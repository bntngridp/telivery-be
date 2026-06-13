# Issue 9 — [Feature] Implement Admin Verification Flow

**Status:** 🟡 Open | **Priority:** P0 | **Severity:** 🔴 Critical

---

## Context

Saat penjual selesai register via `registerSellerStore`, field `status_verifikasi` di-set ke `"pending"`. Saat ini tidak ada mekanisme untuk admin menyetujui/menolak toko tersebut. Meskipun filter `APPROVED_OPEN_FILTER = { status_verifikasi: "approved", status_toko: "OPEN" }` sudah diterapkan di `store.service.ts`, admin tetap harus manual update DB. Untuk production-readiness, kita butuh 2 hal:

1. **Admin role** di JWT — user admin bisa login dan melakukan approve/reject
2. **Endpoint admin** — list toko pending + approve / reject

Saat ini belum ada tabel admin terpisah. Kita akan menggunakan **hardcoded admin credentials via environment variable** untuk phase pertama:

```env
ADMIN_EMAIL=bntngrid@gmail.com
ADMIN_PASSWORD=admin123
```

Admin login akan mengembalikan JWT dengan payload `{ adminId: -1, role: "admin" }`.
Verifikasi admin di-handle via middleware `requireRole('admin')`.

**Data yang ada:**
- `penjual.status_verifikasi` — `"pending"` / `"approved"` / `"rejected"`
- `penjual.status_toko` — `"OPEN"` / `"CLOSED"` (tidak diubah oleh admin)
- Saat register store, `status_verifikasi = "pending"`

---

## Objective

1. Tambah endpoint admin login (hardcoded email+password via env)
2. Tambah middleware admin access: `requireRole('admin')`
3. Buat modul `admin/` dengan endpoint:
   - List semua toko yang `status_verifikasi = "pending"`
   - Approve toko (set `status_verifikasi = "approved"`, `verifikasi_toko = true`)
   - Reject toko (set `status_verifikasi = "rejected"`, dengan alasan)
4. Notifikasi ke seller saat toko di-approve/reject

---

## Task Requirements

### 1. Env Config (`src/config/env.ts`)

Tambahkan di object `env`:
```ts
ADMIN_EMAIL: required('ADMIN_EMAIL', 'bntngrid@gmail.com'),
ADMIN_PASSWORD: required('ADMIN_PASSWORD', 'admin123'),
```

Tambahkan juga di file `.env`:
```env
ADMIN_EMAIL=bntngrid@gmail.com
ADMIN_PASSWORD=admin123
```

### 2. Auth Service — adminLogin (`src/modules/auth/auth.service.ts`)

Tambah method `adminLogin`:

```ts
async adminLogin(email: string, password: string) {
    if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
        throw new UnauthorizedError('Email atau password admin salah');
    }
    const token = signToken(
        { adminId: -1, role: 'admin' },
        env.SELLER_JWT_EXPIRES_IN as SignOptions['expiresIn'],
    );
    return { token };
},
```

### 3. Auth Controller — adminLogin (`src/modules/auth/auth.controller.ts`)

Tambah handler:
```ts
export const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw new BadRequestError('Email dan password wajib diisi');
    const result = await authService.adminLogin(email, password);
    return success(res, 'Login admin berhasil', result);
});
```

### 4. Auth Routes (`src/modules/auth/auth.routes.ts`)

Tambah route:
```ts
router.post('/admin/login', adminLogin);
```

### 5. JWT Middleware — extend type

File `src/middlewares/jwt.middleware.ts` — di dalam fungsi `jwtMiddleware`, tambah penanganan untuk role `admin`:
```ts
if (decoded.role === 'admin') {
    if (typeof decoded.adminId !== 'number') {
        throw new UnauthorizedError('Invalid admin token payload');
    }
    req.user = { role: 'admin' };
    return next();
}
```

**Note:** `adminId` di-set ke `-1` (dummy value), tidak perlu validasi kecuali tipe number.

### 6. Admin Module (`src/modules/admin/`)

#### 6a. Schema (`src/modules/admin/admin.schema.ts`)

```ts
import { z } from 'zod';

export const storeIdParamSchema = z.object({
    id: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
        message: 'ID toko tidak valid',
    }),
});

export const rejectStoreSchema = z.object({
    alasan: z.string().min(5, 'Alasan penolakan minimal 5 karakter').max(500),
});

export const adminPaginationSchema = z.object({
    page: z.string().optional().transform((v) => Math.max(1, parseInt(v ?? '1', 10) || 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => Math.min(50, Math.max(1, parseInt(v ?? '10', 10) || 10))),
});
```

#### 6b. Service (`src/modules/admin/admin.service.ts`)

```ts
import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';

export const adminService = {
    // List toko pending (yang status_verifikasi = "pending")
    async listPendingStores(page: number, limit: number) {
        const skip = (page - 1) * limit;
        const where = { status_verifikasi: 'pending' };

        const [stores, totalCount] = await Promise.all([
            prisma.penjual.findMany({
                where,
                orderBy: { mitra_id: 'asc' },
                skip,
                take: limit,
            }),
            prisma.penjual.count({ where }),
        ]);

        return {
            stores,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(totalCount / limit)),
            },
        };
    },

    // Approve toko
    async approveStore(storeId: number) {
        const store = await prisma.penjual.findUnique({ where: { mitra_id: storeId } });
        if (!store) throw new NotFoundError('Toko tidak ditemukan');
        if (store.status_verifikasi === 'approved') {
            throw new ConflictError('Toko sudah disetujui');
        }

        const updated = await prisma.penjual.update({
            where: { mitra_id: storeId },
            data: {
                status_verifikasi: 'approved',
                verifikasi_toko: true,
                status_toko: 'OPEN', // Auto-buka toko setelah approved
            },
        });

        // Kirim notifikasi ke seller
        if (store.mitra_id) {
            await prisma.notifikasi.create({
                data: {
                    mitra_id: store.mitra_id,
                    isi_pesan: `Selamat! Toko "${store.nama_toko}" telah disetujui. Silakan mulai jualan.`,
                    waktu_kirim: new Date(),
                    tipe: 'store_approved',
                    status_dibaca: false,
                },
            });
        }

        return updated;
    },

    // Reject toko
    async rejectStore(storeId: number, alasan: string) {
        const store = await prisma.penjual.findUnique({ where: { mitra_id: storeId } });
        if (!store) throw new NotFoundError('Toko tidak ditemukan');
        if (store.status_verifikasi === 'rejected') {
            throw new ConflictError('Toko sudah ditolak sebelumnya');
        }

        const updated = await prisma.penjual.update({
            where: { mitra_id: storeId },
            data: {
                status_verifikasi: 'rejected',
                verifikasi_toko: false,
                status_toko: 'CLOSED',
            },
        });

        // Kirim notifikasi ke seller dengan alasan
        if (store.mitra_id) {
            await prisma.notifikasi.create({
                data: {
                    mitra_id: store.mitra_id,
                    isi_pesan: `Maaf, toko "${store.nama_toko}" ditolak. Alasan: ${alasan}`,
                    waktu_kirim: new Date(),
                    tipe: 'store_rejected',
                    status_dibaca: false,
                },
            });
        }

        return updated;
    },
};
```

#### 6c. Controller (`src/modules/admin/admin.controller.ts`)

```ts
import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { storeIdParamSchema, rejectStoreSchema, adminPaginationSchema } from './admin.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { success, paginated } from '../../utils/response';
import { UnauthorizedError } from '../../utils/errors';

function requireAdmin(req: Request) {
    if (req.user?.role !== 'admin') {
        throw new UnauthorizedError('Akses ditolak. Hanya admin yang diizinkan');
    }
}

export const adminController = {
    listPendingStores: asyncHandler(async (req: Request, res: Response) => {
        requireAdmin(req);
        const pagination = adminPaginationSchema.parse(req.query);
        const result = await adminService.listPendingStores(pagination.page, pagination.limit);
        return paginated(
            res,
            'Daftar toko pending berhasil diambil',
            result.stores,
            result.pagination.page,
            result.pagination.limit,
            result.pagination.total,
        );
    }),

    approveStore: asyncHandler(async (req: Request, res: Response) => {
        requireAdmin(req);
        const { id } = storeIdParamSchema.parse(req.params);
        const updated = await adminService.approveStore(Number(id));
        return success(res, 'Toko berhasil disetujui', updated);
    }),

    rejectStore: asyncHandler(async (req: Request, res: Response) => {
        requireAdmin(req);
        const { id } = storeIdParamSchema.parse(req.params);
        const { alasan } = rejectStoreSchema.parse(req.body);
        const updated = await adminService.rejectStore(Number(id), alasan);
        return success(res, 'Toko berhasil ditolak', updated);
    }),
};
```

#### 6d. Routes (`src/modules/admin/admin.routes.ts`)

```ts
import { Router } from 'express';
import { adminController } from './admin.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';

const router = Router();

router.use(jwtMiddleware);
router.get('/stores/pending', adminController.listPendingStores);
router.patch('/stores/:id/approve', adminController.approveStore);
router.patch('/stores/:id/reject', adminController.rejectStore);

export default router;
```

### 7. Mount di `src/app.ts`

```ts
import adminRoutes from './modules/admin/admin.routes';
app.use('/api/admin', adminRoutes);
```

---

## Acceptance Criteria

- [ ] `POST /api/auth/admin/login` dengan credentials dari env → return JWT token `{ adminId: -1, role: "admin" }`
- [ ] `GET /api/admin/stores/pending?page=1&limit=10` - list toko dengan `status_verifikasi = "pending"`
- [ ] `PATCH /api/admin/stores/:id/approve` - ubah status jadi `"approved"`, `verifikasi_toko: true`, `status_toko: "OPEN"`
- [ ] `PATCH /api/admin/stores/:id/reject` dengan body `{ alasan: "..." }` - ubah status jadi `"rejected"`, `verifikasi_toko: false`, `status_toko: "CLOSED"`
- [ ] Saat toko di-approve, notifikasi otomatis dikirim ke seller bersangkutan
- [ ] Saat toko di-reject, notifikasi otomatis dikirim ke seller + alasan penolakan
- [ ] Admin tidak bisa approve toko yang sudah approved (return 409)
- [ ] Non-admin tidak bisa akses endpoint admin (return 403/401)
- [ ] Seller tidak bisa login pakai credentials admin
- [ ] Semua controller dibungkus `asyncHandler`
- [ ] Semua validator menggunakan `.parse()` (Zod throws → global error handler)
- [ ] Tidak ada `new PrismaClient()` di file baru
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `.env` | + `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| `src/config/env.ts` | + `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| `src/modules/auth/auth.service.ts` | + method `adminLogin` |
| `src/modules/auth/auth.controller.ts` | + handler `adminLogin` |
| `src/modules/auth/auth.routes.ts` | + route `/admin/login` |
| `src/middlewares/jwt.middleware.ts` | Tambah handling payload `adminId` |
| `src/modules/admin/admin.schema.ts` | **NEW** |
| `src/modules/admin/admin.service.ts` | **NEW** |
| `src/modules/admin/admin.controller.ts` | **NEW** |
| `src/modules/admin/admin.routes.ts` | **NEW** |
| `src/app.ts` | Mount `/api/admin` |

---

## Dependencies

Tidak ada. Tanpa library tambahan.

---

## Security Note

Credentials admin dibaca dari env. Untuk production, gunakan hash (`compareAdminPassword`) atau tabel database terpisah. Ini hanya untuk phase 1 — cukup untuk development dan testing.

---

## Related Issues

- #6 (Partner store management — toko bisa edit profile tapi tidak bisa self-approve)
- #8 (Notification module — data `store_approved`/`store_rejected` akan dibaca)
