-- AlterTable
ALTER TABLE `pesanan` ADD COLUMN `alamat_id` INTEGER NULL,
    ADD COLUMN `ongkir` DECIMAL(12, 2) NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `refresh_token` (
    `token_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `mitra_id` INTEGER NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `revoked_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `user_agent` VARCHAR(255) NULL,

    UNIQUE INDEX `refresh_token_token_hash_key`(`token_hash`),
    INDEX `refresh_token_user_idx`(`user_id`),
    INDEX `refresh_token_mitra_idx`(`mitra_id`),
    INDEX `refresh_token_exp_idx`(`expires_at`),
    PRIMARY KEY (`token_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alamat` (
    `alamat_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `label` VARCHAR(50) NOT NULL,
    `alamat_lengkap` TEXT NOT NULL,
    `catatan` TEXT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `alamat_user_idx`(`user_id`),
    INDEX `alamat_user_primary_idx`(`user_id`, `is_primary`),
    PRIMARY KEY (`alamat_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `pesanan_alamat_idx` ON `pesanan`(`alamat_id`);

-- AddForeignKey
ALTER TABLE `pesanan` ADD CONSTRAINT `pesanan_alamat_fk` FOREIGN KEY (`alamat_id`) REFERENCES `alamat`(`alamat_id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `refresh_token` ADD CONSTRAINT `refresh_token_user_fk` FOREIGN KEY (`user_id`) REFERENCES `pembeli`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `refresh_token` ADD CONSTRAINT `refresh_token_mitra_fk` FOREIGN KEY (`mitra_id`) REFERENCES `penjual`(`mitra_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `alamat` ADD CONSTRAINT `alamat_user_fk` FOREIGN KEY (`user_id`) REFERENCES `pembeli`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;
