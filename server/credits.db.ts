import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { credits, creditTransactions, users } from "../drizzle/schema";
import { sendLowCreditAlert } from "./emailService";

const LOW_CREDIT_THRESHOLD = 5;

export const FREE_CREDITS = 500;

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
 * Deduct 1 credit for a generation. Returns false if insufficient balance.
 */
export async function deductCredit(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userCredits = await getOrCreateCredits(userId);

  // Unlimited plan users are never blocked
  if (userCredits.plan === "unlimited") return true;

  if (userCredits.balance <= 0) return false;

  await db
    .update(credits)
    .set({ balance: userCredits.balance - 1 })
    .where(eq(credits.userId, userId));

  await db.insert(creditTransactions).values({
    userId,
    amount: -1,
    type: "deduction",
    description: "Tattoo design generation",
  });

  // Fire low-credit alert when balance crosses the threshold
  const newBalance = userCredits.balance - 1;
  if (newBalance > 0 && newBalance <= LOW_CREDIT_THRESHOLD) {
    // Fetch user email asynchronously — don't block the generation response
    getDb().then(async (db2) => {
      if (!db2) return;
      const userRows = await db2.select({ email: users.email, name: users.name })
        .from(users).where(eq(users.id, userId)).limit(1);
      const u = userRows[0];
      if (u?.email) {
        sendLowCreditAlert(u.email, u.name ?? null, newBalance).catch(() => {});
      }
    }).catch(() => {});
  }

  return true;
}

/**
 * Add credits to a user's balance (after purchase).
 */
export async function addCredits(
  userId: number,
  amount: number,
  plan: "starter" | "pro" | "unlimited" | "referral" | "purchase",
  stripeSessionId: string | undefined,
  description: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const userCredits = await getOrCreateCredits(userId);

  const newBalance =
    plan === "unlimited" ? userCredits.balance : userCredits.balance + amount;

  // Only update plan for actual plan changes (not for referral/purchase top-ups)
  const planToSet = (plan === "referral" || plan === "purchase") ? userCredits.plan : plan;

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
    type: plan === "unlimited" ? "subscription" : plan === "referral" ? "referral" : "purchase",
    stripeSessionId,
    description,
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
