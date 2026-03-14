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
  refCode: varchar("refCode", { length: 32 }),
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
  videoUrl: text("videoUrl"),
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
  type: mysqlEnum("type", ["free_grant", "purchase", "deduction", "refund", "subscription", "referral"]).notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }),
  description: varchar("description", { length: 500 }).notNull().default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ── Password Reset Tokens ─────────────────────────────────────────────────────
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// ── Artists ───────────────────────────────────────────────────────────────────
export const artists = mysqlTable("artists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 128 }).notNull(),
  bio: text("bio"),
  location: varchar("location", { length: 128 }),
  country: varchar("country", { length: 64 }),
  specialties: varchar("specialties", { length: 512 }),
  instagram: varchar("instagram", { length: 128 }),
  website: varchar("website", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  avatarUrl: text("avatarUrl"),
  hourlyRate: int("hourlyRate"),
  depositAmount: int("depositAmount"),
  stripeAccountId: varchar("stripeAccountId", { length: 128 }),
  verified: boolean("verified").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Artist = typeof artists.$inferSelect;
export type InsertArtist = typeof artists.$inferInsert;

// ── Design Shares ─────────────────────────────────────────────────────────────
export const designShares = mysqlTable("design_shares", {
  id: int("id").autoincrement().primaryKey(),
  shareId: varchar("shareId", { length: 32 }).notNull().unique(),
  tattooGenerationId: int("tattooGenerationId").notNull(),
  userId: int("userId"),
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DesignShare = typeof designShares.$inferSelect;

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  artistId: int("artistId").notNull(),
  tattooGenerationId: int("tattooGenerationId"),
  status: mysqlEnum("status", ["pending", "deposit_paid", "confirmed", "completed", "cancelled"]).notNull().default("pending"),
  message: text("message"),
  stripeSessionId: varchar("stripeSessionId", { length: 256 }),
  depositAmountCents: int("depositAmountCents"),
  scheduledAt: timestamp("scheduledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ── Referrals ─────────────────────────────────────────────────────────────────
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId"),
  refCode: varchar("refCode", { length: 32 }).notNull().unique(),
  creditAwarded: boolean("creditAwarded").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;

// ── Notification Preferences ──────────────────────────────────────────────────
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailOnGeneration: boolean("emailOnGeneration").default(true).notNull(),
  emailWeeklyDigest: boolean("emailWeeklyDigest").default(true).notNull(),
  emailBookingUpdates: boolean("emailBookingUpdates").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;

// ── Outreach Campaigns ────────────────────────────────────────────────────────
export const outreachCampaigns = mysqlTable("outreach_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  region: varchar("region", { length: 128 }),
  country: varchar("country", { length: 128 }).notNull(),
  language: varchar("language", { length: 64 }).notNull().default("en"),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "completed", "paused"]).notNull().default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  sentCount: int("sentCount").notNull().default(0),
  openCount: int("openCount").notNull().default(0),
  clickCount: int("clickCount").notNull().default(0),
  signupCount: int("signupCount").notNull().default(0),
  subjectLine: varchar("subjectLine", { length: 512 }),
  emailBodyHtml: text("emailBodyHtml"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;
export type InsertOutreachCampaign = typeof outreachCampaigns.$inferInsert;

// ── Outreach Contacts ─────────────────────────────────────────────────────────
export const outreachContacts = mysqlTable("outreach_contacts", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 256 }),
  studioName: varchar("studioName", { length: 256 }),
  country: varchar("country", { length: 128 }),
  language: varchar("language", { length: 64 }).notNull().default("en"),
  status: mysqlEnum("status", ["pending", "sent", "opened", "clicked", "signed_up", "bounced", "unsubscribed"]).notNull().default("pending"),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  signedUpAt: timestamp("signedUpAt"),
  trackingPixelId: varchar("trackingPixelId", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OutreachContact = typeof outreachContacts.$inferSelect;
export type InsertOutreachContact = typeof outreachContacts.$inferInsert;
