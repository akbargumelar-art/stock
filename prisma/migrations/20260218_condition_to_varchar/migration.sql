-- Change condition column from ENUM to VARCHAR to allow free-text input
ALTER TABLE `products` MODIFY COLUMN `condition` VARCHAR(255) NULL;
