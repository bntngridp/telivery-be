# Issue 4 — [Feature] Implement Payment Module

**Status:** 🟡 Open | **Priority:** P1 | **Severity:** 🟡 Major

---

## Problem

Modul `payment` kosong. Pembayaran dibuat oleh order service tapi tidak ada endpoint untuk:
- Buyer: upload bukti bayar
- Seller: konfirmasi / tolak pembayaran

---

## Task Requirements

### 1. Schema (`src/modules/payment/payment.schema.ts`)

```ts
import { z } from 'zod';

export const paymentIdSchema = z.object({
  pembayaranId: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, { message: 'ID pembayaran tidak valid' }),
});

export const pesananIdSchema = z.object({
  pesananId: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, { message: 'ID pesanan tidak valid' }),
});
```

### 2. Service (`src/modules/payment/payment.service.ts`)

```ts
export const paymentService = {
  async uploadReceipt(pesananId: number, userId: number, filePath: string) {
    // Validasi pesanan milik buyer + status pesanan delivered
    // Update pembayaran: status_pembayaran = 'pending', tambah path bukti
  },

  async confirmPayment(pembayaranId: number, sellerId: number) {
    // Validasi pembayaran milik pesanan seller
    // Update status_pembayaran = 'paid'
  },

  async rejectPayment(pembayaranId: number, sellerId: number) {
    // Update status_pembayaran = 'canceled'
  },
};
```

**Note:** Schema DB `pembayaran` tidak punya field `bukti_bayar`. Perlu tambah kolom via migration ATAU simpan path di field yang sudah ada. Untuk sementara, gunakan `metode_pembayaran` sebagai tempat mencatat info tambahan, atau **tambah migration**:
```sql
ALTER TABLE pembayaran ADD COLUMN bukti_bayar TEXT;
```

### 3. Controller (`src/modules/payment/payment.controller.ts`)

- Semua handler dibungkus `asyncHandler`
- Validasi input via `schema.parse()` (lempar ke global error handler)
- Gunakan `success()` / `created()` dari `utils/response`
- Throw `NotFoundError`, `UnauthorizedError`, `BadRequestError` sesuai kebutuhan

### 4. Routes (`src/modules/payment/payment.routes.ts`)

```ts
// POST /api/buyer/payments/:pesananId
//   Middleware: jwtMiddleware, upload.single('receipt')
// PATCH /api/seller/payments/:pembayaranId/confirm
//   Middleware: jwtMiddleware
// PATCH /api/seller/payments/:pembayaranId/reject
//   Middleware: jwtMiddleware
```

### 5. Mount di `src/app.ts`

```ts
import paymentRoutes from './modules/payment/payment.routes';
app.use('/api/payments', paymentRoutes);
```

---

## Acceptance Criteria

- [ ] Buyer bisa upload bukti bayar via `POST /api/payments/buyer/:pesananId`
- [ ] Seller bisa konfirmasi via `PATCH /api/payments/seller/:pembayaranId/confirm`
- [ ] Seller bisa tolak via `PATCH /api/payments/seller/:pembayaranId/reject`
- [ ] Menggunakan `asyncHandler` + singleton Prisma + typed errors
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `src/modules/payment/payment.schema.ts` | **NEW** |
| `src/modules/payment/payment.service.ts` | **NEW** |
| `src/modules/payment/payment.controller.ts` | **NEW** |
| `src/modules/payment/payment.routes.ts` | **NEW** |
| `src/app.ts` | Mount route |
| `prisma/schema.prisma` | Tambah field `bukti_bayar` di model `pembayaran` |
| `prisma/migrations/` | Migration untuk kolom baru |

---

## Dependencies
```bash
npm install
# (tidak ada deps baru, pakai multer + prisma yang sudah ada)
```

---

## DB Migration (via Prisma)

Tambah di `prisma/schema.prisma` model `pembayaran`:
```prisma
bukti_bayar   String?   @db.Text
```

Lalu:
```bash
npx prisma migrate dev --name add_bukti_bayar_to_pembayaran
npx prisma generate
```

---

## Related Issues

- #7 (Image serving — bukti bayar perlu bisa diakses)
- #5 (Wallet logic — setelah pembayaran confirmed → dompet mitra)
