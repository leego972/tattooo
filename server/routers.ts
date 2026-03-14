import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { generateImage } from "./_core/imageGeneration";
import { generateTattooWithRunway } from "./runway";
import {
  saveTattooGeneration,
  getTattooGenerationsBySession,
  getTattooGenerationsByUser,
  getAllPublicGenerations,
  softDeleteTattooGeneration,
  renameTattooGeneration,
} from "./tattoo.db";
import {
  getOrCreateCredits,
  deductCredit,
  addCredits,
  getCreditTransactions,
  setStripeCustomerId,
} from "./credits.db";
import {
  registerUser,
  loginUser,
  createSessionToken,
  verifySessionToken,
  getUserById,
} from "./emailAuth";
import { createCheckoutSession, CREDIT_PACKS, type PackId } from "./stripe";
import { buildSizeAndPlacementContext } from "../shared/tattoo";
import {
  parseSizeCm,
  sizeLabelToCm,
  getGenerationDimensions,
  embedDpiMetadata,
  fetchImageAsBuffer,
  buildPrintSpec,
  PRINT_DPI,
} from "./printUtils";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

// ─── Auth Router (email/password, self-contained) ─────────────────────────────

const authRouter = router({
  /**
   * Register a new user with email + password.
   * Grants 5 free credits on signup.
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(64),
        email: z.string().email(),
        password: z.string().min(8).max(128),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let user;
      try {
        user = await registerUser(input.name, input.email, input.password);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "EMAIL_TAKEN") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists.",
          });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Registration failed." });
      }

      // Grant 5 free credits
      await getOrCreateCredits(user.id);

      // Issue session cookie
      const token = await createSessionToken(user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    }),

  /**
   * Login with email + password.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let user;
      try {
        user = await loginUser(input.email, input.password);
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      const token = await createSessionToken(user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    }),

  /**
   * Get the current authenticated user.
   */
  me: publicProcedure.query(async ({ ctx }) => {
    // First check if the framework already resolved a user via Manus OAuth
    if (ctx.user) return ctx.user;

    // Otherwise try our own JWT cookie
    const token = ctx.req.cookies?.[COOKIE_NAME];
    if (!token) return null;

    const userId = await verifySessionToken(token);
    if (!userId) return null;

    return getUserById(userId);
  }),

  /**
   * Logout — clear session cookie.
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Credits Router ───────────────────────────────────────────────────────────

const creditsRouter = router({
  /**
   * Get the current user's credit balance and plan.
   */
  balance: protectedProcedure.query(async ({ ctx }) => {
    const userCredits = await getOrCreateCredits(ctx.user.id);
    return {
      balance: userCredits.balance,
      plan: userCredits.plan,
      lifetimeTotal: userCredits.lifetimeTotal,
    };
  }),

  /**
   * Get the available credit packs.
   */
  packs: publicProcedure.query(() => CREDIT_PACKS),

  /**
   * Create a Stripe Checkout Session for purchasing credits.
   */
  checkout: protectedProcedure
    .input(
      z.object({
        packId: z.enum(["starter", "pro", "unlimited"]),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const successUrl = `${input.origin}/payment-success`;
      const cancelUrl = `${input.origin}/pricing`;

      const url = await createCheckoutSession(
        ctx.user.id,
        input.packId as PackId,
        successUrl,
        cancelUrl,
        ctx.user.email ?? undefined
      );

      return { url };
    }),

  /**
   * Get credit transaction history.
   */
  transactions: protectedProcedure.query(async ({ ctx }) => {
    return getCreditTransactions(ctx.user.id, 30);
  }),
});

// ─── Tattoo Router ────────────────────────────────────────────────────────────

const tattooRouter = router({
  /**
   * Upload a reference image to S3 and return its URL.
   */
  uploadReference: publicProcedure
    .input(
      z.object({
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
        filename: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.mimeType.split("/")[1] || "jpg";
      const key = `references/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  /**
   * Core generation procedure:
   * 1. Checks user has credits (deducts 1 if authenticated, allows 1 free guest attempt)
   * 2. Uses OpenAI to refine the user's prompt
   * 3. Generates the tattoo image via RunwayML at the correct pixel dimensions
   * 4. Embeds 300 DPI metadata and re-uploads as print-ready PNG
   * 5. Saves the result to the database
   */
  generate: publicProcedure
    .input(
      z.object({
        userPrompt: z.string().min(1).max(2000),
        referenceImageUrl: z.string().url().optional(),
        bodyPlacement: z.string().optional(),
        sizeLabel: z.string().optional(),
        sizeInCm: z.string().optional(),
        style: z.string().optional(),
        sessionId: z.string(),
        gender: z.enum(["male", "female"]).optional(),
        bodyShape: z.enum(["slim", "athletic", "average", "plus-size"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        userPrompt,
        referenceImageUrl,
        bodyPlacement,
        sizeLabel,
        sizeInCm,
        style,
        sessionId,
        gender,
        bodyShape,
      } = input;

      // ── Step 0: Credit check ───────────────────────────────────────────────
      if (ctx.user?.id) {
        const hasCredits = await deductCredit(ctx.user.id);
        if (!hasCredits) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "INSUFFICIENT_CREDITS",
          });
        }
      }
      // Guest users get 1 attempt per session (no credit check — limited by UX)

      // ── Step 1: Calculate print dimensions ────────────────────────────────
      let widthCm: number;
      let heightCm: number;

      if (sizeInCm) {
        const parsed = parseSizeCm(sizeInCm);
        widthCm = parsed.widthCm;
        heightCm = parsed.heightCm;
      } else if (sizeLabel) {
        const cm = sizeLabelToCm(sizeLabel);
        widthCm = cm;
        heightCm = cm;
      } else {
        widthCm = 12;
        heightCm = 12;
      }

      const { genWidth, genHeight, printWidthPx, printHeightPx } =
        getGenerationDimensions(widthCm, heightCm);

      const printSpec = buildPrintSpec(widthCm, heightCm, printWidthPx, printHeightPx);

      // ── Step 2: Refine prompt with OpenAI ──────────────────────────────────
      const placementContext =
        bodyPlacement && sizeLabel
          ? buildSizeAndPlacementContext(bodyPlacement, sizeLabel, sizeInCm || "")
          : "";

      const genderContext = gender
        ? `The tattoo is for a ${gender}${bodyShape ? ` with a ${bodyShape} body shape` : ""}.`
        : "";

      const systemPrompt = `You are an expert tattoo artist and designer with 20 years of experience. 
Your job is to transform a customer's tattoo description into a precise, detailed image generation prompt that will produce a stunning, professional tattoo design.

Rules:
- Output ONLY the refined image generation prompt, nothing else
- The prompt must describe the tattoo design itself (not a photo of a tattoo on skin)
- Use tattoo-specific terminology: linework, shading, black and grey, traditional, neo-traditional, realism, watercolor, geometric, tribal, etc.
- Specify artistic style, line weight, shading technique, and composition
- Make the design appropriate for the specified body placement and size
- Account for the curvature and unique skin texture of the specified body part
- The output should be a single paragraph, maximum 300 words
- Always end with: "tattoo design, professional tattoo art, high contrast, clean lines, suitable for tattooing, white background"`;

      const userMessage = `Customer request: "${userPrompt}"
${placementContext ? `\nPlacement context:\n${placementContext}` : ""}
${genderContext ? `\nCustomer: ${genderContext}` : ""}
${style ? `\nPreferred style: ${style}` : ""}
${referenceImageUrl ? "\nNote: Customer has provided a reference image to draw inspiration from." : ""}
Print size: ${widthCm}×${heightCm}cm at 300 DPI (${printWidthPx}×${printHeightPx}px)

Please create the optimal image generation prompt for this tattoo design.`;

      const llmMessages: Array<{
        role: "system" | "user";
        content:
          | string
          | Array<{
              type: string;
              text?: string;
              image_url?: { url: string };
            }>;
      }> = [{ role: "system", content: systemPrompt }];

      if (referenceImageUrl) {
        llmMessages.push({
          role: "user",
          content: [
            { type: "text", text: userMessage },
            { type: "image_url", image_url: { url: referenceImageUrl } },
          ],
        });
      } else {
        llmMessages.push({ role: "user", content: userMessage });
      }

      const refinementResponse = await invokeLLM({
        messages: llmMessages as Parameters<typeof invokeLLM>[0]["messages"],
      });
      const rawContent = refinementResponse.choices?.[0]?.message?.content;
      const refinedPrompt =
        typeof rawContent === "string" ? rawContent : userPrompt;

      // ── Step 3: Generate image ─────────────────────────────────────────────
      let rawImageUrl: string;

      try {
        const runwayResult = await generateTattooWithRunway({
          prompt: refinedPrompt,
          referenceImageUrl,
          width: genWidth,
          height: genHeight,
        });
        rawImageUrl = runwayResult.imageUrl;
      } catch (runwayError) {
        console.warn("[RunwayML] Failed, falling back to built-in generator:", runwayError);
        const fallbackResult = await generateImage({
          prompt: refinedPrompt,
          ...(referenceImageUrl
            ? { originalImages: [{ url: referenceImageUrl, mimeType: "image/jpeg" }] }
            : {}),
        });
        rawImageUrl = fallbackResult.url || "";
      }

      if (!rawImageUrl)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Image generation failed." });

      // ── Step 4: Embed 300 DPI metadata ────────────────────────────────────
      let imageUrl = rawImageUrl;
      let printImageUrl = rawImageUrl;

      try {
        const imgBuffer = await fetchImageAsBuffer(rawImageUrl);
        const printBuffer = await embedDpiMetadata(imgBuffer, PRINT_DPI);
        const printKey = `prints/${nanoid()}-${printWidthPx}x${printHeightPx}-300dpi.png`;
        const { url } = await storagePut(printKey, printBuffer, "image/png");
        printImageUrl = url;
        imageUrl = url;
      } catch (dpiErr) {
        console.warn("[printUtils] DPI embedding failed, using raw URL:", dpiErr);
      }

      // ── Step 5: Save to database ───────────────────────────────────────────
      await saveTattooGeneration({
        userId: ctx.user?.id ?? null,
        sessionId,
        userPrompt,
        refinedPrompt,
        imageUrl,
        referenceImageUrl: referenceImageUrl ?? null,
        style: style ?? null,
        bodyPlacement: bodyPlacement ?? null,
        sizeLabel: sizeLabel ?? null,
        sizeInCm: sizeInCm ?? `${widthCm}x${heightCm}`,
      });

      // Return updated credit balance if authenticated
      let creditBalance: number | null = null;
      if (ctx.user?.id) {
        const userCredits = await getOrCreateCredits(ctx.user.id);
        creditBalance = userCredits.balance;
      }

      return {
        imageUrl,
        printImageUrl,
        refinedPrompt,
        printSpec,
        printWidthPx,
        printHeightPx,
        widthCm,
        heightCm,
        dpi: PRINT_DPI,
        creditBalance,
      };
    }),

  /**
   * Fetch generation history for the current session or authenticated user.
   */
  history: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.id) {
        return getTattooGenerationsByUser(ctx.user.id);
      }
      return getTattooGenerationsBySession(input.sessionId);
    }),

  /**
   * Fetch all public gallery designs.
   */
  gallery: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      return getAllPublicGenerations(input.limit);
    }),
});

// ─── My Tatts Router ─────────────────────────────────────────────────────────

const myTattsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getTattooGenerationsByUser(ctx.user.id);
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await softDeleteTattooGeneration(input.id, ctx.user.id);
      return { success: true };
    }),

  rename: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), nickname: z.string().min(1).max(128) }))
    .mutation(async ({ input, ctx }) => {
      await renameTattooGeneration(input.id, ctx.user.id, input.nickname);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  credits: creditsRouter,
  tattoo: tattooRouter,
  myTatts: myTattsRouter,
});

export type AppRouter = typeof appRouter;
