/**
 * Stripe integration for tatt-ooo.
 * All products and prices are managed via server/products.ts.
 */
import Stripe from "stripe";
import { CREDIT_PACKS, ARTIST_FEE, type PackId } from "./products";

// Re-export for backward compatibility
export { CREDIT_PACKS, type PackId };

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

/**
 * Create a Stripe Checkout Session for a credit pack purchase.
 * Uses pre-created Stripe price IDs for clean dashboard reporting.
 * Falls back to price_data when a promo discount is applied.
 */
export async function createCheckoutSession(
  userId: number,
  packId: PackId,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string,
  discountPercent?: number
): Promise<string> {
  const stripe = getStripe();
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) throw new Error(`Unknown pack: ${packId}`);

  const isSubscription = pack.isSubscription;

  // Use price_data only when applying a server-side promo discount
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    discountPercent && discountPercent > 0
      ? [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `tatt-ooo ${pack.name} (${discountPercent}% off)`,
                description: pack.description,
              },
              unit_amount: Math.round(pack.price * (1 - discountPercent / 100)),
              ...(isSubscription ? { recurring: { interval: "month" } } : {}),
            },
            quantity: 1,
          },
        ]
      : [{ price: pack.stripePriceId, quantity: 1 }];

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    customer_email: customerEmail,
    allow_promotion_codes: !discountPercent,
    line_items: lineItems,
    client_reference_id: String(userId),
    metadata: {
      userId: String(userId),
      packId,
      credits: String(pack.credits),
      type: "credit_purchase",
      discountPercent: discountPercent ? String(discountPercent) : "",
      customer_email: customerEmail ?? "",
    },
    success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}&pack=${packId}`,
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
    line_items: [{ price: ARTIST_FEE.stripePriceId, quantity: 1 }],
    client_reference_id: String(pendingArtistId),
    metadata: {
      pendingArtistId: String(pendingArtistId),
      type: "artist_registration",
      customer_email: customerEmail ?? "",
    },
    success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
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
 * Booking deposits are dynamic amounts so price_data is used here.
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
    client_reference_id: String(userId),
    metadata: {
      userId: String(userId),
      bookingId: String(bookingId),
      type: "booking_deposit",
      customer_email: customerEmail ?? "",
    },
    success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  });

  return session.url!;
}

/**
 * Retrieve a completed checkout session from Stripe.
 */
export async function retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "customer"],
  });
}
