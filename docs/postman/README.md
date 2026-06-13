# Cheva-Telivery API — Postman Collection

Dokumentasi API siap pakai untuk Postman / Insomnia / VS Code REST Client.

## 📦 Import

**Postman:**
1. Buka Postman → `File` → `Import` → `File` → pilih `Cheva-Telivery.postman_collection.json`
2. Collection "Cheva-Telivery API" muncul di sidebar
3. Variables otomatis tersedia di tab "Variables"

**VS Code (REST Client):**
Buka file `.http` di `docs/rest-client/` (lihat sub-folder tsb)

## 🔧 Setup Environment

Collection ini punya **built-in variables** (tidak perlu setup env terpisah):

| Variable | Auto-set by | Purpose |
|---|---|---|
| `baseUrl` | Manual (default `http://localhost:3000`) | Base URL server |
| `buyerToken` | Auto-saved setelah `Verify OTP` | JWT untuk request buyer |
| `sellerToken` | Auto-saved setelah `Verify OTP + Register Seller` | JWT untuk request seller |
| `adminToken` | Auto-saved setelah `Admin Login` | JWT untuk request admin |
| `buyerId`, `sellerId` | Auto-extracted dari JWT | User ID |
| `produkId`, `layananId`, `pesananId`, `pembayaranId`, `notificationId`, `cartItemId` | Auto-saved setelah create | Resource IDs untuk request lanjutan |

## 📁 Struktur Collection (19 folder)

```
01. System              → Welcome, Health
02. Auth — Buyer        → Register, OTP, Verify
03. Auth — Seller       → OTP, Register, Login, Forgot Password
04. Auth — Admin        → Admin Login
05. Admin               → Approve/Reject Store
06. Buyer Profile       → GET/PATCH
07. Product — Seller    → CRUD + Stock
08. Product — Buyer     → List, Search, Popular, Recommend
09. Store — Buyer       → List, Detail, Search, Products
10. Partner             → Seller Profile (open/close store)
11. Order — Buyer       → Create, Track, Cancel, Confirm, Review
12. Order — Seller      → Accept, Reject, Process, Deliver
13. Service (Layanan) — Seller → CRUD
14. Service (Layanan) — Buyer  → List by Store
15. Cart                → Add, List, Update, Remove, Clear
16. Checkout            → POST /api/buyer/checkout
17. Payment             → Upload Receipt, Confirm, Reject
18. Notification — Buyer → List, Read, Delete
19. Notification — Seller → List, Read, Delete
```

## 🔑 Alur Testing Skenario Penuh (Recommended Order)

1. **Setup awal:**
   - `02. Auth — Buyer → Register Buyer` (jika belum ada)
   - `02. Auth — Buyer → Request OTP Login` → cek console server untuk OTP (mode DRY_RUN)
   - `02. Auth — Buyer → Verify OTP Login` → **auto-save `buyerToken`**
   - `04. Auth — Admin → Admin Login` → **auto-save `adminToken`**
   - Login admin di DB: `pembeli` → `penjual` (admin perlu approve toko via approval flow, atau skip ke step 4 kalau sudah ada toko approved+open di DB)

2. **Seed produk:**
   - `03. Auth — Seller → Request Seller OTP` → `Verify OTP + Register Seller` → **auto-save `sellerToken`**
   - `03. Auth — Seller → Register Store` (multipart, butuh file KTP/face)
   - `05. Admin → List Pending Stores` → `Approve Store` (kalau seller baru)
   - `07. Product — Seller → Create Product` (multipart, butuh file gambar) → **auto-save `produkId`**

3. **Buyer flow:**
   - `08. Product — Buyer → List All Available Products`
   - `15. Cart → Add Produk to Cart` → `List My Cart` (lihat total)
   - `16. Checkout → Checkout` (convert cart → orders) → **auto-save `pesananId`**

4. **Seller order flow:**
   - `12. Order — Seller → Get All My Orders` → `Accept Order` → `Process Order` → `Mark Delivered`

5. **Payment + close flow:**
   - `17. Payment → Upload Payment Receipt` (buyer, multipart)
   - `17. Payment → Confirm Payment` (seller)
   - `11. Order — Buyer → Confirm Order Received` (delivered → completed, triggers wallet credit)
   - `11. Order — Buyer → Review Order`

6. **Notification check:**
   - `18. Notification — Buyer → List` (lihat notifikasi order_completed, store_approved, dll)
   - `19. Notification — Seller → List`

## 🛠 Tips

- **Auto-save token**: Request yang return token punya tab "Tests" yang auto-decode JWT dan simpan ke variable. Tidak perlu copy-paste manual.
- **Body variables**: Bisa pakai `{{produkId}}` di body request untuk reference resource yang baru dibuat.
- **File uploads**: Ganti `/path/to/...` dengan path file lokal di field "Type: file" di form-data.
- **Rate limit**: 5 request / 15 menit untuk OTP endpoints. Tunggu kalau kena 429.

## 📊 Total Endpoints

- **19** folders
- **~70** requests
- **3** role-based auth flows

Lihat juga:
- `docs/REST_CLIENT.md` (coming soon) — alternatif pakai VS Code REST Client
- `issues/00X-*.md` — detail teknis per-fitur
- `src/utils/response.ts` — format response standar `{success, message, data, pagination, error, errors}`
