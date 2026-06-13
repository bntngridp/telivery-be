# Issue 2 — [Chore] Setup NPM Scripts & Standardize Order Status Case

**Status:** 🟡 Open | **Priority:** P1 | **Severity:** 🟡 Major

---

## Problem

1. `package.json` hanya punya script `"start": "ts-node src/server.ts"` — tidak ada `dev`, `build`, `lint`, `format`.
2. Seller order schema (`order.schema.ts`) pakai enum UPPERCASE (`PENDING`, `ACCEPTED`, dll) sementara buyer schema dan DB pakai lowercase (`pending`, `accepted`). Ini bisa menyebabkan bug query.

---

## Task Requirements

### 1. NPM Scripts
Install dev dependencies:
```bash
npm install -D tsx eslint prettier
```

Tambahkan di `package.json`:
```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "start:dev": "ts-node src/server.ts",
  "lint": "eslint . --ext .ts",
  "format": "prettier --write \"src/**/*.ts\""
}
```

### 2. Status Case Fix
File: `src/modules/order/order.schema.ts`

Ubah enum `orderStatusSchema` dari:
```ts
status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'PROCESSING', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'CANCELLED'])
```

Menjadi:
```ts
status: z.enum(['pending', 'accepted', 'rejected', 'processing', 'delivered', 'completed', 'canceled'])
```

Pastikan `order.service.ts` juga menggunakan lowercase string status (cek semua pemanggilan `status_pesanan`).

---

## Acceptance Criteria

- [ ] `npm run dev` boot server dengan hot-reload
- [ ] `npm run build` compile TypeScript ke `dist/`
- [ ] `npm run lint` jalan tanpa error fatal
- [ ] Seller order schema pakai lowercase, konsisten dengan buyer + DB
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `package.json` | Tambah devDeps + scripts |
| `src/modules/order/order.schema.ts` | Lowercase enum |
| `src/modules/order/order.service.ts` | Cek semua string status lowercase |

---

## Related Issues

- #3 (OTP gateway & rate limiting)
- #12 di `issue.md` (status case mismatch asli)
