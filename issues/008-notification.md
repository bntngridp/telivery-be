# Issue 8 — [Feature] Implement Notification Module (Read + Mark as Read)

**Status:** 🟡 Open | **Priority:** P0 | **Severity:** 🔴 Critical

---

## Context

Tabel `notifikasi` di database sudah terisi otomatis data oleh service order. Setiap kali pesanan dibuat, status berubah (accept/reject/deliver), atau pembayaran dikonfirmasi — `buyer.order.service.ts`, `order.service.ts`, dan `buyer.order.service.ts` di `confirmOrder` otomatis memanggil `prisma.notifikasi.create(...)`. Tapi tidak ada endpoint untuk membaca notifikasi tersebut. Modul `src/modules/notification/` 4 file masih 0 bytes.

**Data yang sudah ada di DB:**
- `notifikasi.user_id` — target buyer (nullable, hanya terisi jika notifikasi ke pembeli)
- `notifikasi.mitra_id` — target seller (nullable, hanya terisi jika notifikasi ke penjual)
- `notifikasi.isi_pesan` — text
- `notifikasi.waktu_kirim` — timestamp
- `notifikasi.tipe` — misal `new_order`, `order_accepted`, `order_completed`, dll
- `notifikasi.status_dibaca` — boolean, default `false`

**Tipe notifikasi yang digunakan saat ini:**
| Tipe | Dibuat oleh | Target |
|---|---|---|
| `new_order` | `buyer.order.service.ts` → `createOrder` | `mitra_id` (penjual) |
| `order_completed` | `buyer.order.service.ts` → `confirmOrder` | `mitra_id` (penjual) |
| `order_accepted` | `order.service.ts` → `acceptOrder` | `user_id` (pembeli) |
| `order_rejected` | `order.service.ts` → `rejectOrder` | `user_id` (pembeli) |
| `order_processing` | `order.service.ts` → `processOrder` | `user_id` (pembeli) |
| `order_delivered` | `order.service.ts` → `deliverOrder` | `user_id` (pembeli) |
| `order_canceled` | `buyer.order.service.ts` → `cancelOrder` | `mitra_id` (penjual) |
| `new_review` | `buyer.order.service.ts` → `reviewOrder` | `mitra_id` (penjual) |

---

## Objective

Buat endpoint untuk:
1. Buyer membaca daftar notifikasi miliknya
2. Seller membaca daftar notifikasi miliknya
3. Mark single notifikasi sebagai dibaca
4. Mark semua notifikasi sebagai dibaca
5. Menghitung notifikasi yang belum dibaca (badge counter)
6. Hapus notifikasi (opsional, untuk clean-up user)

---

## Task Requirements

### 1. Notifikasi Schema (`src/modules/notification/notification.schema.ts`)

```ts
import { z } from 'zod';

const idParam = z.object({
    id: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
        message: 'ID notifikasi tidak valid',
    }),
});

export const notificationIdSchema = idParam;

export const notificationPaginationSchema = z.object({
    page: z.string().optional().transform((v) => Math.max(1, parseInt(v ?? '1', 10) || 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => Math.min(50, Math.max(1, parseInt(v ?? '10', 10) || 10))),
});

export const notificationTypeSchema = z.object({
    tipe: z
        .enum([
            'new_order',
            'order_completed',
            'order_accepted',
            'order_rejected',
            'order_processing',
            'order_delivered',
            'order_canceled',
            'new_review',
        ])
        .optional(),
});

export type NotificationIdParams = z.infer<typeof notificationIdSchema>;
export type NotificationPaginationQuery = z.infer<typeof notificationPaginationSchema>;
export type NotificationTypeFilter = z.infer<typeof notificationTypeSchema>;
```

### 2. Notifikasi Service (`src/modules/notification/notification.service.ts`)

```ts
import { prisma } from '../../config/prisma';

// SEMUA function di bawah return result yang sudah diformat

export const notificationService = {
    // Buyer: baca notifikasi miliknya (where: user_id === buyerId)
    async getBuyerNotifications(buyerId: number, page: number, limit: number, tipe?: string) {
        const skip = (page - 1) * limit;
        const where: any = { user_id: buyerId };
        if (tipe) where.tipe = tipe;

        const [notifications, totalCount] = await Promise.all([
            prisma.notifikasi.findMany({
                where,
                orderBy: { waktu_kirim: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notifikasi.count({ where }),
        ]);

        return {
            notifications,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(totalCount / limit)),
            },
        };
    },

    // Seller: baca notifikasi miliknya (where: mitra_id === sellerId)
    async getSellerNotifications(sellerId: number, page: number, limit: number, tipe?: string) {
        const skip = (page - 1) * limit;
        const where: any = { mitra_id: sellerId };
        if (tipe) where.tipe = tipe;

        const [notifications, totalCount] = await Promise.all([
            prisma.notifikasi.findMany({
                where,
                orderBy: { waktu_kirim: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notifikasi.count({ where }),
        ]);

        return {
            notifications,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(totalCount / limit)),
            },
        };
    },

    // Mark single notifikasi sebagai dibaca (pastikan milik user yang bersangkutan)
    async markAsRead(notifId: number, userId: number, role: 'pembeli' | 'penjual') {
        const where: any = { notifikasi_id: notifId };
        if (role === 'pembeli') where.user_id = userId;
        else where.mitra_id = userId;

        const notif = await prisma.notifikasi.findFirst({ where });
        if (!notif) return null;

        return prisma.notifikasi.update({
            where: { notifikasi_id: notifId },
            data: { status_dibaca: true },
        });
    },

    // Mark semua notifikasi sebagai dibaca
    async markAllAsRead(userId: number, role: 'pembeli' | 'penjual') {
        const where: any = {};
        if (role === 'pembeli') where.user_id = userId;
        else where.mitra_id = userId;

        const result = await prisma.notifikasi.updateMany({
            where: { ...where, status_dibaca: false },
            data: { status_dibaca: true },
        });

        return { message: `${result.count} notifikasi ditandai dibaca`, count: result.count };
    },

    // Count notifikasi yang belum dibaca
    async getUnreadCount(userId: number, role: 'pembeli' | 'penjual') {
        const where: any = { status_dibaca: false };
        if (role === 'pembeli') where.user_id = userId;
        else where.mitra_id = userId;

        return prisma.notifikasi.count({ where });
    },

    // Hapus single notifikasi (milik user)
    async deleteNotification(notifId: number, userId: number, role: 'pembeli' | 'penjual') {
        const where: any = { notifikasi_id: notifId };
        if (role === 'pembeli') where.user_id = userId;
        else where.mitra_id = userId;

        const notif = await prisma.notifikasi.findFirst({ where });
        if (!notif) return null;

        await prisma.notifikasi.delete({ where: { notifikasi_id: notifId } });
        return { message: 'Notifikasi berhasil dihapus' };
    },
};
```

### 3. Notifikasi Controller (`src/modules/notification/notification.controller.ts`)

```ts
// SEMUA handler HARUS dibungkus asyncHandler
// Validasi input via schema.parse() — biarkan global error handler menangani ZodError
// Gunakan success(), fail() dari utils/response
// Throw NotFoundError, UnauthorizedError jika perlu
```

**Handler untuk BUYER:**
- `getBuyerNotifications(req, res)` — baca `req.user.id`, parsing query `page`/`limit`/`tipe`, panggil `notificationService.getBuyerNotifications(...)`, return `paginated(...)`
- `getBuyerUnreadCount(req, res)` — return `{ unread: count }` via `success(...)`
- `markBuyerNotificationRead(req, res)` — parsing `id` param, panggil `markAsRead`
- `markAllBuyerNotificationsRead(req, res)` — panggil `markAllAsRead`
- `deleteBuyerNotification(req, res)` — parsing `id` param, panggil `deleteNotification`

**Handler untuk SELLER:**
- Fungsi serupa dengan seller prefix — `getSellerNotifications`, `getSellerUnreadCount`, `markSellerNotificationRead`, `markAllSellerNotificationsRead`, `deleteSellerNotification`

**Helper:**
```ts
function requireUserId(req: Request): number { ... }
function requireSellerId(req: Request): number { ... }
```

### 4. Notifikasi Routes (`src/modules/notification/notification.routes.ts`)

```ts
// SPLIT menjadi 2 router: buyerRouter + sellerRouter
// Keduanya menggunakan jwtMiddleware

const buyerRouter = Router();
buyerRouter.use(jwtMiddleware);
buyerRouter.get('/', buyerController.getBuyerNotifications);
buyerRouter.get('/unread-count', buyerController.getBuyerUnreadCount);
buyerRouter.patch('/:id/read', buyerController.markBuyerNotificationRead);
buyerRouter.patch('/read-all', buyerController.markAllBuyerNotificationsRead);
buyerRouter.delete('/:id', buyerController.deleteBuyerNotification);

const sellerRouter = Router();
sellerRouter.use(jwtMiddleware);
sellerRouter.get('/', sellerController.getSellerNotifications);
sellerRouter.get('/unread-count', sellerController.getSellerUnreadCount);
sellerRouter.patch('/:id/read', sellerController.markSellerNotificationRead);
sellerRouter.patch('/read-all', sellerController.markAllSellerNotificationsRead);
sellerRouter.delete('/:id', sellerController.deleteSellerNotification);

export { buyerRouter, sellerRouter };
```

### 5. Mount di `src/app.ts`

```ts
import {
    buyerRouter as notifBuyerRouter,
    sellerRouter as notifSellerRouter,
} from './modules/notification/notification.routes';

// Place in the order after buyer/seller routes:
app.use('/api/buyer/notifications', notifBuyerRouter);
app.use('/api/seller/notifications', notifSellerRouter);
```

---

## Acceptance Criteria

- [ ] Seller dapat melihat daftar notifikasi via `GET /api/seller/notifications?page=1&limit=10&tipe=new_order`
- [ ] Buyer dapat melihat daftar notifikasi via `GET /api/buyer/notifications?page=1&limit=10&tipe=order_accepted`
- [ ] Notifikasi diurut berdasarkan `waktu_kirim DESC`
- [ ] `PATCH /api/buyer/notifications/:id/read` tandai 1 notifikasi
- [ ] `PATCH /api/buyer/notifications/read-all` tandai semua
- [ ] `GET /api/buyer/notifications/unread-count` return `{ unread: number }`
- [ ] `DELETE /api/buyer/notifications/:id` hapus notifikasi (pastikan milik user)
- [ ] Seller tidak bisa mengakses notifikasi buyer lain (verify via `user_id`/`mitra_id`)
- [ ] Response format konsisten dengan project (`{ success: true, message, data, pagination }`)
- [ ] Semua controller dibungkus `asyncHandler`
- [ ] Semua validator menggunakan `.parse()` (Zod throws → global error handler)
- [ ] Tidak ada `new PrismaClient()` di file baru — gunakan `import { prisma } from '../../config/prisma'`
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `src/modules/notification/notification.schema.ts` | **Tulis ulang** (0 byte → implementasi) |
| `src/modules/notification/notification.service.ts` | **Tulis ulang** |
| `src/modules/notification/notification.controller.ts` | **Tulis ulang** |
| `src/modules/notification/notification.routes.ts` | **Tulis ulang** |
| `src/app.ts` | Tambah 2 mount `notifBuyerRouter` + `notifSellerRouter` |

---

## Dependencies

Tidak ada. Modul ini internal, tanpa library baru. Hanya butuh `@prisma/client` (sudah ada).

---

## Related Issues

- #6 (Wallet logic — notifikasi otomatis terbuat di `confirmOrder`)
- #3 (OTP — notifikasi tidak terkait OTP)
