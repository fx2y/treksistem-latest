CREATE TABLE `driver_services` (
	`driver_id` text NOT NULL,
	`service_id` text NOT NULL,
	PRIMARY KEY(`driver_id`, `service_id`),
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` text PRIMARY KEY NOT NULL,
	`mitra_id` text NOT NULL,
	`identifier` text NOT NULL,
	`name` text,
	`config_json` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`mitra_id`) REFERENCES `mitras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mitras` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`event_type` text NOT NULL,
	`data_json` text,
	`actor_type` text,
	`actor_id` text,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`mitra_id` text NOT NULL,
	`driver_id` text,
	`orderer_identifier` text NOT NULL,
	`receiver_wa_number` text,
	`details_json` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`estimated_cost` real,
	`final_cost` real,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`scheduled_at` integer,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`mitra_id`) REFERENCES `mitras`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`mitra_id` text NOT NULL,
	`name` text NOT NULL,
	`service_type_key` text NOT NULL,
	`config_json` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`mitra_id`) REFERENCES `mitras`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `driver_services_service_id_idx` ON `driver_services` (`service_id`);--> statement-breakpoint
CREATE INDEX `drivers_mitra_id_identifier_idx` ON `drivers` (`mitra_id`,`identifier`);--> statement-breakpoint
CREATE INDEX `drivers_active_idx` ON `drivers` (`is_active`);--> statement-breakpoint
CREATE UNIQUE INDEX `mitras_owner_user_id_unique` ON `mitras` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `order_events_order_id_timestamp_idx` ON `order_events` (`order_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `order_events_event_type_idx` ON `order_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `order_events_actor_idx` ON `order_events` (`actor_type`,`actor_id`);--> statement-breakpoint
CREATE INDEX `orders_service_id_idx` ON `orders` (`service_id`);--> statement-breakpoint
CREATE INDEX `orders_mitra_id_idx` ON `orders` (`mitra_id`);--> statement-breakpoint
CREATE INDEX `orders_driver_id_idx` ON `orders` (`driver_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `orders_orderer_idx` ON `orders` (`orderer_identifier`);--> statement-breakpoint
CREATE INDEX `orders_scheduled_at_idx` ON `orders` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `services_mitra_id_idx` ON `services` (`mitra_id`);--> statement-breakpoint
CREATE INDEX `services_service_type_idx` ON `services` (`service_type_key`);--> statement-breakpoint
CREATE INDEX `services_active_idx` ON `services` (`is_active`);