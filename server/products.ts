/**
 * tatt-ooo Stripe Products & Prices
 *
 * Price IDs are created in Stripe (test mode) and stored here.
 * When switching to live keys, re-run the setup script and update these IDs.
 *
 * Test Price IDs (created 2026-03-15):
 */

// ─── Credit Packs (one-time purchases) ────────────────────────────────────────
export const CREDIT_PACKS = [
  {
    id: "starter" as const,
    name: "Starter Pack",
    credits: 50,
    price: 999, // cents = $9.99
    priceDisplay: "$9.99",
    description: "50 AI tattoo designs",
    popular: false,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || "price_1TB7dSK1nQvj50bs8oRIXXk4",
    isSubscription: false,
  },
  {
    id: "pro" as const,
    name: "Pro Pack",
    credits: 150,
    price: 2499, // cents = $24.99
    priceDisplay: "$24.99",
    description: "150 AI tattoo designs",
    popular: true,
    stripePriceId: process.env.STRIPE_PRO_CREDITS_PRICE_ID || "price_1TB7dUK1nQvj50bstdjicg9C",
    isSubscription: false,
  },
  {
    id: "unlimited" as const,
    name: "Unlimited",
    credits: 500,
    price: 4999, // cents = $49.99/month
    priceDisplay: "$49.99/mo",
    description: "500 AI tattoo designs per month",
    popular: false,
    stripePriceId: process.env.STRIPE_UNLIMITED_PRICE_ID || "price_1TB7dVK1nQvj50bskyJtD6mD",
    isSubscription: true,
  },
] as const;

export type PackId = (typeof CREDIT_PACKS)[number]["id"];

// ─── Subscription Plans ────────────────────────────────────────────────────────
export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    price: 0,
    monthlyCredits: 5,
    features: [
      "5 AI tattoo designs",
      "Basic styles",
      "Share designs",
      "Public gallery",
    ],
    stripePriceId: null,
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    price: 19,
    monthlyCredits: 50,
    features: [
      "50 AI designs/month",
      "All 40+ styles & variations",
      "3-way comparison view",
      "Skin overlay preview",
      "Animated reveal video",
      "Priority support",
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "price_1TB7dXK1nQvj50bsbZR2za4n",
  },
  studio: {
    id: "studio" as const,
    name: "Studio",
    price: 49,
    monthlyCredits: 200,
    features: [
      "200 AI designs/month",
      "Everything in Pro",
      "Bulk generation",
      "Commercial license",
      "Artist collaboration tools",
      "White-label exports",
    ],
    stripePriceId: process.env.STRIPE_STUDIO_PRICE_ID || "price_1TB7dYK1nQvj50bs1M4m5C58",
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

// ─── Artist Directory Fee ──────────────────────────────────────────────────────
export const ARTIST_FEE = {
  amount: 2900, // cents = $29.00
  display: "$29/year",
  description: "Annual directory listing — get discovered by clients",
  stripePriceId: process.env.STRIPE_ARTIST_FEE_PRICE_ID || "price_1TB7dZK1nQvj50bsRYtNu02O",
};

// ─── Credit costs per action ───────────────────────────────────────────────────
export const CREDIT_COSTS = {
  generate: 1,        // 1 credit per AI tattoo generation
  generateVideo: 5,   // 5 credits per animated reveal video
  variation: 1,       // 1 credit per variation
} as const;

// ─── Free signup credits ───────────────────────────────────────────────────────
export const SIGNUP_FREE_CREDITS = 5;
