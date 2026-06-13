# Telivery-BE Issues

Daftar issue, bug, dan pekerjaan yang perlu dilakukan pada backend **Cheva-Telivery**.
File ini bisa dipecah per-issue menjadi file terpisah (mis. `001-buyer-order-unmounted.md`) saat mulai dikerjakan.

---

## Status Issue

| # | Judul | Severity | Status | Prioritas |
|---|---|---|---|---|
| 1 | Buyer order routes tidak di-mount di `app.ts` | 🔴 Critical | ✅ Fixed | P0 |
| 2 | `console.log(JWT_SECRET)` bocor ke console | 🔴 Critical | ✅ Fixed | P0 |
| 3 | OTP tidak benar-benar dikirim ke user | 🔴 Critical | 🟡 Open | P0 |
| 4 | 5 modul masih stub kosong | 🟡 Major | 🟡 Open | P1 |
| 5 | Duplikat PrismaClient di setiap service | 🟡 Major | ✅ Fixed | P1 |
| 6 | User module pakai in-memory array, bukan DB | 🟡 Major | 🟡 Open | P2 |
| 7 | Tidak ada CORS | 🟡 Major | ✅ Fixed | P1 |
| 8 | Tidak ada global error handler | 🟡 Major | ✅ Fixed | P1 |
| 9 | Duplikat buyer product endpoints | 🟡 Major | 🟡 Open | P2 |
| 10 | File `.js` hasil compile masuk repo | 🟠 Minor | ✅ Fixed | P1 |
| 11 | Folder `documents/` di-commit | 🟠 Minor | ✅ Fixed | P1 |
| 12 | Status case mismatch (UPPERCASE vs lowercase) | 🟠 Minor | 🟡 Open | P2 |
| 13 | `registerSellerStore` tidak pakai Zod schema | 🟠 Minor | ✅ Fixed | P2 |
| 14 | Tidak ada rate limiting untuk OTP | 🟠 Minor | 🟡 Open | P2 |
| 15 | Tidak ada admin verification flow | 🟠 Minor | 🟡 Open | P2 |
| 16 | Tidak ada script `build`, `dev`, `lint`, `test` | 🟠 Minor | 🟡 Open | P3 |
| 17 | Tidak ada image serving endpoint | 🟠 Minor | 🟡 Open | P2 |
| 18 | Tidak ada `dompet_mitra` business logic | 🟠 Minor | 🟡 Open | P3 |
| 19 | Schema DB `layanan` tidak ada CRUD endpoint | 🟠 Minor | 🟡 Open | P3 |
| 20 | Tidak ada profil/CRUD untuk pembeli | 🟠 Minor | 🟡 Open | P2 |

---

## Detail Issue

### #1 — Buyer order routes tidak di-mount di `app.ts` [P0] ✅ Fixed

**File:** `src/app.ts`

**Masalah:**
File `src/modules/order/buyer.order.routes.ts` sudah berisi 8 endpoint lengkap (create order, get summary, cancel, confirm, review, track, dll.) tapi tidak pernah di-import atau di-mount di `app.ts`. Artinya, semua fitur pesanan sisi pembeli tidak bisa diakses.

**Fix:** Tambah baris berikut di `app.ts`:
```ts
import buyerOrderRoutes from './modules/order/buyer.order.routes';
app.use('/api/buyer/orders', buyerOrderRoutes);
```

**Sudah dikerjakan:** Sudah ditambahkan di refactor struktur.

---

### #2 — `console.log(JWT_SECRET)` bocor ke console [P0] ✅ Fixed

**File:** `src/modules/auth/auth.service.ts`, `src/modules/middlewares/jwt.middleware.ts` (sebelum refactor)

**Masalah:**
Kode lama mem-print nilai `JWT_SECRET` ke console via `console.debug` / `console.log`. Siapapun yang bisa lihat log server akan punya akses penuh untuk forge token JWT.

**Dampak:** Authentication bypass — bisa generate token untuk user ID manapun.

**Fix:** Hapus semua `console.log(JWT_SECRET)`. Ambil secret hanya dari `env.JWT_SECRET` di `config/env.ts`.

**Sudah dikerjakan:** Secret dibaca dari `env.JWT_SECRET` tanpa logging.

---

### #3 — OTP tidak benar-benar dikirim ke user [P0] 🟡 Open

**File:** Seluruh `auth.service.ts` (fungsi `issueOtp`, `forgotPasswordSeller`)

**Masalah:**
Kode hanya:
1. Generate 5-digit OTP random
2. Simpan ke tabel `otp_verify` di DB
3. `console.log` OTP ke terminal server

User tidak pernah menerima OTP. Saat testing, developer harus query DB untuk lihat OTP. Di production, ini artinya tidak ada user yang bisa login.

**Solusi yang dibutuhkan (pilih salah satu):**
- **Integrasi WhatsApp Business API** (recommend untuk Indonesia, pakai gateway seperti Fonnte / Wablas / WAblas / Twilio)
- **Integrasi SMS gateway** (Zenziva, Nexmo, Twilio)
- **Email fallback** via SMTP / SendGrid (kurang ideal karena OTP via SMS)
- Untuk development, bisa pakai tools seperti [Mailtrap](https://mailtrap.io) + email

**File yang harus ditambah:**
- `src/config/twilio.ts` (atau gateway pilihan)
- `src/services/notification/otp.sender.ts` — `sendOtp(phone, otp): Promise<void>`
- Ganti `console.log` di `auth.service.ts` jadi `await sendOtp(...)`

**Dependencies yang mungkin ditambah:**
```bash
npm install axios  # kalau pakai Fonnte / Wablas (HTTP API)
# atau
npm install twilio # kalau pakai Twilio
```

**Effort:** ~3-4 jam (termasuk testing).

---

### #4 — 5 modul masih stub kosong [P1] 🟡 Open

**File:** `src/modules/cart/`, `src/modules/checkout/`, `src/modules/payment/`, `src/modules/notification/`, `src/modules/partner/`

**Masalah:**
Semua file `.ts` di 5 modul ini kosong (0 bytes). Ini berarti:
- Buyer tidak punya fitur cart
- Tidak ada flow checkout terpisah dari order
- Pembayaran belum ada logic konfirmasi / upload bukti
- Notifikasi yang dibuat oleh order service tidak bisa di-read oleh user
- Mitra/penjual tidak bisa edit profil toko

**Detail per modul:**

#### 4a. Notification [P1, Prioritas Tinggi]
Data sudah ada di DB (dibuat oleh `buyer.order.service.ts` & `order.service.ts`). Tinggal buat endpoint:
- `GET /api/buyer/notifications` — list notifikasi pembeli (auth required)
- `PATCH /api/buyer/notifications/:id/read` — tandai sudah dibaca
- `PATCH /api/buyer/notifications/read-all` — tandai semua dibaca
- `GET /api/seller/notifications` — list notifikasi penjual
- `PATCH /api/seller/notifications/:id/read`
- `GET /api/buyer/notifications/unread-count` — badge counter

Schema: notifikasi sudah ada (`notifikasi` model). Tinggal implement service + controller + routes.

#### 4b. Payment [P1]
- `POST /api/buyer/payments/:pesananId` — buyer upload bukti bayar (multer)
- `PATCH /api/seller/payments/:pembayaranId/confirm` — seller konfirmasi / tolak
- `GET /api/buyer/payments/:pesananId` — status pembayaran pesanan
- Logic: `pembayaran.status_pembayaran` transisi `pending → paid / canceled`

#### 4c. Partner [P2]
Profil & dashboard mitra:
- `GET /api/seller/profile` — profil sendiri
- `PATCH /api/seller/profile` — update nama toko, alamat, jam oprasional, dll
- `PATCH /api/seller/profile/password` — ganti password
- `PATCH /api/seller/profile/status` — buka/tutup toko (`status_toko: OPEN/CLOSED`)

#### 4d. Cart [P3]
Bisa juga dilompati dulu — saat ini buyer langsung `createOrder` tanpa cart. Cart hanya dibutuhkan kalau mau UX "tampung dulu baru checkout sekaligus".

#### 4e. Checkout [P3]
Tergantung cart. Kalau cart di-skip, checkout jadi tidak relevan.

**Effort total:** ~2-3 hari untuk semua 5 modul (jika fokus prioritas 1 = notification + payment + partner).

---

### #5 — Duplikat PrismaClient di setiap service [P1] ✅ Fixed

**File:** Setiap `*.service.ts` (sebelum refactor)

**Masalah:**
Tiap service file punya `const prisma = new PrismaClient();`. Di Prisma best practice, harusnya 1 instance per proses. Kalau ada 15 service = 15 koneksi DB pool. Bisa exceed max connection MySQL.

**Fix:** Singleton di `src/config/prisma.ts`, import dari semua service.

**Sudah dikerjakan:** `import { prisma } from '../../config/prisma';` di semua service.

---

### #6 — User module pakai in-memory array [P2] 🟡 Open

**File:** `src/modules/user/`

**Masalah:**
Modul `user` (di-mount di `/api/users`) pakai array JavaScript biasa. Data hilang saat server restart. Tidak terkait dengan tabel `pembeli` / `penjual` di DB.

**Tampaknya ini adalah sisa tutorial/dummy**, bukan fitur produksi.

**Rekomendasi:** Hapus modul `user` atau ganti jadi CRUD untuk tabel `pembeli` (profil pembeli):
- `GET /api/buyer/profile` — auth required, get profil sendiri
- `PATCH /api/buyer/profile` — update nama, alamat, fakultas, dll
- `PATCH /api/buyer/profile/password`
- `DELETE /api/buyer/profile`

---

### #7 — Tidak ada CORS [P1] ✅ Fixed

**File:** `src/app.ts`

**Masalah:**
Frontend (kalau dipisah domain, mis. `localhost:5173` untuk Vite) akan ditolak browser saat hit API di `localhost:3000`.

**Fix:** Tambah `cors` middleware.

**Sudah dikerjakan:**
```ts
import cors from 'cors';
app.use(cors());
```

**Note:** Untuk production, ganti `app.use(cors())` dengan config origin spesifik:
```ts
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }));
```

---

### #8 — Tidak ada global error handler [P1] ✅ Fixed

**File:** `src/app.ts`

**Masalah:**
Error dari middleware / service yang tidak di-catch akan crash server. Error Prisma (`P2002` duplicate, `P2025` not found) tidak di-handle dengan benar.

**Fix:** Global error middleware di `src/middlewares/error.middleware.ts`:
- Tangani `ZodError` → 422
- Tangani `MulterError` → 400
- Tangani `HttpError` (kelas dari `utils/errors.ts`) → sesuai status
- Tangani `Prisma.PrismaClientKnownRequestError` → 409 / 404
- Tangani unknown error → 500 (log + generic message di production)

**Sudah dikerjakan:** Lengkap.

---

### #9 — Duplikat buyer product endpoints [P2] 🟡 Open

**File:** `src/modules/product/buyer.controller.ts` & `src/modules/product/product.controller.ts`

**Masalah:**
Ada 2 set endpoint buyer untuk produk:
- Versi lama di `product.controller.ts` (function `getAllProductsForBuyer`, dll) — mounted di `/api/product/buyer/*`, TANPA pagination
- Versi baru di `buyer.controller.ts` — mounted di `/api/buyer/products` (setelah refactor), DENGAN pagination

Sudah dipisah mount-nya, tapi logic-nya duplikat.

**Rekomendasi:** Hapus function buyer dari `product.controller.ts` (yang lama) supaya hanya 1 sumber kebenaran.

---

### #10 — File `.js` hasil compile masuk repo [P1] ✅ Fixed

**File:** `src/app.js`, `src/server.js`, semua `*.js` di dalam `src/modules/`

**Masalah:**
Tiap module punya file `.js` (output TypeScript). Seharusnya:
- `outDir` di `tsconfig.json` set ke `./dist`
- Folder `dist/` masuk `.gitignore`
- Jalankan dengan `ts-node` saat dev, atau `node dist/server.js` saat production

**Sudah dikerjakan:**
- `tsconfig.json` punya `outDir: "./dist"` dan `rootDir: "./src"`
- `dist/` masuk `.gitignore`
- Semua `.js` di `src/` dihapus
- (Belum ditambah) script `build` di `package.json`:
  ```json
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts"
  }
  ```

---

### #11 — Folder `documents/` di-commit [P1] ✅ Fixed

**File:** `documents/ktp/`, `documents/owner_face/`, `documents/products/`

**Masalah:**
Foto KTP, wajah, dan produk user akan masuk git repo. Risk泄露 privasi + repo bengkak.

**Fix:** `.gitignore` entry untuk exclude isi folder, sisakan `.gitkeep`.

**Sudah dikerjakan:** Done.

**Catatan tambahan:** Untuk production, HARUS migrasi ke cloud storage (S3 / GCS / R2). Lihat issue #17.

---

### #12 — Status case mismatch (UPPERCASE vs lowercase) [P2] 🟡 Open

**File:** `src/modules/order/order.schema.ts` vs `src/modules/order/buyer.order.schema.ts`

**Masalah:**
- Seller schema: enum `PENDING, ACCEPTED, REJECTED, PROCESSING, DELIVERING, DELIVERED, COMPLETED, CANCELLED` (UPPERCASE)
- Buyer schema: enum `pending, accepted, rejected, processing, delivered, completed, canceled` (lowercase)
- DB & service code pakai lowercase

**Dampak:** Kalau ada code yang filter `status: 'PENDING'` di seller code, akan return 0 hasil karena DB-nya `pending`.

**Rekomendasi:** Standarkan semua ke lowercase sesuai `ORDER_STATUS` di `config/constants.ts`. Update seller schema.

---

### #13 — `registerSellerStore` tidak pakai Zod schema [P2] ✅ Fixed

**File:** `src/modules/auth/auth.controller.ts` (fungsi `registerSellerStore`)

**Masalah:**
Schema `registerSellerStoreSchema` sudah didefinisikan di `auth.schema.ts` tapi controller-nya validasi manual.

**Fix:** Pakai `registerSellerStoreSchema.safeParse()`.

**Sudah dikerjakan:** Done di refactor.

---

### #14 — Tidak ada rate limiting untuk OTP [P2] 🟡 Open

**File:** Endpoint `requestSellerOtp`, `loginOtp`, `forgotPasswordSeller`

**Masalah:**
Tidak ada batasan berapa kali user bisa request OTP per jam. Bisa di-spam → DB penuh dengan `otp_verify` → potential DoS.

**Rekomendasi:**
- Pakai `express-rate-limit`:
  ```ts
  import rateLimit from 'express-rate-limit';
  const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
  router.post('/buyer/request-otp', otpLimiter, loginOtp);
  ```
- Tambah cleanup job yang hapus `otp_verify` yang `expiredAt < now()` setiap 1 jam
- Opsional: captcha setelah 3x gagal

---

### #15 — Tidak ada admin verification flow [P2] 🟡 Open

**File:** `penjual.status_verifikasi`

**Masalah:**
Penjual daftar toko → `status_verifikasi = "pending"`. Tapi tidak ada cara admin approve / reject. Tanpa ini, toko `pending` masih bisa tampil di buyer katalog (kalau filter di-store dihapus).

**Rekomendasi:**
- Tambah role `admin` di JWT payload
- Modul `src/modules/admin/` baru:
  - `GET /api/admin/sellers/pending` — list toko pending
  - `PATCH /api/admin/sellers/:id/approve`
  - `PATCH /api/admin/sellers/:id/reject` (dengan alasan)
- Pastikan semua endpoint buyer store filter `status_verifikasi = "approved"` (sudah ada di service untuk most endpoints, tapi `getAllStores` comment-nya di-disable)

---

### #16 — Tidak ada script `build`, `dev`, `lint`, `test` [P3] 🟡 Open

**File:** `package.json`

**Masalah:**
Cuma ada `"start": "ts-node src/server.ts"`. Tidak ada:
- `build` — compile TS ke `dist/`
- `dev` — auto-reload saat edit (tsx watch / nodemon)
- `lint` — ESLint
- `format` — Prettier
- `test` — Jest / Vitest

**Rekomendasi:**
```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "start:dev": "ts-node src/server.ts",
  "lint": "eslint . --ext .ts",
  "lint:fix": "eslint . --ext .ts --fix",
  "format": "prettier --write \"src/**/*.ts\"",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Tambah dependencies: `tsx`, `eslint`, `@typescript-eslint/*`, `prettier`, `vitest`.

---

### #17 — Tidak ada image serving endpoint [P2] 🟡 Open

**File:** Tidak ada — fitur hilang

**Masalah:**
Foto produk & KTP disimpan di `documents/products/xxx.jpg`. Path-nya dikembalikan ke user. Tapi tidak ada endpoint untuk serve file:
- Tidak bisa diakses dari frontend (`/documents/products/xxx.jpg` 404)
- Tidak ada validasi MIME saat download
- Tidak ada cache headers

**Solusi jangka pendek (cukup untuk dev):**
```ts
app.use('/uploads', express.static('documents'));
```
Sekarang `GET /uploads/products/abc.jpg` akan serve file.

**Solusi jangka panjang (production):**
Migrasi ke cloud storage. Lihat urutan:
1. Pilih provider (S3 / R2 / Supabase Storage)
2. Refactor `multer.seller.ts` → pakai `multer-s3` atau upload manual setelah `multer` di memory
3. Hapus dependency ke filesystem lokal
4. Database simpan URL lengkap dari cloud

---

### #18 — Tidak ada `dompet_mitra` business logic [P3] 🟡 Open

**File:** `dompet_mitra` & `riwayat_dompet` models (schema sudah ada)

**Masalah:**
Schema DB sudah ada tapi tidak ada service/controller. Seharusnya saat order `completed`, otomatis:
1. Hitung `total_harga` pesanan
2. Kurangi fee platform (mis. 10%)
3. Tambah saldo ke `dompet_mitra` milik penjual
4. Catat di `riwayat_dompet`

**Rekomendasi:**
- Implement logic di `buyer.order.service.ts` fungsi `confirmOrder` — setelah `pembayaran.status = "paid"`, trigger transfer ke dompet
- Endpoint `GET /api/seller/wallet` — lihat saldo
- Endpoint `GET /api/seller/wallet/history` — lihat riwayat transaksi
- Endpoint `POST /api/seller/wallet/withdraw` — penarikan (perlu integrasi payment gateway)

---

### #19 — Schema DB `layanan` tidak ada CRUD endpoint [P3] 🟡 Open

**File:** `layanan` model (schema sudah ada), `detail_pesanan_layanan` (ada)

**Masalah:**
DB punya tabel `layanan` (jasa laundry, antar galon, dll) dan `detail_pesanan_layanan`, tapi:
- Tidak ada endpoint CRUD untuk layanan
- `buyer.order.service.ts` tidak handle order yang include layanan
- Tampil di frontend gimana? Tidak bisa.

**Rekomendasi:**
- Modul `src/modules/service/` baru (mirip `product/`):
  - Seller: CRUD `layanan` (nama, harga, jenis, estimasi durasi)
  - Buyer: list layanan, detail
- Update `createOrder` di `buyer.order.service.ts` untuk handle mix produk + layanan

---

### #20 — Tidak ada profil/CRUD untuk pembeli [P2] 🟡 Open

**File:** `pembeli` model (schema sudah ada)

**Masalah:**
Buyer bisa register & login, tapi:
- Tidak bisa lihat profil sendiri
- Tidak bisa update data (alamat, fakultas, dll)
- Tidak bisa ganti password

**Rekomendasi:**
- Modul `src/modules/buyer/` (atau rename `user/`):
  - `GET /api/buyer/profile`
  - `PATCH /api/buyer/profile`
  - `PATCH /api/buyer/profile/password`
- Hapus `user/` placeholder (lihat #6)

---

## Cara Pakai Folder Ini

Saat mulai kerjakan salah satu issue:
1. Copy issue jadi file baru: `cp issues/issue.md issues/00X-judul-issue.md`
2. Update status dari `🟡 Open` jadi `🟢 In Progress`
3. Tambah catatan progress / link PR
4. Setelah selesai, ganti jadi `✅ Done` + tanggal

Atau jika pakai GitHub Issues / GitLab Issues, link issue number di sini.

---

*Terakhir diupdate: 2026-06-14*
