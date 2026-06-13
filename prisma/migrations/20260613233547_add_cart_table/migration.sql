-- CreateTable
CREATE TABLE `cart` (
    `cart_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `produk_id` INTEGER NULL,
    `layanan_id` INTEGER NULL,
    `jumlah` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `cart_user_id_fkey`(`user_id`),
    INDEX `cart_produk_id_fkey`(`produk_id`),
    INDEX `cart_layanan_id_fkey`(`layanan_id`),
    UNIQUE INDEX `cart_user_produk_unique`(`user_id`, `produk_id`),
    UNIQUE INDEX `cart_user_layanan_unique`(`user_id`, `layanan_id`),
    PRIMARY KEY (`cart_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `pembeli`(`user_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`produk_id`) REFERENCES `produk`(`produk_id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_ibfk_3` FOREIGN KEY (`layanan_id`) REFERENCES `layanan`(`layanan_id`) ON DELETE CASCADE ON UPDATE RESTRICT;
