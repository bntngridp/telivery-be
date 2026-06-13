# Issue 3 — [Feature] Implement OTP Gateway Integration & Rate Limiting

**Status:** 🟡 Open | **Priority:** P0 | **Severity:** 🔴 Critical

---

## Problem

OTP login/register HANYA disimpan di tabel `otp_verify` dan di-`console.log`. User tidak bisa menerima OTP. Juga tidak ada rate limiting — request OTP bisa di-spam tanpa batas.

---

## Task Requirements

### 1. Rate Limiting

Install:
```bash
npm install express-rate-limit
npm install -D @types/express-rate-limit
```

Di `src/modules/auth/auth.routes.ts`, tambahkan:
```ts
import rateLimit from 'express-rate-limit';

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

Terapkan ke route:
- `POST /buyer/request-otp`
- `POST /seller/request-otp`
- `POST /seller/forgot-password`

### 2. OTP Gateway Service

Buat file: `src/services/notification/otp.sender.ts`

```ts
export async function sendOtp(phone: string, otp: string): Promise<boolean> {
  // TODO: Replace with real Fonnte/WhatsApp API call
  // Contoh integration Fonnte:
  // await axios.post('https://api.fonnte.com/send', {
  //   target: phone,
  //   message: `Kode OTP Anda: ${otp}`,
  //   countryCode: '62',
  // }, {
  //   headers: { Authorization: process.env.FONNTE_TOKEN }
  // });

  console.log(`[OTP SENT] phone=${phone} otp=${otp}`);
  return true;
}
```

### 3. Integrasi ke auth.service.ts

Di `src/modules/auth/auth.service.ts`:
- Hapus `console.log(`[OTP] ${otp} -> ${phone}`)`
- Tambah `import { sendOtp } from '../../services/notification/otp.sender';`
- Di fungsi `issueOtp()`: `const otp = generateOtp(5); ... await sendOtp(phone, otp);`
- Wrap dengan try/catch supaya kalau OTP gateway gagal, tetap return success (fallback graceful)

---

## Acceptance Criteria

- [ ] Endpoint OTP return **429** jika lebih dari 5 request per 15 menit
- [ ] OTP dipanggil via `sendOtp()` — tidak lagi langsung `console.log` di auth service
- [ ] Dependencies: `express-rate-limit`, `axios` (jika belum ada)
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `package.json` | Tambah deps |
| `src/modules/auth/auth.routes.ts` | Tambah `otpLimiter` |
| `src/modules/auth/auth.service.ts` | Ganti `console.log` → `await sendOtp()` |
| `src/services/notification/otp.sender.ts` | **NEW** |
| `src/config/env.ts` | Tambah `FONNTE_TOKEN` (opsional) |

---

## Dependencies
```bash
npm install express-rate-limit
npm install -D @types/express-rate-limit
```

---

## Related Issues

- #2 (NPM scripts)
- #14 di `issue.md`
