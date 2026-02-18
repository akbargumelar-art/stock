-- Add missing columns to products table
-- Run each ALTER TABLE separately to handle cases where some columns may already exist

ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `purchase_date` DATETIME(3) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `purchase_source` ENUM('ONLINE','OFFLINE') NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `purchase_link` TEXT NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `store_name` VARCHAR(255) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `store_location` VARCHAR(255) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `condition` VARCHAR(255) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `is_consumable` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `created_by` VARCHAR(36) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `cost_price` INT NOT NULL DEFAULT 0;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `qr_code` TEXT NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `image` TEXT NULL;
