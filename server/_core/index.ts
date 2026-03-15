import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import healthRouter from "../health";
import stripeWebhookRouter from "../stripeWebhook";
import { handleUnsubscribe } from "../mailing-list-router";

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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Stripe webhook MUST be registered before express.json() for raw body access
  app.use(stripeWebhookRouter);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
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

startServer().catch(console.error);
