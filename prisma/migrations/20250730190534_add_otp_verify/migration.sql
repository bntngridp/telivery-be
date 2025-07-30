/*
  Warnings:

  - You are about to drop the `otperify` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `otperify`;

-- CreateTable
CREATE TABLE `otp_verify` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(20) NOT NULL,
    `otp` VARCHAR(5) NOT NULL,
    `expiredAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
