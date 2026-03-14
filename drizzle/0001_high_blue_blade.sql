CREATE TABLE `affiliate_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`discoveryId` int NOT NULL,
	`applicationType` enum('email','form_fill','api_signup','network_apply') NOT NULL DEFAULT 'email',
	`app_subject` text,
	`app_body` text,
	`formData` json,
	`app_status` enum('drafted','approved','sent','pending','accepted','rejected') NOT NULL DEFAULT 'drafted',
	`app_sentAt` timestamp,
	`responseReceivedAt` timestamp,
	`responseContent` text,
	`app_aiGenerated` boolean NOT NULL DEFAULT true,
	`app_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_clicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`userId` int,
	`clickId` varchar(64) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`referrer` text,
	`utmSource` varchar(128),
	`utmMedium` varchar(128),
	`utmCampaign` varchar(128),
	`converted` boolean NOT NULL DEFAULT false,
	`conversionDate` timestamp,
	`commissionEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_clicks_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_clicks_clickId_unique` UNIQUE(`clickId`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_discoveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`domain` varchar(512) NOT NULL,
	`description` text,
	`vertical_disc` enum('ai_tools','hosting','dev_tools','security','vpn','crypto','saas','education','automation','analytics','design','marketing','fintech','other') NOT NULL DEFAULT 'other',
	`estimatedCommissionType` enum('revshare','cpa','hybrid','unknown') NOT NULL DEFAULT 'unknown',
	`estimatedCommissionRate` int NOT NULL DEFAULT 0,
	`revenueScore` int NOT NULL DEFAULT 0,
	`relevanceScore` int NOT NULL DEFAULT 0,
	`overallScore` int NOT NULL DEFAULT 0,
	`affiliateProgramUrl` text,
	`signupUrl` text,
	`contactEmail` varchar(320),
	`networkName` varchar(128),
	`discovery_status` enum('discovered','evaluating','approved','applied','accepted','rejected','skipped') NOT NULL DEFAULT 'discovered',
	`applicationStatus` enum('not_applied','application_drafted','application_sent','pending_review','approved','rejected') NOT NULL DEFAULT 'not_applied',
	`applicationDraftedAt` timestamp,
	`disc_applicationSentAt` timestamp,
	`applicationResponseAt` timestamp,
	`discoveredBy` enum('llm_search','network_crawl','competitor_analysis','manual') NOT NULL DEFAULT 'llm_search',
	`discoveryBatchId` varchar(64),
	`notes` text,
	`disc_metadata` json,
	`promotedToPartnerId` int,
	`disc_createdAt` timestamp NOT NULL DEFAULT (now()),
	`disc_updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_discoveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_discovery_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` varchar(64) NOT NULL,
	`runType` enum('scheduled','manual','startup') NOT NULL DEFAULT 'scheduled',
	`run_status` enum('running','completed','failed','killed') NOT NULL DEFAULT 'running',
	`programsDiscovered` int NOT NULL DEFAULT 0,
	`programsEvaluated` int NOT NULL DEFAULT 0,
	`programsApproved` int NOT NULL DEFAULT 0,
	`applicationsGenerated` int NOT NULL DEFAULT 0,
	`applicationsSent` int NOT NULL DEFAULT 0,
	`searchQueries` json,
	`run_errors` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`durationMs` int NOT NULL DEFAULT 0,
	`killSwitchTriggered` boolean NOT NULL DEFAULT false,
	CONSTRAINT `affiliate_discovery_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliate_discovery_runs_batchId_unique` UNIQUE(`batchId`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_outreach` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`type` enum('email','form','api') NOT NULL DEFAULT 'email',
	`subject` text,
	`body` text,
	`status` enum('drafted','sent','opened','replied','accepted','rejected') NOT NULL DEFAULT 'drafted',
	`sentAt` timestamp,
	`repliedAt` timestamp,
	`aiGenerated` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_outreach_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`domain` varchar(512),
	`contactEmail` varchar(320),
	`vertical` enum('ai_tools','hosting','dev_tools','security','vpn','crypto','saas','education','other') NOT NULL DEFAULT 'other',
	`commissionType` enum('revshare','cpa','hybrid','cpm','cpc') NOT NULL DEFAULT 'cpa',
	`commissionRate` int NOT NULL DEFAULT 20,
	`tier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`status` enum('prospect','applied','active','paused','rejected','churned') NOT NULL DEFAULT 'prospect',
	`affiliateUrl` text,
	`applicationUrl` text,
	`applicationEmail` varchar(320),
	`applicationSentAt` timestamp,
	`approvedAt` timestamp,
	`totalClicks` int NOT NULL DEFAULT 0,
	`totalConversions` int NOT NULL DEFAULT 0,
	`totalEarnings` int NOT NULL DEFAULT 0,
	`performanceScore` int NOT NULL DEFAULT 0,
	`lastOptimizedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliate_partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliate_payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(64),
	`paymentReference` varchar(256),
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`clickCount` int NOT NULL DEFAULT 0,
	`conversionCount` int NOT NULL DEFAULT 0,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `affiliate_payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(128) NOT NULL,
	`bio` text,
	`location` varchar(128),
	`country` varchar(64),
	`specialties` varchar(512),
	`instagram` varchar(128),
	`website` varchar(255),
	`contactEmail` varchar(320),
	`avatarUrl` text,
	`hourlyRate` int,
	`depositAmount` int,
	`stripeAccountId` varchar(128),
	`verified` boolean NOT NULL DEFAULT false,
	`featured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blog_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cat_name` varchar(100) NOT NULL,
	`cat_slug` varchar(100) NOT NULL,
	`cat_description` text,
	`postCount` int DEFAULT 0,
	`cat_createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_categories_cat_name_unique` UNIQUE(`cat_name`),
	CONSTRAINT `blog_categories_cat_slug_unique` UNIQUE(`cat_slug`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`blog_title` varchar(500) NOT NULL,
	`excerpt` text,
	`blog_content` text NOT NULL,
	`coverImageUrl` text,
	`authorId` int,
	`category` varchar(100) NOT NULL,
	`tags` json DEFAULT ('[]'),
	`metaTitle` varchar(160),
	`metaDescription` varchar(320),
	`focusKeyword` varchar(100),
	`secondaryKeywords` json DEFAULT ('[]'),
	`seoScore` int DEFAULT 0,
	`readingTimeMinutes` int DEFAULT 5,
	`blog_status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`blog_createdAt` timestamp NOT NULL DEFAULT (now()),
	`blog_updatedAt` timestamp NOT NULL DEFAULT (now()),
	`viewCount` int DEFAULT 0,
	`blog_aiGenerated` boolean NOT NULL DEFAULT false,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`artistId` int NOT NULL,
	`tattooGenerationId` int,
	`status` enum('pending','deposit_paid','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
	`message` text,
	`stripeSessionId` varchar(256),
	`depositAmountCents` int,
	`scheduledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_creator_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pieceId` int NOT NULL,
	`campaignId` int,
	`platform` varchar(50) NOT NULL,
	`date` varchar(10) NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`engagements` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`saves` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`reach` int NOT NULL DEFAULT 0,
	`videoViews` int NOT NULL DEFAULT 0,
	`videoCompletionRate` varchar(10) DEFAULT '0',
	`ctr` varchar(10) DEFAULT '0',
	`engagementRate` varchar(10) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_creator_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_creator_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`objective` varchar(100) NOT NULL DEFAULT 'brand_awareness',
	`description` text,
	`targetAudience` text,
	`brandVoice` varchar(100) NOT NULL DEFAULT 'confident',
	`primaryKeywords` json,
	`platforms` json NOT NULL,
	`cc_campaign_status` enum('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`startDate` timestamp,
	`endDate` timestamp,
	`totalPieces` int NOT NULL DEFAULT 0,
	`publishedPieces` int NOT NULL DEFAULT 0,
	`totalImpressions` int NOT NULL DEFAULT 0,
	`totalClicks` int NOT NULL DEFAULT 0,
	`totalEngagements` int NOT NULL DEFAULT 0,
	`seoLinked` boolean NOT NULL DEFAULT false,
	`advertisingLinked` boolean NOT NULL DEFAULT false,
	`tiktokLinked` boolean NOT NULL DEFAULT false,
	`aiStrategy` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_creator_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_creator_pieces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`cc_platform` enum('tiktok','instagram','x_twitter','linkedin','reddit','facebook','youtube_shorts','blog','email','pinterest','discord','telegram','whatsapp','medium','hackernews') NOT NULL,
	`cc_content_type` enum('video_script','photo_carousel','social_post','ad_copy','blog_article','email_campaign','story','reel','thread','infographic') NOT NULL,
	`title` varchar(500),
	`body` text NOT NULL,
	`headline` varchar(500),
	`callToAction` varchar(255),
	`hashtags` json,
	`mediaUrl` text,
	`imagePrompt` text,
	`videoScript` text,
	`hook` varchar(500),
	`visualDirections` json,
	`seoKeywords` json,
	`seoScore` int DEFAULT 0,
	`qualityScore` int DEFAULT 0,
	`cc_piece_status` enum('draft','review','approved','scheduled','published','failed','archived') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`externalPostId` varchar(255),
	`externalUrl` text,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`engagements` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`saves` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`aiPrompt` text,
	`aiModel` varchar(50),
	`generationMs` int,
	`tiktokPublishId` varchar(255),
	`linkedMarketingContentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_creator_pieces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_creator_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pieceId` int NOT NULL,
	`campaignId` int,
	`platform` varchar(50) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`cc_schedule_status` enum('pending','processing','published','failed','cancelled') NOT NULL DEFAULT 'pending',
	`publishedAt` timestamp,
	`failReason` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_creator_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`credits` int NOT NULL DEFAULT 0,
	`lifetimeCreditsUsed` int NOT NULL DEFAULT 0,
	`lifetimeCreditsAdded` int NOT NULL DEFAULT 0,
	`isUnlimited` boolean NOT NULL DEFAULT false,
	`lastRefillAt` timestamp,
	`lastLoginBonusAt` timestamp,
	`loginBonusThisMonth` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_balances_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('free_grant','purchase','deduction','refund','subscription','referral') NOT NULL,
	`stripeSessionId` varchar(255),
	`description` varchar(500) NOT NULL DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`lifetimeTotal` int NOT NULL DEFAULT 0,
	`plan` enum('free','starter','pro','unlimited') NOT NULL DEFAULT 'free',
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`subscriptionStatus` varchar(64),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `credits_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `design_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shareId` varchar(32) NOT NULL,
	`tattooGenerationId` int NOT NULL,
	`userId` int,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `design_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `design_shares_shareId_unique` UNIQUE(`shareId`)
);
--> statement-breakpoint
CREATE TABLE `marketing_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` varchar(100) NOT NULL,
	`channel` varchar(50),
	`details` json,
	`status` enum('success','failed','skipped') NOT NULL DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketing_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`budgetId` int,
	`channel` enum('meta','google_ads','x_twitter','linkedin','snapchat','content_seo') NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('draft','pending_review','active','paused','completed','failed') NOT NULL DEFAULT 'draft',
	`type` enum('awareness','engagement','conversion','retargeting') NOT NULL,
	`targetAudience` json,
	`dailyBudget` int NOT NULL DEFAULT 0,
	`totalBudget` int NOT NULL DEFAULT 0,
	`totalSpend` int NOT NULL DEFAULT 0,
	`externalCampaignId` varchar(255),
	`startDate` timestamp,
	`endDate` timestamp,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`aiStrategy` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketing_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`channel` enum('meta','google_ads','x_twitter','linkedin','snapchat','content_seo','devto','medium','hashnode','discord','mastodon','telegram','whatsapp','pinterest','reddit','tiktok','youtube','quora','skool','indiehackers','hackernews','producthunt','email_outreach','sendgrid','hacker_forum') NOT NULL,
	`contentType` enum('social_post','ad_copy','blog_article','email','image_ad','video_script','backlink_outreach','email_nurture','community_engagement','hacker_forum_post','content_queue') NOT NULL,
	`title` varchar(500),
	`body` text NOT NULL,
	`mediaUrl` text,
	`hashtags` json,
	`platform` varchar(128),
	`headline` varchar(500),
	`metadata` json,
	`status` enum('draft','approved','published','failed') NOT NULL DEFAULT 'draft',
	`externalPostId` varchar(255),
	`publishedAt` timestamp,
	`impressions` int NOT NULL DEFAULT 0,
	`engagements` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`aiPrompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketing_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`channel` enum('meta','google_ads','x_twitter','linkedin','snapchat','content_seo','devto','medium','hashnode','discord','mastodon','telegram','whatsapp','pinterest','reddit','tiktok','youtube','quora','skool','indiehackers','hackernews','producthunt','email_outreach','sendgrid','hacker_forum') NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`spend` int NOT NULL DEFAULT 0,
	`cpc` int NOT NULL DEFAULT 0,
	`cpm` int NOT NULL DEFAULT 0,
	`ctr` varchar(10) NOT NULL DEFAULT '0',
	`roas` varchar(10) NOT NULL DEFAULT '0',
	`signups` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketing_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketing_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketing_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketing_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailOnGeneration` boolean NOT NULL DEFAULT true,
	`emailWeeklyDigest` boolean NOT NULL DEFAULT true,
	`emailBookingUpdates` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `outreach_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`region` varchar(128),
	`country` varchar(128) NOT NULL,
	`language` varchar(64) NOT NULL DEFAULT 'en',
	`status` enum('draft','scheduled','sending','completed','paused') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentCount` int NOT NULL DEFAULT 0,
	`openCount` int NOT NULL DEFAULT 0,
	`clickCount` int NOT NULL DEFAULT 0,
	`signupCount` int NOT NULL DEFAULT 0,
	`subjectLine` varchar(512),
	`emailBodyHtml` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `outreach_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outreach_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(256),
	`studioName` varchar(256),
	`country` varchar(128),
	`language` varchar(64) NOT NULL DEFAULT 'en',
	`status` enum('pending','sent','opened','clicked','signed_up','bounced','unsubscribed') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`signedUpAt` timestamp,
	`trackingPixelId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outreach_contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `outreach_contacts_trackingPixelId_unique` UNIQUE(`trackingPixelId`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(16) NOT NULL,
	`totalReferrals` int NOT NULL DEFAULT 0,
	`totalRewardsEarned` int NOT NULL DEFAULT 0,
	`totalCommissionCents` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referral_conversions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referralCodeId` int NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`status` enum('signed_up','subscribed','rewarded') NOT NULL DEFAULT 'signed_up',
	`rewardType` enum('free_month','commission','credit','tier_upgrade','discount','high_value_discount') DEFAULT 'discount',
	`rewardAmountCents` int NOT NULL DEFAULT 0,
	`rewardGrantedAt` timestamp,
	`subscriptionId` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_conversions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int,
	`refCode` varchar(32) NOT NULL,
	`creditAwarded` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_refCode_unique` UNIQUE(`refCode`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(128) NOT NULL,
	`stripeSubscriptionId` varchar(128),
	`plan` enum('free','pro','enterprise','cyber','cyber_plus','titan') NOT NULL DEFAULT 'free',
	`status` enum('active','canceled','past_due','incomplete','trialing') NOT NULL DEFAULT 'active',
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tattoo_generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(128) NOT NULL,
	`userPrompt` text NOT NULL,
	`refinedPrompt` text,
	`imageUrl` text NOT NULL,
	`referenceImageUrl` text,
	`style` varchar(64),
	`bodyPlacement` varchar(64),
	`sizeLabel` varchar(16),
	`sizeInCm` varchar(32),
	`nickname` varchar(128),
	`printImageUrl` text,
	`printSpec` varchar(128),
	`videoUrl` text,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tattoo_generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `refCode` varchar(32);