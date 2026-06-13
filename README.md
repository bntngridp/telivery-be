# Cheva-Telivery

Backend API untuk marketplace **delivery kampus** (chevelierlab-sas) — mirip GoFood/GrabFood versi universitas.

Mahasiswa pesan makanan, minuman, laundry, atau antar galon dari toko-toko di sekitar kampus. Dua role:

- **Pembeli (Buyer/Mahasiswa)** — browse toko, tambah ke keranjang, checkout, bayar, review
- **Penjual (Seller/Mitra)** — kelola toko & produk, terima/proses pesanan, tarik saldo dompet

## Features

### Buyer (Mahasiswa)
- Registrasi via OTP WhatsApp/SMS
- Browse toko, produk, dan layanan (laundry/galon)
- Cart + Checkout multi-store (1 pesanan per toko)
- Upload bukti pembayaran
- Tracking pesanan real-time
- Review + rating
- Notifikasi real-time (unread badge, mark-read)
- Rekomendasi personal (berdasarkan histori order)

### Seller (Mitra)
- Registrasi + upload KTP & foto pemilik
- Admin verification flow (auto-approve/reject)
- CRUD produk (image upload, auto-compress)
- CRUD layanan (jasa: laundry, antar galon)
- Order management (accept → process → deliver)
- Konfirmasi/tolak pembayaran
- Dompet digital (auto-credit saat order completed)
- Riwayat transaksi
- Buka/tutup toko (real-time)
- Notifikasi pesanan masuk

### Admin
- Login (env-based credentials)
- Approve/reject toko baru
- List toko pending

### System
- Health check dengan DB ping
- Global rate limiting (100 req/15min)
- Per-endpoint OTP rate limit (5 req/15min)
- OTP gateway integration (Fonnte/Twilio/generic, DRY_RUN mode default)
- Global error handler (Zod, Prisma, Multer, HttpError)
- Static file serving untuk upload (`/documents/...`)
- `last_login_at` tracking
- 84+ API endpoints

## Tech Stack

| Komponen | Versi |
|---|---|
| Node.js | 20+ |
| TypeScript | 5.8+ |
| Express | 5.1 |
| Prisma ORM | 6.13 |
| MySQL | 8.0+ |
| JWT (jsonwebtoken) | 9.0 |
| Bcrypt | 3.0 |
| Zod | 3.22 |
| Multer | 2.0 |
| Sharp (image optimization) | latest |
| express-rate-limit | 7+ |
| Axios (OTP gateway) | latest |
| CORS | 2.8 |

## Project Structure

```
telivery-be/
├── docs/                          # 📚 Dokumentasi
│   ├── postman/                   # Postman collection
│   │   ├── Cheva-Telivery.postman_collection.json
│   │   └── README.md
│   └── API.md                     # Coming soon
│
├── prisma/                        # 🗄️ Database
│   ├── schema.prisma              # 14 models
│   └── migrations/                # 4 migrations
│
├── documents/                     # 📁 Uploaded files
│   ├── ktp/                       # (gitignored, .gitkeep)
│   ├── owner_face/
│   ├── products/
│   ├── payment_receipts/
│   └── other/
│
├── scripts/                       # 🔧 Utility scripts
│   ├── test-db.ts                 # DB connection test
│   └── e2e-test.sh                # (coming soon) Full e2e test
│
├── issues/                        # 📋 Issue tracking (Markdown)
│   ├── 008-notification.md
│   ├── 009-admin-verification.md
│   ├── 010-quick-wins.md
│   ├── 011-cart-checkout.md
│   └── ...
│
└── src/
    ├── app.ts                     # Express setup + middleware
    ├── server.ts                  # Entrypoint
    ├── config/                    # ⚙️ Shared config
    │   ├── prisma.ts              # Prisma singleton
    │   ├── env.ts                 # Env validation
    │   └── constants.ts           # Status enums, upload paths
    │
    ├── middlewares/               # 🛡️ Global middleware
    │   ├── jwt.middleware.ts      # JWT verify (3 roles: pembeli/penjual/admin)
    │   ├── multer.seller.ts       # File upload (disk, with type filter)
    │   └── error.middleware.ts    # Global error handler (Zod/Prisma/Multer)
    │
    ├── utils/                     # 🔨 Helpers
    │   ├── response.ts            # success/created/paginated/fail
    │   ├── errors.ts              # HttpError classes
    │   ├── asyncHandler.ts
    │   ├── helpers.ts             # generateOtp, sanitizeFileName, dll
    │   └── imageOptimizer.ts      # sharp integration
    │
    ├── services/                  # 💼 Cross-module services
    │   └── notification/
    │       └── otp.sender.ts      # OTP via Fonnte/Twilio/dry-run
    │
    └── modules/                   # 📦 Feature modules (11 implemented)
        ├── auth/                  # OTP, login (buyer/seller/admin)
        ├── buyer/                 # Profile CRUD
        ├── cart/                  # Cart CRUD
        ├── checkout/              # Cart → Orders atomic
        ├── notification/          # Read/mark-read/delete (buyer+seller)
        ├── order/                 # Order management (buyer + seller + wallet)
        ├── partner/               # Seller store profile
        ├── payment/               # Upload receipt, confirm/reject
        ├── product/               # CRUD + buyer katalog
        ├── service/               # Layanan (jasa) CRUD + buyer list
        ├── store/                 # Buyer katalog toko + filter approved+open
        └── admin/                 # Approve/reject store
```

## API Endpoints (84+)

Lihat lengkap di:
- 📦 **[Postman Collection](docs/postman/Cheva-Telivery.postman_collection.json)** — import di Postman
- 📋 **[docs/postman/README.md](docs/postman/README.md)** — panduan testing

Atau lihat langsung di [`src/app.ts`](src/app.ts).

### Quick Reference

```
GET    /                                # Welcome
GET    /health                         # Health check (DB ping)

# Auth (Buyer)
POST   /api/auth/buyer/register
POST   /api/auth/buyer/request-otp     # 5/15min
POST   /api/auth/buyer/verify-otp

# Auth (Seller)
POST   /api/auth/seller/request-otp   # 5/15min
POST   /api/auth/seller/verify-otp
POST   /api/auth/seller/register-store # multipart
POST   /api/auth/seller/login
POST   /api/auth/seller/forgot-password  # 5/15min
POST   /api/auth/seller/verify-reset-otp
PATCH  /api/auth/seller/reset-password

# Auth (Admin)
POST   /api/auth/admin/login

# Admin
GET    /api/admin/stores/pending
PATCH  /api/admin/stores/:id/approve
PATCH  /api/admin/stores/:id/reject

# Buyer Profile
GET    /api/buyer/profile
PATCH  /api/buyer/profile

# Product (Seller) — all JWT
POST   /api/product/seller/create      # multipart
GET    /api/product/seller
GET    /api/product/seller/category/:category
GET    /api/product/seller/:id
PUT    /api/product/seller/:id        # multipart
PATCH  /api/product/seller/:id/stock
DELETE /api/product/seller/:id
DELETE /api/product/seller

# Product (Buyer) — public
GET    /api/buyer/products
GET    /api/buyer/products/:id
GET    /api/buyer/products/search?q=
GET    /api/buyer/products/popular
GET    /api/buyer/products/recommendations  # optional JWT
GET    /api/buyer/products/category/:kategori

# Store (Buyer) — public, APPROVED+OPEN only
GET    /api/buyer/stores
GET    /api/buyer/stores/:id
GET    /api/buyer/stores/search?q=
GET    /api/buyer/stores/category/:kategori
GET    /api/buyer/stores/popular
GET    /api/buyer/stores/recommendations  # optional JWT
GET    /api/buyer/stores/:id/products

# Partner (Seller Profile) — JWT
GET    /api/seller/profile
PATCH  /api/seller/profile

# Order (Buyer) — JWT
POST   /api/buyer/orders               # direct
GET    /api/buyer/orders
GET    /api/buyer/orders/summary
GET    /api/buyer/orders/status/:status
GET    /api/buyer/orders/:id
GET    /api/buyer/orders/:id/track
PATCH  /api/buyer/orders/:id/cancel
PATCH  /api/buyer/orders/:id/confirm   # triggers wallet credit
POST   /api/buyer/orders/:id/review

# Order (Seller) — JWT
GET    /api/seller/orders
GET    /api/seller/orders/summary
GET    /api/seller/orders/status/:status
GET    /api/seller/orders/:id
PATCH  /api/seller/orders/:id/accept
PATCH  /api/seller/orders/:id/reject
PATCH  /api/seller/orders/:id/processing
PATCH  /api/seller/orders/:id/deliver

# Service/Layanan (Seller) — JWT
POST   /api/service/seller
GET    /api/service/seller
GET    /api/service/seller/:id
PUT/PATCH /api/service/seller/:id
DELETE /api/service/seller/:id

# Service/Layanan (Buyer) — public
GET    /api/service/buyer/store/:storeId

# Cart — JWT
POST   /api/buyer/cart/items
GET    /api/buyer/cart
PATCH  /api/buyer/cart/items/:id
DELETE /api/buyer/cart/items/:id
DELETE /api/buyer/cart

# Checkout — JWT
POST   /api/buyer/checkout             # atomic: cart → orders

# Payment
POST   /api/payments/buyer/pesanan/:pesananId/receipt  # JWT, multipart
PATCH  /api/payments/seller/pembayaran/:pembayaranId/confirm  # JWT
PATCH  /api/payments/seller/pembayaran/:pembayaranId/reject   # JWT

# Notification (Buyer) — JWT
GET    /api/buyer/notifications
GET    /api/buyer/notifications/unread-count
PATCH  /api/buyer/notifications/:id/read
PATCH  /api/buyer/notifications/read-all
DELETE /api/buyer/notifications/:id

# Notification (Seller) — JWT
GET    /api/seller/notifications
GET    /api/seller/notifications/unread-count
PATCH  /api/seller/notifications/:id/read
PATCH  /api/seller/notifications/read-all
DELETE /api/seller/notifications/:id
```

## Getting Started

### 1. Prerequisites

- **Node.js 20+** ([download](https://nodejs.org))
- **MySQL 8.0+** (atau DBngin / XAMPP / Docker)
- **npm** (built-in)

### 2. Clone & Install

```bash
git clone https://github.com/bntngridp/telivery-be.git
cd telivery-be
npm install
```

### 3. Setup Environment

Buat file `.env` di root:
```env
DATABASE_URL="mysql://root@127.0.0.1:3306/telivery"
PORT=3000
JWT_SECRET=change_me_to_a_random_long_string
ADMIN_EMAIL=bntngrid@gmail.com
ADMIN_PASSWORD=admin123
# Optional — untuk kirim OTP real ke WhatsApp
# OTP_GATEWAY_URL=https://api.fonnte.com/send
# OTP_GATEWAY_TOKEN=your_fonnte_token
# OTP_DRY_RUN=false
```

### 4. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Test koneksi
npx ts-node scripts/test-db.ts
```

### 5. Start Server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

Server akan jalan di `http://localhost:3000`.

### 6. Test API

Buka browser ke `http://localhost:3000/health` — harus return:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-06-14T06:47:00.000Z",
  "database": "connected",
  "uptime": 5.2,
  "memory": 307000000
}
```

Atau import Postman collection: [docs/postman/](docs/postman/)

## NPM Scripts

```bash
npm run dev         # tsx watch (hot reload)
npm run build       # TypeScript compile to dist/
npm start           # node dist/server.js (production)
npm run start:dev   # ts-node src/server.ts (one-time run)
npm run lint        # eslint check
npm run lint:fix    # eslint auto-fix
npm run format      # prettier write
npm run format:check
```

## Database

14 models di Prisma schema:
- `pembeli` (buyer)
- `penjual` (seller)
- `kategori`
- `produk`
- `layanan`
- `pesanan` (order)
- `detail_pesanan_produk`
- `detail_pesanan_layanan`
- `pembayaran` (payment)
- `notifikasi` (notification)
- `ulasan` (review)
- `dompet_mitra` (seller wallet)
- `riwayat_dompet` (wallet history)
- `otp_verify`
- `cart`

Lihat [`prisma/schema.prisma`](prisma/schema.prisma) untuk detail.

## Response Format

Semua response pakai format konsisten:

```json
// Success
{
  "success": true,
  "message": "...",
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
}

// Error
{
  "success": false,
  "message": "...",
  "error": "code_or_message",
  "errors": { "field": ["message"] }  // optional, untuk Zod validation
}
```

## Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (Zod validation, missing fields) |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate, state mismatch) |
| 422 | Validation failed (legacy) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (DB down — health check) |

## Architecture Highlights

- **Feature-first folder** (`src/modules/<feature>/{controller,service,schema,routes}.ts`)
- **Shared Prisma singleton** di `src/config/prisma.ts` (tidak ada `new PrismaClient()` di service)
- **`asyncHandler` wrapper** untuk semua controller async — error otomatis ke global handler
- **Typed errors** (`NotFoundError`, `BadRequestError`, dll) dari `src/utils/errors.ts`
- **Global error handler** translate ke HTTP response (termasuk Zod, Prisma, Multer)
- **Static file serving** untuk upload (`/documents/...`)
- **Rate limiting** di 2 level: per-endpoint (OTP 5/15min) + global (100/15min)
- **Atomic transactions** untuk operasi multi-table (confirmOrder, checkout)
- **Wallet auto-credit** saat order completed (via `$transaction`)
- **Image auto-compress** via Sharp (resize max 1280px, JPEG quality 80)

## Issue Tracking

Lihat [`issues/`](issues/) untuk detail per-fitur:
- `issue.md` — overview + 20 issues
- `issue1.md` — Static file serving + Zod error handler
- `008-notification.md` — Notification module
- `009-admin-verification.md` — Admin flow
- `010-quick-wins.md` — Health check + rate limit + last_login
- `011-cart-checkout.md` — Cart + checkout
- (more)

## License

WIP — university assignment project.

## Author

- **Original:** [chevalierlab-sas/CLearn-TelIvery-Web-BE](https://github.com/chevalierlab-sas/CLearn-TelIvery-Web-BE)
- **Current fork:** [bntngridp/telivery-be](https://github.com/bntngridp/telivery-be)
