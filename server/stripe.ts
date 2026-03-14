/**
 * Stripe integration for tatt-ooo freemium credits system.
 * Handles checkout session creation and webhook fulfillment.
 */
import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export const CREDIT_PACKS = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 5000,
    price: 999, // cents = $9.99
    priceDisplay: "$9.99",
    description: "5,000 tattoo designs",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 15000,
    price: 2499, // cents = $24.99
    priceDisplay: "$24.99",
    description: "15,000 tattoo designs",
    popular: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    credits: 99999,
    price: 4999, // cents = $49.99/month
    priceDisplay: "$49.99/mo",
    description: "Unlimited designs monthly",
    popular: false,
    isSubscription: true,
  },
] as const;

export type PackId = (typeof CREDIT_PACKS)[number]["id"];

/**
 * Create a Stripe Checkout Session for a credit pack purchase.
 */
export async function createCheckoutSession(
  userId: number,
  packId: PackId,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
): Promise<string> {
  const stripe = getStripe();
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error(`Unknown pack: ${packId}`);

  const isSubscription = "isSubscription" in pack && pack.isSubscription;

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `tatt-ooo ${pack.name}`,
            description: pack.description,
            images: [],
          },
          unit_amount: pack.price,
          ...(isSubscription ? { recurring: { interval: "month" } } : {}),
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: String(userId),
      packId,
      credits: String(pack.credits),
    },
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

/**
 * Create a Stripe Checkout Session for artist annual directory listing fee.
 * $29/year — on success, artist profile is created (pending admin review).
 */
export async function createArtistRegistrationSession(
  pendingArtistId: number,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "tatt-ooo Artist Directory Listing",
            description: "Annual listing fee — get discovered by clients who've already designed their tattoo",
          },
          unit_amount: 2900, // $29.00
        },
        quantity: 1,
      },
    ],
    metadata: {
      pendingArtistId: String(pendingArtistId),
      type: "artist_registration",
    },
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

/**
 * Verify and parse a Stripe webhook event.
 */
export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Create a Stripe Checkout Session for an artist booking deposit.
 */
export async function createBookingDepositSession(
  userId: number,
  bookingId: number,
  depositAmountCents: number,
  artistName: string,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Booking Deposit — ${artistName}`,
            description: "Deposit to secure your tattoo appointment",
          },
          unit_amount: depositAmountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: String(userId),
      bookingId: String(bookingId),
      type: "booking_deposit",
    },
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

