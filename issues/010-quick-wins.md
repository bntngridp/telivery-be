# Issue 10 — [Chore] System Reliability Quick Wins

**Status:** 🟡 Open | **Priority:** P1 | **Severity:** 🟡 Major

---

## Context

Ada 3 perbaikan kecil yang memberikan dampak besar pada reliability dan observability:

1. **Health check endpoint** (`GET /health`) saat ini hanya return `{ success: true }` tanpa benar-benar mengecek koneksi ke database. Saat DB down, `/health` tetap return `200 OK` — ini misleading untuk monitoring tools.

2. **Tidak ada global rate limit** — saat ini hanya OTP endpoint yang dilindungi rate limiter. Endpoint lain (create product, create order, login, dll) rentan di-brute-force.

3. **Field `last_login_at`** tidak ada — kita tidak tahu kapan terakhir kali user login. Ini penting untuk audit dan deteksi akun tidak aktif.

Ketiga fix ini low effort (< 30 menit), tidak butuh endpoint baru, dan bisa langsung memberikan ROI tinggi.

---

## Objective

1. Update `GET /health` agar melakukan DB ping (`prisma.$queryRaw\`SELECT 1\``) dan return status DB
2. Tambah global rate limiter untuk semua route POST/PATCH/PUT di `app.ts` (100 request per 15 menit per IP)
3. Tambah field `last_login_at` di model `pembeli` dan `penjual` + update saat login sukses via Prisma migration

---

## Task Requirements

### Task 1: Health Check dengan DB Ping

**File:** `src/app.ts`

Ubah handler health dari:
```ts
app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});
```

Menjadi:
```ts
import { prisma } from './config/prisma';

app.get('/health', async (_req, res) => {
    let dbStatus = 'disconnected';
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (e) {
        dbStatus = 'disconnected';
    }

    const statusCode = dbStatus === 'connected' ? 200 : 503;
    res.status(statusCode).json({
        success: dbStatus === 'connected',
        status: statusCode === 200 ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        uptime: process.uptime(),
        memory: process.memoryUsage().rss,
    });
});
```

**Catatan:** Wrapper handler harus async tapi tanpa `asyncHandler` agar tidak terpengaruh global error handler (health check harus selalu return JSON).

### Task 2: Global Rate Limit

**File:** `src/app.ts`

Tambah global rate limiter untuk semua write endpoint:

```ts
import rateLimit from 'express-rate-limit';

const globalWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,       // 15 menit
    max: 100,                        // maks 100 request per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Terlalu banyak request. Coba lagi dalam 15 menit.',
        error: 'TOO_MANY_REQUESTS',
    },
});

// Taruh SETELAH middleware json/urlencoded tapi SEBELUM route definitions:
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalWriteLimiter);   // <-- disini
app.use('/documents', express.static(...));
// ... lalu route definitions
```

**Note:** Jangan override rate limiter OTP yang sudah ada — OTP limiter yang lebih ketat (5 req/15 min) akan diproses lebih dulu oleh route-level middleware setelah global limiter, jadi OTP tetap strict.

### Task 3: Field `last_login_at` + Migration

#### 3a. Prisma Schema

Tambahkan di model `pembeli` (setelah field `birth_date`):

```prisma
last_login_at  DateTime?
```

Tambahkan di model `penjual` (setelah field `waktu_dibuat`):

```prisma
last_login_at  DateTime?
```

#### 3b. Migration

Jalankan:
```bash
npx prisma migrate dev --name add_last_login_at_to_users
```

#### 3c. Auth Service — update login

**File:** `src/modules/auth/auth.service.ts`

Tambahkan update `last_login_at` di setiap method yang berhasil login:

**`verifyOtp` — login buyer:**
```ts
async verifyOtp(data: VerifyOtpDto) {
    // ... existing logic ...
    const token = signToken({ id: buyer.user_id, role: 'pembeli' }, ...);
    await prisma.otp_verify.delete({ where: { id: otpRecord.id } });

    // ADD: update last_login_at
    await prisma.pembeli.update({
        where: { user_id: buyer.user_id },
        data: { last_login_at: new Date() },
    }).catch(() => {}); // fire-and-forget, tidak critical

    return { token };
},
```

**`loginSeller` — login seller:**
```ts
async loginSeller(email: string, password: string) {
    // ... existing logic ...
    const token = signToken(...);

    // ADD: update last_login_at
    await prisma.penjual.update({
        where: { mitra_id: seller.mitra_id },
        data: { last_login_at: new Date() },
    }).catch(() => {});

    return { token };
},
```

**`adminLogin` — login admin:** (skip, admin tidak pakai tabel penjual/pembeli)

**`verifyOtpAndRegisterSeller` — register + langsung login seller:**
```ts
// Setelah seller.create, tambahkan:
// last_login_at sudah di-set di atas, atau:
// (tidak perlu — seller baru, belum login. Tapi kalau register = langsung login, boleh ditambahkan)
// Skip untuk sekarang karena langsung login tidak berlaku untuk seller (harus login ulang).
```

### 4. Import `prisma` di `app.ts` (untuk health check)

Pastikan import prisma dari config singleton:
```ts
import { prisma } from './config/prisma';
```

Hapus import local PrismaClient apa pun.

---

## Acceptance Criteria

- [ ] `GET /health` return 200 dengan `database: "connected"` saat MySQL menyala
- [ ] `GET /health` return 503 dengan `database: "disconnected"` saat MySQL mati — json body tetap ada (no crash)
- [ ] Response health checkpoint berisi: `success`, `status`, `timestamp`, `database`, `uptime`, `memory`
- [ ] Rate limiter global berfungsi: endpoint POST/PATCH/PUT dibatasi 100 request per 15 menit per IP
- [ ] Rate limiter OTP tetap berfungsi (5 req/15 min per IP) — teruji ok dari issue #3
- [ ] Migration `add_last_login_at_to_users` berjalan bersih — 2 kolom baru (pembeli + penjual)
- [ ] Saat buyer `verifyOtp` sukses → `pembeli.last_login_at` terupdate
- [ ] Saat seller `loginSeller` sukses → `penjual.last_login_at` terupdate
- [ ] Tidak ada compile error + tidak ada duplikat PrismaClient
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `src/app.ts` | Refactor health handler → DB ping + tambah global rate limiter |
| `prisma/schema.prisma` | + `last_login_at DateTime?` di `pembeli` dan `penjual` |
| `prisma/migrations/` | Auto-generated via `prisma migrate dev` |
| `src/modules/auth/auth.service.ts` | `verifyOtp` → update `pembeli.last_login_at`; `loginSeller` → update `penjual.last_login_at` |

---

## Dependencies

Semua sudah terinstall dari issue sebelumnya:
- `express-rate-limit` (dari issue #3)
- Tidak ada dependency baru

---

## Testing Checklist

```bash
# 1. Test health dengan DB menyala
curl http://localhost:3000/health
# expect: 200, database: "connected"

# 2. Test health dengan DB mati (stop DBngin sejenak)
# expect: 503, database: "disconnected", body tetap JSON

# 3. Test global rate limit
for i in $(seq 1 101); do
  curl -s -o /dev/null -w "  hit $i: HTTP %{http_code}\n" \
    -X POST -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"x"}' \
    http://localhost:3000/api/auth/seller/login
done
# expect: hit 1-100 = 400 (bad request) or 404, hit 101 = 429

# 4. Verify last_login_at di DB
# Setup: register buyer, verify OTP
# Query: SELECT last_login_at FROM pembeli WHERE phone_number = '...'
# expect: timestamp terisi (bukan NULL)

# 5. Verify penjual last_login_at
# Setup: register+login seller
# Query: SELECT last_login_at FROM penjual WHERE email = '...'
# expect: timestamp terisi (bukan NULL)
```

---

## Related Issues

- #3 (OTP rate limiting — sudah lebih strict dari global limiter)
- #9 (Admin verification — admin login tidak update last_login_at karena tidak ada tabel admin)
