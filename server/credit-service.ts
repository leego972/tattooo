/**
 * Credit Service — Core business logic for the Manus-style credit system.
 *
 * Admin users get unlimited credits (isUnlimited = true).
 * Paid users get monthly refills based on their plan tier.
 * All users can purchase additional credit packs.
 */

import { eq, sql, desc } from "drizzle-orm";
import { getDb } from "./db";
import { creditBalances, creditTransactions, users } from "../drizzle/schema";
import { PRICING_TIERS, CREDIT_COSTS, type PlanId, type CreditActionType } from "../shared/pricing";
import { getUserPlan } from "./subscription-gate";
import { isAdminRole } from '@shared/const';
// Inline stubs for security helpers (security-hardening module not required in tatt-ooo)
function validateCreditOperation(_op: string, _cost: number, _userId: number, _isAdmin?: boolean): { valid: boolean; error?: string } {
  return { valid: true };
}
async function logSecurityEvent(_userId: number, _event: string, _data: Record<string, unknown>): Promise<void> {
  if (process.env.NODE_ENV !== "production") console.warn("[SecurityEvent]", _event, _data);
}

// ─── Types ─────────────────────────────────────────────────────────

export interface CreditBalanceInfo {
  credits: number;
  isUnlimited: boolean;
  lifetimeUsed: number;
  lifetimeAdded: number;
  lastRefillAt: Date | null;
}

export interface CreditCheckResult {
  allowed: boolean;
  currentBalance: number;
  cost: number;
  isUnlimited: boolean;
  message?: string;
}

// ─── Ensure Balance Exists ─────────────────────────────────────────

async function ensureBalance(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db
    .select({ id: creditBalances.id })
    .from(creditBalances)
    .where(eq(creditBalances.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    // Check if user is admin
    const userResult = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isAdmin = userResult.length > 0 && isAdminRole(userResult[0].role);

    // Get user's plan for signup bonus
    const plan = await getUserPlan(userId);
    const tier = PRICING_TIERS.find((t) => t.id === plan.planId);
    const signupBonus = tier?.credits.signupBonus ?? 25;

    await db.insert(creditBalances).values({
      userId,
      credits: isAdmin ? 999999 : signupBonus,
      isUnlimited: isAdmin,
      lifetimeCreditsAdded: isAdmin ? 0 : signupBonus,
      lifetimeCreditsUsed: 0,
    });

    // Log the signup bonus transaction (only for non-admin)
    if (!isAdmin && signupBonus > 0) {
      await db.insert(creditTransactions).values({
        userId,
        amount: signupBonus,
        type: "free_grant",
        description: `Welcome bonus: ${signupBonus} credits for signing up`,
      });
    }
  }
}

// ─── Get Balance ───────────────────────────────────────────────────

export async function getCreditBalance(userId: number): Promise<CreditBalanceInfo> {
  const db = await getDb();
  if (!db) {
    return { credits: 0, isUnlimited: false, lifetimeUsed: 0, lifetimeAdded: 0, lastRefillAt: null };
  }

  await ensureBalance(userId);

  const result = await db
    .select()
    .from(creditBalances)
    .where(eq(creditBalances.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return { credits: 0, isUnlimited: false, lifetimeUsed: 0, lifetimeAdded: 0, lastRefillAt: null };
  }

  const bal = result[0];
  return {
    credits: bal.credits,
    isUnlimited: bal.isUnlimited,
    lifetimeUsed: bal.lifetimeCreditsUsed,
    lifetimeAdded: bal.lifetimeCreditsAdded,
    lastRefillAt: bal.lastRefillAt,
  };
}

// ─── Check Credits ─────────────────────────────────────────────────

export async function checkCredits(
  userId: number,
  action: CreditActionType
): Promise<CreditCheckResult> {
  const balance = await getCreditBalance(userId);
  const cost = CREDIT_COSTS[action];

  if (balance.isUnlimited) {
    return { allowed: true, currentBalance: balance.credits, cost, isUnlimited: true };
  }

  if (balance.credits >= cost) {
    return { allowed: true, currentBalance: balance.credits, cost, isUnlimited: false };
  }

  return {
    allowed: false,
    currentBalance: balance.credits,
    cost,
    isUnlimited: false,
    message: `Insufficient credits. You need ${cost} credits for this action but only have ${balance.credits}. Purchase more credits or upgrade your plan.`,
  };
}

// ─── Consume Credits ───────────────────────────────────────────────

export async function consumeCredits(
  userId: number,
  action: CreditActionType,
  description?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: 'No database' };

  await ensureBalance(userId);

  // ── SECURITY: Credit Integrity Validation ──────────────────────
  const cost = CREDIT_COSTS[action];
  const validation = validateCreditOperation("consume", cost, userId);
  if (!validation.valid) {
    await logSecurityEvent(userId, "credit_integrity_violation", {
      operation: "consume",
      action,
      cost,
      error: validation.error,
    });
    return { success: false, error: validation.error };
  }

  // Map action key to DB enum type. All new action types pass through directly
  // since they are now defined in the schema enum. Fallback: "deduction".
  const txType = "deduction" as const;

  // Wrap in a transaction to prevent race conditions (check-then-deduct atomicity)
  return await db.transaction(async (tx) => {
    // Lock the row with SELECT ... FOR UPDATE to prevent concurrent deductions
    const bal = await tx
      .select({ credits: creditBalances.credits, isUnlimited: creditBalances.isUnlimited })
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .for("update")
      .limit(1);

    if (bal.length === 0) return { success: false };
    if (bal[0].isUnlimited) {
      // Admin — log the action but don't deduct
      await tx.insert(creditTransactions).values({
        userId,
        amount: 0,
        type: "deduction",
        description: description || `${action} (unlimited account)`,
      });
      return { success: true };
    }

    const cost = CREDIT_COSTS[action];

    if (bal[0].credits < cost) {
      return { success: false };
    }

    // Deduct credits atomically within the transaction
    await tx
      .update(creditBalances)
      .set({
        credits: sql`${creditBalances.credits} - ${cost}`,
        lifetimeCreditsUsed: sql`${creditBalances.lifetimeCreditsUsed} + ${cost}`,
      })
      .where(eq(creditBalances.userId, userId));

    // Get updated balance
    const updated = await tx
      .select({ credits: creditBalances.credits })
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .limit(1);

    const newBalance = updated[0]?.credits ?? 0;

    // Log transaction
    await tx.insert(creditTransactions).values({
      userId,
      amount: -cost,
      type: "deduction",
      description: description || `${action}: -${cost} credits`,
    });

    return { success: true };
  });
}

// ─── Add Credits ───────────────────────────────────────────────────

export async function addCredits(
  userId: number,
  amount: number,
  type: "free_grant" | "purchase" | "deduction" | "refund" | "subscription" | "referral",
  description: string,
  stripePaymentIntentId?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: 'No database' };

  await ensureBalance(userId);

  // ── SECURITY: Credit Integrity Validation ──────────────────────
  // Validate the credit addition amount. Admin adjustments bypass.
  const isAdminOp = type === "free_grant";
  const validation = validateCreditOperation("add", amount, userId, isAdminOp);
  if (!validation.valid) {
    await logSecurityEvent(userId, "credit_integrity_violation", {
      operation: "add",
      type,
      amount,
      error: validation.error,
    });
    return { success: false, error: validation.error };
  }

  // Wrap in a transaction to ensure balance update + transaction log are atomic
  return await db.transaction(async (tx) => {
    // Add credits atomically within the transaction
    await tx
      .update(creditBalances)
      .set({
        credits: sql`${creditBalances.credits} + ${amount}`,
        lifetimeCreditsAdded: sql`${creditBalances.lifetimeCreditsAdded} + ${amount}`,
        ...(type === "subscription" ? { lastRefillAt: new Date() } : {}),
      })
      .where(eq(creditBalances.userId, userId));

    // Get updated balance
    const updated = await tx
      .select({ credits: creditBalances.credits })
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .limit(1);

    const newBalance = updated[0]?.credits ?? 0;

    // Log transaction
    await tx.insert(creditTransactions).values({
      userId,
      amount,
      type,
      description,
    });

    return { success: true };
  });
}

// ─── Monthly Refill ────────────────────────────────────────────────

export async function processMonthlyRefill(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await ensureBalance(userId);

  const bal = await db
    .select({ lastRefillAt: creditBalances.lastRefillAt, isUnlimited: creditBalances.isUnlimited })
    .from(creditBalances)
    .where(eq(creditBalances.userId, userId))
    .limit(1);

  if (bal.length === 0 || bal[0].isUnlimited) return false;

  // Check if already refilled this month
  const now = new Date();
  const lastRefill = bal[0].lastRefillAt;
  if (lastRefill) {
    const sameMonth =
      lastRefill.getUTCFullYear() === now.getUTCFullYear() &&
      lastRefill.getUTCMonth() === now.getUTCMonth();
    if (sameMonth) return false; // Already refilled this month
  }

  // Get user's plan allocation
  const plan = await getUserPlan(userId);
  const tier = PRICING_TIERS.find((t) => t.id === plan.planId);
  const allocation = tier?.credits.monthlyAllocation ?? 50;

  if (allocation <= 0) return false;

  await addCredits(
    userId,
    allocation,
    "subscription",
    `Monthly credit refill: +${allocation} credits (${tier?.name || "Free"} plan)`
  );

  return true;
}

// ─── Daily Login Bonus (Free Tier Engagement) ────────────────────────
//
// DAILY LOGIN BONUS PHILOSOPHY:
// - Free users get 5 credits per day just for logging in / using the platform.
// - Capped at 150 credits per month (30 days × 5) to prevent abuse.
// - This costs nothing (credits are virtual) but dramatically increases:
//   1. Daily active users (DAU) — users come back every day to claim bonus
//   2. Retention — users feel progress even on the free tier
//   3. Conversion — users who engage daily are more likely to upgrade
// - Only applies to free tier users. Paid users already get generous allocations.
// - The bonus resets each calendar month along with loginBonusThisMonth counter.

const DAILY_LOGIN_BONUS_AMOUNT = 50;
const MONTHLY_LOGIN_BONUS_CAP = 1500;

export async function processDailyLoginBonus(userId: number): Promise<{ awarded: boolean; amount: number; monthlyTotal: number }> {
  const db = await getDb();
  if (!db) return { awarded: false, amount: 0, monthlyTotal: 0 };

  await ensureBalance(userId);

  // Only award to non-unlimited (non-admin) users
  const bal = await db
    .select({
      isUnlimited: creditBalances.isUnlimited,
      lastLoginBonusAt: creditBalances.lastLoginBonusAt,
      loginBonusThisMonth: creditBalances.loginBonusThisMonth,
    })
    .from(creditBalances)
    .where(eq(creditBalances.userId, userId))
    .limit(1);

  if (bal.length === 0 || bal[0].isUnlimited) {
    return { awarded: false, amount: 0, monthlyTotal: 0 };
  }

  // Only award to free tier users
  const plan = await getUserPlan(userId);
  if (plan.planId !== "free") {
    return { awarded: false, amount: 0, monthlyTotal: bal[0].loginBonusThisMonth };
  }

  const now = new Date();
  const lastBonus = bal[0].lastLoginBonusAt;
  let monthlyTotal = bal[0].loginBonusThisMonth;

  // Reset monthly counter if we're in a new month
  if (lastBonus) {
    const differentMonth =
      lastBonus.getUTCFullYear() !== now.getUTCFullYear() ||
      lastBonus.getUTCMonth() !== now.getUTCMonth();
    if (differentMonth) {
      monthlyTotal = 0;
    }
  }

  // Check if already claimed today
  if (lastBonus) {
    const sameDay =
      lastBonus.getUTCFullYear() === now.getUTCFullYear() &&
      lastBonus.getUTCMonth() === now.getUTCMonth() &&
      lastBonus.getUTCDate() === now.getUTCDate();
    if (sameDay) {
      return { awarded: false, amount: 0, monthlyTotal };
    }
  }

  // Check monthly cap
  if (monthlyTotal >= MONTHLY_LOGIN_BONUS_CAP) {
    return { awarded: false, amount: 0, monthlyTotal };
  }

  // Calculate amount (might be less than 5 if near cap)
  const remaining = MONTHLY_LOGIN_BONUS_CAP - monthlyTotal;
  const awardAmount = Math.min(DAILY_LOGIN_BONUS_AMOUNT, remaining);

  if (awardAmount <= 0) {
    return { awarded: false, amount: 0, monthlyTotal };
  }

  // Award the bonus
  const newMonthlyTotal = monthlyTotal + awardAmount;

  await db
    .update(creditBalances)
    .set({
      lastLoginBonusAt: now,
      loginBonusThisMonth: newMonthlyTotal,
    })
    .where(eq(creditBalances.userId, userId));

  const result = await addCredits(
    userId,
    awardAmount,
    "free_grant",
    `Daily login bonus: +${awardAmount} credits (${newMonthlyTotal}/${MONTHLY_LOGIN_BONUS_CAP} this month)`
  );

  if (result.success) {
    return { awarded: true, amount: awardAmount, monthlyTotal: newMonthlyTotal };
  }

  return { awarded: false, amount: 0, monthlyTotal };
}

// ─── Get Transaction History ───────────────────────────────────────

export async function getCreditHistory(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<{ transactions: Array<{
  id: number;
  amount: number;
  type: string;
  description: string | null;
  createdAt: Date;
}>; total: number }> {
  const db = await getDb();
  if (!db) return { transactions: [], total: 0 };

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId)),
  ]);

  return {
    transactions: rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      type: r.type,
      description: r.description,
      createdAt: r.createdAt,
    })),
    total: countResult[0]?.count ?? 0,
  };
}

// ─── Admin: Set Unlimited ──────────────────────────────────────────

export async function setUnlimited(userId: number, unlimited: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await ensureBalance(userId);

  await db
    .update(creditBalances)
    .set({ isUnlimited: unlimited })
    .where(eq(creditBalances.userId, userId));
}

// ─── Admin: Adjust Credits ─────────────────────────────────────────

export async function adminAdjustCredits(
  userId: number,
  amount: number,
  reason: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  return addCredits(userId, amount, "free_grant", `Admin adjustment: ${reason}`);
}
