/**
 * Studio Mailing List Router
 * Handles info pack sending, weekly ad generation, unsubscribe, and contact management.
 */
import { z } from "zod";
import { eq, and, desc, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { studioMailingList, weeklyAdSends, infoPackAttachments } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { sendOutreachEmail } from "./emailService";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ── Language map for email content ────────────────────────────────────────────
const LANG_NAMES: Record<string, string> = {
  en: "English", de: "German", fr: "French", es: "Spanish", it: "Italian",
  pt: "Portuguese", ja: "Japanese", ko: "Korean", nl: "Dutch", he: "Hebrew",
};

// ── Generate info pack email body for a given language ────────────────────────
async function generateInfoPackEmail(language: string, studioName: string, origin: string): Promise<{ subject: string; htmlBody: string }> {
  const langName = LANG_NAMES[language] || "English";
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a professional marketing copywriter for tatt-ooo, an AI tattoo design platform. Write compelling outreach emails to tattoo studios in their native language. Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Write a professional, compelling info pack email to a tattoo studio called "${studioName}" in ${langName}.

Core message to convey:
tatt-ooo handles everything on the client side — we generate the traffic, we acquire the client, and we deliver a fully prepared, AI-generated design brief to scale before the client even walks through the door. The studio's only job is to do what they do best: the tattoo. In return, we charge a 13% service fee on the quoted job value, only when a booking is successfully confirmed. No upfront costs. No subscriptions. No risk.

The email should:
1. Open powerfully — position tatt-ooo as a growth partner that fills their chair with ready-to-go clients, not just a lead generator
2. Make it crystal clear: we handle the marketing, the client acquisition, and the design preparation — they just need to show up and tattoo
3. Emphasise the AI-prepared design brief: clients arrive knowing exactly what they want, at the right scale and placement, eliminating wasted consultation time
4. Present the 13% fee as a fair exchange for a fully managed, end-to-end client delivery — pure incremental revenue with zero effort on their part
5. Mention that tatt-ooo is available on both Android and iOS for maximum client convenience — clients can design their tattoo anytime, anywhere, and book directly through the app
6. Include a clear call-to-action to list their studio at ${origin}/artist-signup
7. Be confident, direct, and professional — speak to the studio owner as a serious business partner who understands ROI
8. Be written entirely in ${langName}

Respond with JSON: { "subject": "...", "htmlBody": "..." }
The htmlBody should be clean HTML paragraphs (no full page wrapper, just the content body).`,
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
            htmlBody: { type: "string" },
          },
          required: ["subject", "htmlBody"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("LLM returned empty content");
  const parsed = JSON.parse(content);
  return { subject: parsed.subject as string, htmlBody: parsed.htmlBody as string };
}

// ── Generate weekly ad email with AI image ────────────────────────────────────
async function generateWeeklyAdEmail(language: string, studioName: string, origin: string): Promise<{ subject: string; htmlBody: string; imageUrl: string }> {
  const langName = LANG_NAMES[language] || "English";
  const weekNum = getISOWeek(new Date());

  // Generate ad image
  const adPrompts = [
    "A stunning photorealistic tattoo sleeve with intricate geometric patterns and floral elements, professional studio photography, dark moody background",
    "Beautiful watercolor tattoo design on skin showing a phoenix rising, vibrant colors, professional tattoo photography",
    "Minimalist fine-line tattoo of a mountain range on forearm, crisp black lines, clean white studio background",
    "Japanese traditional tattoo style dragon, bold colors, professional photography, dramatic lighting",
    "Blackwork mandala tattoo on back, symmetrical, intricate dotwork, professional studio lighting",
  ];
  const prompt = adPrompts[weekNum % adPrompts.length];

  let imageUrl = "";
  try {
    const result = await generateImage({ prompt: `${prompt}. Add subtle text overlay: "tatt-ooo.com" in elegant white font` });
    imageUrl = result.url ?? "";
  } catch {
    // Fall back to no image if generation fails
    imageUrl = "";
  }

  // Generate email copy
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a marketing copywriter for tatt-ooo. Write short, punchy weekly reminder emails to tattoo studios. Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Write a short weekly reminder email to tattoo studio "${studioName}" in ${langName}.

The email should:
1. Be short (2-3 short paragraphs max)
2. Remind them about tatt-ooo — the AI tattoo design tool their clients are using
3. Mention one specific benefit (e.g., clients arrive with clearer briefs, saves consultation time)
4. Include a soft CTA to list their studio at ${origin}/artist-signup
5. Feel like a friendly weekly newsletter, not a hard sell
6. Be written entirely in ${langName}

Respond with JSON: { "subject": "...", "htmlBody": "..." }
The htmlBody should be clean HTML paragraphs only (no full page wrapper).`,
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
            htmlBody: { type: "string" },
          },
          required: ["subject", "htmlBody"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("LLM returned empty content");
  const parsed = JSON.parse(content);

  // Embed image into htmlBody if we have one
  const imageHtml = imageUrl
    ? `<div style="text-align:center;margin:24px 0;"><img src="${imageUrl}" alt="tatt-ooo AI Tattoo Design" style="max-width:100%;border-radius:8px;border:1px solid #1e293b;" /></div>`
    : "";

  return {
    subject: parsed.subject,
    htmlBody: imageHtml + parsed.htmlBody,
    imageUrl,
  };
}

// ── ISO week number helper ────────────────────────────────────────────────────
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Router ────────────────────────────────────────────────────────────────────
export const mailingListRouter = router({
  // List all studios with filters
  list: adminProcedure
    .input(z.object({
      country: z.string().optional(),
      emailStatus: z.enum(["found", "not_found", "bounced", "unsubscribed"]).optional(),
      infoPackStatus: z.enum(["not_sent", "sent", "opened", "bounced"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(studioMailingList).orderBy(desc(studioMailingList.createdAt));
      return rows.filter((r) => {
        if (input.country && r.country !== input.country) return false;
        if (input.emailStatus && r.emailStatus !== input.emailStatus) return false;
        if (input.infoPackStatus && r.infoPackStatus !== input.infoPackStatus) return false;
        if (input.search) {
          const q = input.search.toLowerCase();
          if (!r.studioName.toLowerCase().includes(q) && !r.city?.toLowerCase().includes(q) && !r.email?.toLowerCase().includes(q)) return false;
        }
        return true;
      });
    }),

  // Stats summary
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select().from(studioMailingList);
    return {
      total: rows.length,
      emailFound: rows.filter((r) => r.emailStatus === "found").length,
      emailNotFound: rows.filter((r) => r.emailStatus === "not_found").length,
      unsubscribed: rows.filter((r) => r.emailStatus === "unsubscribed").length,
      infoPackSent: rows.filter((r) => r.infoPackStatus === "sent" || r.infoPackStatus === "opened").length,
      weeklyOptOut: rows.filter((r) => r.weeklyAdOptOut).length,
    };
  }),

  // Update a studio's email
  updateEmail: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      email: z.string().email().optional(),
      emailStatus: z.enum(["found", "not_found", "bounced", "unsubscribed"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(studioMailingList).set({
        ...(input.email !== undefined ? { email: input.email, emailStatus: "found" } : {}),
        ...(input.emailStatus !== undefined ? { emailStatus: input.emailStatus } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      }).where(eq(studioMailingList.id, input.id));
      return { success: true };
    }),

  // Delete a studio from the list
  delete: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(studioMailingList).where(eq(studioMailingList.id, input.id));
      return { success: true };
    }),

  // Add a new studio manually
  add: adminProcedure
    .input(z.object({
      studioName: z.string().min(1),
      city: z.string().optional(),
      country: z.string().min(1),
      language: z.string().default("en"),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const token = nanoid(48);
      await db.insert(studioMailingList).values({
        studioName: input.studioName,
        city: input.city,
        country: input.country,
        language: input.language,
        email: input.email,
        emailStatus: input.email ? "found" : "not_found",
        unsubscribeToken: token,
      });
      return { success: true };
    }),

  // Upload info pack PDF for a language
  uploadInfoPack: adminProcedure
    .input(z.object({
      language: z.string().min(1),
      fileBase64: z.string(), // base64 encoded PDF
      fileName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const buffer = Buffer.from(input.fileBase64, "base64");
      const key = `info-packs/${input.language}-${nanoid(8)}.pdf`;
      const { url } = await storagePut(key, buffer, "application/pdf");
      // Upsert
      const existing = await db.select().from(infoPackAttachments).where(eq(infoPackAttachments.language, input.language)).limit(1);
      if (existing.length > 0) {
        await db.update(infoPackAttachments).set({ fileUrl: url, fileName: input.fileName }).where(eq(infoPackAttachments.language, input.language));
      } else {
        await db.insert(infoPackAttachments).values({ language: input.language, fileUrl: url, fileName: input.fileName });
      }
      return { success: true, url };
    }),

  // Get all uploaded info packs
  getInfoPacks: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(infoPackAttachments).orderBy(infoPackAttachments.language);
  }),

  // Send info pack to a single studio
  sendInfoPack: adminProcedure
    .input(z.object({
      studioId: z.number().int().positive(),
      origin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(studioMailingList).where(eq(studioMailingList.id, input.studioId)).limit(1);
      const studio = rows[0];
      if (!studio) throw new TRPCError({ code: "NOT_FOUND" });
      if (!studio.email) throw new TRPCError({ code: "BAD_REQUEST", message: "No email address for this studio." });
      if (studio.emailStatus === "unsubscribed") throw new TRPCError({ code: "BAD_REQUEST", message: "Studio has unsubscribed." });

       const unsubscribeUrl = `${input.origin}/api/unsubscribe/${studio.unsubscribeToken}`;
      const { subject, htmlBody } = await generateInfoPackEmail(studio.language, studio.studioName, input.origin);
      const bodyWithUnsub = htmlBody + `<p style="margin-top:32px;font-size:12px;color:#64748b;">To unsubscribe from future emails, <a href="${unsubscribeUrl}" style="color:#06b6d4;">click here</a>.</p>`;
      // Fetch language-specific PDF attachment
      const lang = studio.language || "en";
      const attachRows = await db.select().from(infoPackAttachments)
        .where(eq(infoPackAttachments.language, lang)).limit(1);
      const fallbackRows = attachRows.length ? attachRows : await db.select().from(infoPackAttachments)
        .where(eq(infoPackAttachments.language, "en")).limit(1);
      const attachment = fallbackRows[0];
      await sendOutreachEmail({
        to: studio.email,
        toName: studio.studioName,
        subject,
        htmlBody: bodyWithUnsub,
        unsubscribeToken: studio.unsubscribeToken ?? undefined,
        attachmentUrl: attachment?.fileUrl,
        attachmentName: attachment?.fileName,
      });
      await db.update(studioMailingList).set({ infoPackSentAt: new Date(), infoPackStatus: "sent" }).where(eq(studioMailingList.id, input.studioId));
      return { success: true, subject };
    }),

  // Send info pack to ALL studios with emails (batch)
  sendInfoPackBatch: adminProcedure
    .input(z.object({ origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const studios = await db.select().from(studioMailingList)
        .where(and(
          isNotNull(studioMailingList.email),
          eq(studioMailingList.emailStatus, "found"),
          eq(studioMailingList.infoPackStatus, "not_sent"),
        ));

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const studio of studios) {
        if (!studio.email) continue;
        try {
          const unsubscribeUrl = `${input.origin}/api/unsubscribe/${studio.unsubscribeToken}`;
          const { subject, htmlBody } = await generateInfoPackEmail(studio.language, studio.studioName, input.origin);
          const bodyWithUnsub = htmlBody + `<p style="margin-top:32px;font-size:12px;color:#64748b;">To unsubscribe, <a href="${unsubscribeUrl}" style="color:#06b6d4;">click here</a>.</p>`;
          // Fetch language-specific PDF
          const lang = studio.language || "en";
          const aRows = await db.select().from(infoPackAttachments).where(eq(infoPackAttachments.language, lang)).limit(1);
          const fbRows = aRows.length ? aRows : await db.select().from(infoPackAttachments).where(eq(infoPackAttachments.language, "en")).limit(1);
          const att = fbRows[0];
          await sendOutreachEmail({
            to: studio.email,
            toName: studio.studioName,
            subject,
            htmlBody: bodyWithUnsub,
            unsubscribeToken: studio.unsubscribeToken ?? undefined,
            attachmentUrl: att?.fileUrl,
            attachmentName: att?.fileName,
          });
          await db.update(studioMailingList).set({ infoPackSentAt: new Date(), infoPackStatus: "sent" }).where(eq(studioMailingList.id, studio.id));
          sent++;
          // Rate limit: 1.5s per email to stay within Gmail rate limits
          await new Promise((r) => setTimeout(r, 1500));
        } catch (err: unknown) {
          failed++;
          errors.push(`${studio.studioName}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      return { sent, failed, errors };
    }),

  // Send weekly ad to ALL opted-in studios with emails
  sendWeeklyAd: adminProcedure
    .input(z.object({ origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const weekNum = getISOWeek(new Date());
      const year = new Date().getFullYear();

      // Get studios that haven't received this week's ad yet
      const studios = await db.select().from(studioMailingList)
        .where(and(
          isNotNull(studioMailingList.email),
          eq(studioMailingList.emailStatus, "found"),
          eq(studioMailingList.weeklyAdOptOut, false),
        ));

      // Check which studios already got this week's ad
      const alreadySent = await db.select({ studioId: weeklyAdSends.studioId })
        .from(weeklyAdSends)
        .where(and(eq(weeklyAdSends.weekNumber, weekNum), eq(weeklyAdSends.year, year)));
      const alreadySentIds = new Set(alreadySent.map((r) => r.studioId));

      const pending = studios.filter((s) => !alreadySentIds.has(s.id));

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const studio of pending) {
        if (!studio.email) continue;
        try {
          const unsubscribeUrl = `${input.origin}/api/unsubscribe/${studio.unsubscribeToken}`;
          const { subject, htmlBody, imageUrl } = await generateWeeklyAdEmail(studio.language, studio.studioName, input.origin);
          const bodyWithUnsub = htmlBody + `<p style="margin-top:32px;font-size:12px;color:#64748b;">To unsubscribe, <a href="${unsubscribeUrl}" style="color:#06b6d4;">click here</a>.</p>`;

          await sendOutreachEmail({ to: studio.email, toName: studio.studioName, subject, htmlBody: bodyWithUnsub });
          await db.insert(weeklyAdSends).values({ studioId: studio.id, weekNumber: weekNum, year, subject, imageUrl, emailBodyHtml: htmlBody, status: "sent" });
          await db.update(studioMailingList).set({ lastWeeklyAdSentAt: new Date(), weeklyAdSentCount: (studio.weeklyAdSentCount || 0) + 1 }).where(eq(studioMailingList.id, studio.id));
          sent++;
          await new Promise((r) => setTimeout(r, 1000));
        } catch (err: unknown) {
          failed++;
          errors.push(`${studio.studioName}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      return { sent, failed, errors, weekNum, year };
    }),

  // Get weekly ad send history
  weeklyAdHistory: adminProcedure
    .input(z.object({ limit: z.number().int().positive().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(weeklyAdSends).orderBy(desc(weeklyAdSends.sentAt)).limit(input.limit);
    }),

  // Preview a generated info pack email (without sending)
  previewInfoPack: adminProcedure
    .input(z.object({ language: z.string(), studioName: z.string(), origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const { subject, htmlBody } = await generateInfoPackEmail(input.language, input.studioName, input.origin);
      return { subject, htmlBody };
    }),

  // Preview a generated weekly ad (without sending)
  previewWeeklyAd: adminProcedure
    .input(z.object({ language: z.string(), studioName: z.string(), origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const { subject, htmlBody, imageUrl } = await generateWeeklyAdEmail(input.language, input.studioName, input.origin);
      return { subject, htmlBody, imageUrl };
    }),

  // Upload an ad image and get back a public CDN URL
  uploadAdImage: adminProcedure
    .input(z.object({
      base64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const ext = input.fileName.split(".").pop() ?? "jpg";
      const key = `ad-blasts/${Date.now()}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  // Send a custom ad blast to all opted-in studios with emails
  sendCustomAd: adminProcedure
    .input(z.object({
      subject: z.string().min(1),
      bodyHtml: z.string().min(1),
      imageUrl: z.string().url().optional(),
      origin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const studios = await db.select().from(studioMailingList)
        .where(and(
          isNotNull(studioMailingList.email),
          eq(studioMailingList.emailStatus, "found"),
          eq(studioMailingList.weeklyAdOptOut, false),
        ));

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const studio of studios) {
        if (!studio.email) continue;
        try {
          const unsubscribeUrl = `${input.origin}/api/unsubscribe/${studio.unsubscribeToken}`;
          const personalizedBody = input.bodyHtml.replace(/\{\{STUDIO_NAME\}\}/g, studio.studioName);
          const imageBlock = input.imageUrl
            ? `<div style="text-align:center;margin:24px 0;"><img src="${input.imageUrl}" alt="" style="max-width:100%;border-radius:8px;" /></div>`
            : "";
          const fullHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e2e8f0;padding:32px;border-radius:12px;">${imageBlock}${personalizedBody}<p style="margin-top:32px;font-size:12px;color:#64748b;">To unsubscribe, <a href="${unsubscribeUrl}" style="color:#06b6d4;">click here</a>.</p></div>`;
          await sendOutreachEmail({
            to: studio.email,
            toName: studio.studioName,
            subject: input.subject,
            htmlBody: fullHtml,
            unsubscribeToken: studio.unsubscribeToken ?? undefined,
            adImageUrl: input.imageUrl,
          });
          await db.update(studioMailingList)
            .set({ lastWeeklyAdSentAt: new Date(), weeklyAdSentCount: (studio.weeklyAdSentCount || 0) + 1 })
            .where(eq(studioMailingList.id, studio.id));
          sent++;
          await new Promise((r) => setTimeout(r, 1000));
        } catch (err: unknown) {
          failed++;
          errors.push(`${studio.studioName}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      return { sent, failed, errors, total: studios.length };
    }),
});

// ── Public unsubscribe handler (used by Express route) ───────────────────────
export async function handleUnsubscribe(token: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(studioMailingList).where(eq(studioMailingList.unsubscribeToken, token)).limit(1);
  if (!rows[0]) return false;
  await db.update(studioMailingList).set({ emailStatus: "unsubscribed", weeklyAdOptOut: true }).where(eq(studioMailingList.id, rows[0].id));
  return true;
}

// ── Weekly ad job (called by cron scheduler) ─────────────────────────────────
// Uses the deployed site origin for links and unsubscribe URLs
const PROD_ORIGIN = process.env.VITE_APP_ORIGIN || "https://tattooo.shop";

export async function runWeeklyAdJob(): Promise<{ sent: number; failed: number; errors: string[] }> {
  console.log("[DISABLED] runWeeklyAdJob");
  return { sent: 0, failed: 0, errors: [] };
}
