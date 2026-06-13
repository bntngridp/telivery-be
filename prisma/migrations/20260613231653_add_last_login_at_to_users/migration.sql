-- AlterTable
ALTER TABLE `pembeli` ADD COLUMN `last_login_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `penjual` ADD COLUMN `last_login_at` DATETIME(0) NULL;
