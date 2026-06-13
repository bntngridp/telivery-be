# Issue 5 — [Refactor] Build Buyer Profile Module & Clean Up Product Routes

**Status:** 🟡 Open | **Priority:** P2 | **Severity:** 🟡 Major

---

## Problem

1. Modul `user` (`/api/users`) masih pakai in-memory array — placeholder dummy.
2. Endpoint buyer product di `product.controller.ts` (lama) duplikasi logic dari `buyer.controller.ts` (baru yang ada pagination).
3. Buyer tidak punya endpoint profil untuk lihat/update data diri.

---

## Task Requirements

### 1. Hapus In-Memory User Module

- Kosongkan file di `src/modules/user/` ATAU ganti menjadi modul buyer profile.
- Hapus mount `app.use('/api/users', userRoutes)` dari `app.ts`.

### 2. Cleanup Duplikat Product

Di `src/modules/product/product.controller.ts`, **hapus** function:
- `getAllProductsForBuyer`
- `getProductByIdForBuyer`
- `getProductsByCategoryForBuyer`
- `searchProducts`
- `getPopularProducts`
- `getProductRecommendations`

Juga hapus route terkait dari `src/modules/product/product.routes.ts`:
```ts
router.get('/buyer', ...);
router.get('/buyer/popular', ...);
router.get('/buyer/recommendations', ...);
router.get('/buyer/search', ...);
router.get('/buyer/category/:kategori', ...);
router.get('/buyer/:id', ...);
```

Buyer product sekarang hanya dilayani oleh `buyer.routes.ts` (mount di `/api/buyer/products`).

### 3. Buyer Profile Module (`src/modules/buyer/`)

#### 3a. Schema (`src/modules/buyer/buyer.schema.ts`)
```ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phoneNumber: z.string().min(10).optional(),
  birthDate: z.string().optional(),
  domicile: z.string().optional(),
  faculty: z.string().optional(),
  major: z.string().optional(),
  deliveryAddress: z.string().optional(),
});
```

#### 3b. Service (`src/modules/buyer/buyer.service.ts`)
```ts
export const buyerProfileService = {
  async getProfile(userId: number) {
    // prisma.pembeli.findUnique({ where: { user_id: userId }})
    // exclude password field
  },

  async updateProfile(userId: number, data) {
    // prisma.pembeli.update
  }
};
```

#### 3c. Controller (`src/modules/buyer/buyer.controller.ts`)
- `getProfile` — return data pembeli (tanpa password)
- `updateProfile` — validate via Zod, update di DB

#### 3d. Routes (`src/modules/buyer/buyer.routes.ts`)
```ts
router.get('/profile', jwtMiddleware, getProfile);
router.patch('/profile', jwtMiddleware, updateProfile);
```

### 4. Mount di `src/app.ts`

```ts
import buyerProfileRoutes from './modules/buyer/buyer.routes';
// Ubah existing mount jadi:
app.use('/api/buyer', buyerProfileRoutes);
app.use('/api/buyer/products', buyerProductRoutes);
app.use('/api/buyer/stores', buyerStoreRoutes);
app.use('/api/buyer/orders', buyerOrderRoutes);
```

Atau mount terpisah:
```ts
app.use('/api/buyer', buyerProfileRoutes);
```

---

## Acceptance Criteria

- [ ] `GET /api/buyer/profile` return data pembeli (tanpa password)
- [ ] `PATCH /api/buyer/profile` update data diri
- [ ] Modul user in-memory dihapus atau diganti
- [ ] Endpoint buyer product hanya dari `buyer.controller.ts` (dengan pagination)
- [ ] `npx tsc --noEmit` → 0 errors

---

## Files Affected

| File | Change |
|---|---|
| `src/modules/user/` | Hapus atau ganti isi |
| `src/modules/product/product.controller.ts` | Hapus function buyer (6 function) |
| `src/modules/product/product.routes.ts` | Hapus route buyer |
| `src/modules/buyer/buyer.schema.ts` | **NEW** |
| `src/modules/buyer/buyer.service.ts` | **NEW** |
| `src/modules/buyer/buyer.controller.ts` | **NEW** |
| `src/modules/buyer/buyer.routes.ts` | **NEW** |
| `src/app.ts` | Mount buyer profile |

---

## Note

`src/modules/product/buyer.*` adalah refactor lama yang sudah punya pagination — ini yang dipertahankan. Bedakan dengan `src/modules/buyer/` yang baru (profil pembeli).
