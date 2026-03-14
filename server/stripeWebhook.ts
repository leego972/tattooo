/**
 * Stripe webhook handler.
 * Must be registered BEFORE express.json() so the raw body is available
 * for signature verification.
 */
import { Router } from "express";
import { constructWebhookEvent, CREDIT_PACKS, type PackId } from "./stripe";
import { addCredits, setStripeCustomerId, getOrCreateCredits } from "./credits.db";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripeWebhookRouter = Router();

stripeWebhookRouter.post(
  "/api/stripe/webhook",
  // Raw body is required for Stripe signature verification
  // This route is registered before express.json()
  (req, res, next) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      (req as unknown as { rawBody: string }).rawBody = data;
      next();
    });
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Webhook] STRIPE_WEBHOOK_SECRET is not set");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    let event;
    try {
      const rawBody = (req as unknown as { rawBody: string }).rawBody;
      event = constructWebhookEvent(Buffer.from(rawBody), sig, webhookSecret);
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Test events — return immediately
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Webhook] Event: ${event.type} | ${event.id}`);

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as {
          metadata?: { userId?: string; packId?: string; credits?: string };
          customer?: string;
          customer_email?: string;
        };

        const userId = session.metadata?.userId ? parseInt(session.metadata.userId) : null;
        const packId = session.metadata?.packId as PackId | undefined;
        const creditsAmount = session.metadata?.credits ? parseInt(session.metadata.credits) : 0;

        if (!userId || !packId) {
          console.warn("[Webhook] Missing userId or packId in metadata");
          return res.json({ received: true });
        }

        const pack = CREDIT_PACKS.find((p) => p.id === packId);
        if (!pack) {
          console.warn("[Webhook] Unknown packId:", packId);
          return res.json({ received: true });
        }

        // Save Stripe customer ID if available
        if (session.customer && typeof session.customer === "string") {
          await setStripeCustomerId(userId, session.customer);
        }

        // Grant credits
        await addCredits(
          userId,
          creditsAmount,
          packId as "starter" | "pro" | "unlimited",
          event.id,
          `Purchased ${pack.name}: ${pack.description}`
        );

        console.log(`[Webhook] Granted ${creditsAmount} credits to user ${userId} (${packId})`);
      }

      if (event.type === "customer.subscription.deleted") {
        // Downgrade to free plan when subscription is cancelled
        const subscription = event.data.object as { metadata?: { userId?: string } };
        const userId = subscription.metadata?.userId ? parseInt(subscription.metadata.userId) : null;
        if (userId) {
          const db = await getDb();
          if (db) {
            // Keep remaining balance, just downgrade plan
            const userCredits = await getOrCreateCredits(userId);
            if (userCredits.plan === "unlimited") {
              const { credits } = await import("../drizzle/schema");
              await db.update(credits).set({ plan: "free", stripeSubscriptionId: null, subscriptionStatus: "cancelled" }).where(eq(credits.userId, userId));
            }
          }
        }
      }
    } catch (err) {
      console.error("[Webhook] Error processing event:", err);
      return res.status(500).json({ error: "Webhook processing failed" });
    }

    return res.json({ received: true });
  }
);

export default stripeWebhookRouter;
