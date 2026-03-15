import { z } from "zod";
import { eq, and, isNull, gt, desc, sql, count } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { advertisingRouter } from "./advertising-router";
import { affiliateRouter } from "./affiliate-router";
import { creditRouter } from "./credit-router";
import { subscriptionRouter } from "./subscription-router";
import { seoRouter } from "./seo-router";
import { blogRouter } from "./blog-router";
import { contentCreatorRouter } from "./content-creator-router";
import { marketingRouter } from "./marketing-router";
import { mailingListRouter } from "./mailing-list-router";
import { bookingRouter, availabilityRouter, notificationsRouter } from "./booking-router";
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
import { createMembershipCheckoutSession } from "./stripe";
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
import { sendPasswordResetEmail, sendArtistContactEmail, sendWelcomeEmail, sendPromoConfirmationEmail, sendDesignToArtistEmail } from "./emailService";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  passwordResetTokens,
  artists,
  artistTeams,
  artistTeamMembers,
  designShares,
  tattooGenerations,
  users,
  credits,
  creditTransactions,
  bookings,
  referrals,
  referralCodes,
  referralTracking,
  promoCodes,
  outreachCampaigns,
  outreachContacts,
} from "../drizzle/schema";
import crypto from "crypto";

// ─── Referral & Promo Constants ───────────────────────────────────────────────
const REFERRAL_REWARDS = {
  referrerCredits: 10,
  newUserCredits: 10,
  milestones: [
    { count: 3,  bonus: 15,  label: "Ink Starter" },
    { count: 5,  bonus: 25,  label: "Tattoo Enthusiast" },
    { count: 10, bonus: 50,  label: "Ink Master" },
    { count: 25, bonus: 100, label: "Tattoo Legend" },
    { count: 50, bonus: 200, label: "Hall of Ink" },
  ],
} as const;

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });
  }
  return next({ ctx });
});

// ─── Auth Router (email/password, self-contained) ─────────────────────────────

const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(64),
        email: z.string().email(),
        password: z.string().min(8).max(128),
        refCode: z.string().optional(),
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

      // Handle referral (using referral_codes table with milestone tracking)
      if (input.refCode) {
        try {
          const db = await getDb();
          if (db) {
            const rcRows = await db
              .select()
              .from(referralCodes)
              .where(and(eq(referralCodes.code, input.refCode.toUpperCase()), eq(referralCodes.isActive, true)))
              .limit(1);

            if (rcRows[0] && rcRows[0].userId !== user.id) {
              const rc = rcRows[0];
              const BASE_REWARD = REFERRAL_REWARDS.referrerCredits;
              const NEW_USER_REWARD = REFERRAL_REWARDS.newUserCredits;

              // Award credits to both parties
              await addCredits(rc.userId, BASE_REWARD, "referral", undefined, `Referral reward: friend signed up via code ${rc.code}`);
              await addCredits(user.id, NEW_USER_REWARD, "referral", undefined, `Welcome bonus: joined via referral code ${rc.code}`);

              const newSuccessfulCount = (rc.successfulReferrals || 0) + 1;

              // Update referral code stats
              await db.update(referralCodes).set({
                totalReferrals: (rc.totalReferrals || 0) + 1,
                successfulReferrals: newSuccessfulCount,
                bonusCreditsEarned: (rc.bonusCreditsEarned || 0) + BASE_REWARD,
              }).where(eq(referralCodes.id, rc.id));

              // Create tracking record
              await db.insert(referralTracking).values({
                referralCodeId: rc.id,
                referrerId: rc.userId,
                referredUserId: user.id,
                referredEmail: user.email ?? undefined,
                status: "rewarded",
                rewardType: "credits",
                rewardAmount: BASE_REWARD,
                rewardedAt: new Date(),
              });

              // Check for milestone bonuses
              const hitMilestone = REFERRAL_REWARDS.milestones.find(m => m.count === newSuccessfulCount);
              if (hitMilestone) {
                await addCredits(rc.userId, hitMilestone.bonus, "referral", undefined, `Milestone bonus: ${hitMilestone.label} (${newSuccessfulCount} referrals)`);
                await db.update(referralCodes).set({
                  bonusCreditsEarned: (rc.bonusCreditsEarned || 0) + BASE_REWARD + hitMilestone.bonus,
                }).where(eq(referralCodes.id, rc.id));
              }
            }
          }
        } catch (refErr) {
          console.warn("[Referral] Error processing referral:", refErr);
        }
      }

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

      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!userRows[0]) return { success: true };

      const user = userRows[0];
      const token = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt });

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
        throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link is invalid or has expired." });
      }

      const resetToken = tokenRows[0];
      await updatePassword(resetToken.userId, input.newPassword);
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

  // Membership checkout — $10/month or $99/year
  membershipCheckout: protectedProcedure
    .input(z.object({ interval: z.enum(["monthly", "yearly"]), origin: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      const url = await createMembershipCheckoutSession(
        ctx.user.id,
        input.interval,
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
        variationCount: z.number().min(1).max(3).default(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        userPrompt, referenceImageUrl, bodyPlacement, sizeLabel,
        sizeInCm, style, sessionId, gender, bodyShape, variationCount,
      } = input;

      // Credit check — deduct one credit per generation (not per variation)
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

      // Generate image(s) — support multiple variations
      const generateOne = async (variationSuffix: string = "") => {
        const promptWithVariation = variationCount > 1
          ? `${refinedPrompt}${variationSuffix}`
          : refinedPrompt;

        let rawImageUrl: string;
        try {
          const runwayResult = await generateTattooWithRunway({
            prompt: promptWithVariation,
            referenceImageUrl,
            width: genWidth,
            height: genHeight,
          });
          rawImageUrl = runwayResult.imageUrl;
        } catch (runwayError) {
          console.warn("[RunwayML] Failed, falling back to built-in generator:", runwayError);
          const fallbackResult = await generateImage({
            prompt: promptWithVariation,
            ...(referenceImageUrl
              ? { originalImages: [{ url: referenceImageUrl, mimeType: "image/jpeg" }] }
              : {}),
          });
          rawImageUrl = fallbackResult.url || "";
        }

        if (!rawImageUrl) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Image generation failed." });

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

        return { imageUrl, printImageUrl };
      };

      const variationSuffixes = [
        "",
        ", alternative composition, different angle",
        ", bold variation, stronger contrast",
      ];

      // Generate variations (or just one)
      const results = await Promise.all(
        Array.from({ length: variationCount }, (_, i) => generateOne(variationSuffixes[i] || ""))
      );

      // Save primary to database
      await saveTattooGeneration({
        userId: ctx.user?.id ?? null,
        sessionId,
        userPrompt,
        refinedPrompt,
        imageUrl: results[0].imageUrl,
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
        imageUrl: results[0].imageUrl,
        printImageUrl: results[0].printImageUrl,
        variations: results.map((r) => r.imageUrl),
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

  // ── Animated Reveal Video ──────────────────────────────────────────────

  generateVideo: protectedProcedure
    .input(
      z.object({
        generationId: z.number().int().positive(),
        prompt: z.string().max(512).optional(),
        duration: z.union([z.literal(5), z.literal(10)]).default(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify ownership
      const rows = await db
        .select()
        .from(tattooGenerations)
        .where(and(eq(tattooGenerations.id, input.generationId), eq(tattooGenerations.userId, ctx.user.id)))
        .limit(1);

      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Design not found." });

      const generation = rows[0];
      if (!generation.imageUrl) throw new TRPCError({ code: "BAD_REQUEST", message: "No image to animate." });

      // Deduct credits (video costs 5 credits — call 5 times)
      let deducted = 0;
      for (let i = 0; i < 5; i++) {
        const ok = await deductCredit(ctx.user.id);
        if (ok) deducted++;
        else break;
      }
      if (deducted < 5) {
        throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Insufficient credits. Video generation costs 5 credits." });
      }

      const { generateTattooVideo } = await import("./runway");
      const result = await generateTattooVideo({
        imageUrl: generation.imageUrl,
        prompt: input.prompt ?? `Cinematic tattoo reveal animation, ${generation.userPrompt?.slice(0, 100) ?? "tattoo"}, subtle ink flow, dramatic lighting`,
        duration: input.duration,
      });

      // Store video URL back on the generation record
      await db
        .update(tattooGenerations)
        .set({ videoUrl: result.videoUrl } as Record<string, unknown>)
        .where(eq(tattooGenerations.id, input.generationId));

      return { videoUrl: result.videoUrl, taskId: result.taskId };
    }),
});

// ─── Send Design to Artist Router ──────────────────────────────────────────────

const sendDesignRouter = router({
  send: protectedProcedure
    .input(z.object({
      generationId: z.number().int().positive(),
      artistId: z.number().int().positive(),
      customerPhone: z.string().optional(),
      preferredDate: z.string().optional(),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const genRows = await db.select().from(tattooGenerations)
        .where(and(eq(tattooGenerations.id, input.generationId), eq(tattooGenerations.userId, ctx.user.id)))
        .limit(1);
      const gen = genRows[0];
      if (!gen) throw new TRPCError({ code: "NOT_FOUND", message: "Design not found." });
      const artistRows = await db.select().from(artists)
        .where(eq(artists.id, input.artistId)).limit(1);
      const artist = artistRows[0];
      if (!artist) throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found." });
      if (!artist.contactEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "This artist has no email address on file." });
      await sendDesignToArtistEmail({
        artistEmail: artist.contactEmail,
        artistName: artist.name,
        customerName: ctx.user.name || "A tatt-ooo user",
        customerEmail: ctx.user.email || "",
        customerPhone: input.customerPhone,
        designImageUrl: gen.imageUrl,
        printImageUrl: gen.printImageUrl ?? undefined,
        style: gen.style ?? undefined,
        bodyPlacement: gen.bodyPlacement ?? undefined,
        sizeLabel: gen.sizeLabel ?? undefined,
        sizeInCm: gen.sizeInCm ?? undefined,
        printSpec: gen.printSpec ?? undefined,
        preferredDate: input.preferredDate,
        notes: input.notes,
        bookingDepositAmount: artist.depositAmount ?? undefined,
      });
      return { success: true, artistName: artist.name, artistEmail: artist.contactEmail };
    }),
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
        name: z.string().optional(),
        country: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(artists)
        .where(eq(artists.verified, true))
        .orderBy(desc(artists.featured), desc(artists.createdAt))
        .limit(200); // fetch more, filter in JS for flexibility
      return rows.filter((a) => {
        if (input.specialty && !a.specialties?.toLowerCase().includes(input.specialty.toLowerCase())) return false;
        if (input.location && !a.location?.toLowerCase().includes(input.location.toLowerCase())) return false;
        if (input.name && !a.name?.toLowerCase().includes(input.name.toLowerCase())) return false;
        if (input.country && a.country?.toLowerCase() !== input.country.toLowerCase()) return false;
        return true;
      }).slice(0, input.limit);
    }),

  get: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db.select().from(artists).where(eq(artists.id, input.id)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found." });
      return rows[0];
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

      const artistRows = await db.select().from(artists).where(eq(artists.id, input.artistId)).limit(1);
      if (!artistRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found." });

      const artist = artistRows[0];
      if (!artist.contactEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "This artist has no contact email." });

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

  // ── Bookings ────────────────────────────────────────────────────────────────

  requestBooking: protectedProcedure
    .input(
      z.object({
        artistId: z.number().int().positive(),
        tattooGenerationId: z.number().int().positive().optional(),
        message: z.string().min(10).max(1000),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const artistRows = await db.select().from(artists).where(eq(artists.id, input.artistId)).limit(1);
      if (!artistRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found." });

      const artist = artistRows[0];
      const depositCents = (artist.depositAmount ?? 50) * 100;

      // Create booking record
      const [result] = await db.insert(bookings).values({
        customerId: ctx.user.id,
        artistId: input.artistId,
        tattooGenerationId: input.tattooGenerationId ?? null,
        message: input.message,
        depositAmountCents: depositCents,
        status: "pending",
      });

      const bookingId = (result as { insertId: number }).insertId;

      // Create Stripe checkout for deposit
      const { createBookingFeeSession } = await import("./stripe");
      const checkoutUrl = await createBookingFeeSession(
        ctx.user.id,
        bookingId,
        depositCents,
        artist.name,
        `$${(depositCents / 100).toFixed(2)}`,
        `${input.origin}/payment-success?type=booking`,
        `${input.origin}/artists/${input.artistId}`,
        ctx.user.email ?? ""
      );

      return { bookingId, checkoutUrl };
    }),

  myBookings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(bookings)
      .where(eq(bookings.customerId, ctx.user.id))
      .orderBy(desc(bookings.createdAt));
  }),

  // ── Artist Registration with Annual Fee ──────────────────────────────────────

  applyWithPayment: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(128),
        bio: z.string().max(1000).optional(),
        location: z.string().max(128).optional(),
        specialties: z.string().max(256).optional(),
        instagram: z.string().max(64).optional(),
        website: z.string().url().optional().or(z.literal("")),
        contactEmail: z.string().email(),
        portfolioUrl: z.string().url().optional().or(z.literal("")),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Insert artist as unverified (pending payment + admin review)
      const [result] = await db.insert(artists).values({
        name: input.name,
        bio: input.bio ?? null,
        location: input.location ?? null,
        specialties: input.specialties ?? null,
        instagram: input.instagram ?? null,
        website: input.website || null,
        contactEmail: input.contactEmail,
        avatarUrl: input.portfolioUrl || null,
        verified: false,
        depositAmount: 50,
      });

      const pendingArtistId = (result as { insertId: number }).insertId;

      const { createArtistRegistrationSession } = await import("./stripe");
      const checkoutUrl = await createArtistRegistrationSession(
        pendingArtistId,
        `${input.origin}/payment-success?type=artist`,
        `${input.origin}/artist-signup`,
        input.contactEmail
      );

      return { pendingArtistId, checkoutUrl };
    }),

  // Confirm registration after Stripe payment (called from success page)
  confirmRegistration: publicProcedure
    .input(z.object({ pendingArtistId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db.select().from(artists).where(eq(artists.id, input.pendingArtistId)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });

      return { artist: rows[0], status: rows[0].verified ? "approved" : "pending_review" };
    }),

  // Get my artist profile (if current user has one)
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
    return rows[0] ?? null;
  }),

  // Update my artist profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(128).optional(),
        bio: z.string().max(2000).optional(),
        phone: z.string().max(32).optional(),
        address: z.string().max(255).optional(),
        city: z.string().max(128).optional(),
        state: z.string().max(128).optional(),
        country: z.string().max(64).optional(),
        postcode: z.string().max(20).optional(),
        specialties: z.string().max(512).optional(),
        yearsExperience: z.number().int().min(0).max(60).optional(),
        priceRange: z.string().max(64).optional(),
        languages: z.string().max(256).optional(),
        instagram: z.string().max(128).optional(),
        tiktok: z.string().max(128).optional(),
        facebook: z.string().max(128).optional(),
        website: z.string().url().optional().or(z.literal("")),
        hourlyRate: z.number().int().min(0).optional(),
        depositAmount: z.number().int().min(0).optional(),
        businessHours: z.record(z.string(), z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() })).optional(),
        profilePhotoUrl: z.string().url().optional(),
        portfolioImages: z.array(z.string().url()).max(20).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Artist profile not found." });

      const updates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(input)) {
        if (v !== undefined) updates[k] = v === "" ? null : v;
      }

      await db.update(artists).set(updates).where(eq(artists.userId, ctx.user.id));
      const updated = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
      return updated[0];
    }),

  // Apply with payment — full profile version
  applyWithPaymentFull: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(128),
        bio: z.string().max(2000).optional(),
        phone: z.string().max(32).optional(),
        address: z.string().max(255).optional(),
        city: z.string().max(128).optional(),
        state: z.string().max(128).optional(),
        country: z.string().max(64).optional(),
        postcode: z.string().max(20).optional(),
        specialties: z.string().max(512).optional(),
        yearsExperience: z.number().int().min(0).max(60).optional(),
        priceRange: z.string().max(64).optional(),
        languages: z.string().max(256).optional(),
        instagram: z.string().max(128).optional(),
        tiktok: z.string().max(128).optional(),
        facebook: z.string().max(128).optional(),
        website: z.string().url().optional().or(z.literal("")),
        contactEmail: z.string().email(),
        hourlyRate: z.number().int().min(0).optional(),
        depositAmount: z.number().int().min(10).default(50),
        businessHours: z.record(z.string(), z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() })).optional(),
        profilePhotoUrl: z.string().url().optional(),
        portfolioImages: z.array(z.string().url()).max(20).optional(),
        // Team signup
        isTeamSignup: z.boolean().default(false),
        studioName: z.string().max(255).optional(),
        studioDescription: z.string().max(2000).optional(),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Insert artist profile
      const [result] = await db.insert(artists).values({
        name: input.name,
        bio: input.bio ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        country: input.country ?? null,
        postcode: input.postcode ?? null,
        specialties: input.specialties ?? null,
        yearsExperience: input.yearsExperience ?? null,
        priceRange: input.priceRange ?? null,
        languages: input.languages ?? null,
        instagram: input.instagram ?? null,
        tiktok: input.tiktok ?? null,
        facebook: input.facebook ?? null,
        website: input.website || null,
        contactEmail: input.contactEmail,
        hourlyRate: input.hourlyRate ?? null,
        depositAmount: input.depositAmount,
        businessHours: (input.businessHours ?? null) as Record<string, { open: string; close: string; closed?: boolean }> | null,
        profilePhotoUrl: input.profilePhotoUrl ?? null,
        portfolioImages: (input.portfolioImages ?? null) as string[] | null,
        isTeamOwner: input.isTeamSignup,
        verified: false,
      });

      const pendingArtistId = (result as { insertId: number }).insertId;

      // If team signup, create team record
      if (input.isTeamSignup && input.studioName) {
        const [teamResult] = await db.insert(artistTeams).values({
          ownerId: pendingArtistId,
          studioName: input.studioName,
          studioDescription: input.studioDescription ?? null,
          studioEmail: input.contactEmail,
        });
        const teamId = (teamResult as { insertId: number }).insertId;
        await db.update(artists).set({ teamId }).where(eq(artists.id, pendingArtistId));
        await db.insert(artistTeamMembers).values({
          teamId,
          artistId: pendingArtistId,
          role: "owner",
          status: "active",
          joinedAt: new Date(),
        });
      }

      const { createArtistRegistrationSession } = await import("./stripe");
      const checkoutUrl = await createArtistRegistrationSession(
        pendingArtistId,
        `${input.origin}/payment-success?type=artist`,
        `${input.origin}/artist-signup`,
        input.contactEmail
      );

      return { pendingArtistId, checkoutUrl };
    }),
  // Get a single artist's public profile by ID
  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(artists)
        .where(and(eq(artists.id, input.id), eq(artists.verified, true)))
        .limit(1);
      if (!rows[0]) return null;
      let team: (typeof artistTeams.$inferSelect & { members: (typeof artists.$inferSelect)[] }) | null = null;
      if (rows[0].teamId) {
        const teamRows = await db
          .select()
          .from(artistTeams)
          .where(eq(artistTeams.id, rows[0].teamId))
          .limit(1);
        if (teamRows[0]) {
          const memberRows = await db
            .select()
            .from(artists)
            .where(and(eq(artists.teamId, teamRows[0].id), eq(artists.verified, true)));
          team = { ...teamRows[0], members: memberRows };
        }
      }
      return { ...rows[0], team };
    }),
});

// ─── Team Router ──────────────────────────────────────────────────────────────

const teamRouter = router({
  getMyTeam: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const artistRows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
    if (!artistRows[0]?.teamId) return null;
    const teamRows = await db.select().from(artistTeams).where(eq(artistTeams.id, artistRows[0].teamId)).limit(1);
    return teamRows[0] ?? null;
  }),

  getMembers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const artistRows = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
    if (!artistRows[0]?.teamId) return [];
    const members = await db
      .select()
      .from(artistTeamMembers)
      .where(eq(artistTeamMembers.teamId, artistRows[0].teamId));
    // Enrich with artist data
    const enriched = await Promise.all(
      members.map(async (m) => {
        const a = await db.select().from(artists).where(eq(artists.id, m.artistId)).limit(1);
        return { ...m, artist: a[0] ?? null };
      })
    );
    return enriched;
  }),

  inviteMember: protectedProcedure
    .input(z.object({ email: z.string().email(), origin: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const artistRows = await db.select().from(artists).where(and(eq(artists.userId, ctx.user.id), eq(artists.isTeamOwner, true))).limit(1);
      if (!artistRows[0]?.teamId) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a team owner." });

      const teamId = artistRows[0].teamId;
      const teamRows = await db.select().from(artistTeams).where(eq(artistTeams.id, teamId)).limit(1);
      const team = teamRows[0];
      if (!team) throw new TRPCError({ code: "NOT_FOUND" });

      // Check member count
      const memberCount = await db.select({ c: count() }).from(artistTeamMembers).where(and(eq(artistTeamMembers.teamId, teamId), eq(artistTeamMembers.status, "active")));
      if ((memberCount[0]?.c ?? 0) >= team.maxMembers) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Team is full (max ${team.maxMembers} members).` });
      }

      const inviteToken = nanoid(32);
      await db.insert(artistTeamMembers).values({
        teamId,
        artistId: artistRows[0].id,
        role: "member",
        inviteToken,
        inviteEmail: input.email,
        status: "pending",
      });

      // Send invite email
      const inviteUrl = `${input.origin}/artist-signup?teamInvite=${inviteToken}&teamName=${encodeURIComponent(team.studioName)}`;
      const { sendArtistTeamInviteEmail } = await import("./emailService");
      await sendArtistTeamInviteEmail(input.email, team.studioName, inviteUrl);

      return { success: true, inviteToken };
    }),

  acceptInvite: publicProcedure
    .input(z.object({ token: z.string(), artistId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(artistTeamMembers).where(eq(artistTeamMembers.inviteToken, input.token)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite token." });
      await db.update(artistTeamMembers).set({ artistId: input.artistId, status: "active", joinedAt: new Date(), inviteToken: null }).where(eq(artistTeamMembers.inviteToken, input.token));
      await db.update(artists).set({ teamId: rows[0].teamId }).where(eq(artists.id, input.artistId));
      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ artistId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const artistRows = await db.select().from(artists).where(and(eq(artists.userId, ctx.user.id), eq(artists.isTeamOwner, true))).limit(1);
      if (!artistRows[0]?.teamId) throw new TRPCError({ code: "FORBIDDEN" });
      await db.update(artistTeamMembers).set({ status: "removed" }).where(and(eq(artistTeamMembers.teamId, artistRows[0].teamId), eq(artistTeamMembers.artistId, input.artistId)));
      await db.update(artists).set({ teamId: null }).where(eq(artists.id, input.artistId));
      return { success: true };
    }),

  updateTeam: protectedProcedure
    .input(
      z.object({
        studioName: z.string().max(255).optional(),
        studioDescription: z.string().max(2000).optional(),
        studioAddress: z.string().max(255).optional(),
        studioCity: z.string().max(128).optional(),
        studioState: z.string().max(128).optional(),
        studioCountry: z.string().max(64).optional(),
        studioPostcode: z.string().max(20).optional(),
        studioPhone: z.string().max(32).optional(),
        studioEmail: z.string().email().optional(),
        studioWebsite: z.string().url().optional().or(z.literal("")),
        studioInstagram: z.string().max(128).optional(),
        studioLogoUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const artistRows = await db.select().from(artists).where(and(eq(artists.userId, ctx.user.id), eq(artists.isTeamOwner, true))).limit(1);
      if (!artistRows[0]?.teamId) throw new TRPCError({ code: "FORBIDDEN" });
      const updates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(input)) {
        if (v !== undefined) updates[k] = v === "" ? null : v;
      }
      await db.update(artistTeams).set(updates).where(eq(artistTeams.id, artistRows[0].teamId));
      return { success: true };
    }),
});

// ─── Placeholder closing brace for original artistsRouter ─────────────────────
const _artistsRouterClosed = true;

// ─── Sharing Router ───────────────────────────────────────────────────────────

const sharingRouter = router({
  create: publicProcedure
    .input(z.object({ tattooGenerationId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const existing = await db
        .select()
        .from(designShares)
        .where(eq(designShares.tattooGenerationId, input.tattooGenerationId))
        .limit(1);

      if (existing[0]) return { shareId: existing[0].shareId };

      const shareId = nanoid(12);
      await db.insert(designShares).values({
        shareId,
        tattooGenerationId: input.tattooGenerationId,
        userId: ctx.user?.id ?? null,
      });

      return { shareId };
    }),

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

      if (!shareRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Share not found." });

      const share = shareRows[0];
      await db
        .update(designShares)
        .set({ viewCount: share.viewCount + 1 })
        .where(eq(designShares.id, share.id));

      const genRows = await db
        .select()
        .from(tattooGenerations)
        .where(eq(tattooGenerations.id, share.tattooGenerationId))
        .limit(1);

      if (!genRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Design not found." });

      return { share, design: genRows[0] };
    }),
});

// ─── Referral Router ─────────────────────────────────────────────────────────

const referralRouter = router({
  // Get or create the user's referral code (uses referral_codes table)
  getMyCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const existing = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, ctx.user.id))
      .limit(1);

    if (existing[0]) {
      return { refCode: existing[0].code, id: existing[0].id };
    }

    // Auto-generate a unique code
    const code = nanoid(10).toUpperCase();
    const [inserted] = await db.insert(referralCodes).values({
      userId: ctx.user.id,
      code,
    }).$returningId();

    return { refCode: code, id: inserted.id };
  }),

  // Full stats for the referral dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const codeRows = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, ctx.user.id))
      .limit(1);

    if (!codeRows[0]) {
      return {
        refCode: null,
        totalReferrals: 0,
        successfulReferrals: 0,
        creditsEarned: 0,
        nextMilestone: REFERRAL_REWARDS.milestones[0],
        milestones: REFERRAL_REWARDS.milestones,
        recentReferrals: [],
      };
    }

    const rc = codeRows[0];
    const trackRows = await db
      .select()
      .from(referralTracking)
      .where(eq(referralTracking.referralCodeId, rc.id))
      .orderBy(desc(referralTracking.createdAt))
      .limit(20);

    const successfulCount = rc.successfulReferrals;
    const nextMilestone = REFERRAL_REWARDS.milestones.find(m => m.count > successfulCount) ?? null;

    return {
      refCode: rc.code,
      totalReferrals: rc.totalReferrals,
      successfulReferrals: successfulCount,
      creditsEarned: rc.bonusCreditsEarned,
      nextMilestone,
      milestones: REFERRAL_REWARDS.milestones,
      recentReferrals: trackRows.map(t => ({
        id: t.id,
        status: t.status,
        rewardAmount: t.rewardAmount,
        rewardedAt: t.rewardedAt,
        createdAt: t.createdAt,
      })),
    };
  }),

  // Validate a referral code (public — for registration form)
  validate: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false };
      const rows = await db
        .select()
        .from(referralCodes)
        .where(and(eq(referralCodes.code, input.code.toUpperCase()), eq(referralCodes.isActive, true)))
        .limit(1);
      if (!rows[0]) return { valid: false };
      return { valid: true, bonusCredits: REFERRAL_REWARDS.newUserCredits };
    }),
});

// ─── Promo Code Router ────────────────────────────────────────────────────────

const promoRouter = router({
  // Validate a promo code (public — called live as user types)
  validate: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { valid: false };
      const rows = await db
        .select()
        .from(promoCodes)
        .where(eq(promoCodes.code, input.code.toUpperCase()))
        .limit(1);
      const promo = rows[0];
      if (!promo || !promo.isActive) return { valid: false, reason: "Code not found or inactive" };
      if (promo.usedCount >= promo.maxUses) return { valid: false, reason: "Code has reached its usage limit" };
      if (promo.expiresAt && promo.expiresAt < new Date()) return { valid: false, reason: "Code has expired" };
      return {
        valid: true,
        discountPercent: promo.discountPercent,
        bonusCredits: promo.bonusCredits,
        description: promo.description,
      };
    }),

  // Apply a promo code to the current user (protected)
  applyCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if user already used a promo
      const userRows = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (userRows[0]?.promoDiscountUsed) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You have already used a promo code." });
      }

      const rows = await db
        .select()
        .from(promoCodes)
        .where(eq(promoCodes.code, input.code.toUpperCase()))
        .limit(1);
      const promo = rows[0];
      if (!promo || !promo.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid promo code." });
      if (promo.usedCount >= promo.maxUses) throw new TRPCError({ code: "BAD_REQUEST", message: "This promo code has expired." });
      if (promo.expiresAt && promo.expiresAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "This promo code has expired." });

      // Mark user as having applied promo
      await db.update(users).set({ appliedPromoCode: promo.code, promoDiscountUsed: true }).where(eq(users.id, ctx.user.id));
      // Increment usage count
      await db.update(promoCodes).set({ usedCount: promo.usedCount + 1 }).where(eq(promoCodes.id, promo.id));
      // Award bonus credits if any
      if (promo.bonusCredits > 0) {
        await addCredits(ctx.user.id, promo.bonusCredits, "referral", undefined, `Promo code ${promo.code}: ${promo.bonusCredits} bonus credits`);
      }

      // Send confirmation email (non-blocking)
      const userEmail = ctx.user.email;
      if (userEmail) {
        sendPromoConfirmationEmail(userEmail, ctx.user.name, promo.code, promo.discountPercent, promo.bonusCredits).catch((e) =>
          console.warn("[Promo] Failed to send confirmation email:", e)
        );
      }

      return {
        success: true,
        discountPercent: promo.discountPercent,
        bonusCredits: promo.bonusCredits,
        message: `Promo applied! ${promo.discountPercent}% off your next purchase${promo.bonusCredits > 0 ? ` + ${promo.bonusCredits} bonus credits` : ""}.`,
      };
    }),

  // Admin: list all promo codes
  list: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }),

  // Admin: create a promo code
  create: adminProcedure
    .input(z.object({
      code: z.string().min(3).max(32),
      discountPercent: z.number().min(1).max(100).default(50),
      bonusCredits: z.number().min(0).default(0),
      maxUses: z.number().min(1).default(100),
      description: z.string().max(255).optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(promoCodes).values({
        code: input.code.toUpperCase(),
        discountPercent: input.discountPercent,
        bonusCredits: input.bonusCredits,
        maxUses: input.maxUses,
        description: input.description,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      });
      return { success: true };
    }),

  // Admin: toggle active status
  toggle: adminProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(promoCodes).set({ isActive: input.isActive }).where(eq(promoCodes.id, input.id));
      return { success: true };
    }),
});

// ─── Admin Router ─────────────────────────────────────────────────────────────

const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [userCount] = await db.select({ count: count() }).from(users);
    const [genCount] = await db.select({ count: count() }).from(tattooGenerations);
    const [artistCount] = await db.select({ count: count() }).from(artists);

    // Revenue from credit transactions
    const revenueRows = await db
      .select({ amount: creditTransactions.amount })
      .from(creditTransactions)
      .where(eq(creditTransactions.type, "purchase"));

    // Approximate revenue: each credit is worth ~$0.20 (50 credits = $9.99)
    const totalCreditsFromPurchases = revenueRows.reduce((sum, r) => sum + r.amount, 0);
    const estimatedRevenue = (totalCreditsFromPurchases / 50) * 9.99;

    // Top styles
    const styleRows = await db
      .select({
        style: tattooGenerations.style,
        count: count(),
      })
      .from(tattooGenerations)
      .groupBy(tattooGenerations.style)
      .orderBy(desc(count()))
      .limit(10);

    // Recent users
    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(20);

    // Credits distribution
    const creditRows = await db
      .select({
        plan: credits.plan,
        count: count(),
        totalBalance: sql<number>`SUM(${credits.balance})`,
      })
      .from(credits)
      .groupBy(credits.plan);

    return {
      userCount: userCount.count,
      genCount: genCount.count,
      artistCount: artistCount.count,
      estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
      topStyles: styleRows.filter((s) => s.style),
      recentUsers,
      creditDistribution: creditRows,
    };
  }),

  listUsers: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const userRows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return userRows;
    }),

  setUserRole: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "admin"]) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  adjustCredits: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), amount: z.number(), reason: z.string() }))
    .mutation(async ({ input }) => {
      if (input.amount > 0) {
        await addCredits(input.userId, input.amount, "purchase", undefined, input.reason);
      }
      return { success: true };
    }),

  verifyArtist: adminProcedure
    .input(z.object({ artistId: z.number().int().positive(), verified: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.update(artists).set({ verified: input.verified }).where(eq(artists.id, input.artistId));
      return { success: true };
    }),

  listArtists: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db.select().from(artists).orderBy(desc(artists.createdAt));
  }),

  // ── Outreach ────────────────────────────────────────────────────────────────

  listCampaigns: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    return db.select().from(outreachCampaigns).orderBy(desc(outreachCampaigns.createdAt));
  }),

  createCampaign: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        country: z.string().min(1).max(128),
        region: z.string().optional(),
        language: z.string().default("en"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Generate email content using AI
      const langNames: Record<string, string> = {
        en: "English", fr: "French", es: "Spanish", de: "German",
        it: "Italian", pt: "Portuguese", ja: "Japanese", ko: "Korean",
        zh: "Mandarin Chinese", ar: "Arabic", ru: "Russian", nl: "Dutch",
        pl: "Polish", sv: "Swedish", no: "Norwegian", da: "Danish",
      };
      const langName = langNames[input.language] || "English";

      const aiResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a marketing copywriter for tatt-ooo, an AI-powered tattoo design platform. 
Write compelling outreach emails to tattoo artists in their native language.
The email should be professional, enthusiastic, and explain the value proposition clearly.
Always write in ${langName}.`,
          },
          {
            role: "user",
            content: `Write a short outreach email to tattoo artists in ${input.country}${input.region ? `, ${input.region}` : ""}.

The email should:
1. Introduce tatt-ooo as an AI tattoo design platform
2. Explain how artists can join our marketplace to get more clients
3. Mention that clients can generate AI designs and then book a real artist to execute them
4. Include a clear call-to-action to sign up at [SIGNUP_URL]
5. Be warm, professional, and culturally appropriate for ${input.country}

Format your response as JSON with these fields:
{
  "subject": "email subject line",
  "body": "full email body in HTML format with <p> tags"
}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "email_content",
            strict: true,
            schema: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
              },
              required: ["subject", "body"],
              additionalProperties: false,
            },
          },
        },
      });

      let subject = `Join tatt-ooo — AI Tattoo Design Platform`;
      let emailBodyHtml = `<p>We'd love to have you on our platform!</p>`;

      try {
        const content = JSON.parse(aiResponse.choices?.[0]?.message?.content as string);
        subject = content.subject;
        emailBodyHtml = content.body;
      } catch (e) {
        console.warn("[Outreach] Failed to parse AI email content:", e);
      }

      const [result] = await db.insert(outreachCampaigns).values({
        name: input.name,
        country: input.country,
        region: input.region ?? null,
        language: input.language,
        subjectLine: subject,
        emailBodyHtml,
        status: "draft",
      });

      const campaignId = (result as { insertId: number }).insertId;
      return { campaignId, subject, emailBodyHtml };
    }),

  addOutreachContacts: adminProcedure
    .input(
      z.object({
        campaignId: z.number().int().positive(),
        contacts: z.array(
          z.object({
            email: z.string().email(),
            name: z.string().optional(),
            studioName: z.string().optional(),
            country: z.string().optional(),
            language: z.string().default("en"),
          })
        ).max(500),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const contactsToInsert = input.contacts.map((c) => ({
        campaignId: input.campaignId,
        email: c.email,
        name: c.name ?? null,
        studioName: c.studioName ?? null,
        country: c.country ?? null,
        language: c.language,
        trackingPixelId: nanoid(16),
      }));

      await db.insert(outreachContacts).values(contactsToInsert);
      return { added: contactsToInsert.length };
    }),

  sendCampaign: adminProcedure
    .input(z.object({ campaignId: z.number().int().positive(), origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const campaignRows = await db
        .select()
        .from(outreachCampaigns)
        .where(eq(outreachCampaigns.id, input.campaignId))
        .limit(1);

      if (!campaignRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found." });

      const campaign = campaignRows[0];

      const pendingContacts = await db
        .select()
        .from(outreachContacts)
        .where(
          and(
            eq(outreachContacts.campaignId, input.campaignId),
            eq(outreachContacts.status, "pending")
          )
        )
        .limit(100); // Send in batches of 100

      if (pendingContacts.length === 0) {
        return { sent: 0, message: "No pending contacts." };
      }

      // Update campaign status
      await db
        .update(outreachCampaigns)
        .set({ status: "sending" })
        .where(eq(outreachCampaigns.id, input.campaignId));

      const { sendOutreachEmail } = await import("./emailService");
      let sentCount = 0;

      for (const contact of pendingContacts) {
        try {
          const trackingPixelUrl = `${input.origin}/api/track/open/${contact.trackingPixelId}`;
          const signupUrl = `${input.origin}/signup?ref=outreach&campaign=${input.campaignId}`;

          const personalizedBody = (campaign.emailBodyHtml || "")
            .replace(/\[SIGNUP_URL\]/g, signupUrl)
            .replace(/\[NAME\]/g, contact.name || "there")
            .replace(/\[STUDIO\]/g, contact.studioName || "your studio")
            + `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" />`;

          await sendOutreachEmail({
            to: contact.email,
            toName: contact.name ?? undefined,
            subject: campaign.subjectLine || "Join tatt-ooo",
            htmlBody: personalizedBody,
          });

          await db
            .update(outreachContacts)
            .set({ status: "sent", sentAt: new Date() })
            .where(eq(outreachContacts.id, contact.id));

          sentCount++;
        } catch (err) {
          console.warn(`[Outreach] Failed to send to ${contact.email}:`, err);
          await db
            .update(outreachContacts)
            .set({ status: "bounced" })
            .where(eq(outreachContacts.id, contact.id));
        }
      }

      await db
        .update(outreachCampaigns)
        .set({
          sentCount: campaign.sentCount + sentCount,
          status: "completed",
        })
        .where(eq(outreachCampaigns.id, input.campaignId));

      return { sent: sentCount };
    }),

  getCampaignContacts: adminProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(outreachContacts)
        .where(eq(outreachContacts.campaignId, input.campaignId))
        .orderBy(desc(outreachContacts.createdAt));
    }),

  // ── Promo Code Management ──────────────────────────────────────────────────
  listPromos: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }),

  createPromo: adminProcedure
    .input(
      z.object({
        code: z.string().min(3).max(32).toUpperCase(),
        discountPercent: z.number().int().min(0).max(100).default(0),
        bonusCredits: z.number().int().min(0).default(0),
        description: z.string().optional(),
        maxUses: z.number().int().positive().optional(),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Check for duplicate
      const existing = await db.select().from(promoCodes).where(eq(promoCodes.code, input.code.toUpperCase())).limit(1);
      if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Promo code already exists" });
      await db.insert(promoCodes).values({
        code: input.code.toUpperCase(),
        discountPercent: input.discountPercent,
        bonusCredits: input.bonusCredits,
        description: input.description ?? undefined,
        maxUses: input.maxUses ?? 1000,
        expiresAt: input.expiresAt ?? undefined,
        isActive: true,
        usedCount: 0,
      });
      return { success: true };
    }),

  updatePromo: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        discountPercent: z.number().int().min(0).max(100).optional(),
        bonusCredits: z.number().int().min(0).optional(),
        description: z.string().optional(),
        maxUses: z.number().int().positive().nullable().optional(),
        expiresAt: z.date().nullable().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...fields } = input;
      const updateData: Record<string, unknown> = {};
      if (fields.discountPercent !== undefined) updateData.discountPercent = fields.discountPercent;
      if (fields.bonusCredits !== undefined) updateData.bonusCredits = fields.bonusCredits;
      if (fields.description !== undefined) updateData.description = fields.description;
      if (fields.maxUses !== undefined) updateData.maxUses = fields.maxUses;
      if (fields.expiresAt !== undefined) updateData.expiresAt = fields.expiresAt;
      if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
      await db.update(promoCodes).set(updateData).where(eq(promoCodes.id, id));
      return { success: true };
    }),

  deletePromo: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(promoCodes).set({ isActive: false }).where(eq(promoCodes.id, input.id));
      return { success: true };
    }),

  // ── Gift Credits ─────────────────────────────────────────────────────────────
  giftCredits: adminProcedure
    .input(z.object({
      email: z.string().email(),
      amount: z.number().int().min(1).max(10000),
      reason: z.string().min(1).max(200).default("Admin gift"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const userRows = await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users).where(eq(users.email, input.email)).limit(1);
      if (!userRows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "No user found with that email" });
      const targetUser = userRows[0];
      await addCredits(targetUser.id, input.amount, "purchase", undefined, `Admin gift: ${input.reason}`);
      return { success: true, userId: targetUser.id, name: targetUser.name, credited: input.amount };
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
  team: teamRouter,
  sharing: sharingRouter,
  referral: referralRouter,
  promo: promoRouter,
  admin: adminRouter,
  advertising: advertisingRouter,
  affiliate: affiliateRouter,
  creditMgmt: creditRouter,
  subscription: subscriptionRouter,
  seo: seoRouter,
  marketing: marketingRouter,
  mailingList: mailingListRouter,
  sendDesign: sendDesignRouter,
  booking: bookingRouter,
  availability: availabilityRouter,
  notifications: notificationsRouter,
  blog: blogRouter,
  contentCreator: contentCreatorRouter,
});

export type AppRouter = typeof appRouter;
