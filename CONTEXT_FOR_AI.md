# Cheva-Telivery Backend — Dokumentasi Lengkap untuk Konsultasi AI

> **Tujuan dokumen**: Memberikan gambaran 100% dari codebase backend Cheva-Telivery agar AI chat bisa memahami state project dan membantu melanjutkan development.

---

## 1. Overview Project

**Cheva-Telivery** adalah backend API untuk marketplace delivery di lingkungan kampus (mirip GoFood/GrabFood versi universitas). Dibangun sebagai tugas kuliah oleh tim `chevalierlab-sas`.

**Dua role utama:**
- **Pembeli** (mahasiswa) — browse toko, pesan produk/layanan, bayar, review
- **Penjual/Mitra** — kelola toko, produk, layanan, terima/proses pesanan, punya dompet digital

---

## 2. Tech Stack

| Komponen | Teknologi | Versi |
|---|---|---|
| Runtime | Node.js | - |
| Framework | Express | 5.1.0 |
| Language | TypeScript | 5.8.3 |
| ORM | Prisma | 6.13.0 |
| Database | MySQL | 8.0.33 (via DBngin) |
| Auth | JWT (jsonwebtoken) + bcryptjs | 9.0.2 / 3.0.2 |
| Validation | Zod | 3.22.4 |
| File Upload | Multer | 2.0.2 |
| Runner | ts-node | 10.9.2 |

**tsconfig**: target `es2020`, module `commonjs`, strict mode, esModuleInterop, skipLibCheck.

---

## 3. Struktur Folder

```
telivery-be/
├── .env                    # DATABASE_URL, PORT, JWT_SECRET
├── package.json
├── tsconfig.json
├── documents/              # File upload lokal
│   ├── ktp/                #   Foto KTP penjual
│   ├── owner_face/         #   Foto wajah pemilik
│   └── products/           #   Foto produk
├── prisma/
│   ├── schema.prisma       # 13 model + 1 OTP model
│   └── migrations/         # 3 migration files
├── scripts/
│   └── test-db.ts          # Script test koneksi DB
└── src/
    ├── app.ts              # Express setup + route mounting
    ├── server.ts           # Entrypoint (listen PORT)
    └── modules/
        ├── auth/           # ✅ IMPLEMENTED — login, register, OTP
        ├── user/           # ⚠️ PLACEHOLDER — in-memory demo, bukan Prisma
        ├── product/        # ✅ IMPLEMENTED — CRUD seller + katalog buyer
        ├── store/          # ✅ IMPLEMENTED — list toko untuk buyer
        ├── order/          # ✅ IMPLEMENTED — seller order management + buyer order
        ├── cart/           # ❌ EMPTY — belum diimplementasi
        ├── checkout/       # ❌ EMPTY — belum diimplementasi
        ├── payment/        # ❌ EMPTY — belum diimplementasi
        ├── notification/   # ❌ EMPTY — belum diimplementasi
        ├── partner/        # ❌ EMPTY — belum diimplementasi
        └── middlewares/
            ├── jwt.middleware.ts    # JWT Bearer token verification
            └── multer.seller.ts    # File upload handler (disk + memory)
```

**Pola tiap modul:**
```
<module>/
  ├── <module>.controller.ts   # HTTP handler
  ├── <module>.routes.ts       # Route definitions
  ├── <module>.schema.ts       # Zod validation schemas
  └── <module>.service.ts      # Business logic + Prisma queries
```

---

## 4. Database Schema (Prisma — MySQL)

### 4.1 Model `pembeli` (Buyer/Mahasiswa)
```
user_id          Int       @id @autoincrement
email            String?   VARCHAR(100)
password         String?   VARCHAR(255)
domicile         String?   VARCHAR(100)
faculty          String?   VARCHAR(100)
major            String?   VARCHAR(100)
delivery_address String?   TEXT
phone_number     String?   VARCHAR(20)
full_name        String?   VARCHAR(100)
birth_date       DateTime?
```
Relasi: → notifications, → orders

### 4.2 Model `penjual` (Seller/Mitra)
```
mitra_id          Int       @id @autoincrement
phone_number      String?   VARCHAR(20)
email             String?   VARCHAR(100)
password          String?   VARCHAR(255)
jenis_usaha       String?   VARCHAR(50)    — makanan/minuman/air_galon/laundry
foto_ktp_pemilik  String?   TEXT           — path file
alamat_toko       String?   TEXT
foto_pemilik      String?   TEXT           — path file
status_verifikasi String?   VARCHAR(50)    — pending/approved/rejected
nama_pemilik      String?   VARCHAR(100)
nama_toko         String?   UNIQUE VARCHAR(100)
deskripsi_toko    String?   TEXT
jam_oprasional    String?   VARCHAR(50)
verifikasi_toko   Boolean?
status_toko       String?   VARCHAR(50)    — OPEN/CLOSED
role_penjual      String?   VARCHAR(50)
waktu_dibuat      DateTime?
```
Relasi: → dompet_mitra, → layanan, → notifikasi, → pesanan, → produk

### 4.3 Model `produk`
```
produk_id           Int       @id @autoincrement
mitra_id            Int?      FK → penjual
id_kategori         Int?      FK → kategori
nama_produk         String?   VARCHAR(100)
harga               Decimal?  (12,2)
foto                String?   TEXT — path file
status_ketersediaan Boolean?
stok_produk         Int?
```

### 4.4 Model `kategori`
```
id_kategori        Int       @id @autoincrement
nama_kategori      String?   UNIQUE VARCHAR(100) — MAKANAN_MINUMAN, AIR_GALON, LAUNDRY
deskripsi_kategori String?   TEXT
```

### 4.5 Model `layanan` (Jasa/Service)
```
layanan_id      Int       @id @autoincrement
mitra_id        Int?      FK → penjual
nama_layanan    String?   VARCHAR(100)
harga           Decimal?  (12,2)
jenis_layanan   String?   VARCHAR(100)
estimasi_durasi String?   VARCHAR(50)
catatan         String?   TEXT
```

### 4.6 Model `pesanan` (Order)
```
pesanan_id        Int       @id @autoincrement
user_id           Int?      FK → pembeli
mitra_id          Int?      FK → penjual
total_harga       Decimal?  (12,2)
alamat_pengiriman String?   TEXT
status_pesanan    String?   VARCHAR(50) — pending/accepted/rejected/processing/delivered/completed/canceled
metode_pembayaran String?   VARCHAR(50) — cash/transfer/e-wallet
waktu_pesan       DateTime?
waktu_dikirim     DateTime?
waktu_diterima    DateTime?
```
Relasi: → detail_pesanan_layanan, → detail_pesanan_produk, → pembayaran, → ulasan

### 4.7 Model `detail_pesanan_produk`
```
id_detail   Int       @id @autoincrement
pesanan_id  Int?      FK → pesanan  (UNIQUE bersama produk_id)
produk_id   Int?      FK → produk
jumlah_item Int?
subtotal    Decimal?  (12,2)
```

### 4.8 Model `detail_pesanan_layanan`
```
id_detail   Int       @id @autoincrement
pesanan_id  Int?      FK → pesanan  (UNIQUE bersama layanan_id)
layanan_id  Int?      FK → layanan
jumlah_item Int?
subtotal    Decimal?  (12,2)
```

### 4.9 Model `pembayaran` (Payment)
```
pembayaran_id     Int       @id @autoincrement
pesanan_id        Int?      FK → pesanan
status_pembayaran String?   VARCHAR(50) — pending/paid/canceled
metode_pembayaran String?   VARCHAR(50)
waktu_pembayaran  DateTime?
```

### 4.10 Model `notifikasi`
```
notifikasi_id Int       @id @autoincrement
user_id       Int?      FK → pembeli
mitra_id      Int?      FK → penjual
isi_pesan     String?   TEXT
waktu_kirim   DateTime?
tipe          String?   VARCHAR(50)
status_dibaca Boolean?
```

### 4.11 Model `ulasan` (Review)
```
id_ulasan    Int       @id @autoincrement
id_pesanan   Int?      FK → pesanan
rating       Int?      (1-5)
komentar     String?   TEXT
waktu_ulasan DateTime?
```

### 4.12 Model `dompet_mitra` (Seller Wallet)
```
id_dompet      Int       @id @autoincrement
mitra_id       Int?      FK → penjual
saldo          Decimal?  (12,2)
status_dompet  String?   VARCHAR(50)
tanggal_dibuat DateTime?
tanggal_diubah DateTime?
```

### 4.13 Model `riwayat_dompet` (Wallet History)
```
id_transaksi        Int       @id @autoincrement
id_dompet           Int?      FK → dompet_mitra
jenis_transaksi     String?   VARCHAR(50)
jumlah_diterima     Decimal?  (12,2)
deskripsi_transaksi String?   TEXT
waktu_transaksi     DateTime?
```

### 4.14 Model `otp_verify`
```
id        Int       @id @autoincrement
phone     String    VARCHAR(20)
otp       String    VARCHAR(5)
expiredAt DateTime
createdAt DateTime  @default(now())
```

---

## 5. API Endpoints — Yang Sudah Terdaftar di `app.ts`

### 5.1 Auth (`/api/auth`)

| Method | Path | Middleware | Fungsi |
|---|---|---|---|
| POST | `/buyer/register` | — | Register pembeli baru (fullName, phoneNumber, birthDate, domicile, faculty, major, address, email). Buat OTP. |
| POST | `/buyer/request-otp` | — | Minta OTP login pembeli (phoneNumber) |
| POST | `/buyer/verify-otp` | — | Verifikasi OTP pembeli → return JWT token `{id, role:"pembeli"}` (1 hari) |
| POST | `/seller/request-otp` | — | Minta OTP untuk register penjual (phoneNumber) |
| POST | `/seller/verify-otp` | — | Verifikasi OTP + register penjual → hash password bcrypt → return JWT `{sellerId, role:"penjual"}` (7 hari) |
| POST | `/seller/register` | — | DUPLIKAT dari `/seller/verify-otp` (handler sama) |
| POST | `/seller/login` | — | Login penjual (email + password) → bcrypt compare → JWT |
| POST | `/seller/forgot-password` | — | Minta OTP reset password (email ATAU phoneNumber) |
| POST | `/seller/verify-reset-otp` | — | Verifikasi OTP reset password |
| PATCH | `/seller/reset-password` | — | Reset password penjual (OTP + newPassword) |
| POST | `/seller/register-store` | JWT + Multer (ownerKtpPhoto, ownerFacePhoto) | Register toko penjual (businessType, storeName, storeAddress) + upload foto |

**Auth flow pembeli**: register → OTP dikirim → verify OTP → dapat JWT
**Auth flow penjual**: request OTP → verify OTP + register (email+password) → login → register store (upload KTP + foto)
**Catatan**: OTP hanya dibuat di DB (tabel `otp_verify`), TIDAK ada integrasi SMS/WhatsApp gateway. OTP 5 digit, expire 5 menit.

### 5.2 User (`/api/users`) — ⚠️ PLACEHOLDER

| Method | Path | Handler |
|---|---|---|
| GET | `/random-quote` | Return random motivational quote |
| GET | `/` | List users (IN-MEMORY) |
| GET | `/:id` | Get user by ID (IN-MEMORY) |
| POST | `/` | Create user (IN-MEMORY) |
| PUT | `/:id` | Update user (IN-MEMORY) |
| DELETE | `/:id` | Delete user (IN-MEMORY) |

**PENTING**: Modul ini BUKAN menggunakan database Prisma. Hanya array in-memory. Ini placeholder/demo.

### 5.3 Product (`/api/product`)

**Seller endpoints (JWT required):**

| Method | Path | Middleware | Fungsi |
|---|---|---|---|
| POST | `/seller/create` | JWT + uploadProductImage | Buat produk (nama, harga, stok, kategori, gambar). File disimpan ke `documents/products/`. |
| GET | `/seller` | JWT | List semua produk milik seller |
| GET | `/seller/category/:category` | JWT | Produk seller filtered by kategori |
| GET | `/seller/:id` | JWT | Detail produk seller |
| PUT | `/seller/:id` | JWT + uploadProductImage | Update produk (termasuk ganti gambar, hapus gambar lama) |
| PATCH | `/seller/:id/stock` | JWT | Update stok saja |
| DELETE | `/seller/:id` | JWT | Hapus produk + file gambar |
| DELETE | `/seller` | JWT | Hapus SEMUA produk seller + file gambar |

**Buyer endpoints (NO auth):**

| Method | Path | Fungsi |
|---|---|---|
| GET | `/buyer` | Semua produk available (stok > 0, status_ketersediaan = true), include info penjual |
| GET | `/buyer/popular` | Top 10 produk by jumlah pesanan |
| GET | `/buyer/recommendations` | Rekomendasi berdasar histori order buyer (jika ada JWT), fallback: produk terbaru |
| GET | `/buyer/search?q=keyword` | Cari produk by nama |
| GET | `/buyer/category/:kategori` | Produk by kategori (makanan-minuman, air-galon, laundry) |
| GET | `/buyer/:id` | Detail produk |

### 5.4 Store (`/api/buyer/stores`) — Buyer-facing

| Method | Path | Fungsi |
|---|---|---|
| GET | `/` | Semua toko (paginated, page/limit query) |
| GET | `/popular` | Toko populer by jumlah pesanan, include avg rating |
| GET | `/recommendations` | Rekomendasi toko berdasar histori buyer |
| GET | `/search?q=keyword` | Cari toko by nama/deskripsi |
| GET | `/category/:kategori` | Toko by kategori usaha |
| GET | `/:id/products` | Produk dari toko tertentu (available + in-stock) |
| GET | `/:id` | Detail toko (jumlah produk, jumlah order, avg rating) |

Filter: hanya toko dengan `status_toko = "OPEN"` dan `status_verifikasi = "approved"` (kecuali `getAllStores` yang filter-nya di-comment).

### 5.5 Order Seller (`/api/seller/orders`) — JWT required semua

| Method | Path | Fungsi |
|---|---|---|
| GET | `/` | Semua pesanan masuk (paginated) |
| GET | `/summary` | Ringkasan: total revenue, count per status, 5 order terbaru, revenue harian 7 hari |
| GET | `/status/:status` | Filter by status (PENDING/ACCEPTED/REJECTED/PROCESSING/DELIVERING/DELIVERED/COMPLETED/CANCELLED) |
| GET | `/:id` | Detail pesanan |
| PATCH | `/:id/accept` | Terima pesanan (pending → accepted). Kirim notifikasi ke buyer. |
| PATCH | `/:id/reject` | Tolak pesanan (pending → rejected) + alasan. Kirim notifikasi. |
| PATCH | `/:id/processing` | Proses pesanan (accepted → processing). Kirim notifikasi. |
| PATCH | `/:id/deliver` | Kirim pesanan (processing → delivered) + note opsional. Set waktu_dikirim. Kirim notifikasi. |

---

## 6. Kode yang ADA tapi BELUM Di-mount di `app.ts`

### 6.1 Buyer Order (`buyer.order.routes.ts`) — ✅ FULLY IMPLEMENTED tapi TIDAK TERDAFTAR

Router ini sudah lengkap tapi TIDAK di-import di `app.ts`:

| Method | Path | Middleware | Fungsi |
|---|---|---|---|
| POST | `/` | JWT | Buat pesanan. Validasi stok, grup by toko, buat pesanan per toko, kurangi stok, buat pembayaran (pending), notif ke seller. |
| GET | `/summary` | JWT | Ringkasan buyer: count per status, total spending, 5 order terbaru, spending bulanan 6 bulan |
| GET | `/status/:status` | JWT | Filter pesanan by status |
| GET | `/track/:id` | JWT | Tracking pesanan (status history timeline) |
| GET | `/` | JWT | Semua pesanan buyer (paginated) |
| GET | `/:id` | JWT | Detail pesanan |
| PATCH | `/:id/cancel` | JWT | Batalkan pesanan (hanya pending). Restore stok. |
| PATCH | `/:id/confirm` | JWT | Konfirmasi terima (delivered → completed). Set pembayaran paid. |
| POST | `/:id/review` | JWT | Review pesanan (rating 1-5, komentar) |

**Service-nya (`buyer.order.service.ts`) adalah file terbesar (636 baris) dengan logic paling kompleks.**

**Input createOrder:**
```json
{
  "id_produk": [
    { "produk_id": 1, "jumlah": 2 },
    { "produk_id": 5, "jumlah": 1 }
  ],
  "alamat_pengiriman": "Gedung A Lt 3",
  "metode_pembayaran": "cash",
  "catatan": "optional note"
}
```

### 6.2 Buyer Product (`buyer.routes.ts`) — ✅ IMPLEMENTED tapi DUPLIKAT

Versi refactored dari buyer product endpoints yang sudah ada di `product.routes.ts`. Versi ini punya:
- Pagination support (page/limit)
- Zod schema validasi yang lebih ketat
- Response format konsisten `{success, message, data, pagination}`
- TAPI TIDAK di-mount di `app.ts` (dan endpoint sudah ada duplikatnya di `/api/product/buyer/*`)

### 6.3 Modul KOSONG (0 byte — belum diimplementasi sama sekali)

| Modul | File | Tujuan yang diharapkan |
|---|---|---|
| **Cart** | cart.controller/routes/schema/service.ts | Keranjang belanja (tampung produk sebelum checkout) |
| **Checkout** | checkout.controller/routes/schema/service.ts | Proses checkout dari cart → pesanan |
| **Payment** | payment.controller/routes/schema/service.ts | Manajemen pembayaran (konfirmasi, bukti bayar, dll) |
| **Notification** | notification.controller/routes/schema/service.ts | CRUD + read/unread notifikasi (data notifikasi sudah dibuat oleh order service) |
| **Partner** | partner.controller/routes/schema/service.ts | Manajemen profil mitra/penjual (edit toko, verifikasi, dll) |

---

## 7. Middleware

### 7.1 JWT Middleware (`jwt.middleware.ts`)
- Baca token dari header `Authorization: Bearer <token>`
- Verify dengan `JWT_SECRET` dari env
- Attach decoded payload ke `(req as any).user`
- Payload pembeli: `{ id: number, role: "pembeli" }`
- Payload penjual: `{ sellerId: number, role: "penjual" }`
- Return 401 jika token invalid/missing

### 7.2 Multer Middleware (`multer.seller.ts`)
- `uploadSellerDocs` — disk storage, 10MB max. Route by fieldname:
  - `ownerKtpPhoto` → `./documents/ktp/`
  - `ownerFacePhoto` → `./documents/owner_face/`
  - `gambar` → `./documents/products/`
- `uploadProductImage` — memory storage, 5MB max, single file `"gambar"`
- `logFileInfo` — debug middleware (console.log req.body/file/files)

---

## 8. Zod Validation Schemas — Ringkasan

### Auth schemas:
- `registerBuyerSchema`: fullName, phoneNumber (min 10), birthDate, domicile, faculty, major, address, email
- `loginOtpSchema`: phoneNumber (min 10)
- `verifyOtpSchema`: phoneNumber (min 10), otp (exact 5 chars)
- `requestSellerOtpSchema`: phoneNumber (min 10)
- `verifyOtpAndRegisterSellerSchema`: phoneNumber, otp, email, password (min 6)
- `registerSellerStoreSchema`: businessType (enum), ownerKtpPhoto, storeName (min 3), storeAddress (min 5), ownerFacePhoto
- `forgotPasswordSellerSchema`: email (opt) | phoneNumber (opt)
- `verifyResetOtpSellerSchema`: email (opt) | phoneNumber (opt) + otp
- `resetPasswordSellerSchema`: email (opt) | phoneNumber (opt) + otp + newPassword (min 6)

### Product schemas:
- `createProductSchema`: nama (min 1), harga (positive number), stok (min 0), kategori (enum: MAKANAN_MINUMAN, AIR_GALON, LAUNDRY)
- `updateProductSchema`: semua field optional
- `updateStockSchema`: stok (min 0)

### Order schemas (seller):
- `orderStatusSchema`: status enum (PENDING, ACCEPTED, REJECTED, PROCESSING, DELIVERING, DELIVERED, COMPLETED, CANCELLED) — UPPERCASE
- `rejectOrderSchema`: reason (min 1)
- `deliveryNoteSchema`: note (optional)

### Order schemas (buyer):
- `createOrderSchema`: id_produk (array of {produk_id, jumlah}), alamat_pengiriman (min 5), metode_pembayaran (cash/transfer/e-wallet), catatan (opt)
- `orderStatusSchema`: status enum (pending, accepted, rejected, processing, delivered, completed, canceled) — lowercase
- `cancelOrderSchema`: reason (min 5)
- `reviewOrderSchema`: rating (1-5), komentar (opt)

### Store/Buyer schemas:
- `storeIdSchema`, `productIdSchema`: id string (must be numeric)
- `storeCategorySchema`, `productCategorySchema`: kategori enum (makanan-minuman, air-galon, laundry)
- `storeSearchSchema`, `productSearchSchema`: q (min 1)
- `paginationSchema`: page (default 1), limit (default 10)

---

## 9. Business Logic Flow

### 9.1 Alur Pemesanan (Order Flow)
```
Buyer browse produk → Buyer createOrder (multi-produk, multi-toko)
  ↓
Sistem: buat pesanan per toko, kurangi stok, buat pembayaran (pending), notif seller
  ↓
Seller: accept / reject pesanan
  ↓ accept
Seller: processing (sedang diproses)
  ↓
Seller: deliver (set waktu_dikirim)
  ↓
Buyer: confirm (delivered → completed, pembayaran → paid)
  ↓
Buyer: review (rating + komentar)
```

### 9.2 Status Transitions
```
pending → accepted (by seller)
pending → rejected (by seller, with reason)
pending → canceled (by buyer, stock restored)
accepted → processing (by seller)
processing → delivered (by seller)
delivered → completed (by buyer, payment marked paid)
```

### 9.3 Alur Registrasi Penjual
```
Request OTP (phoneNumber) → Verify OTP + Register (email, password) → Login → Register Store (businessType, KTP, foto, nama toko, alamat) → status_verifikasi = "pending" → (admin approval needed — NOT IMPLEMENTED)
```

---

## 10. Masalah & Hutang Teknis yang Diketahui

### 🔴 Critical
1. **`console.log(JWT_SECRET)`** di `jwt.middleware.ts` dan `auth.service.ts` — print secret ke console. Hapus sebelum deploy.
2. **OTP tidak dikirim** — OTP hanya disimpan di DB, tidak ada integrasi SMS/WhatsApp gateway. User tidak bisa tahu OTP-nya kecuali baca langsung dari DB.

### 🟡 Major
3. **5 modul kosong** — Cart, Checkout, Payment, Notification, Partner belum diimplementasi sama sekali.
4. **Buyer Order routes tidak di-mount** — `buyer.order.routes.ts` sudah lengkap tapi tidak di-import di `app.ts`. Buyer tidak bisa buat pesanan.
5. **User module placeholder** — Modul `/api/users` pakai in-memory array, bukan database.
6. **Duplikat PrismaClient** — Setiap service file buat `new PrismaClient()` sendiri. Harusnya pakai singleton.
7. **File .js duplikat** — Semua modul punya file `.js` (compiled output) yang ikut ke repo. Seharusnya di-gitignore.
8. **Tidak ada CORS** — Tidak bisa diakses dari frontend di domain berbeda.
9. **Tidak ada global error handler** — Error unhandled akan crash server.

### 🟠 Minor
10. **Status case mismatch** — Seller order schema pakai UPPERCASE (PENDING), buyer pakai lowercase (pending). DB pakai lowercase.
11. **Duplikat buyer product endpoints** — Ada 2 implementasi: di `product.controller.ts` dan di `buyer.controller.ts`. Yang di buyer.* lebih baik (ada pagination) tapi tidak di-mount.
12. **`registerSellerStore` tidak pakai Zod** — Schema sudah ada tapi controller validasi manual.
13. **Admin verification flow belum ada** — Penjual bisa register toko tapi tidak ada mekanisme admin untuk approve/reject.
14. **Tidak ada rate limiting** — OTP bisa di-spam tanpa batas.
15. **Tidak ada script `build`, `dev`, `lint`, `test`** — Hanya ada `npm start`.

---

## 11. Apa yang Perlu Dilanjutkan (Saran Prioritas)

### Prioritas 1 — Fix Broken Stuff
- [ ] Mount `buyer.order.routes` di `app.ts` (buyer tidak bisa order tanpa ini)
- [ ] Hapus `console.log(JWT_SECRET)` di jwt.middleware dan auth.service
- [ ] Tambah CORS middleware
- [ ] Tambah global error handler
- [ ] Buat Prisma singleton (shared instance)
- [ ] Gitignore file `.js` yang auto-generated

### Prioritas 2 — Implement Empty Modules
- [ ] **Notification** — CRUD notifikasi (data sudah dibuat oleh order service, tinggal bikin endpoint read/mark-read)
- [ ] **Payment** — Konfirmasi pembayaran, upload bukti bayar, integrasi payment gateway (opsional)
- [ ] **Partner** — Profil penjual, edit toko, ganti password, dashboard seller
- [ ] **Cart** — Keranjang belanja (opsional, saat ini buyer langsung order tanpa cart)
- [ ] **Checkout** — Flow checkout dari cart (tergantung implementasi cart)

### Prioritas 3 — Fitur Tambahan
- [ ] Admin panel / admin role untuk verifikasi penjual
- [ ] Integrasi SMS/WhatsApp gateway untuk kirim OTP
- [ ] Profil pembeli (edit data, ganti alamat)
- [ ] Layanan (jasa) — schema DB sudah ada, tapi tidak ada endpoint CRUD
- [ ] Dompet mitra — schema sudah ada, tapi belum ada logic pencairan/penarikan
- [ ] Image serving — saat ini foto disimpan sebagai path string, perlu endpoint untuk serve file
- [ ] Rate limiting untuk OTP

### Prioritas 4 — DevOps & Quality
- [ ] Tambah npm scripts: `dev` (nodemon/tsx watch), `build`, `lint`, `test`
- [ ] Environment config validation (pastikan .env vars ada)
- [ ] Logging yang proper (winston/pino)
- [ ] Unit & integration tests
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Docker setup untuk deployment

---

## 12. Environment Variables

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/telivery"
PORT=3000
JWT_SECRET=cheva_telivery_dev_secret_change_me
```

---

## 13. Cara Menjalankan

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Test koneksi DB
npx ts-node scripts/test-db.ts

# Start server
npm start
# → Server is running on http://localhost:3000

# Test
curl http://localhost:3000
# → "Welcome to the Cheva Telivery API!"
```

---

*Dokumen ini mencakup 100% source code yang ada di repository per tanggal 14 Juni 2026. Semua file `.ts` sudah dibaca dan didokumentasikan.*
