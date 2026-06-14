# Issue 12 — [Ops] Implement GitHub Actions CI Pipeline

**Status:** 🟡 Open | **Priority:** P1 | **Severity:** 🟡 Major

---

## Context

Proyek memiliki **114 unit + integration tests** yang semuanya 100% passing. Integration tests menggunakan supertest + MySQL asli (database `telivery`). Saat ini tidak ada proses otomatis yang memastikan bahwa perubahan kode baru tidak merusak pipeline CI di masa depan. **Kita perlu GitHub Actions CI** yang otomatis menjalankan:

1. **Linter** (`npm run lint`)
2. **Formatter** (`npm run format:check`)
3. **TypeScript Build** (`npm run build`)
4. **Tests** (`npm run test`)

Semua ini harus berjalan di container **MySQL 8.0** yang disediakan oleh GitHub Actions, tanpa perlu database eksternal.

---

## Objective

Buat file `.github/workflows/ci.yml` yang mendefinisikan workflow CI untuk branch `main`.

Pipeline harus:
- Trigger: `push` dan `pull_request` ke `main`
- Menyediakan **MySQL 8.0 service container**
- Setup Node.js v20
- Install dependencies
- Generate Prisma Client + deploy migration
- Jalankan lint → format check → build → test
- Pastikan `DATABASE_URL` di-set untuk konek ke service MySQL di runner
- Buat environment variable: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

---

## Task Requirements

### 1. Struktur Folder

Buat direktori dan file:
```
.github/
└── workflows/
    └── ci.yml
```

### 2. Isi File `ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: telivery
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=10

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate
        env:
          DATABASE_URL: mysql://root:root@127.0.0.1:3306/telivery

      - name: Run Prisma Migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: mysql://root:root@127.0.0.1:3306/telivery

      - name: Run Linter
        run: npm run lint
        env:
          DATABASE_URL: mysql://root:root@127.0.0.1:3306/telivery
          JWT_SECRET: ci_jwt_secret
          ADMIN_EMAIL: admin@test.com
          ADMIN_PASSWORD: admin123

      - name: Check Formatting
        run: npm run format:check

      - name: TypeScript Build
        run: npm run build
        env:
          DATABASE_URL: mysql://root:root@127.0.0.1:3306/telivery
          JWT_SECRET: ci_jwt_secret
          ADMIN_EMAIL: admin@test.com
          ADMIN_PASSWORD: admin123

      - name: Run Tests
        run: npm run test
        env:
          DATABASE_URL: mysql://root:root@127.0.0.1:3306/telivery
          JWT_SECRET: ci_jwt_secret
          ADMIN_EMAIL: admin@test.com
          ADMIN_PASSWORD: admin123
          NODE_ENV: test
```

### 3. Environment Variables

**Wajib** di-set di setiap step yang butuh koneksi database:

| Variable | Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `mysql://root:root@127.0.0.1:3306/telivery` | Koneksi ke MySQL service di runner |
| `JWT_SECRET` | `ci_jwt_secret` | Secret untuk JWT (tidak kritis di CI) |
| `ADMIN_EMAIL` | `admin@test.com` | Admin credentials untuk test |
| `ADMIN_PASSWORD` | `admin123` | Admin password untuk test |
| `NODE_ENV` | `test` | Mode test (global rate limiter = 1000 req/15min) |

### 4. Catatan Penting

- **MySQL Health Check**: Jangan lanjut sebelum MySQL siap. Pakai `--health-cmd="mysqladmin ping"` dengan `health-interval=10s` dan `health-retries=10`.
- **Service Port**: MySQL service container menggunakan `ports: 3306:3306`. Prisma mengakses via `127.0.0.1:3306`.
- **Prisma deploy**: Pakai `prisma migrate deploy` (bukan `prisma migrate dev`) karena tidak butuh generate migration baru — hanya apply existing.
- **npm ci vs npm install**: Pakai `npm ci` karena lebih cepat, deterministik, dan cocok untuk CI pipeline (mengunci versi dari `package-lock.json`).
- **Run order**: lint → format → build → test. Jika lint gagal, tes tidak perlu dijalankan.

### 5. Titik Gagal Potensial (Harus Di-handle)

| Masalah | Solusi |
|---|---|
| MySQL belum connect | `health-retries: 10` + `health-interval: 10s` = menunggu sampai 100 detik |
| Prisma bisa konek sebelum MySQL benar-benar siap | Pastikan health check mengirim `mysqladmin ping` |
| `npx vitest run` membutuhkan `NODE_ENV=test` | Set di env step Run Tests |
| `npm run build` compile ke `dist/` | Tidak perlu konflik — setiap runner fresh |
| `dotenv` membaca `.env` lokal | Lebih baik set env via step-level `env:` karena `.env` mungkin berisi credential production |

---

## Acceptance Criteria

- [ ] File `.github/workflows/ci.yml` dibuat dengan benar
- [ ] Workflow terdeteksi di GitHub Actions tab setelah di-push
- [ ] Pipeline berjalan otomatis saat push ke `main` dan PR
- [ ] MySQL 8.0 service container berjalan tanpa error koneksi
- [ ] `npx prisma generate` berhasil — semua model Prisma di-generate
- [ ] `npx prisma migrate deploy` berjalan — semua migration diterapkan
- [ ] `npm run lint` lulus tanpa error
- [ ] `npm run format:check` lulus (All matched files use Prettier code style)
- [ ] `npm run build` menghasilkan `dist/` tanpa error kompilasi
- [ ] `npm run test` menjalankan 114+ tests dan lulus 100% (0 failed, 0 skipped)
- [ ] Workflow tidak membutuhkan secrets/credentials tambahan selain yang di-hardcode di file YAML
- [ ] Durasi workflow tidak melebihi ~10 menit

---

## Files Affected

| File | Change |
|---|---|
| `.github/workflows/ci.yml` | **Create** (baru) |

---

## Dependencies

Tidak ada. GitHub Actions sudah built-in dengan GitHub. Cukup buat file `.yml` dan push.

---

## Cara Verifikasi

Setelah di-push ke `main`:
1. Buka **GitHub** → **Actions** tab di `bntngridp/telivery-be`
2. Lihat workflow bernama **"CI"** berjalan
3. Klik workflow → `build` → lihat tiap step
4. Pastikan semua steps hijau (✅)
5. Pull request baru → workflow otomatis jalan sebagai check

---

## Related Issues

- #2 (NPM scripts — `lint`, `format:check`, `build`, `test` — semua digunakan di CI)
- #10 (NODE_ENV=test untuk global rate limiter threshold 1000)
- #8, #9 (Integration tests yang butuh MySQL — dijalankan di CI)
