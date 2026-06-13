import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

const main = async () => {
  const r = await p.$queryRaw<{ ok: number; db: string; u: string; v: string }[]>`
    SELECT 1 AS ok, DATABASE() AS db, USER() AS u, VERSION() AS v
  `;
  console.log('PRISMA OK');
  console.log(r[0]);

  const counts = {
    pembeli:    await p.pembeli.count(),
    penjual:    await p.penjual.count(),
    produk:     await p.produk.count(),
    pesanan:    await p.pesanan.count(),
    kategori:   await p.kategori.count(),
    layanan:    await p.layanan.count(),
    notifikasi: await p.notifikasi.count(),
  };
  console.log('COUNTS', counts);

  await p.$disconnect();
  console.log('DISCONNECTED');
};

main().catch((e) => {
  console.log('FAIL', e.code || '', e.message);
  process.exit(1);
});
