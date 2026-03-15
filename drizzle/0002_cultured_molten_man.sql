CREATE TABLE `artist_team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`artistId` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`inviteToken` varchar(64),
	`inviteEmail` varchar(320),
	`status` enum('pending','active','removed') NOT NULL DEFAULT 'pending',
	`joinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artist_team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `artist_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`studioName` varchar(255) NOT NULL,
	`studioDescription` text,
	`studioLogoUrl` text,
	`studioAddress` varchar(255),
	`studioCity` varchar(128),
	`studioState` varchar(128),
	`studioCountry` varchar(64),
	`studioPostcode` varchar(20),
	`studioPhone` varchar(32),
	`studioEmail` varchar(320),
	`studioWebsite` varchar(255),
	`studioInstagram` varchar(128),
	`maxMembers` int NOT NULL DEFAULT 10,
	`plan` enum('team','enterprise') NOT NULL DEFAULT 'team',
	`stripeCustomerId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`subscriptionStatus` enum('active','inactive','trialing','past_due','canceled') NOT NULL DEFAULT 'inactive',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artist_teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `info_pack_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`language` varchar(8) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileName` varchar(256) NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `info_pack_attachments_id` PRIMARY KEY(`id`),
	CONSTRAINT `info_pack_attachments_language_unique` UNIQUE(`language`)
);
--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`discountPercent` int NOT NULL DEFAULT 50,
	`bonusCredits` int NOT NULL DEFAULT 0,
	`maxUses` int NOT NULL DEFAULT 100,
	`usedCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`description` varchar(255),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promo_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promo_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referral_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referralCodeId` int NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int,
	`referredEmail` varchar(320),
	`referralTrackStatus` enum('clicked','registered','rewarded') NOT NULL DEFAULT 'clicked',
	`rewardType` varchar(64),
	`rewardAmount` int,
	`rewardedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studio_mailing_list` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studioName` varchar(256) NOT NULL,
	`city` varchar(128),
	`country` varchar(128) NOT NULL,
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`email` varchar(320),
	`emailStatus` enum('found','not_found','bounced','unsubscribed') NOT NULL DEFAULT 'not_found',
	`emailSource` varchar(128),
	`infoPackSentAt` timestamp,
	`infoPackStatus` enum('not_sent','sent','opened','bounced') NOT NULL DEFAULT 'not_sent',
	`weeklyAdOptOut` boolean NOT NULL DEFAULT false,
	`lastWeeklyAdSentAt` timestamp,
	`weeklyAdSentCount` int NOT NULL DEFAULT 0,
	`unsubscribeToken` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studio_mailing_list_id` PRIMARY KEY(`id`),
	CONSTRAINT `studio_mailing_list_unsubscribeToken_unique` UNIQUE(`unsubscribeToken`)
);
--> statement-breakpoint
CREATE TABLE `weekly_ad_sends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studioId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`year` int NOT NULL,
	`subject` varchar(512),
	`imageUrl` text,
	`emailBodyHtml` text,
	`status` enum('sent','bounced','failed') NOT NULL DEFAULT 'sent',
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weekly_ad_sends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `credits` MODIFY COLUMN `plan` enum('free','starter','pro','studio','unlimited') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `referral_codes` MODIFY COLUMN `code` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `artists` ADD `address` varchar(255);--> statement-breakpoint
ALTER TABLE `artists` ADD `city` varchar(128);--> statement-breakpoint
ALTER TABLE `artists` ADD `state` varchar(128);--> statement-breakpoint
ALTER TABLE `artists` ADD `postcode` varchar(20);--> statement-breakpoint
ALTER TABLE `artists` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `artists` ADD `tiktok` varchar(128);--> statement-breakpoint
ALTER TABLE `artists` ADD `facebook` varchar(128);--> statement-breakpoint
ALTER TABLE `artists` ADD `profilePhotoUrl` text;--> statement-breakpoint
ALTER TABLE `artists` ADD `portfolioImages` json;--> statement-breakpoint
ALTER TABLE `artists` ADD `yearsExperience` int;--> statement-breakpoint
ALTER TABLE `artists` ADD `priceRange` varchar(64);--> statement-breakpoint
ALTER TABLE `artists` ADD `languages` varchar(256);--> statement-breakpoint
ALTER TABLE `artists` ADD `businessHours` json DEFAULT ('{"mon":{"open":"09:00","close":"17:00"},"tue":{"open":"09:00","close":"17:00"},"wed":{"open":"09:00","close":"17:00"},"thu":{"open":"09:00","close":"17:00"},"fri":{"open":"09:00","close":"17:00"},"sat":{"closed":true,"open":"","close":""},"sun":{"closed":true,"open":"","close":""}}');--> statement-breakpoint
ALTER TABLE `artists` ADD `teamId` int;--> statement-breakpoint
ALTER TABLE `artists` ADD `isTeamOwner` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `referral_codes` ADD `successfulReferrals` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `referral_codes` ADD `bonusCreditsEarned` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `appliedPromoCode` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `promoDiscountUsed` boolean DEFAULT false NOT NULL;