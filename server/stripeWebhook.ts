/**
 * Stripe webhook handler.
 * Must be registered BEFORE express.json() so the raw body is available
 * for signature verification.
 */
import { Router } from "express";
import { constructWebhookEvent } from "./stripe";
import { setStripeCustomerId, getOrCreateCredits } from "./credits.db";
import { getDb } from "./db";
import { users, artists, bookings, credits, promoCodes } from "../drizzle/schema";
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
          metadata?: Record<string, string>;
          customer?: string;
          customer_email?: string;
          amount_total?: number;
        };
        const meta = session.metadata || {};
        const eventType = meta.type;

        // ── User Membership ──────────────────────────────────────────────────
        if (eventType === "membership") {
          const userId = meta.userId ? parseInt(meta.userId) : null;
          const interval = meta.interval || "monthly";
          if (!userId) {
            console.warn("[Webhook] Missing userId in membership metadata");
            return res.json({ received: true });
          }
          const db = await getDb();
          if (db) {
            if (session.customer && typeof session.customer === "string") {
              await setStripeCustomerId(userId, session.customer);
            }
            await db.update(credits)
              .set({
                plan: "member" as any,
                subscriptionStatus: "active",
                stripeSubscriptionId: (session as any).subscription ?? null,
                stripeCustomerId: session.customer ?? null,
              })
              .where(eq(credits.userId, userId));
            console.log(`[Webhook] User ${userId} activated as member (${interval})`);
          }
        }

        // ── Artist registration ───────────────────────────────────────────────
        if (eventType === "artist_registration") {
          const pendingArtistId = meta.pendingArtistId ? parseInt(meta.pendingArtistId) : null;
          if (!pendingArtistId) {
            console.warn("[Webhook] Missing pendingArtistId in artist_registration metadata");
            return res.json({ received: true });
          }
          const db = await getDb();
          if (db) {
            // Mark artist as verified (payment received, pending admin review)
            await db.update(artists)
              .set({ verified: false })
              .where(eq(artists.id, pendingArtistId));
            const artistRows = await db.select().from(artists).where(eq(artists.id, pendingArtistId)).limit(1);
            if (artistRows.length > 0) {
              const artist = artistRows[0];
              const contactEmail = artist.contactEmail || session.customer_email;
              if (contactEmail) {
                try {
                  const { sendArtistRegistrationConfirmation } = await import("./emailService");
                  await sendArtistRegistrationConfirmation(contactEmail, artist.name);
                } catch (e) { console.warn("[Webhook] Artist reg email failed:", e); }
              }
            }
            console.log(`[Webhook] Artist ${pendingArtistId} moved to pending_review`);
          }
        }



        // ── Booking deposit ───────────────────────────────────────────────
        if (eventType === "booking_deposit") {
          const bookingId = meta.bookingId ? parseInt(meta.bookingId) : null;
          const userId = meta.userId ? parseInt(meta.userId) : null;
          if (!bookingId) {
            console.warn("[Webhook] Missing bookingId in booking_deposit metadata");
            return res.json({ received: true });
          }
          const db = await getDb();
          if (db) {
            await db.update(bookings)
              .set({ status: "confirmed" })
              .where(eq(bookings.id, bookingId));
            if (userId) {
              const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
              const bookingRows = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
              if (userRows.length > 0 && bookingRows.length > 0) {
                const user = userRows[0];
                const booking = bookingRows[0];
                if (user.email) {
                  try {
                    // Get artist name for the confirmation email
                    const artistRows2 = await db.select().from(artists).where(eq(artists.id, booking.artistId)).limit(1);
                    const artistName = artistRows2.length > 0 ? artistRows2[0].name : "your artist";
                    const { sendArtistContactEmail } = await import("./emailService");
                    await sendArtistContactEmail({
                      artistEmail: user.email,
                      artistName,
                      customerName: user.name || "A client",
                      customerEmail: user.email,
                      message: `Your booking deposit of $${((session.amount_total || 0) / 100).toFixed(2)} has been received. Your appointment with ${artistName} is confirmed!`,
                    });
                  } catch (e) { console.warn("[Webhook] Booking confirmation email failed:", e); }
                }
              }
            }
            console.log(`[Webhook] Booking ${bookingId} confirmed`);
          }
        }
      }

      // ── Membership renewal ────────────────────────────────────────────────────
      if (event.type === "invoice.paid") {
        const invoice = event.data.object as {
          subscription?: string;
          customer?: string;
          billing_reason?: string;
        };
        if (invoice.billing_reason === "subscription_cycle" && invoice.customer) {
          const db = await getDb();
          if (db) {
            await db.update(credits)
              .set({ subscriptionStatus: "active" })
              .where(eq(credits.stripeCustomerId, invoice.customer));
            console.log(`[Webhook] Membership renewed for customer ${invoice.customer}`);
          }
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as { customer: string; metadata?: { userId?: string } };
        const userId = subscription.metadata?.userId ? parseInt(subscription.metadata.userId) : null;
        if (userId) {
          const db = await getDb();
          if (db) {
            await db.update(credits)
              .set({ plan: "free" as any, stripeSubscriptionId: null, subscriptionStatus: "cancelled" })
              .where(eq(credits.userId, userId));
            console.log(`[Webhook] User ${userId} downgraded to free (subscription cancelled)`);
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
