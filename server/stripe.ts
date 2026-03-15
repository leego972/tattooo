/**
 * Stripe integration for tatt-ooo.
 * Business model:
 *   - Users: $10/month OR $99/year membership (unlimited designs + booking access)
 *   - Artists: $29/year directory listing fee
 *   - Booking fee: 13% of artist's quoted price, charged at booking confirmation
 */
import Stripe from "stripe";
import { ARTIST_FEE, USER_MEMBERSHIP, type MembershipInterval } from "./products";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

/**
 * Create a Stripe Checkout Session for user membership.
 * Supports monthly ($10/mo) and yearly ($99/yr) intervals.
 * If no Stripe price ID is configured yet, falls back to price_data.
 */
export async function createMembershipCheckoutSession(
  userId: number,
  interval: MembershipInterval,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
): Promise<string> {
  const stripe = getStripe();
  const plan = USER_MEMBERSHIP[interval];

  // Use pre-created price ID if available, otherwise use price_data
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem =
    plan.stripePriceId
      ? { price: plan.stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price,
            recurring: { interval: plan.interval },
          },
          quantity: 1,
        };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: customerEmail,
    allow_promotion_codes: true,
    line_items: [lineItem],
    client_reference_id: String(userId),
    metadata: {
      userId: String(userId),
      type: "membership",
      interval,
      customer_email: customerEmail ?? "",
    },
    success_url: `${successUrl}?type=membership&interval=${interval}&session_id={CHECKOUT_SESSION_ID}`,
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

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem =
    ARTIST_FEE.stripePriceId
      ? { price: ARTIST_FEE.stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Tattooo Artist Directory Listing",
              description: ARTIST_FEE.description,
            },
            unit_amount: ARTIST_FEE.amount,
          },
          quantity: 1,
        };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    allow_promotion_codes: true,
    line_items: [lineItem],
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
 * Create a Stripe Checkout Session for the 13% booking fee.
 * Dynamic amount — based on artist's quoted price.
 */
export async function createBookingFeeSession(
  userId: number,
  bookingId: number,
  bookingFeeAmountCents: number,
  artistName: string,
  quotedAmountDisplay: string,
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
            name: `Booking Fee — ${artistName}`,
            description: `Platform booking fee (13% of ${quotedAmountDisplay} quoted price). Secures your appointment.`,
          },
          unit_amount: bookingFeeAmountCents,
        },
        quantity: 1,
      },
    ],
    client_reference_id: String(userId),
    metadata: {
      userId: String(userId),
      bookingId: String(bookingId),
      type: "booking_fee",
      customer_email: customerEmail ?? "",
    },
    success_url: `${successUrl}?type=booking_fee&bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
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
 * Retrieve a completed checkout session from Stripe.
 */
export async function retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "customer"],
  });
}
