-- CreateTable
CREATE TABLE `detail_pesanan_layanan` (
    `id_detail` INTEGER NOT NULL AUTO_INCREMENT,
    `pesanan_id` INTEGER NULL,
    `layanan_id` INTEGER NULL,
    `jumlah_item` INTEGER NULL,
    `subtotal` DECIMAL(12, 2) NULL,

    INDEX `layanan_id`(`layanan_id`),
    UNIQUE INDEX `pesanan_id`(`pesanan_id`, `layanan_id`),
    PRIMARY KEY (`id_detail`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_pesanan_produk` (
    `id_detail` INTEGER NOT NULL AUTO_INCREMENT,
    `pesanan_id` INTEGER NULL,
    `produk_id` INTEGER NULL,
    `jumlah_item` INTEGER NULL,
    `subtotal` DECIMAL(12, 2) NULL,

    INDEX `produk_id`(`produk_id`),
    UNIQUE INDEX `pesanan_id`(`pesanan_id`, `produk_id`),
    PRIMARY KEY (`id_detail`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dompet_mitra` (
    `id_dompet` INTEGER NOT NULL AUTO_INCREMENT,
    `mitra_id` INTEGER NULL,
    `saldo` DECIMAL(12, 2) NULL,
    `status_dompet` VARCHAR(50) NULL,
    `tanggal_dibuat` DATETIME(0) NULL,
    `tanggal_diubah` DATETIME(0) NULL,

    INDEX `mitra_id`(`mitra_id`),
    PRIMARY KEY (`id_dompet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kategori` (
    `id_kategori` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_kategori` VARCHAR(100) NULL,
    `deskripsi_kategori` TEXT NULL,

    UNIQUE INDEX `nama_kategori`(`nama_kategori`),
    PRIMARY KEY (`id_kategori`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `layanan` (
    `layanan_id` INTEGER NOT NULL AUTO_INCREMENT,
    `mitra_id` INTEGER NULL,
    `nama_layanan` VARCHAR(100) NULL,
    `harga` DECIMAL(12, 2) NULL,
    `jenis_layanan` VARCHAR(100) NULL,
    `estimasi_durasi` VARCHAR(50) NULL,
    `catatan` TEXT NULL,

    INDEX `mitra_id`(`mitra_id`),
    PRIMARY KEY (`layanan_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifikasi` (
    `notifikasi_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `mitra_id` INTEGER NULL,
    `isi_pesan` TEXT NULL,
    `waktu_kirim` DATETIME(0) NULL,
    `tipe` VARCHAR(50) NULL,
    `status_dibaca` BOOLEAN NULL,

    INDEX `mitra_id`(`mitra_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`notifikasi_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembayaran` (
    `pembayaran_id` INTEGER NOT NULL AUTO_INCREMENT,
    `pesanan_id` INTEGER NULL,
    `status_pembayaran` VARCHAR(50) NULL,
    `metode_pembayaran` VARCHAR(50) NULL,
    `waktu_pembayaran` DATETIME(0) NULL,

    INDEX `pesanan_id`(`pesanan_id`),
    PRIMARY KEY (`pembayaran_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembeli` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NULL,
    `nomer_hp` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `alamat_pengiriman` TEXT NULL,
    `password` VARCHAR(255) NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penjual` (
    `mitra_id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama_pemilik` VARCHAR(100) NULL,
    `nama_toko` VARCHAR(100) NULL,
    `deskripsi_toko` TEXT NULL,
    `jam_oprasional` VARCHAR(50) NULL,
    `verifikasi_toko` BOOLEAN NULL,
    `status_toko` VARCHAR(50) NULL,
    `role_penjual` VARCHAR(50) NULL,
    `waktu_dibuat` DATETIME(0) NULL,

    UNIQUE INDEX `nama_toko`(`nama_toko`),
    PRIMARY KEY (`mitra_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pesanan` (
    `pesanan_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `mitra_id` INTEGER NULL,
    `total_harga` DECIMAL(12, 2) NULL,
    `alamat_pengiriman` TEXT NULL,
    `status_pesanan` VARCHAR(50) NULL,
    `metode_pembayaran` VARCHAR(50) NULL,
    `waktu_pesan` DATETIME(0) NULL,
    `waktu_dikirim` DATETIME(0) NULL,
    `waktu_diterima` DATETIME(0) NULL,

    INDEX `mitra_id`(`mitra_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`pesanan_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produk` (
    `produk_id` INTEGER NOT NULL AUTO_INCREMENT,
    `mitra_id` INTEGER NULL,
    `id_kategori` INTEGER NULL,
    `nama_produk` VARCHAR(100) NULL,
    `harga` DECIMAL(12, 2) NULL,
    `foto` TEXT NULL,
    `status_ketersediaan` BOOLEAN NULL,
    `stok_produk` INTEGER NULL,

    INDEX `id_kategori`(`id_kategori`),
    INDEX `mitra_id`(`mitra_id`),
    PRIMARY KEY (`produk_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_dompet` (
    `id_transaksi` INTEGER NOT NULL AUTO_INCREMENT,
    `id_dompet` INTEGER NULL,
    `jenis_transaksi` VARCHAR(50) NULL,
    `jumlah_diterima` DECIMAL(12, 2) NULL,
    `deskripsi_transaksi` TEXT NULL,
    `waktu_transaksi` DATETIME(0) NULL,

    INDEX `id_dompet`(`id_dompet`),
    PRIMARY KEY (`id_transaksi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ulasan` (
    `id_ulasan` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pesanan` INTEGER NULL,
    `rating` INTEGER NULL,
    `komentar` TEXT NULL,
    `waktu_ulasan` DATETIME(0) NULL,

    INDEX `id_pesanan`(`id_pesanan`),
    PRIMARY KEY (`id_ulasan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `detail_pesanan_layanan` ADD CONSTRAINT `detail_pesanan_layanan_ibfk_1` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan`(`pesanan_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `detail_pesanan_layanan` ADD CONSTRAINT `detail_pesanan_layanan_ibfk_2` FOREIGN KEY (`layanan_id`) REFERENCES `layanan`(`layanan_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `detail_pesanan_produk` ADD CONSTRAINT `detail_pesanan_produk_ibfk_1` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan`(`pesanan_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `detail_pesanan_produk` ADD CONSTRAINT `detail_pesanan_produk_ibfk_2` FOREIGN KEY (`produk_id`) REFERENCES `produk`(`produk_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `dompet_mitra` ADD CONSTRAINT `dompet_mitra_ibfk_1` FOREIGN KEY (`mitra_id`) REFERENCES `penjual`(`mitra_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `layanan` ADD CONSTRAINT `layanan_ibfk_1` FOREIGN KEY (`mitra_id`) REFERENCES `penjual`(`mitra_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `pembeli`(`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_ibfk_2` FOREIGN KEY (`mitra_id`) REFERENCES `penjual`(`mitra_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pembayaran` ADD CONSTRAINT `pembayaran_ibfk_1` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan`(`pesanan_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pesanan` ADD CONSTRAINT `pesanan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `pembeli`(`user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pesanan` ADD CONSTRAINT `pesanan_ibfk_2` FOREIGN KEY (`mitra_id`) REFERENCES `penjual`(`mitra_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `produk` ADD CONSTRAINT `produk_ibfk_1` FOREIGN KEY (`mitra_id`) REFERENCES `penjual`(`mitra_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `produk` ADD CONSTRAINT `produk_ibfk_2` FOREIGN KEY (`id_kategori`) REFERENCES `kategori`(`id_kategori`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `riwayat_dompet` ADD CONSTRAINT `riwayat_dompet_ibfk_1` FOREIGN KEY (`id_dompet`) REFERENCES `dompet_mitra`(`id_dompet`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ulasan` ADD CONSTRAINT `ulasan_ibfk_1` FOREIGN KEY (`id_pesanan`) REFERENCES `pesanan`(`pesanan_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
