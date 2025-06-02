CREATE TABLE `master_service_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`applies_to_service_type_key` text NOT NULL,
	`config_json` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `master_templates_service_type_idx` ON `master_service_templates` (`applies_to_service_type_key`);--> statement-breakpoint
CREATE INDEX `master_templates_sort_order_idx` ON `master_service_templates` (`sort_order`);