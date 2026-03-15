import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  appliedPromoCode: varchar("appliedPromoCode", { length: 32 }),
  promoDiscountUsed: boolean("promoDiscountUsed").default(false).notNull(),
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
  plan: mysqlEnum("plan", ["free", "starter", "pro", "studio", "unlimited"]).notNull().default("free"),
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


// ═══════════════════════════════════════════════════════════
// ADVERTISING, AFFILIATE, SEO, BLOG, MARKETING, SUBSCRIPTION
// ═══════════════════════════════════════════════════════════

export const affiliatePartners = mysqlTable("affiliate_partners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  domain: varchar("domain", { length: 512 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  vertical: mysqlEnum("vertical", ["ai_tools", "hosting", "dev_tools", "security", "vpn", "crypto", "saas", "education", "other"]).default("other").notNull(),
  commissionType: mysqlEnum("commissionType", ["revshare", "cpa", "hybrid", "cpm", "cpc"]).default("cpa").notNull(),
  commissionRate: int("commissionRate").default(20).notNull(), // percentage or cents depending on type
  tier: mysqlEnum("tier", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
  status: mysqlEnum("status", ["prospect", "applied", "active", "paused", "rejected", "churned"]).default("prospect").notNull(),
  affiliateUrl: text("affiliateUrl"), // their affiliate link for us to promote
  applicationUrl: text("applicationUrl"), // where to apply for their program
  applicationEmail: varchar("applicationEmail", { length: 320 }),
  applicationSentAt: timestamp("applicationSentAt"),
  approvedAt: timestamp("approvedAt"),
  totalClicks: int("totalClicks").default(0).notNull(),
  totalConversions: int("totalConversions").default(0).notNull(),
  totalEarnings: int("totalEarnings").default(0).notNull(), // in cents
  performanceScore: int("performanceScore").default(0).notNull(), // 0-100
  lastOptimizedAt: timestamp("lastOptimizedAt"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const affiliateClicks = mysqlTable("affiliate_clicks", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  userId: int("userId"), // null for anonymous clicks
  clickId: varchar("clickId", { length: 64 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  referrer: text("referrer"),
  utmSource: varchar("utmSource", { length: 128 }),
  utmMedium: varchar("utmMedium", { length: 128 }),
  utmCampaign: varchar("utmCampaign", { length: 128 }),
  converted: boolean("converted").default(false).notNull(),
  conversionDate: timestamp("conversionDate"),
  commissionEarned: int("commissionEarned").default(0).notNull(), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const affiliateApplications = mysqlTable("affiliate_applications", {
  id: int("id").autoincrement().primaryKey(),
  discoveryId: int("discoveryId").notNull(),
  applicationType: mysqlEnum("applicationType", ["email", "form_fill", "api_signup", "network_apply"]).default("email").notNull(),
  subject: text("app_subject"),
  body: text("app_body"),
  formData: json("formData").$type<Record<string, string>>(),
  status: mysqlEnum("app_status", ["drafted", "approved", "sent", "pending", "accepted", "rejected"]).default("drafted").notNull(),
  sentAt: timestamp("app_sentAt"),
  responseReceivedAt: timestamp("responseReceivedAt"),
  responseContent: text("responseContent"),
  aiGenerated: boolean("app_aiGenerated").default(true).notNull(),
  createdAt: timestamp("app_createdAt").defaultNow().notNull(),
});


export const affiliateDiscoveries = mysqlTable("affiliate_discoveries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  domain: varchar("domain", { length: 512 }).notNull(),
  description: text("description"),
  vertical: mysqlEnum("vertical_disc", ["ai_tools", "hosting", "dev_tools", "security", "vpn", "crypto", "saas", "education", "automation", "analytics", "design", "marketing", "fintech", "other"]).default("other").notNull(),
  estimatedCommissionType: mysqlEnum("estimatedCommissionType", ["revshare", "cpa", "hybrid", "unknown"]).default("unknown").notNull(),
  estimatedCommissionRate: int("estimatedCommissionRate").default(0).notNull(),
  revenueScore: int("revenueScore").default(0).notNull(), // 0-100 estimated revenue potential
  relevanceScore: int("relevanceScore").default(0).notNull(), // 0-100 relevance to Titan users
  overallScore: int("overallScore").default(0).notNull(), // combined weighted score
  affiliateProgramUrl: text("affiliateProgramUrl"),
  signupUrl: text("signupUrl"),
  contactEmail: varchar("contactEmail", { length: 320 }),
  networkName: varchar("networkName", { length: 128 }), // ShareASale, CJ, Impact, PartnerStack, direct
  status: mysqlEnum("discovery_status", ["discovered", "evaluating", "approved", "applied", "accepted", "rejected", "skipped"]).default("discovered").notNull(),
  applicationStatus: mysqlEnum("applicationStatus", ["not_applied", "application_drafted", "application_sent", "pending_review", "approved", "rejected"]).default("not_applied").notNull(),
  applicationDraftedAt: timestamp("applicationDraftedAt"),
  applicationSentAt: timestamp("disc_applicationSentAt"),
  applicationResponseAt: timestamp("applicationResponseAt"),
  discoveredBy: mysqlEnum("discoveredBy", ["llm_search", "network_crawl", "competitor_analysis", "manual"]).default("llm_search").notNull(),
  discoveryBatchId: varchar("discoveryBatchId", { length: 64 }),
  notes: text("notes"),
  metadata: json("disc_metadata").$type<Record<string, unknown>>(),
  promotedToPartnerId: int("promotedToPartnerId"), // if promoted to full affiliate_partners table
  createdAt: timestamp("disc_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("disc_updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const affiliateDiscoveryRuns = mysqlTable("affiliate_discovery_runs", {
  id: int("id").autoincrement().primaryKey(),
  batchId: varchar("batchId", { length: 64 }).notNull().unique(),
  runType: mysqlEnum("runType", ["scheduled", "manual", "startup"]).default("scheduled").notNull(),
  status: mysqlEnum("run_status", ["running", "completed", "failed", "killed"]).default("running").notNull(),
  programsDiscovered: int("programsDiscovered").default(0).notNull(),
  programsEvaluated: int("programsEvaluated").default(0).notNull(),
  programsApproved: int("programsApproved").default(0).notNull(),
  applicationsGenerated: int("applicationsGenerated").default(0).notNull(),
  applicationsSent: int("applicationsSent").default(0).notNull(),
  searchQueries: json("searchQueries").$type<string[]>(),
  errors: json("run_errors").$type<string[]>(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  durationMs: int("durationMs").default(0).notNull(),
  killSwitchTriggered: boolean("killSwitchTriggered").default(false).notNull(),
});


export const affiliateOutreach = mysqlTable("affiliate_outreach", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  type: mysqlEnum("type", ["email", "form", "api"]).default("email").notNull(),
  subject: text("subject"),
  body: text("body"),
  status: mysqlEnum("status", ["drafted", "sent", "opened", "replied", "accepted", "rejected"]).default("drafted").notNull(),
  sentAt: timestamp("sentAt"),
  repliedAt: timestamp("repliedAt"),
  aiGenerated: boolean("aiGenerated").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const affiliatePayouts = mysqlTable("affiliate_payouts", {
  id: int("id").autoincrement().primaryKey(),
  partnerId: int("partnerId").notNull(),
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }), // stripe, paypal, bank_transfer
  paymentReference: varchar("paymentReference", { length: 256 }),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  clickCount: int("clickCount").default(0).notNull(),
  conversionCount: int("conversionCount").default(0).notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("blog_title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  content: text("blog_content").notNull(),
  coverImageUrl: text("coverImageUrl"),
  authorId: int("authorId"),
  category: varchar("category", { length: 100 }).notNull(),
  tags: json("tags").$type<string[]>().default([]),
  metaTitle: varchar("metaTitle", { length: 160 }),
  metaDescription: varchar("metaDescription", { length: 320 }),
  focusKeyword: varchar("focusKeyword", { length: 100 }),
  secondaryKeywords: json("secondaryKeywords").$type<string[]>().default([]),
  seoScore: int("seoScore").default(0),
  readingTimeMinutes: int("readingTimeMinutes").default(5),
  status: mysqlEnum("blog_status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("blog_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("blog_updatedAt").defaultNow().notNull(),
  viewCount: int("viewCount").default(0),
  aiGenerated: boolean("blog_aiGenerated").default(false).notNull(),
});


export const blogCategories = mysqlTable("blog_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("cat_name", { length: 100 }).notNull().unique(),
  slug: varchar("cat_slug", { length: 100 }).notNull().unique(),
  description: text("cat_description"),
  postCount: int("postCount").default(0),
  createdAt: timestamp("cat_createdAt").defaultNow().notNull(),
});


export const marketingContent = mysqlTable("marketing_content", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  channel: mysqlEnum("channel", ["meta", "google_ads", "x_twitter", "linkedin", "snapchat", "content_seo", "devto", "medium", "hashnode", "discord", "mastodon", "telegram", "whatsapp", "pinterest", "reddit", "tiktok", "youtube", "quora", "skool", "indiehackers", "hackernews", "producthunt", "email_outreach", "sendgrid", "hacker_forum"]).notNull(),
  contentType: mysqlEnum("contentType", ["social_post", "ad_copy", "blog_article", "email", "image_ad", "video_script", "backlink_outreach", "email_nurture", "community_engagement", "hacker_forum_post", "content_queue"]).notNull(),
  title: varchar("title", { length: 500 }),
  body: text("body").notNull(),
  mediaUrl: text("mediaUrl"), // S3 URL for generated images/videos
  hashtags: json("hashtags").$type<string[]>(),
  platform: varchar("platform", { length: 128 }), // extended platform identifier
  headline: varchar("headline", { length: 500 }), // alternative headline field
  metadata: json("metadata").$type<Record<string, any>>(), // extra metadata for content queue
  status: mysqlEnum("status", ["draft", "approved", "published", "failed"]).default("draft").notNull(),
  externalPostId: varchar("externalPostId", { length: 255 }), // ID from the platform after publishing
  publishedAt: timestamp("publishedAt"),
  impressions: int("impressions").default(0).notNull(),
  engagements: int("engagements").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  aiPrompt: text("aiPrompt"), // The prompt used to generate this content
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const marketingActivityLog = mysqlTable("marketing_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  channel: varchar("channel", { length: 50 }),
  details: json("details").$type<Record<string, any>>(),
  status: mysqlEnum("status", ["success", "failed", "skipped"]).default("success").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const marketingCampaigns = mysqlTable("marketing_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  budgetId: int("budgetId"),
  channel: mysqlEnum("channel", ["meta", "google_ads", "x_twitter", "linkedin", "snapchat", "content_seo"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "pending_review", "active", "paused", "completed", "failed"]).default("draft").notNull(),
  type: mysqlEnum("type", ["awareness", "engagement", "conversion", "retargeting"]).notNull(),
  targetAudience: json("targetAudience").$type<{
    demographics?: { ageMin?: number; ageMax?: number; genders?: string[]; };
    interests?: string[];
    locations?: string[];
    customAudiences?: string[];
  }>(),
  dailyBudget: int("dailyBudget").default(0).notNull(), // cents
  totalBudget: int("totalBudget").default(0).notNull(), // cents
  totalSpend: int("totalSpend").default(0).notNull(), // cents
  externalCampaignId: varchar("externalCampaignId", { length: 255 }), // ID from the ad platform
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  impressions: int("impressions").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  aiStrategy: text("aiStrategy"), // AI's reasoning for this campaign
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const marketingPerformance = mysqlTable("marketing_performance", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // "2026-02-15" format
  channel: mysqlEnum("channel", ["meta", "google_ads", "x_twitter", "linkedin", "snapchat", "content_seo", "devto", "medium", "hashnode", "discord", "mastodon", "telegram", "whatsapp", "pinterest", "reddit", "tiktok", "youtube", "quora", "skool", "indiehackers", "hackernews", "producthunt", "email_outreach", "sendgrid", "hacker_forum"]).notNull(),
  impressions: int("impressions").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  spend: int("spend").default(0).notNull(), // cents
  cpc: int("cpc").default(0).notNull(), // cents — cost per click
  cpm: int("cpm").default(0).notNull(), // cents — cost per 1000 impressions
  ctr: varchar("ctr", { length: 10 }).default("0").notNull(), // click-through rate as string "2.5"
  roas: varchar("roas", { length: 10 }).default("0").notNull(), // return on ad spend as string "3.2"
  signups: int("signups").default(0).notNull(), // new Titan signups attributed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const marketingSettings = mysqlTable("marketing_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const contentCreatorPieces = mysqlTable("content_creator_pieces", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  platform: mysqlEnum("cc_platform", [
    "tiktok", "instagram", "x_twitter", "linkedin", "reddit", "facebook",
    "youtube_shorts", "blog", "email", "pinterest", "discord", "telegram",
    "whatsapp", "medium", "hackernews",
  ]).notNull(),
  contentType: mysqlEnum("cc_content_type", [
    "video_script", "photo_carousel", "social_post", "ad_copy",
    "blog_article", "email_campaign", "story", "reel", "thread", "infographic",
  ]).notNull(),
  title: varchar("title", { length: 500 }),
  body: text("body").notNull(),
  headline: varchar("headline", { length: 500 }),
  callToAction: varchar("callToAction", { length: 255 }),
  hashtags: json("hashtags").$type<string[]>(),
  mediaUrl: text("mediaUrl"),
  imagePrompt: text("imagePrompt"),
  videoScript: text("videoScript"),
  hook: varchar("hook", { length: 500 }),
  visualDirections: json("visualDirections").$type<string[]>(),
  seoKeywords: json("seoKeywords").$type<string[]>(),
  seoScore: int("seoScore").default(0),
  qualityScore: int("qualityScore").default(0),
  status: mysqlEnum("cc_piece_status", [
    "draft", "review", "approved", "scheduled", "published", "failed", "archived",
  ]).notNull().default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  externalPostId: varchar("externalPostId", { length: 255 }),
  externalUrl: text("externalUrl"),
  impressions: int("impressions").notNull().default(0),
  clicks: int("clicks").notNull().default(0),
  engagements: int("engagements").notNull().default(0),
  shares: int("shares").notNull().default(0),
  saves: int("saves").notNull().default(0),
  comments: int("comments").notNull().default(0),
  aiPrompt: text("aiPrompt"),
  aiModel: varchar("aiModel", { length: 50 }),
  generationMs: int("generationMs"),
  tiktokPublishId: varchar("tiktokPublishId", { length: 255 }),
  linkedMarketingContentId: int("linkedMarketingContentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const contentCreatorCampaigns = mysqlTable("content_creator_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  objective: varchar("objective", { length: 100 }).notNull().default("brand_awareness"),
  description: text("description"),
  targetAudience: text("targetAudience"),
  brandVoice: varchar("brandVoice", { length: 100 }).notNull().default("confident"),
  primaryKeywords: json("primaryKeywords").$type<string[]>(),
  platforms: json("platforms").$type<string[]>().notNull(),
  status: mysqlEnum("cc_campaign_status", ["draft", "active", "paused", "completed", "archived"]).notNull().default("draft"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  totalPieces: int("totalPieces").notNull().default(0),
  publishedPieces: int("publishedPieces").notNull().default(0),
  totalImpressions: int("totalImpressions").notNull().default(0),
  totalClicks: int("totalClicks").notNull().default(0),
  totalEngagements: int("totalEngagements").notNull().default(0),
  seoLinked: boolean("seoLinked").notNull().default(false),
  advertisingLinked: boolean("advertisingLinked").notNull().default(false),
  tiktokLinked: boolean("tiktokLinked").notNull().default(false),
  aiStrategy: text("aiStrategy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const contentCreatorSchedules = mysqlTable("content_creator_schedules", {
  id: int("id").autoincrement().primaryKey(),
  pieceId: int("pieceId").notNull(),
  campaignId: int("campaignId"),
  platform: varchar("platform", { length: 50 }).notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  status: mysqlEnum("cc_schedule_status", [
    "pending", "processing", "published", "failed", "cancelled",
  ]).notNull().default("pending"),
  publishedAt: timestamp("publishedAt"),
  failReason: text("failReason"),
  retryCount: int("retryCount").notNull().default(0),
  maxRetries: int("maxRetries").notNull().default(3),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const contentCreatorAnalytics = mysqlTable("content_creator_analytics", {
  id: int("id").autoincrement().primaryKey(),
  pieceId: int("pieceId").notNull(),
  campaignId: int("campaignId"),
  platform: varchar("platform", { length: 50 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  impressions: int("impressions").notNull().default(0),
  clicks: int("clicks").notNull().default(0),
  engagements: int("engagements").notNull().default(0),
  shares: int("shares").notNull().default(0),
  saves: int("saves").notNull().default(0),
  comments: int("comments").notNull().default(0),
  reach: int("reach").notNull().default(0),
  videoViews: int("videoViews").notNull().default(0),
  videoCompletionRate: varchar("videoCompletionRate", { length: 10 }).default("0"),
  ctr: varchar("ctr", { length: 10 }).default("0"),
  engagementRate: varchar("engagementRate", { length: 10 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});


export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }).notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  plan: mysqlEnum("plan", ["free", "pro", "enterprise", "cyber", "cyber_plus", "titan"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "incomplete", "trialing"]).default("active").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const creditBalances = mysqlTable("credit_balances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  credits: int("credits").notNull().default(0),
  lifetimeCreditsUsed: int("lifetimeCreditsUsed").notNull().default(0),
  lifetimeCreditsAdded: int("lifetimeCreditsAdded").notNull().default(0),
  isUnlimited: boolean("isUnlimited").notNull().default(false), // admin bypass
  lastRefillAt: timestamp("lastRefillAt"),
  lastLoginBonusAt: timestamp("lastLoginBonusAt"), // last daily login bonus claim
  loginBonusThisMonth: int("loginBonusThisMonth").notNull().default(0), // cumulative login bonus credits this month (cap: 150)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // the referrer
  code: varchar("code", { length: 32 }).notNull().unique(),
  totalReferrals: int("totalReferrals").default(0).notNull(),
  successfulReferrals: int("successfulReferrals").default(0).notNull(),
  bonusCreditsEarned: int("bonusCreditsEarned").default(0).notNull(),
  totalRewardsEarned: int("totalRewardsEarned").default(0).notNull(),
  totalCommissionCents: int("totalCommissionCents").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

export const referralTracking = mysqlTable("referral_tracking", {
  id: int("id").autoincrement().primaryKey(),
  referralCodeId: int("referralCodeId").notNull(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId"),
  referredEmail: varchar("referredEmail", { length: 320 }),
  status: mysqlEnum("referralTrackStatus", ["clicked", "registered", "rewarded"]).default("clicked").notNull(),
  rewardType: varchar("rewardType", { length: 64 }),
  rewardAmount: int("rewardAmount"),
  rewardedAt: timestamp("rewardedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralTracking = typeof referralTracking.$inferSelect;
export type InsertReferralTracking = typeof referralTracking.$inferInsert;

export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  discountPercent: int("discountPercent").notNull().default(50),
  bonusCredits: int("bonusCredits").notNull().default(0),
  maxUses: int("maxUses").notNull().default(100),
  usedCount: int("usedCount").notNull().default(0),
  isActive: boolean("isActive").notNull().default(true),
  description: varchar("description", { length: 255 }),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;


export const referralConversions = mysqlTable("referral_conversions", {
  id: int("id").autoincrement().primaryKey(),
  referralCodeId: int("referralCodeId").notNull(),
  referrerId: int("referrerId").notNull(), // the user who referred
  referredUserId: int("referredUserId").notNull(), // the new user
  status: mysqlEnum("status", ["signed_up", "subscribed", "rewarded"]).default("signed_up").notNull(),
  rewardType: mysqlEnum("rewardType", ["free_month", "commission", "credit", "tier_upgrade", "discount", "high_value_discount"]).default("discount"),
  rewardAmountCents: int("rewardAmountCents").default(0).notNull(),
  rewardGrantedAt: timestamp("rewardGrantedAt"),
  subscriptionId: varchar("subscriptionId", { length: 256 }), // Stripe subscription ID if they paid
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
