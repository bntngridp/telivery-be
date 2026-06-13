# Issue 7 — [Feature] Implement Services (Layanan) Module

**Status:** 🟡 Open | **Priority:** P3 | **Severity:** 🟠 Minor

---

## Problem

Tabel `layanan` (jasa) dan `detail_pesanan_layanan` sudah ada di schema Prisma. Tapi:
1. Belum ada endpoint CRUD untuk `layanan`
2. `createOrder` di buyer order service tidak support layanan

---

## Task Requirements

### 1. Service Module (`src/modules/service/`)

#### 1a. Schema (`src/modules/service/service.schema.ts`)
```ts
import { z } from 'zod';

export const createServiceSchema = z.object({
  nama_layanan: z.string().min(1),
  harga: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().positive()),
  jenis_layanan: z.string().min(1),
  estimasi_durasi: z.string().optional(),
  catatan: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();
```

#### 1b. Service (`src/modules/service/service.service.ts`)
```ts
export const serviceService = {
  async create(sellerId: number, data) {},
  async listBySeller(sellerId: number) {},
  async findById(id: number, sellerId: number) {},
  async update(id: number, sellerId: number, data) {},
  async delete(id: number, sellerId: number) {},
  async listByStore(storeId: number) {},       // Untuk buyer
};
```

#### 1c. Controller + Routes

**Seller:**
- `POST /api/service/seller` (JWT seller) — create
- `GET /api/service/seller` (JWT seller) — list
- `GET /api/service/seller/:id` (JWT seller) — detail
- `PUT /api/service/seller/:id` (JWT seller) — update
- `DELETE /api/service/seller/:id` (JWT seller) — delete

**Buyer:**
- `GET /api/service/buyer/store/:storeId` — list layanan toko tertentu

### 2. Order Logic — Support Layanan

File: `src/modules/order/buyer.order.service.ts` → `createOrder`

Tambahkan dukungan field `id_layanan` di input schema:

```ts
export const createOrderSchema = z.object({
  id_produk: z.array(z.object({
    produk_id: z.number(),
    jumlah: z.number().min(1),
  })).optional().default([]),
  id_layanan: z.array(z.object({
    layanan_id: z.number(),
    jumlah: z.number().min(1),
  })).optional().default([]),
  alamat_pengiriman: z.string().min(5),
  metode_pembayaran: z.enum(['cash', 'transfer', 'e-wallet']),
  catatan: z.string().optional(),
});
```

Di service `createOrder`:
1. Validasi produk (existing logic)
2. Validasi layanan — cek layanan_id valid
3. Group by toko (produk + layanan dalam 1 toko di-merge) — ATAU buat pesanan terpisah untuk layanan
4. Buat `detail_pesanan_layanan` selain `detail_pesanan_produk`
5. Hitung subtotal untuk masing-masing

---

## Acceptance Criteria

- [ ] Seller bisa CRUD layanan
- [ ] Buyer bisa lihat layanan toko tertentu
- [ ] `createOrder` bisa handle mix produk + layanan
- [ ] Total harga pesanan mencakup produk + layanan
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `src/modules/service/service.schema.ts` | **NEW** |
| `src/modules/service/service.service.ts` | **NEW** |
| `src/modules/service/service.controller.ts` | **NEW** |
| `src/modules/service/service.routes.ts` | **NEW** |
| `src/modules/order/buyer.order.schema.ts` | Tambah `id_layanan` di `createOrderSchema` |
| `src/modules/order/buyer.order.service.ts` | Handle layanan di `createOrder` |
| `src/app.ts` | Mount service routes |

---

## Related Issues

- #19 di `issue.md`
- #6 (Partner store management)
