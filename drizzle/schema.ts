import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Tattoo Generations ────────────────────────────────────────────────────────
export const tattooGenerations = mysqlTable("tattoo_generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  userPrompt: text("userPrompt").notNull(),
  refinedPrompt: text("refinedPrompt"),
  imageUrl: text("imageUrl").notNull(),
  referenceImageUrl: text("referenceImageUrl"),
  style: varchar("style", { length: 64 }),
  bodyPlacement: varchar("bodyPlacement", { length: 64 }),
  sizeLabel: varchar("sizeLabel", { length: 16 }),
  sizeInCm: varchar("sizeInCm", { length: 32 }),
  nickname: varchar("nickname", { length: 128 }),
  printImageUrl: text("printImageUrl"),
  printSpec: varchar("printSpec", { length: 128 }),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TattooGeneration = typeof tattooGenerations.$inferSelect;
export type InsertTattooGeneration = typeof tattooGenerations.$inferInsert;

// ── Credits ───────────────────────────────────────────────────────────────────
export const credits = mysqlTable("credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: int("balance").notNull().default(0),
  lifetimeTotal: int("lifetimeTotal").notNull().default(0),
  plan: mysqlEnum("plan", ["free", "starter", "pro", "unlimited"]).notNull().default("free"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 64 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Credits = typeof credits.$inferSelect;
export type InsertCredits = typeof credits.$inferInsert;

// ── Credit Transactions ───────────────────────────────────────────────────────
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["free_grant", "purchase", "deduction", "refund", "subscription"]).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  description: varchar("description", { length: 500 }).notNull().default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
