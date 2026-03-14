import { z } from "zod";
import { eq, and, isNull, gt } from "drizzle-orm";
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
  getTattooGenerationById,
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
  updatePassword,
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
import { sendPasswordResetEmail, sendArtistContactEmail, sendWelcomeEmail } from "./emailService";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  passwordResetTokens,
  artists,
  designShares,
  tattooGenerations,
} from "../drizzle/schema";
import crypto from "crypto";

// ─── Auth Router (email/password, self-contained) ─────────────────────────────

const authRouter = router({
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

      // Send welcome email (non-blocking)
      sendWelcomeEmail(user.email!, user.name).catch(console.warn);

      // Issue session cookie
      const token = await createSessionToken(user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      let user;
      try {
        user = await loginUser(input.email, input.password);
      } catch {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      }

      const token = await createSessionToken(user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return { id: user.id, name: user.name, email: user.email, role: user.role };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (ctx.user) return ctx.user;
    const token = ctx.req.cookies?.[COOKIE_NAME];
    if (!token) return null;
    const userId = await verifySessionToken(token);
    if (!userId) return null;
    return getUserById(userId);
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  // ── Password Reset ──────────────────────────────────────────────────────────

  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email(), origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Find user by email
      const { users } = await import("../drizzle/schema");
      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!userRows[0]) return { success: true };

      const user = userRows[0];
      const token = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      const resetUrl = `${input.origin}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email!, user.name, resetUrl);

      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), newPassword: z.string().min(8).max(128) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const tokenRows = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, input.token),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!tokenRows[0]) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link is invalid or has expired.",
        });
      }

      const resetToken = tokenRows[0];

      // Update password
      await updatePassword(resetToken.userId, input.newPassword);

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

      return { success: true };
    }),
});

// ─── Credits Router ───────────────────────────────────────────────────────────

const creditsRouter = router({
  balance: protectedProcedure.query(async ({ ctx }) => {
    const userCredits = await getOrCreateCredits(ctx.user.id);
    return {
      balance: userCredits.balance,
      plan: userCredits.plan,
      lifetimeTotal: userCredits.lifetimeTotal,
    };
  }),

  packs: publicProcedure.query(() => CREDIT_PACKS),

  checkout: protectedProcedure
    .input(z.object({ packId: z.enum(["starter", "pro", "unlimited"]), origin: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      const url = await createCheckoutSession(
        ctx.user.id,
        input.packId as PackId,
        `${input.origin}/payment-success`,
        `${input.origin}/pricing`,
        ctx.user.email ?? undefined
      );
      return { url };
    }),

  transactions: protectedProcedure.query(async ({ ctx }) => {
    return getCreditTransactions(ctx.user.id, 30);
  }),
});

// ─── Tattoo Router ────────────────────────────────────────────────────────────

const tattooRouter = router({
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
        userPrompt, referenceImageUrl, bodyPlacement, sizeLabel,
        sizeInCm, style, sessionId, gender, bodyShape,
      } = input;

      // Credit check
      if (ctx.user?.id) {
        const hasCredits = await deductCredit(ctx.user.id);
        if (!hasCredits) {
          throw new TRPCError({ code: "FORBIDDEN", message: "INSUFFICIENT_CREDITS" });
        }
      }

      // Calculate print dimensions
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

      // Refine prompt with OpenAI
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
${referenceImageUrl ? "\nNote: Customer has provided a reference image. Use it as inspiration for the style and composition." : ""}

Please create the optimal image generation prompt for this tattoo design.`;

      const llmMessages: Array<{
        role: "system" | "user";
        content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
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
      const refinedPrompt = typeof rawContent === "string" ? rawContent : userPrompt;

      // Generate image
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

      // Embed 300 DPI metadata
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

      // Save to database
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

  history: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.id) return getTattooGenerationsByUser(ctx.user.id);
      return getTattooGenerationsBySession(input.sessionId);
    }),

  gallery: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input }) => getAllPublicGenerations(input.limit)),
});

// ─── My Tatts Router ─────────────────────────────────────────────────────────

const myTattsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => getTattooGenerationsByUser(ctx.user.id)),

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

// ─── Artists Router ───────────────────────────────────────────────────────────

const artistsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        specialty: z.string().optional(),
        location: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const rows = await db
        .select()
        .from(artists)
        .where(eq(artists.verified, true))
        .limit(input.limit);

      // Filter by specialty/location in JS (simple contains check)
      return rows.filter((a) => {
        if (input.specialty && !a.specialties?.toLowerCase().includes(input.specialty.toLowerCase())) {
          return false;
        }
        if (input.location && !a.location?.toLowerCase().includes(input.location.toLowerCase())) {
          return false;
        }
        return true;
      });
    }),

  contact: publicProcedure
    .input(
      z.object({
        artistId: z.number().int().positive(),
        customerName: z.string().min(1).max(128),
        customerEmail: z.string().email(),
        message: z.string().min(10).max(1000),
        designUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const artistRows = await db
        .select()
        .from(artists)
        .where(eq(artists.id, input.artistId))
        .limit(1);

      if (!artistRows[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found." });
      }

      const artist = artistRows[0];
      if (!artist.contactEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This artist has no contact email." });
      }

      await sendArtistContactEmail({
        artistEmail: artist.contactEmail,
        artistName: artist.name,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        message: input.message,
        designUrl: input.designUrl,
      });

      return { success: true };
    }),
});

// ─── Sharing Router ───────────────────────────────────────────────────────────

const sharingRouter = router({
  /**
   * Create a public share link for a tattoo design.
   */
  create: publicProcedure
    .input(z.object({ tattooGenerationId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if share already exists
      const existing = await db
        .select()
        .from(designShares)
        .where(eq(designShares.tattooGenerationId, input.tattooGenerationId))
        .limit(1);

      if (existing[0]) {
        return { shareId: existing[0].shareId };
      }

      const shareId = nanoid(12);
      await db.insert(designShares).values({
        shareId,
        tattooGenerationId: input.tattooGenerationId,
        userId: ctx.user?.id ?? null,
      });

      return { shareId };
    }),

  /**
   * Get a shared design by shareId (public).
   */
  get: publicProcedure
    .input(z.object({ shareId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const shareRows = await db
        .select()
        .from(designShares)
        .where(eq(designShares.shareId, input.shareId))
        .limit(1);

      if (!shareRows[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Share not found." });
      }

      const share = shareRows[0];

      // Increment view count
      await db
        .update(designShares)
        .set({ viewCount: share.viewCount + 1 })
        .where(eq(designShares.id, share.id));

      // Get the tattoo generation
      const genRows = await db
        .select()
        .from(tattooGenerations)
        .where(eq(tattooGenerations.id, share.tattooGenerationId))
        .limit(1);

      if (!genRows[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Design not found." });
      }

      return {
        share,
        design: genRows[0],
      };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  credits: creditsRouter,
  tattoo: tattooRouter,
  myTatts: myTattsRouter,
  artists: artistsRouter,
  sharing: sharingRouter,
});

export type AppRouter = typeof appRouter;
