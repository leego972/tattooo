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
   * 1. Uses OpenAI to refine the user's prompt with placement/size/avatar context
   * 2. Generates the tattoo image via RunwayML at the correct pixel dimensions
   * 3. Downloads the image, embeds 300 DPI metadata, re-uploads as print-ready PNG
   * 4. Saves the result to the database
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
        // Default to medium (12cm square)
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
- Account for the curvature and unique skin texture of the specified body part (e.g. fingers, face, feet have special considerations)
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

      // ── Step 3: Generate image at correct dimensions ───────────────────────
      let rawImageUrl: string;

      try {
        // Try RunwayML first with correct print dimensions
        const runwayResult = await generateTattooWithRunway({
          prompt: refinedPrompt,
          referenceImageUrl,
          width: genWidth,
          height: genHeight,
        });
        rawImageUrl = runwayResult.imageUrl;
      } catch (runwayError) {
        console.warn(
          "[RunwayML] Failed, falling back to built-in generator:",
          runwayError
        );
        // Fallback to built-in image generation
        const fallbackResult = await generateImage({
          prompt: refinedPrompt,
          ...(referenceImageUrl
            ? {
                originalImages: [
                  { url: referenceImageUrl, mimeType: "image/jpeg" },
                ],
              }
            : {}),
        });
        rawImageUrl = fallbackResult.url || "";
      }

      if (!rawImageUrl)
        throw new Error("Image generation failed — no image URL returned.");

      // ── Step 4: Embed 300 DPI metadata and re-upload as print-ready PNG ────
      let imageUrl = rawImageUrl;
      let printImageUrl = rawImageUrl;

      try {
        const imgBuffer = await fetchImageAsBuffer(rawImageUrl);
        const printBuffer = await embedDpiMetadata(imgBuffer, PRINT_DPI);
        const printKey = `prints/${nanoid()}-${printWidthPx}x${printHeightPx}-300dpi.png`;
        const { url } = await storagePut(printKey, printBuffer, "image/png");
        printImageUrl = url;
        imageUrl = url; // Use the DPI-embedded version as the primary URL
      } catch (dpiErr) {
        console.warn("[printUtils] DPI embedding failed, using raw URL:", dpiErr);
        // Fall back to raw image URL — still usable
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

  /**
   * Get user's personal saved designs (requires auth).
   */
  myDesigns: protectedProcedure.query(async ({ ctx }) => {
    return getTattooGenerationsByUser(ctx.user.id);
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
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  tattoo: tattooRouter,
  myTatts: myTattsRouter,
});

export type AppRouter = typeof appRouter;
