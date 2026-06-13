# Issue 6 — [Feature] Implement Partner Store Management & Wallet Logic

**Status:** 🟡 Open | **Priority:** P1 | **Severity:** 🟡 Major

---

## Problem

1. Penjual tidak bisa edit profil toko setelah registrasi.
2. Tidak ada integrasi `dompet_mitra` — saat pesanan selesai, saldo penjual tidak bertambah.
3. Toko dengan `status_verifikasi = "pending"` masih bisa muncul di katalog buyer (filter di `store.service.ts` `getAllStores` di-comment).

---

## Task Requirements

### 1. Partner Profile (`src/modules/partner/`)

#### Schema
File: `src/modules/partner/partner.schema.ts`
```ts
import { z } from 'zod';

export const updateStoreSchema = z.object({
  nama_toko: z.string().min(3).optional(),
  deskripsi_toko: z.string().optional(),
  jam_oprasional: z.string().optional(),
  status_toko: z.enum(['OPEN', 'CLOSED']).optional(),
  alamat_toko: z.string().min(5).optional(),
});
```

#### Service
```ts
export const partnerService = {
  async getProfile(sellerId: number) {},
  async updateProfile(sellerId: number, data) {},
};
```

#### Routes
```ts
router.get('/profile', jwtMiddleware, getProfile);
router.patch('/profile', jwtMiddleware, updateProfile);
```

Mount di `/api/seller` di `app.ts`.

### 2. Wallet Logic — `confirmOrder`

File: `src/modules/order/buyer.order.service.ts` → fungsi `confirmOrder`

Setelah pesanan confirmed (delivered → completed) dan pembayaran di-set paid, tambahkan:

```ts
// Gunakan prisma.$transaction
await prisma.$transaction(async (tx) => {
  // 1. Update status pesanan → completed
  // 2. Update pembayaran → paid
  // 3. Hitung total_harga pesanan (dari DB)
  // 4. Upsert dompet_mitra — tambah saldo
  const wallet = await tx.dompet_mitra.upsert({
    where: { mitra_id: order.mitra_id },
    update: { saldo: { increment: totalHarga } },
    create: { mitra_id: order.mitra_id, saldo: totalHarga, status_dompet: 'active' },
  });
  // 5. Catat riwayat_dompet
  await tx.riwayat_dompet.create({
    data: {
      id_dompet: wallet.id_dompet,
      jenis_transaksi: 'credit',
      jumlah_diterima: totalHarga,
      deskripsi_transaksi: `Pembayaran pesanan #${orderId}`,
      waktu_transaksi: new Date(),
    },
  });
});
```

### 3. Filter Toko Pending

File: `src/modules/store/store.service.ts` → `getAllStores`

Tambah filter:
```ts
where: {
  status_verifikasi: 'approved',
  status_toko: 'OPEN',
}
```

Hal yang sama untuk `searchStores`, `getStoresByCategory`, `getPopularStores`, `getStoreRecommendations`, `getStoreProducts` — pastikan semua filter toko yang approved + open.

---

## Acceptance Criteria

- [ ] Penjual bisa lihat + update profil toko (`status_toko: OPEN/CLOSED`)
- [ ] Setiap pesanan completed → saldo dompet_mitra penjual bertambah + histori tercatat
- [ ] Payment `paid` otomatis saat `confirmOrder` (atau dari modul payment)
- [ ] Toko pending tidak muncul di katalog buyer
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `src/modules/partner/partner.schema.ts` | **NEW** |
| `src/modules/partner/partner.service.ts` | **NEW** |
| `src/modules/partner/partner.controller.ts` | **NEW** |
| `src/modules/partner/partner.routes.ts` | **NEW** |
| `src/modules/order/buyer.order.service.ts` | Tambah wallet logic di `confirmOrder` |
| `src/modules/store/store.service.ts` | Tambah filter `status_verifikasi: approved` |
| `src/app.ts` | Mount partner routes |

---

## Note

Schema DB `dompet_mitra` tidak punya constraint unique di `mitra_id`. Prisma `upsert` butuh unique constraint. **Perlu migration:**
```prisma
@@unique([mitra_id], map: "mitra_id_unique")
```

Atau lakukan manual: cek dulu `findFirst`, lalu `update` atau `create`.

---

## Related Issues

- #4 (Payment module — setelah payment confirmed, trigger wallet)
- #15 di `issue.md` (admin verification flow)
