# Title: [Enhancement] Implement Static File Serving & Integrate Zod with Global Error Handler

## Context
Proyek ini adalah backend Node.js/Express menggunakan TypeScript. Saat ini kita sudah memiliki fondasi yang solid dengan `asyncHandler`, `error.middleware.ts` untuk Global Error Handling, dan penyimpanan file lokal di direktori `documents/`. Namun, ada dua masalah operasional yang perlu diselesaikan sebelum kita mengembangkan modul baru.

## Objective
1. Mengaktifkan akses statis (Static File Serving) agar klien bisa mengakses file gambar/dokumen yang diunggah.
2. Memastikan error dari kegagalan validasi Zod tertangkap dengan baik oleh Global Error Handler dan mengembalikan pesan error yang detail kepada klien.

## Task Requirements

### Task 1: Static File Serving
- Buka file `src/app.ts`.
- Tambahkan middleware `express.static` untuk menyajikan folder `documents/` (yang berada di root direktori, sejajar dengan `src/`).
- Prefix route harus diset ke `/documents`.
- Pastikan penggunaan `path.join` sudah benar untuk merujuk ke lokasi folder tersebut (misal: `path.join(__dirname, '../documents')`).

### Task 2: Zod Error Handling Integration
- Buka file `src/middlewares/error.middleware.ts`.
- Tambahkan pengecekan kondisi jika `err` (error object) merupakan instance dari `ZodError` (dari library `zod`).
- Jika error adalah `ZodError`, format respons harus mengembalikan HTTP Status 400 (Bad Request).
- Struktur respons JSON harus konsisten dengan standar yang ada (`{ success: false, message: string, errors: array/object }`), dan harus memuat detail field apa saja yang gagal divalidasi beserta pesannya.

## Acceptance Criteria
- [ ] Klien dapat mengakses file gambar melalui URL `GET http://localhost:3000/documents/products/namafile.jpg`.
- [ ] Jika validasi payload Zod gagal di layer router/controller, API mengembalikan status 400 dengan detail field yang salah tanpa membuat server crash.
- [ ] Kode TypeScript tidak memiliki error kompilasi dan tetap mengikuti aturan linting proyek.

Tolong berikan kode implementasi untuk `app.ts` dan `error.middleware.ts` berdasarkan spesifikasi di atas.