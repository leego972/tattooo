CREATE TABLE `artist_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`timeSlot` varchar(10) NOT NULL DEFAULT 'all-day',
	`isBooked` boolean NOT NULL DEFAULT false,
	`bookingId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artist_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `in_app_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('booking_request','booking_confirmed','booking_declined','booking_cancelled','new_message','system') NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`data` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `in_app_notifications_id` PRIMARY KEY(`id`)
);
