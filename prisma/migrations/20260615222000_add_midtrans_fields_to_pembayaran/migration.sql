-- AlterTable
ALTER TABLE `pembayaran`
  ADD COLUMN `midtrans_order_id` VARCHAR(100) NULL,
  ADD COLUMN `snap_token` TEXT NULL,
  ADD COLUMN `payment_type` VARCHAR(50) NULL,
  ADD COLUMN `paid_at` DATETIME(0) NULL,
  ADD COLUMN `midtrans_response` JSON NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pembayaran_midtrans_order_id_key` ON `pembayaran`(`midtrans_order_id`);
CREATE INDEX `pembayaran_status_pembayaran_idx` ON `pembayaran`(`status_pembayaran`);
