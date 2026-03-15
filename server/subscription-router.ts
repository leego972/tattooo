import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "./stripe";

// Subscription Plans
// Customer:  $10/mo  — generate AI artwork & book artists
// Artist:    $33/mo  — artist profile, bookings, portfolio
// Studio:    $99/mo  — up to 5 users, studio dashboard
// Industry:  $199/mo — enterprise, unlimited users
// All plans: 15% off on annual billing
// Booking commission: 13% of quote charged at booking time

export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    userType: "customer",
    monthlyPrice: 0,
    annualPrice: 0,
    credits: 3,
    features: ["3 AI tattoo designs", "Browse artists", "Save favourites"],
    monthlyPriceId: undefined as string | undefined,
    annualPriceId: undefined as string | undefined,
  },
  customer: {
    id: "customer",
    name: "Customer",
    userType: "customer",
    monthlyPrice: 10,
    annualPrice: 102,
    credits: 30,
    features: [
      "30 AI tattoo designs/month",
      "All styles & variations",
      "Skin overlay preview",
      "Book any artist on platform",
      "Booking history & receipts",
      "Priority customer support",
    ],
    monthlyPriceId: process.env.STRIPE_CUSTOMER_MONTHLY_PRICE_ID || "price_1TBGtj8YRB7s7dJHweBd5USK",
    annualPriceId: process.env.STRIPE_CUSTOMER_ANNUAL_PRICE_ID || "price_1TBGtk8YRB7s7dJHhVTztSG3",
  },
  artist: {
    id: "artist",
    name: "Artist",
    userType: "artist",
    monthlyPrice: 33,
    annualPrice: 337,
    credits: 100,
    features: [
      "Artist profile & portfolio",
      "Accept client bookings",
      "100 AI reference designs/month",
      "Booking calendar & management",
      "Client messaging",
      "Earnings dashboard",
    ],
    monthlyPriceId: process.env.STRIPE_ARTIST_MONTHLY_PRICE_ID || "price_1TBGtm8YRB7s7dJHfW7sL6ix",
    annualPriceId: process.env.STRIPE_ARTIST_ANNUAL_PRICE_ID || "price_1TBGtn8YRB7s7dJHetL1TM0n",
  },
  studio: {
    id: "studio",
    name: "Studio",
    userType: "studio",
    monthlyPrice: 99,
    annualPrice: 1010,
    credits: 500,
    features: [
      "Up to 5 artist accounts",
      "Studio profile & branding",
      "500 AI designs/month (shared)",
      "Centralised booking dashboard",
      "Team calendar & scheduling",
      "Revenue & analytics reports",
      "Priority support",
    ],
    monthlyPriceId: process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID || "price_1TBGtq8YRB7s7dJHYSX6WL4I",
    annualPriceId: process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID || "price_1TBGtr8YRB7s7dJHSevdlzP5",
  },
  industry: {
    id: "industry",
    name: "Industry",
    userType: "industry",
    monthlyPrice: 199,
    annualPrice: 2030,
    credits: 2000,
    features: [
      "Unlimited artist accounts",
      "White-label platform option",
      "2000 AI designs/month",
      "Enterprise booking management",
      "Advanced analytics & reporting",
      "Dedicated account manager",
      "API access",
      "SLA support",
    ],
    monthlyPriceId: process.env.STRIPE_INDUSTRY_MONTHLY_PRICE_ID || "price_1TBGtt8YRB7s7dJHcPJ8jyT9",
    annualPriceId: process.env.STRIPE_INDUSTRY_ANNUAL_PRICE_ID || "price_1TBGtu8YRB7s7dJHojU2hvI3",
  },
} as const;

export const BOOKING_COMMISSION_RATE = 0.13;
export const BOOKING_COMMISSION_PRODUCT_ID = process.env.STRIPE_BOOKING_COMMISSION_PRODUCT_ID || "prod_U9a4ucTMjnaU8D";

export const subscriptionRouter = router({
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

  getPlans: publicProcedure.query(() => {
    return Object.values(SUBSCRIPTION_PLANS);
  }),

  createCheckout: protectedProcedure
    .input(z.object({
      plan: z.enum(["customer", "artist", "studio", "industry"]),
      billing: z.enum(["monthly", "annual"]).default("monthly"),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const plan = SUBSCRIPTION_PLANS[input.plan];
      const priceId = input.billing === "annual" ? plan.annualPriceId : plan.monthlyPriceId;
      if (!priceId) throw new Error("No Stripe price ID configured for " + input.plan + " " + input.billing);
      const session = await (getStripe().checkout.sessions as any).create({
        mode: "subscription",
        customer_email: ctx.user.email,
        client_reference_id: ctx.user.id.toString(),
        metadata: { user_id: ctx.user.id.toString(), plan: input.plan, billing: input.billing, customer_email: ctx.user.email },
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        success_url: input.origin + "/subscription/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: input.origin + "/subscription",
      });
      return { url: session.url };
    }),

  createBookingCheckout: protectedProcedure
    .input(z.object({
      artistId: z.number(),
      tattooGenerationId: z.number().optional(),
      quoteAmountCents: z.number().min(100),
      message: z.string().optional(),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const commissionCents = Math.round(input.quoteAmountCents * BOOKING_COMMISSION_RATE);
      const session = await (getStripe().checkout.sessions as any).create({
        mode: "payment",
        customer_email: ctx.user.email,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          type: "booking_commission",
          customer_id: ctx.user.id.toString(),
          artist_id: input.artistId.toString(),
          tattoo_generation_id: input.tattooGenerationId?.toString() ?? "",
          quote_amount_cents: input.quoteAmountCents.toString(),
          commission_cents: commissionCents.toString(),
          message: input.message ?? "",
        },
        line_items: [{
          price_data: {
            currency: "usd",
            product: BOOKING_COMMISSION_PRODUCT_ID,
            unit_amount: commissionCents,
          },
          quantity: 1,
        }],
        success_url: input.origin + "/booking/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: input.origin + "/artists/" + input.artistId,
      });
      return { url: session.url, commissionCents, quoteAmountCents: input.quoteAmountCents };
    }),

  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const stripeCustomerId = (user[0] as any)?.stripeCustomerId;
      if (!stripeCustomerId) throw new Error("No Stripe customer found. Please subscribe first.");
      const session = await getStripe().billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: input.origin + "/subscription",
      });
      return { url: session.url };
    }),
});
