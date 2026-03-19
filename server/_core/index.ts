import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import healthRouter from "../health";
import stripeWebhookRouter from "../stripeWebhook";
import { handleUnsubscribe, runWeeklyAdJob } from "../mailing-list-router";
import { getDb } from "../db";
import { invokeLLMStream } from "./llm";
import { studioMailingList, users, bookings, inAppNotifications } from "../../drizzle/schema";
import { sendBookingNotificationEmail } from "../emailService";
import { registerUser } from "../emailAuth";
import { eq, and, lt, isNull } from "drizzle-orm";
import cron from "node-cron";
import { seedBlogPosts } from "../blog-seed";
import { migrate } from "drizzle-orm/mysql2/migrator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function runMigrations() {
  try {
    const db = await getDb();
    if (!db) { console.warn("[Migrate] DB not available, skipping migrations"); return; }
    const migrationsFolder = path.resolve(__dirname, "../drizzle");
    await migrate(db as any, { migrationsFolder });
    console.log("[Migrate] Migrations applied successfully");
  } catch (err) {
    console.error("[Migrate] Migration error (non-fatal):", err);
  }
}

async function startServer() {
  await runMigrations();
  const app = express();
  app.set("trust proxy", 1); // Trust Railway's proxy for secure cookies
  const server = createServer(app);
  // Cookie parser must be before tRPC middleware
  app.use(cookieParser());
  // Stripe webhook MUST be registered before express.json() for raw body access
  app.use(stripeWebhookRouter);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check endpoint (used by Railway)
  app.use("/api", healthRouter);

  // Unsubscribe endpoint for studio mailing list
  app.get("/api/unsubscribe/:token", async (req, res) => {
    const { token } = req.params;
    const success = await handleUnsubscribe(token);
    const html = success
      ? `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Unsubscribed - tatt-ooo</title></head><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0a;color:#94a3b8;"><div style="font-size:28px;font-weight:900;color:#fff;">tatt<span style="color:#06b6d4;">-ooo</span></div><p style="margin-top:24px;">You have been successfully unsubscribed.</p><p>You will no longer receive emails from us.</p></body></html>`
      : `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invalid Link - tatt-ooo</title></head><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0a;color:#94a3b8;"><div style="font-size:28px;font-weight:900;color:#fff;">tatt<span style="color:#06b6d4;">-ooo</span></div><p style="margin-top:24px;">This unsubscribe link is invalid or has already been used.</p></body></html>`;
    res.status(success ? 200 : 404).send(html);
  });

  // One-time admin setup endpoint — creates the admin account if it doesn't exist
  app.post("/api/admin/setup", async (req, res) => {
    const { secret, email, password, name } = req.body;
    if (!secret || secret !== process.env.JWT_SECRET) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "db unavailable" }); return; }
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        await db.update(users).set({ role: "admin", emailVerified: true }).where(eq(users.email, email));
        res.json({ message: "User already exists, role updated to admin", email });
        return;
      }
      const user = await registerUser(email, name || "Admin", password);
      await db.update(users).set({ role: "admin", emailVerified: true }).where(eq(users.id, user.id));
      res.json({ message: "Admin user created successfully", email, id: user.id });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Temporary endpoint to run raw SQL migrations for missing columns
  app.post("/api/admin/run-sql", async (req, res) => {
    const { secret, sql } = req.body;
    if (!secret || secret !== process.env.JWT_SECRET) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "db unavailable" }); return; }
      const result = await (db as any).execute(sql);
      res.json({ message: "SQL executed", result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Temporary admin export endpoint for studio mailing list
  app.get("/api/admin/export-studios", async (req, res) => {
    const secret = req.query.secret as string;
    if (!secret || secret !== process.env.JWT_SECRET) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    try {
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "db unavailable" }); return; }
      const rows = await db.select().from(studioMailingList);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── SSE Streaming Chat (Titan-style real-time token streaming) ────────
  // Maps sessionId -> SSE Response so the POST handler can write to it
  const activeChatStreams = new Map<string, import('express').Response>();

  app.get("/api/chat/stream/:sessionId", (_req, res) => {
    const { sessionId } = _req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    activeChatStreams.set(sessionId, res);
    _req.on("close", () => activeChatStreams.delete(sessionId));
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
  });

  app.post("/api/chat/stream/:sessionId/send", async (req, res) => {
    const { sessionId } = req.params;
    const { messages } = req.body as { messages: Array<{ role: string; content: string }> };
    const sseRes = activeChatStreams.get(sessionId);
    if (!sseRes) { res.status(404).json({ error: "No active stream" }); return; }

    const SYSTEM = `You are Ink, a world-class tattoo design consultant and AI artist for tatt-ooo. Your purpose is to generate tattoo designs — that is your primary job.

Have a friendly conversation to gather details, but ALWAYS lean toward generating rather than asking more questions.

You know all styles: Traditional, Neo-Traditional, Realism, Watercolour, Geometric, Blackwork, Japanese, Tribal, Fine Line, Illustrative, Minimalist, Dotwork.

RULES:
- If the user gives you ANY description of a tattoo (even vague), generate it — do not keep asking questions
- If the user says "generate", "just do it", "surprise me", "go ahead", "make it", or anything similar, generate IMMEDIATELY
- You only need a basic concept to generate — style, placement, size and colour can be inferred or defaulted
- At most ask ONE clarifying question, then generate on the next message regardless
- NEVER refuse to generate — always find a way to create something

When ready to generate, respond ONLY with this exact JSON (no markdown, no code fences, no extra text):
{"readyToGenerate": true, "summary": "<detailed generation prompt>"}`;

    const llmMessages = [
      { role: "system" as const, content: SYSTEM },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    sseRes.write(`data: ${JSON.stringify({ type: "thinking", message: "Ink is thinking..." })}\n\n`);

    let fullText = "";
    await invokeLLMStream(
      { messages: llmMessages, maxTokens: 600 },
      (token) => {
        fullText += token;
        if (!fullText.trimStart().startsWith("{")) {
          sseRes.write(`data: ${JSON.stringify({ type: "token", token })}\n\n`);
        }
      },
      (full) => {
        // Strip markdown code fences if the model wrapped the JSON
        const stripped = full.trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();
        // Also try to extract a JSON object if there's surrounding text
        const jsonMatch = stripped.match(/\{[\s\S]*"readyToGenerate"[\s\S]*\}/);
        const toParse = jsonMatch ? jsonMatch[0] : stripped;
        try {
          const parsed = JSON.parse(toParse);
          if (parsed.readyToGenerate) {
            sseRes.write(`data: ${JSON.stringify({ type: "ready_to_generate", summary: parsed.summary })}\n\n`);
          } else {
            sseRes.write(`data: ${JSON.stringify({ type: "done", text: full })}\n\n`);
          }
        } catch {
          sseRes.write(`data: ${JSON.stringify({ type: "done", text: full })}\n\n`);
        }
      },
      (err) => sseRes.write(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`)
    );

    res.json({ ok: true });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer()
  .then(() => {
    // Seed blog posts after server is up (only inserts missing posts)
    seedBlogPosts()
      .then(n => { if (n > 0) console.log(`[BlogSeed] Inserted ${n} new tattoo blog posts`); })
      .catch(err => console.error("[BlogSeed] Error:", err));
  })
  .catch(console.error);

// ── Weekly Ad Cron Job ────────────────────────────────────────────────────────
// Fires every Monday at 09:00 UTC
// Generates an AI picture ad and emails all opted-in studios in their language
cron.schedule("0 9 * * 1", async () => {
  console.log("[WeeklyAdCron] Starting weekly ad job...");
  try {
    const result = await runWeeklyAdJob();
    console.log(`[WeeklyAdCron] Done — sent: ${result.sent}, failed: ${result.failed}`);
  } catch (err) {
    console.error("[WeeklyAdCron] Error:", err);
  }
}, { timezone: "UTC" });

// ── 24-Hour Quote Timeout Cron ────────────────────────────────────────────────
// Runs every hour. Finds bookings in 'pending' status with no quote sent
// that are older than 24 hours, notifies the customer to pick another studio.
cron.schedule("0 * * * *", async () => {
  try {
    const db = await getDb();
    if (!db) return;
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Find pending bookings older than 24 hours with no quote yet
    const timedOut = await db.select({
      id: bookings.id,
      customerId: bookings.customerId,
      artistId: bookings.artistId,
      createdAt: bookings.createdAt,
    }).from(bookings)
      .where(and(
        eq(bookings.status, "pending"),
        isNull(bookings.quotedAmountCents),
        lt(bookings.createdAt, cutoff),
      ));
    if (timedOut.length === 0) return;
    console.log(`[QuoteTimeoutCron] Found ${timedOut.length} timed-out booking(s)`);
    for (const booking of timedOut) {
      try {
        const [customer] = await db.select().from(users).where(eq(users.id, booking.customerId)).limit(1);
        if (!customer?.email) continue;
        const [artist] = await db.select().from(users).where(eq(users.id, booking.artistId)).limit(1);
        // Create in-app notification for customer
        await db.insert(inAppNotifications).values({
          userId: booking.customerId,
          type: "system",
          title: "⏰ No Quote Received — Choose Another Artist",
          message: `The studio you requested hasn't responded within 24 hours. We recommend choosing a different artist for your booking.`,
          data: JSON.stringify({ bookingId: booking.id, artistId: booking.artistId }),
          isRead: false,
        });
        // Send email notification
        await sendBookingNotificationEmail({
          to: customer.email,
          toName: customer.name || customer.email,
          type: "declined",
          artistName: artist?.name || "the selected studio",
          reason: "The studio did not respond within 24 hours. We recommend choosing a different artist.",
          bookingId: booking.id,
        });
        // Cancel the timed-out booking so it doesn't keep triggering
        await db.update(bookings)
          .set({ status: "cancelled", declineReason: "Studio did not respond within 24 hours" })
          .where(eq(bookings.id, booking.id));
        console.log(`[QuoteTimeoutCron] Notified customer ${customer.email} for booking #${booking.id}`);
      } catch (err) {
        console.error(`[QuoteTimeoutCron] Error processing booking #${booking.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[QuoteTimeoutCron] Fatal error:", err);
  }
}, { timezone: "UTC" });
