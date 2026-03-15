/**
 * tatt-ooo Stripe Products & Prices
 *
 * Business model:
 *   - Users: $10/month OR $99/year (saves ~17%)
 *   - Artists/Studios: $29/year directory listing fee
 *   - Booking fee: 13% of artist's quoted price, charged at booking confirmation
 *
 * Price IDs are created in Stripe (test mode) and stored here.
 * When switching to live keys, update the env vars in Settings → Payment.
 */

// ─── User Membership ──────────────────────────────────────────────────────────
export const USER_MEMBERSHIP = {
  monthly: {
    id: "member_monthly" as const,
    name: "Tattooo Member — Monthly",
    price: 1000,          // cents = $10.00/month
    priceDisplay: "$10/month",
    interval: "month" as const,
    description: "Full access to AI tattoo designer, artist directory, and booking system",
    stripePriceId: process.env.STRIPE_MEMBER_MONTHLY_PRICE_ID || "",
  },
  yearly: {
    id: "member_yearly" as const,
    name: "Tattooo Member — Yearly",
    price: 9900,          // cents = $99.00/year (~$8.25/month, saves ~17%)
    priceDisplay: "$99/year",
    interval: "year" as const,
    description: "Full access — save 17% vs monthly",
    stripePriceId: process.env.STRIPE_MEMBER_YEARLY_PRICE_ID || "",
  },
} as const;

export type MembershipInterval = keyof typeof USER_MEMBERSHIP;

// ─── Artist Directory Fee ──────────────────────────────────────────────────────
export const ARTIST_FEE = {
  amount: 2900,           // cents = $29.00/year
  display: "$29/year",
  description: "Annual directory listing — get discovered by clients, receive real bookings",
  stripePriceId: process.env.STRIPE_ARTIST_FEE_PRICE_ID || "price_1TB7dZK1nQvj50bsRYtNu02O",
};

// ─── Booking Fee ──────────────────────────────────────────────────────────────
export const BOOKING_FEE_PERCENT = 13; // 13% of artist's quoted price

/**
 * Calculate the booking fee amount in cents given the artist's quoted price.
 * @param quotedAmountCents - Artist's quote in cents
 * @returns Booking fee in cents (rounded up to nearest cent)
 */
export function calcBookingFee(quotedAmountCents: number): number {
  return Math.ceil(quotedAmountCents * BOOKING_FEE_PERCENT / 100);
}

// ─── Membership features (for display on Pricing page) ────────────────────────
export const MEMBERSHIP_FEATURES = [
  "Unlimited AI tattoo designs",
  "All 40+ styles & variations",
  "3-way comparison view",
  "Skin overlay preview",
  "Animated reveal video",
  "Browse verified artist directory",
  "Send booking requests to artists",
  "Secure booking via platform",
  "Design-to-artist email delivery",
  "Priority support",
];

// ─── Free (non-member) limits ─────────────────────────────────────────────────
export const FREE_LIMITS = {
  designsPerDay: 3,       // 3 free designs per day to try the tool
  canBook: false,         // booking requires membership
  canBrowseArtists: true, // browsing is free
};
