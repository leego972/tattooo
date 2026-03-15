ALTER TABLE `bookings` ADD `preferredDate` varchar(10);--> statement-breakpoint
ALTER TABLE `bookings` ADD `customerPhone` varchar(64);--> statement-breakpoint
ALTER TABLE `bookings` ADD `customerNotes` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `declineReason` text;--> statement-breakpoint
ALTER TABLE `bookings` ADD `nextAvailableDate` varchar(10);