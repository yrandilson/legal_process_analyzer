CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deadlines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`type` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`originalDate` timestamp NOT NULL,
	`calculatedDate` timestamp NOT NULL,
	`businessDaysCount` int NOT NULL,
	`status` enum('pending','notified','completed','overdue') DEFAULT 'pending',
	`urgency` enum('low','medium','high','critical') DEFAULT 'medium',
	`notificationSent` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deadlines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`processId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(50),
	`extractedText` text,
	`summary` text,
	`entities` text,
	`processedAt` timestamp,
	`status` enum('uploaded','processing','processed','failed') DEFAULT 'uploaded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deadlineId` int NOT NULL,
	`type` enum('email','in_app','both') DEFAULT 'both',
	`daysBeforeDeadline` int NOT NULL,
	`message` text,
	`emailSent` int DEFAULT 0,
	`inAppSent` int DEFAULT 0,
	`sentAt` timestamp,
	`status` enum('pending','sent','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`processNumber` varchar(50) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`court` varchar(255),
	`judge` varchar(255),
	`plaintiff` varchar(255),
	`defendant` varchar(255),
	`subject` text,
	`status` enum('active','archived','concluded') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `processes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deadlines` ADD CONSTRAINT `deadlines_processId_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `processes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_processId_processes_id_fk` FOREIGN KEY (`processId`) REFERENCES `processes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_deadlineId_deadlines_id_fk` FOREIGN KEY (`deadlineId`) REFERENCES `deadlines`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `processes` ADD CONSTRAINT `processes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;