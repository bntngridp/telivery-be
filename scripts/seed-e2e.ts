import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main() {
    // CLEAN
    await prisma.cart.deleteMany({});
    await prisma.notifikasi.deleteMany({});
    await prisma.riwayat_dompet.deleteMany({});
    await prisma.dompet_mitra.deleteMany({});
    await prisma.pembayaran.deleteMany({});
    await prisma.pesanan.deleteMany({});
    await prisma.detail_pesanan_produk.deleteMany({});
    await prisma.detail_pesanan_layanan.deleteMany({});
    await prisma.produk.deleteMany({});
    await prisma.kategori.deleteMany({});
    await prisma.layanan.deleteMany({});
    await prisma.pembeli.deleteMany({});
    await prisma.penjual.deleteMany({});
    await prisma.otp_verify.deleteMany({});
    await prisma.ulasan.deleteMany({});

    // BUYER
    const buyerA = await prisma.pembeli.create({
        data: {
            full_name: 'Budi Santoso',
            phone_number: '081111111111',
            email: 'budi@test.com',
            domicile: 'Jakarta',
            faculty: 'FTI',
            major: 'Teknik Informatika',
            delivery_address: 'Jl. Test No. 1, Jakarta',
            birth_date: new Date('2000-05-15'),
        },
    });
    const buyerB = await prisma.pembeli.create({
        data: {
            full_name: 'Siti Aminah',
            phone_number: '082222222222',
            email: 'siti@test.com',
            delivery_address: 'Jl. Test No. 2',
        },
    });

    // SELLERS
    const sellerA = await prisma.penjual.create({
        data: {
            nama_pemilik: 'Andi A',
            nama_toko: 'Toko A',
            email: 'a@test.com',
            password: await bcrypt.hash('password123', 10),
            phone_number: '083333333333',
            status_verifikasi: 'approved',
            status_toko: 'OPEN',
            verifikasi_toko: true,
            jenis_usaha: 'makanan',
            alamat_toko: 'Jl. Toko A',
            deskripsi_toko: 'Restoran terlengkap',
            jam_oprasional: '08:00 - 22:00',
        },
    });
    const sellerB = await prisma.penjual.create({
        data: {
            nama_pemilik: 'Budi B',
            nama_toko: 'Toko B Pending',
            email: 'b@test.com',
            password: await bcrypt.hash('password123', 10),
            phone_number: '084444444444',
            status_verifikasi: 'pending',
            status_toko: 'CLOSED',
            verifikasi_toko: false,
            jenis_usaha: 'laundry',
            alamat_toko: 'Jl. Toko B',
        },
    });
    const sellerC = await prisma.penjual.create({
        data: {
            nama_pemilik: 'Citra C',
            nama_toko: 'Toko C Approved-OPEN',
            email: 'c@test.com',
            password: await bcrypt.hash('password123', 10),
            phone_number: '085555555555',
            status_verifikasi: 'approved',
            status_toko: 'OPEN',
            verifikasi_toko: true,
            jenis_usaha: 'air_galon',
            alamat_toko: 'Jl. Toko C',
        },
    });

    // KATEGORI
    const kategori = await prisma.kategori.create({
        data: { nama_kategori: 'MAKANAN_MINUMAN', deskripsi_kategori: 'Makanan & minuman' },
    });
    const kategoriAir = await prisma.kategori.create({
        data: { nama_kategori: 'AIR_GALON', deskripsi_kategori: 'Air galon' },
    });
    const kategoriLaundry = await prisma.kategori.create({
        data: { nama_kategori: 'LAUNDRY', deskripsi_kategori: 'Layanan laundry' },
    });
    void kategoriAir; void kategoriLaundry;

    // PRODUKS for A
    const produk1 = await prisma.produk.create({
        data: {
            nama_produk: 'Nasi Goreng',
            harga: '15000',
            stok_produk: 100,
            status_ketersediaan: true,
            mitra_id: sellerA.mitra_id,
            id_kategori: kategori.id_kategori,
        },
    });
    const produk2 = await prisma.produk.create({
        data: {
            nama_produk: 'Es Teh Manis',
            harga: '5000',
            stok_produk: 100,
            status_ketersediaan: true,
            mitra_id: sellerA.mitra_id,
        },
    });

    // PRODUKS for C
    const produkC = await prisma.produk.create({
        data: {
            nama_produk: 'Galon Aqua',
            harga: '20000',
            stok_produk: 50,
            status_ketersediaan: true,
            mitra_id: sellerC.mitra_id,
            id_kategori: kategoriAir.id_kategori,
        },
    });
    void produkC;

    // LAYANAN for A
    const layananA = await prisma.layanan.create({
        data: {
            nama_layanan: 'Paket Nasi Box',
            harga: '25000',
            jenis_layanan: 'catering',
            estimasi_durasi: '1',
            catatan: 'Minimal order 5 box',
            mitra_id: sellerA.mitra_id,
        },
    });

    // PRE-EXISTING NOTIFIKASI for buyerA (test unread count)
    await prisma.notifikasi.createMany({
        data: [
            {
                user_id: buyerA.user_id,
                isi_pesan: 'Selamat datang di Cheva-Telivery',
                waktu_kirim: new Date(Date.now() - 86400_000),
                tipe: 'order_accepted',
                status_dibaca: true,
            },
            {
                user_id: buyerA.user_id,
                isi_pesan: 'Pesanan #1 sedang diantar',
                waktu_kirim: new Date(Date.now() - 3600_000),
                tipe: 'order_delivered',
                status_dibaca: false,
            },
            {
                user_id: buyerA.user_id,
                isi_pesan: 'Pesanan #1 selesai',
                waktu_kirim: new Date(Date.now() - 1800_000),
                tipe: 'order_completed',
                status_dibaca: false,
            },
        ],
    });

    // PRE-EXISTING NOTIFIKASI for sellerA
    await prisma.notifikasi.createMany({
        data: [
            {
                mitra_id: sellerA.mitra_id,
                isi_pesan: 'Pesanan baru masuk',
                waktu_kirim: new Date(Date.now() - 7200_000),
                tipe: 'new_order',
                status_dibaca: false,
            },
            {
                mitra_id: sellerA.mitra_id,
                isi_pesan: 'Pesanan #1 dibatalkan',
                waktu_kirim: new Date(Date.now() - 1800_000),
                tipe: 'order_canceled',
                status_dibaca: false,
            },
        ],
    });

    // TOKENS
    const tokenBuyerA = jwt.sign(
        { id: buyerA.user_id, role: 'pembeli' },
        process.env.JWT_SECRET ?? 'dev',
        { expiresIn: '1d' },
    );
    const tokenBuyerB = jwt.sign(
        { id: buyerB.user_id, role: 'pembeli' },
        process.env.JWT_SECRET ?? 'dev',
        { expiresIn: '1d' },
    );
    const tokenSellerA = jwt.sign(
        { sellerId: sellerA.mitra_id, role: 'penjual' },
        process.env.JWT_SECRET ?? 'dev',
        { expiresIn: '7d' },
    );
    const tokenSellerB = jwt.sign(
        { sellerId: sellerB.mitra_id, role: 'penjual' },
        process.env.JWT_SECRET ?? 'dev',
        { expiresIn: '7d' },
    );
    const tokenAdmin = jwt.sign(
        { adminId: -1, role: 'admin' },
        process.env.JWT_SECRET ?? 'dev',
        { expiresIn: '1d' },
    );

    console.log('SEEDED:');
    console.log('  buyerA.user_id     =', buyerA.user_id);
    console.log('  buyerB.user_id     =', buyerB.user_id);
    console.log('  sellerA.mitra_id   =', sellerA.mitra_id, '(Toko A: approved+OPEN)');
    console.log('  sellerB.mitra_id   =', sellerB.mitra_id, '(Toko B: pending+CLOSED)');
    console.log('  sellerC.mitra_id   =', sellerC.mitra_id, '(Toko C: approved+OPEN)');
    console.log('  produk1.produk_id  =', produk1.produk_id, '(Nasi Goreng @15000, A)');
    console.log('  produk2.produk_id  =', produk2.produk_id, '(Es Teh @5000, A)');
    console.log('  produkC.produk_id  =', produkC.produk_id, '(Galon @20000, C)');
    console.log('  layananA.layanan_id=', layananA.layanan_id, '(Paket Nasi Box @25000, A)');
    console.log('');
    console.log('TOKENS:');
    console.log('  BUYER_A_TOKEN=' + tokenBuyerA);
    console.log('  BUYER_B_TOKEN=' + tokenBuyerB);
    console.log('  SELLER_A_TOKEN=' + tokenSellerA);
    console.log('  SELLER_B_TOKEN=' + tokenSellerB);
    console.log('  ADMIN_TOKEN=' + tokenAdmin);
    console.log('');
    console.log('Admin env creds: bntngrid@gmail.com / admin123');
    console.log('Seller A login: a@test.com / password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
