-- AlterTable
ALTER TABLE `pembayaran` ADD COLUMN `bukti_bayar` TEXT NULL,
    ADD COLUMN `catatan_penjual` TEXT NULL;

-- RenameIndex
ALTER TABLE `pembayaran` RENAME INDEX `pesanan_id` TO `pembayaran_pesanan_id_fkey`;
