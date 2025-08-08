"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStockSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    nama: zod_1.z.string({
        required_error: 'Nama produk wajib diisi',
        invalid_type_error: 'Nama produk harus berupa text',
    }).min(1, 'Nama produk tidak boleh kosong'),
    harga: zod_1.z
        .string()
        .or(zod_1.z.number())
        .transform(Number)
        .pipe(zod_1.z
        .number({
        required_error: 'Harga produk wajib diisi',
        invalid_type_error: 'Harga harus berupa angka',
    })
        .positive('Harga harus lebih dari 0')),
    stok: zod_1.z
        .string()
        .or(zod_1.z.number())
        .transform(Number)
        .pipe(zod_1.z
        .number({
        required_error: 'Stok produk wajib diisi',
        invalid_type_error: 'Stok harus berupa angka',
    })
        .min(0, 'Stok tidak boleh negatif')),
    kategori: zod_1.z.enum(['MAKANAN_MINUMAN', 'AIR_GALON', 'LAUNDRY'], {
        required_error: 'Kategori produk wajib diisi',
        invalid_type_error: 'Kategori tidak valid',
    }),
});
exports.updateProductSchema = zod_1.z.object({
    nama: zod_1.z.string({
        invalid_type_error: 'Nama produk harus berupa text',
    }).min(1, 'Nama produk tidak boleh kosong').optional(),
    deskripsi: zod_1.z.string({
        invalid_type_error: 'Deskripsi produk harus berupa text',
    }).optional(),
    harga: zod_1.z
        .string()
        .or(zod_1.z.number())
        .transform(Number)
        .pipe(zod_1.z
        .number({
        invalid_type_error: 'Harga harus berupa angka',
    })
        .positive('Harga harus lebih dari 0'))
        .optional(),
    stok: zod_1.z
        .string()
        .or(zod_1.z.number())
        .transform(Number)
        .pipe(zod_1.z
        .number({
        invalid_type_error: 'Stok harus berupa angka',
    })
        .min(0, 'Stok tidak boleh negatif'))
        .optional(),
    kategori: zod_1.z.enum(['MAKANAN_MINUMAN', 'AIR_GALON', 'LAUNDRY'], {
        invalid_type_error: 'Kategori tidak valid',
    }).optional(),
});
exports.updateStockSchema = zod_1.z.object({
    stok: zod_1.z
        .string()
        .or(zod_1.z.number())
        .transform(Number)
        .pipe(zod_1.z
        .number({
        required_error: 'Stok produk wajib diisi',
        invalid_type_error: 'Stok harus berupa angka',
    })
        .min(0, 'Stok tidak boleh negatif')),
});
