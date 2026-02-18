-- AlterTable: Add condition column to products table
ALTER TABLE `products` ADD COLUMN `condition` ENUM('NEW', 'USED', 'REFURBISHED') NOT NULL DEFAULT 'NEW';
