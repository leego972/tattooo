import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "./stripe";

// ── Subscription Plans ─────────────────────────────────────────────────────────
export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    credits: 5,
    features: ["5 AI tattoo designs/month", "Basic styles", "Share designs"],
    stripePriceId: undefined,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19,
    credits: 50,
    features: [
      "50 AI designs/month",
      "All styles & variations",
      "3 comparison views",
      "Skin overlay preview",
      "Animated reveal video",
      "Priority support",
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  studio: {
    id: "studio",
    name: "Studio",
    price: 49,
    credits: 200,
    features: [
      "200 AI designs/month",
      "Everything in Pro",
      "Bulk generation",
      "Commercial license",
      "Artist collaboration tools",
      "White-label exports",
    ],
    stripePriceId: process.env.STRIPE_STUDIO_PRICE_ID || null,
  },
} as const;

export const subscriptionRouter = router({
  // Get current subscription status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const u = user[0];
    if (!u) throw new Error("User not found");
    return {
      plan: (u as any).subscriptionPlan || "free",
      status: (u as any).subscriptionStatus || "active",
      currentPeriodEnd: (u as any).subscriptionPeriodEnd || null,
      stripeCustomerId: (u as any).stripeCustomerId || null,
    };
  }),

  // Get all plans
  getPlans: publicProcedure.query(() => {
    return Object.values(SUBSCRIPTION_PLANS);
  }),

  // Create checkout session for subscription upgrade
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(["pro", "studio"]), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const plan = SUBSCRIPTION_PLANS[input.plan];
      if (!plan.stripePriceId) {
        // Create a one-time price if no recurring price ID is configured
        const session = await (getStripe().checkout.sessions as any).create({
          mode: "payment",
          customer_email: ctx.user.email,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            plan: input.plan,
            customer_email: ctx.user.email,
          },
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `tatooo.shop ${plan.name} Plan`,
                  description: plan.features.join(", "),
                },
                unit_amount: plan.price * 100,
              },
              quantity: 1,
            },
          ],
          allow_promotion_codes: true,
          success_url: `${input.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${input.origin}/subscription`,
        });
        return { url: session.url };
      }

      const session = await (getStripe().checkout.sessions as any).create({
        mode: "subscription",
        customer_email: ctx.user.email,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          plan: input.plan,
          customer_email: ctx.user.email,
        },
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        allow_promotion_codes: true,
        success_url: `${input.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/subscription`,
      });
      return { url: session.url };
    }),

  // Create customer portal session for managing subscription
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const stripeCustomerId = (user[0] as any)?.stripeCustomerId;
      if (!stripeCustomerId) {
        throw new Error("No Stripe customer found. Please subscribe first.");
      }
      const session = await getStripe().billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${input.origin}/subscription`,
      });
      return { url: session.url };
    }),
});
