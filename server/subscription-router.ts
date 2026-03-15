import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { credits } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "./stripe";
import { SUBSCRIPTION_PLANS } from "./products";

export { SUBSCRIPTION_PLANS };

export const subscriptionRouter = router({
  // Get current subscription status — reads from credits table
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const rows = await db.select().from(credits).where(eq(credits.userId, ctx.user.id)).limit(1);
    const c = rows[0];
    if (!c) return { plan: "free", status: "active", currentPeriodEnd: null, stripeCustomerId: null, balance: 0 };

    // If subscribed, fetch current period end from Stripe
    let currentPeriodEnd: number | null = null;
    if (c.stripeSubscriptionId) {
      try {
        const sub = await getStripe().subscriptions.retrieve(c.stripeSubscriptionId) as any;
        currentPeriodEnd = sub.current_period_end ?? null;
      } catch {
        // Subscription may have been cancelled — ignore
      }
    }

    return {
      plan: c.plan || "free",
      status: c.subscriptionStatus || "active",
      currentPeriodEnd,
      stripeCustomerId: c.stripeCustomerId || null,
      balance: c.balance ?? 0,
    };
  }),

  // Get all plans
  getPlans: publicProcedure.query(() => {
    return Object.values(SUBSCRIPTION_PLANS);
  }),

  // Create checkout session for subscription upgrade — always uses recurring price IDs
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["pro", "studio"]), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const plan = SUBSCRIPTION_PLANS[input.plan];

      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        customer_email: ctx.user.email ?? undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          type: "subscription_upgrade",
          user_id: ctx.user.id.toString(),
          plan: input.plan,
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        allow_promotion_codes: true,
        success_url: `${input.origin}/payment-success?type=subscription&plan=${input.plan}`,
        cancel_url: `${input.origin}/subscription`,
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
