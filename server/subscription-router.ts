import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { credits } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "./stripe";
import { USER_MEMBERSHIP, MEMBERSHIP_FEATURES, FREE_LIMITS } from "./products";

export const subscriptionRouter = router({
  // Get current subscription status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const rows = await db.select().from(credits).where(eq(credits.userId, ctx.user.id)).limit(1);
    const c = rows[0];
    if (!c) return { plan: "free", status: "active", currentPeriodEnd: null, stripeCustomerId: null, isMember: false };

    let currentPeriodEnd: number | null = null;
    if (c.stripeSubscriptionId) {
      try {
        const sub = await getStripe().subscriptions.retrieve(c.stripeSubscriptionId) as any;
        currentPeriodEnd = sub.current_period_end ?? null;
      } catch {
        // Subscription may have been cancelled — ignore
      }
    }

    const isMember = c.plan === "member" && c.subscriptionStatus === "active";
    return {
      plan: c.plan || "free",
      status: c.subscriptionStatus || "active",
      currentPeriodEnd,
      stripeCustomerId: c.stripeCustomerId || null,
      isMember,
    };
  }),

  // Get membership plans for display
  getPlans: publicProcedure.query(() => {
    return {
      monthly: USER_MEMBERSHIP.monthly,
      yearly: USER_MEMBERSHIP.yearly,
      features: MEMBERSHIP_FEATURES,
      freeLimits: FREE_LIMITS,
    };
  }),

  // Create membership checkout session — monthly or yearly
  createCheckout: protectedProcedure
    .input(z.object({ interval: z.enum(["monthly", "yearly"]), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const plan = USER_MEMBERSHIP[input.interval];
      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        customer_email: ctx.user.email ?? undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          type: "membership",
          userId: ctx.user.id.toString(),
          interval: input.interval,
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        line_items: [
          plan.stripePriceId
            ? { price: plan.stripePriceId, quantity: 1 }
            : {
                price_data: {
                  currency: "usd",
                  product_data: { name: plan.name, description: plan.description },
                  unit_amount: plan.price,
                  recurring: { interval: plan.interval },
                },
                quantity: 1,
              },
        ],
        allow_promotion_codes: true,
        success_url: `${input.origin}/payment-success?type=membership`,
        cancel_url: `${input.origin}/pricing`,
      });
      return { url: session.url };
    }),

  // Create customer portal session for managing/cancelling subscription
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const rows = await db.select().from(credits).where(eq(credits.userId, ctx.user.id)).limit(1);
      const stripeCustomerId = rows[0]?.stripeCustomerId;
      if (!stripeCustomerId) {
        throw new Error("No Stripe customer found. Please subscribe first.");
      }
      const session = await getStripe().billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${input.origin}/subscription`,
      });
      return { url: session.url };
    }),

  // Cancel subscription immediately
  cancel: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const rows = await db.select().from(credits).where(eq(credits.userId, ctx.user.id)).limit(1);
      const stripeSubscriptionId = rows[0]?.stripeSubscriptionId;
      if (!stripeSubscriptionId) throw new Error("No active subscription found.");

      await getStripe().subscriptions.cancel(stripeSubscriptionId);

      // Update local plan to free
      await db.update(credits)
        .set({ plan: "free", subscriptionStatus: "cancelled", stripeSubscriptionId: null })
        .where(eq(credits.userId, ctx.user.id));

      return { success: true };
    }),
});
