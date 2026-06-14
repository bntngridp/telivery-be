import 'dotenv/config';
import { prisma } from '../src/config/prisma';

beforeAll(async () => {
    await prisma.$connect();
});

afterAll(async () => {
    await prisma.$disconnect();
});

beforeEach(async () => {
    // Disable FK checks before truncating
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
        'cart',
        'detail_pesanan_layanan',
        'detail_pesanan_produk',
        'notifikasi',
        'riwayat_dompet',
        'dompet_mitra',
        'pembayaran',
        'pesanan',
        'produk',
        'kategori',
        'layanan',
        'pembeli',
        'penjual',
        'otp_verify',
        'ulasan',
    ];
    for (const t of tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${t}\``);
        } catch (e) {
            // Ignore — table may not exist on first run
        }
    }
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
});
