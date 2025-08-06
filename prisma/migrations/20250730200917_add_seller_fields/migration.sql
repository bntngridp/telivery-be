-- AlterTable
ALTER TABLE `penjual` ADD COLUMN `alamat_toko` TEXT NULL,
    ADD COLUMN `email` VARCHAR(100) NULL,
    ADD COLUMN `foto_ktp_pemilik` TEXT NULL,
    ADD COLUMN `foto_pemilik` TEXT NULL,
    ADD COLUMN `jenis_usaha` VARCHAR(50) NULL,
    ADD COLUMN `password` VARCHAR(255) NULL,
    ADD COLUMN `phone_number` VARCHAR(20) NULL,
    ADD COLUMN `status_verifikasi` VARCHAR(50) NULL;
