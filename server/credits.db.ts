import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { credits, creditTransactions, users } from "../drizzle/schema";
import { sendLowCreditAlert } from "./emailService";
import { isAdminRole } from "@shared/const";

const LOW_CREDIT_THRESHOLD = 5;

export const FREE_CREDITS = 5;

/**
 * Get or create a user's credits record.
 * New users automatically receive FREE_CREDITS on first access.
 */
export async function getOrCreateCredits(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(credits)
    .where(eq(credits.userId, userId))
    .limit(1);

  if (existing.length > 0) return existing[0];

  // First time — grant free credits
  await db.insert(credits).values({
    userId,
    balance: FREE_CREDITS,
    lifetimeTotal: FREE_CREDITS,
    plan: "free",
  });

  await db.insert(creditTransactions).values({
    userId,
    amount: FREE_CREDITS,
    type: "free_grant",
    description: `Welcome gift: ${FREE_CREDITS} free credits to start designing!`,
  });

  const created = await db
    .select()
    .from(credits)
    .where(eq(credits.userId, userId))
    .limit(1);

  return created[0];
}

/**
 * Deduct 1 credit for a generation.
 * Returns false if insufficient balance.
 * Admins and unlimited-plan users are NEVER charged — always returns true.
 */
export async function deductCredit(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ── Admin bypass: check role first — admins never pay credits ──────────────
  const userRows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRows.length > 0 && isAdminRole(userRows[0].role)) {
    // Admin — unlimited access, no deduction, no transaction logged
    return true;
  }

  const userCredits = await getOrCreateCredits(userId);

  // Unlimited plan users are never blocked
  if (userCredits.plan === "unlimited") return true;

  if (userCredits.balance <= 0) return false;

  const newBalance = userCredits.balance - 1;

  await db
    .update(credits)
    .set({ balance: newBalance })
    .where(eq(credits.userId, userId));

  await db.insert(creditTransactions).values({
    userId,
    amount: -1,
    type: "deduction",
    description: "Tattoo design generation",
  });

  // Fire low-credit alert when balance crosses the threshold (async, non-blocking)
  if (newBalance > 0 && newBalance <= LOW_CREDIT_THRESHOLD) {
    getDb().then(async (db2) => {
      if (!db2) return;
      const u = await db2
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (u[0]?.email) {
        sendLowCreditAlert(u[0].email, u[0].name ?? null, newBalance).catch(() => {});
      }
    }).catch(() => {});
  }

  return true;
}

/**
 * Add credits to a user's balance (after purchase or subscription activation).
 * Pass plan = "unlimited" to mark the user as unlimited (no balance consumed).
 */
export async function addCredits(
  userId: number,
  amount: number,
  plan: "free" | "starter" | "pro" | "studio" | "unlimited" | "member" | "customer" | "artist" | "industry" | "referral" | "purchase",
  stripeSessionId: string | undefined,
  description: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userCredits = await getOrCreateCredits(userId);

  // For unlimited plan, don't change the numeric balance — just mark the plan
  const newBalance =
    plan === "unlimited" ? userCredits.balance : userCredits.balance + amount;

  // Only update plan for actual plan changes (not for referral/purchase top-ups)
  const planToSet = (plan === "referral" || plan === "purchase")
    ? userCredits.plan
    : (plan as typeof userCredits.plan);

  await db
    .update(credits)
    .set({
      balance: newBalance,
      lifetimeTotal: userCredits.lifetimeTotal + amount,
      plan: planToSet,
    })
    .where(eq(credits.userId, userId));

  await db.insert(creditTransactions).values({
    userId,
    amount,
    type: plan === "unlimited" ? "subscription"
        : plan === "referral" ? "referral"
        : plan === "purchase" ? "purchase"
        : "subscription",
    stripeSessionId,
    description,
  });
}

/**
 * Set the plan and credit balance for a user when they subscribe.
 * Used by the Stripe webhook on checkout.session.completed.
 */
export async function activateSubscriptionPlan(
  userId: number,
  planId: "customer" | "artist" | "studio" | "industry" | "member",
  monthlyCredits: number,
  stripeCustomerId: string | null,
  stripeSubscriptionId: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userCredits = await getOrCreateCredits(userId);

  // Add the plan's monthly allocation on top of any existing balance
  const newBalance = userCredits.balance + monthlyCredits;

  await db
    .update(credits)
    .set({
      balance: newBalance,
      lifetimeTotal: userCredits.lifetimeTotal + monthlyCredits,
      plan: planId as any,
      subscriptionStatus: "active",
      stripeCustomerId: stripeCustomerId ?? userCredits.stripeCustomerId,
      stripeSubscriptionId: stripeSubscriptionId ?? userCredits.stripeSubscriptionId,
    })
    .where(eq(credits.userId, userId));

  await db.insert(creditTransactions).values({
    userId,
    amount: monthlyCredits,
    type: "subscription",
    description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} plan activated — ${monthlyCredits} credits added`,
  });
}

/**
 * Refill credits on monthly subscription renewal.
 * Resets balance to the plan's monthly allocation (does not stack).
 */
export async function refillSubscriptionCredits(
  stripeCustomerId: string,
  monthlyCredits: number
) {
  const db = await getDb();
  if (!db) return;

  // Find the user by Stripe customer ID
  const rows = await db
    .select({ userId: credits.userId, balance: credits.balance, lifetimeTotal: credits.lifetimeTotal, plan: credits.plan })
    .from(credits)
    .where(eq(credits.stripeCustomerId, stripeCustomerId))
    .limit(1);

  if (rows.length === 0) return;

  const record = rows[0];

  await db
    .update(credits)
    .set({
      balance: monthlyCredits,
      lifetimeTotal: record.lifetimeTotal + monthlyCredits,
      subscriptionStatus: "active",
    })
    .where(eq(credits.stripeCustomerId, stripeCustomerId));

  await db.insert(creditTransactions).values({
    userId: record.userId,
    amount: monthlyCredits,
    type: "subscription",
    description: `Monthly credit refill — ${monthlyCredits} credits`,
  });
}

/**
 * Update Stripe customer ID on a user's credits record.
 */
export async function setStripeCustomerId(userId: number, stripeCustomerId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await getOrCreateCredits(userId);
  await db
    .update(credits)
    .set({ stripeCustomerId })
    .where(eq(credits.userId, userId));
}

/**
 * Get transaction history for a user.
 */
export async function getCreditTransactions(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}
