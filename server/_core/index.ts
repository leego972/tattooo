import "dotenv/config";
import express from "express";
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
import { studioMailingList, users } from "../../drizzle/schema";
import { registerUser } from "../emailAuth";
import { eq } from "drizzle-orm";
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
  const server = createServer(app);
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
