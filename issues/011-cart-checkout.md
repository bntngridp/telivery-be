# Issue 11 — [Feature] Implement Cart + Checkout Module

**Status:** 🟡 Open | **Priority:** P2 | **Severity:** 🟡 Major

---

## Context

Modul `cart/` dan `checkout/` masih 0-byte stub. Saat ini buyer langsung `POST /api/buyer/orders` dengan payload `id_produk` + `id_layanan` — tanpa ada "keranjang" temporer.

**Cart** berfungsi sebagai staging: buyer bisa tambahkan produk/layanan dari multiple toko, lihat total, edit qty, hapus, baru `checkout` untuk konversi ke `pesanan`.

**Checkout** adalah endpoint final yang:
1. Validasi ulang stok (race condition guard)
2. Validasi ulang toko buka + approved
3. Konversi cart items → orders (re-use logic dari `buyer.order.service.createOrder`)
4. Kosongkan cart

**Pendekatan DB:** Simpan cart sebagai baris-baris di tabel `cart` (FK ke `pembeli`, `produk`, `layanan`). Lebih sederhana daripada JSON blob. Boleh ada banyak cart aktif per user (1 per toko) atau 1 cart global — pilih **1 cart global per user** untuk simplicity.

**Skema DB baru dibutuhkan:**
- Tabel `cart` (id, user_id FK, produk_id FK nullable, layanan_id FK nullable, jumlah, created_at)
- Unique constraint: `(user_id, produk_id)` + `(user_id, layanan_id)`

---

## Objective

1. **Cart Module** — endpoint untuk manage keranjang (tambah, list, update qty, hapus item, kosongkan)
2. **Checkout Module** — endpoint yang commit cart → order, kosongkan cart, return list pesanan

---

## Task Requirements

### Step 1 — DB Migration: Tabel `cart`

File: `prisma/schema.prisma`

Tambah model:

```prisma
model cart {
  cart_id    Int       @id @default(autoincrement())
  user_id    Int
  produk_id  Int?
  layanan_id Int?
  jumlah     Int
  created_at DateTime  @default(now()) @db.DateTime(0)
  updated_at DateTime  @updatedAt @db.DateTime(0)

  pembeli  pembeli?  @relation(fields: [user_id], references: [user_id], onDelete: Cascade, onUpdate: Restrict, map: "cart_ibfk_1")
  produk   produk?   @relation(fields: [produk_id], references: [produk_id], onDelete: Cascade, onUpdate: Restrict, map: "cart_ibfk_2")
  layanan  layanan?  @relation(fields: [layanan_id], references: [layanan_id], onDelete: Cascade, onUpdate: Restrict, map: "cart_ibfk_3")

  @@unique([user_id, produk_id], map: "cart_user_produk_unique")
  @@unique([user_id, layanan_id], map: "cart_user_layanan_unique")
  @@index([user_id], map: "cart_user_id_fkey")
  @@index([produk_id], map: "cart_produk_id_fkey")
  @@index([layanan_id], map: "cart_layanan_id_fkey")
}
```

Tambah juga relasi balik di `pembeli`, `produk`, `layanan` (sisipkan `cart cart[]`).

Generate migration:
```bash
npx prisma migrate dev --name add_cart_table
```

### Step 2 — Cart Schema (`src/modules/cart/cart.schema.ts`)

```ts
import { z } from 'zod';

export const addCartItemSchema = z
    .object({
        produkId: z.number().int().positive().optional(),
        layananId: z.number().int().positive().optional(),
        jumlah: z.number().int().min(1, 'Jumlah minimal 1'),
    })
    .refine((data) => Boolean(data.produkId) !== Boolean(data.layananId), {
        message: 'Harus menyertakan produkId ATAU layananId, tidak keduanya',
    });

export const updateCartItemSchema = z.object({
    jumlah: z.number().int().min(1, 'Jumlah minimal 1'),
});

export const cartItemIdParamSchema = z.object({
    id: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
        message: 'ID item cart tidak valid',
    }),
});

export type AddCartItemDto = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;
```

### Step 3 — Cart Service (`src/modules/cart/cart.service.ts`)

```ts
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AddCartItemDto, UpdateCartItemDto } from './cart.schema';
import { APPROVED_OPEN_FILTER } from '../store/store.service';

export const cartService = {
    async addItem(userId: number, data: AddCartItemDto) {
        if (data.produkId) {
            // Validate produk exists + available + toko approved+open
            const produk = await prisma.produk.findFirst({
                where: { produk_id: data.produkId, status_ketersediaan: true, stok_produk: { gt: 0 } },
                include: { penjual: { select: { mitra_id: true, status_toko: true, status_verifikasi: true } } },
            });
            if (!produk) throw new BadRequestError('Produk tidak tersedia');
            if (produk.penjual.status_verifikasi !== 'approved' || produk.penjual.status_toko !== 'OPEN') {
                throw new BadRequestError('Toko belum buka atau belum diverifikasi');
            }

            // Upsert: jika sudah ada, increment jumlah
            const existing = await prisma.cart.findUnique({
                where: { cart_user_produk_unique: { user_id: userId, produk_id: data.produkId } },
            });
            if (existing) {
                return prisma.cart.update({
                    where: { cart_id: existing.cart_id },
                    data: { jumlah: existing.jumlah + data.jumlah },
                });
            }
            return prisma.cart.create({
                data: { user_id: userId, produk_id: data.produkId, jumlah: data.jumlah },
            });
        }

        if (data.layananId) {
            const layanan = await prisma.layanan.findFirst({
                where: { layanan_id: data.layananId },
                include: { penjual: { select: { mitra_id: true, status_toko: true, status_verifikasi: true } } },
            });
            if (!layanan) throw new BadRequestError('Layanan tidak ditemukan');
            if (layanan.penjual.status_verifikasi !== 'approved' || layanan.penjual.status_toko !== 'OPEN') {
                throw new BadRequestError('Toko belum buka atau belum diverifikasi');
            }

            const existing = await prisma.cart.findUnique({
                where: { cart_user_layanan_unique: { user_id: userId, layanan_id: data.layananId } },
            });
            if (existing) {
                return prisma.cart.update({
                    where: { cart_id: existing.cart_id },
                    data: { jumlah: existing.jumlah + data.jumlah },
                });
            }
            return prisma.cart.create({
                data: { user_id: userId, layanan_id: data.layananId, jumlah: data.jumlah },
            });
        }

        throw new BadRequestError('produkId atau layananId harus diisi');
    },

    async getCart(userId: number) {
        const [items, produkIds, layananIds] = await Promise.all([
            prisma.cart.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'asc' },
            }),
            prisma.cart.findMany({
                where: { user_id: userId, produk_id: { not: null } },
                select: { produk_id: true },
            }),
            prisma.cart.findMany({
                where: { user_id: userId, layanan_id: { not: null } },
                select: { layanan_id: true },
            }),
        ]);

        const [produkMap, layananMap] = await Promise.all([
            prisma.produk.findMany({
                where: { produk_id: { in: produkIds.map((i) => i.produk_id!).filter((id) => id != null) } },
                include: { penjual: { select: { nama_toko: true, mitra_id: true } } },
            }).then((rows) => new Map(rows.map((r) => [r.produk_id, r]))),
            prisma.layanan.findMany({
                where: { layanan_id: { in: layananIds.map((i) => i.layanan_id!).filter((id) => id != null) } },
                include: { penjual: { select: { nama_toko: true, mitra_id: true } } },
            }).then((rows) => new Map(rows.map((r) => [r.layanan_id, r]))),
        ]);

        const enriched = items.map((item) => {
            if (item.produk_id) {
                const p = produkMap.get(item.produk_id);
                return {
                    ...item,
                    kind: 'produk' as const,
                    detail: p ? {
                        nama: p.nama_produk,
                        harga: Number(p.harga),
                        stok: p.stok_produk,
                        foto: p.foto,
                        toko: p.penjual.nama_toko,
                        mitra_id: p.penjual.mitra_id,
                    } : null,
                    subtotal: p ? Number(p.harga) * item.jumlah : 0,
                };
            }
            if (item.layanan_id) {
                const l = layananMap.get(item.layanan_id);
                return {
                    ...item,
                    kind: 'layanan' as const,
                    detail: l ? {
                        nama: l.nama_layanan,
                        harga: Number(l.harga),
                        toko: l.penjual.nama_toko,
                        mitra_id: l.penjual.mitra_id,
                    } : null,
                    subtotal: l ? Number(l.harga) * item.jumlah : 0,
                };
            }
            return item;
        });

        const total = enriched.reduce((sum, e) => sum + (e.subtotal || 0), 0);
        const groupedByStore = enriched.reduce<Record<number, typeof enriched>>((acc, e) => {
            const key = e.detail?.mitra_id ?? 0;
            if (!acc[key]) acc[key] = [];
            acc[key].push(e);
            return acc;
        }, {});

        return {
            items: enriched,
            total,
            totalItems: items.reduce((s, i) => s + i.jumlah, 0),
            groupedByStore,
        };
    },

    async updateItemQuantity(cartId: number, userId: number, data: UpdateCartItemDto) {
        const item = await prisma.cart.findFirst({ where: { cart_id: cartId, user_id: userId } });
        if (!item) throw new NotFoundError('Item cart tidak ditemukan');
        return prisma.cart.update({
            where: { cart_id: cartId },
            data: { jumlah: data.jumlah },
        });
    },

    async removeItem(cartId: number, userId: number) {
        const item = await prisma.cart.findFirst({ where: { cart_id: cartId, user_id: userId } });
        if (!item) throw new NotFoundError('Item cart tidak ditemukan');
        await prisma.cart.delete({ where: { cart_id: cartId } });
        return { message: 'Item berhasil dihapus dari cart' };
    },

    async clearCart(userId: number) {
        const result = await prisma.cart.deleteMany({ where: { user_id: userId } });
        return { message: `${result.count} item dihapus dari cart`, count: result.count };
    },
};
```

### Step 4 — Cart Controller (`src/modules/cart/cart.controller.ts`)

```ts
import { Request, Response } from 'express';
import { cartService } from './cart.service';
import {
    addCartItemSchema,
    updateCartItemSchema,
    cartItemIdParamSchema,
} from './cart.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { success, created } from '../../utils/response';
import { UnauthorizedError } from '../../utils/errors';

function requireUserId(req: Request): number {
    const id = req.user?.id;
    if (!id) throw new UnauthorizedError('Unauthorized, silakan login sebagai pembeli');
    return id;
}

export const cartController = {
    add: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const data = addCartItemSchema.parse(req.body);
        const item = await cartService.addItem(userId, data);
        return created(res, 'Item berhasil ditambahkan ke cart', item);
    }),

    list: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const cart = await cartService.getCart(userId);
        return success(res, 'Cart berhasil diambil', cart);
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const { id } = cartItemIdParamSchema.parse(req.params);
        const data = updateCartItemSchema.parse(req.body);
        const item = await cartService.updateItemQuantity(Number(id), userId, data);
        return success(res, 'Jumlah item berhasil diupdate', item);
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const { id } = cartItemIdParamSchema.parse(req.params);
        const result = await cartService.removeItem(Number(id), userId);
        return success(res, result.message);
    }),

    clear: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const result = await cartService.clearCart(userId);
        return success(res, result.message);
    }),
};
```

### Step 5 — Cart Routes (`src/modules/cart/cart.routes.ts`)

```ts
import { Router } from 'express';
import { cartController } from './cart.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';

const router = Router();

router.use(jwtMiddleware);
router.post('/items', cartController.add);
router.get('/', cartController.list);
router.patch('/items/:id', cartController.update);
router.delete('/items/:id', cartController.remove);
router.delete('/', cartController.clear);

export default router;
```

### Step 6 — Checkout Schema (`src/modules/checkout/checkout.schema.ts`)

```ts
import { z } from 'zod';

export const checkoutSchema = z.object({
    alamat_pengiriman: z.string().min(5, 'Alamat pengiriman terlalu pendek'),
    metode_pembayaran: z.enum(['cash', 'transfer', 'e-wallet'], {
        errorMap: () => ({ message: 'Metode pembayaran tidak valid' }),
    }),
    catatan: z.string().max(500).optional(),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;
```

### Step 7 — Checkout Service (`src/modules/checkout/checkout.service.ts`)

```ts
import { prisma } from '../../config/prisma';
import { BadRequestError } from '../../utils/errors';
import { CheckoutDto } from './checkout.schema';

export const checkoutService = {
    async checkoutFromCart(userId: number, data: CheckoutDto) {
        const items = await prisma.cart.findMany({
            where: { user_id: userId },
            include: {
                produk: { include: { penjual: { select: { mitra_id: true, status_toko: true, status_verifikasi: true } } } },
                layanan: { include: { penjual: { select: { mitra_id: true, status_toko: true, status_verifikasi: true } } } },
            },
        });

        if (items.length === 0) throw new BadRequestError('Cart kosong, tidak bisa checkout');

        // Group by store
        const byStore: Record<number, typeof items> = {};
        for (const it of items) {
            const seller = it.produk?.penjual ?? it.layanan?.penjual;
            if (!seller) continue;
            if (seller.status_verifikasi !== 'approved' || seller.status_toko !== 'OPEN') {
                throw new BadRequestError(`Toko ${seller.mitra_id} sudah tutup atau belum diverifikasi`);
            }
            if (!byStore[seller.mitra_id]) byStore[seller.mitra_id] = [];
            byStore[seller.mitra_id].push(it);
        }

        // Validate stock (race condition)
        for (const it of items) {
            if (it.produk && it.produk.stok_produk !== null && it.produk.stok_produk < it.jumlah) {
                throw new BadRequestError(`Stok produk ${it.produk.nama_produk} tidak cukup`);
            }
        }

        const createdOrders: Array<{ pesanan_id: number; mitra_id: number; total: number }> = [];

        // Use transaction
        await prisma.$transaction(async (tx) => {
            for (const [storeIdStr, storeItems] of Object.entries(byStore)) {
                const storeId = Number(storeIdStr);
                let total = 0;
                for (const it of storeItems) {
                    const price = it.produk?.harga ?? it.layanan?.harga;
                    if (price) total += Number(price) * it.jumlah;
                }

                const order = await tx.pesanan.create({
                    data: {
                        user_id: userId,
                        mitra_id: storeId,
                        total_harga: total,
                        alamat_pengiriman: data.alamat_pengiriman,
                        status_pesanan: 'pending',
                        metode_pembayaran: data.metode_pembayaran,
                        waktu_pesan: new Date(),
                    },
                });

                for (const it of storeItems) {
                    const price = it.produk?.harga ?? it.layanan?.harga;
                    const subtotal = price ? Number(price) * it.jumlah : 0;
                    if (it.produk) {
                        await tx.detail_pesanan_produk.create({
                            data: {
                                pesanan_id: order.pesanan_id,
                                produk_id: it.produk_id!,
                                jumlah_item: it.jumlah,
                                subtotal,
                            },
                        });
                        await tx.produk.update({
                            where: { produk_id: it.produk_id! },
                            data: { stok_produk: { decrement: it.jumlah } },
                        });
                    } else if (it.layanan) {
                        await tx.detail_pesanan_layanan.create({
                            data: {
                                pesanan_id: order.pesanan_id,
                                layanan_id: it.layanan_id!,
                                jumlah_item: it.jumlah,
                                subtotal,
                            },
                        });
                    }
                }

                await tx.pembayaran.create({
                    data: {
                        pesanan_id: order.pesanan_id,
                        status_pembayaran: 'pending',
                        metode_pembayaran: data.metode_pembayaran,
                    },
                });

                await tx.notifikasi.create({
                    data: {
                        mitra_id: storeId,
                        isi_pesan: `Pesanan baru #${order.pesanan_id} dari cart checkout`,
                        waktu_kirim: new Date(),
                        tipe: 'new_order',
                        status_dibaca: false,
                    },
                });

                createdOrders.push({ pesanan_id: order.pesanan_id, mitra_id: storeId, total });
            }

            // Clear cart
            await tx.cart.deleteMany({ where: { user_id: userId } });
        });

        return createdOrders;
    },
};
```

### Step 8 — Checkout Controller (`src/modules/checkout/checkout.controller.ts`)

```ts
import { Request, Response } from 'express';
import { checkoutService } from './checkout.service';
import { checkoutSchema } from './checkout.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { created } from '../../utils/response';
import { UnauthorizedError } from '../../utils/errors';

function requireUserId(req: Request): number {
    const id = req.user?.id;
    if (!id) throw new UnauthorizedError('Unauthorized, silakan login sebagai pembeli');
    return id;
}

export const checkoutController = {
    checkout: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const data = checkoutSchema.parse(req.body);
        const orders = await checkoutService.checkoutFromCart(userId, data);
        return created(res, 'Checkout berhasil', orders);
    }),
};
```

### Step 9 — Checkout Routes (`src/modules/checkout/checkout.routes.ts`)

```ts
import { Router } from 'express';
import { checkoutController } from './checkout.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';

const router = Router();

router.use(jwtMiddleware);
router.post('/', checkoutController.checkout);

export default router;
```

### Step 10 — Mount di `src/app.ts`

```ts
import cartRoutes from './modules/cart/cart.routes';
import checkoutRoutes from './modules/checkout/checkout.routes';

// ... dalam mounting section:
app.use('/api/buyer/cart', cartRoutes);
app.use('/api/buyer/checkout', checkoutRoutes);
```

---

## Acceptance Criteria

- [ ] Migration `add_cart_table` sukses — tabel `cart` ada dengan semua FK
- [ ] Buyer bisa `POST /api/buyer/cart/items` dengan `produkId` atau `layananId` → cart bertambah
- [ ] Tambah item yang sama → jumlah di-upsert (incremented)
- [ ] Tambah produk dari toko yang closed/pending → 400
- [ ] Tambah produk yang stok habis → 400
- [ ] `GET /api/buyer/cart` return items enriched (nama, harga, subtotal, grouped by store, total)
- [ ] `PATCH /api/buyer/cart/items/:id` update jumlah
- [ ] `DELETE /api/buyer/cart/items/:id` hapus 1 item
- [ ] `DELETE /api/buyer/cart/` clear semua
- [ ] `POST /api/buyer/checkout` dengan cart berisi 3 item dari 2 toko → buat 2 pesanan, kosongkan cart
- [ ] Checkout validasi ulang stok — kalau produk kehabisan saat checkout → 400
- [ ] Checkout validasi toko tutup → 400
- [ ] Checkout dengan cart kosong → 400
- [ ] Setelah checkout: cart kosong, pesanan terbuat, pembayaran pending, notifikasi seller
- [ ] Seller tidak bisa akses cart/checkout (401)
- [ ] Tidak ada `new PrismaClient()` — pakai `prisma` dari config
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `prisma/schema.prisma` | + model `cart` + relasi balik di `pembeli`/`produk`/`layanan` |
| `prisma/migrations/` | Auto-generated |
| `src/modules/cart/cart.schema.ts` | **NEW** |
| `src/modules/cart/cart.service.ts` | **NEW** |
| `src/modules/cart/cart.controller.ts` | **NEW** |
| `src/modules/cart/cart.routes.ts` | **NEW** |
| `src/modules/checkout/checkout.schema.ts` | **NEW** |
| `src/modules/checkout/checkout.service.ts` | **NEW** |
| `src/modules/checkout/checkout.controller.ts` | **NEW** |
| `src/modules/checkout/checkout.routes.ts` | **NEW** |
| `src/app.ts` | Mount 2 routes |

---

## Dependencies

Tidak ada. Modul ini full internal.

---

## Related Issues

- #7 (Layanan module — cart support produk + layanan)
- #4 (Order — checkout buat pesanan, re-use pattern)
- #6 (Wallet — setelah pesanan completed, seller dapat credit otomatis)
