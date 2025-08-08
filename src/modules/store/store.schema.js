"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.storeSearchSchema = exports.storeCategorySchema = exports.storeIdSchema = void 0;
const zod_1 = require("zod");
exports.storeIdSchema = zod_1.z.object({
    id: zod_1.z.string().refine((val) => !isNaN(Number(val)), {
        message: "ID toko harus berupa angka"
    })
});
exports.storeCategorySchema = zod_1.z.object({
    kategori: zod_1.z.enum(['makanan-minuman', 'air-galon', 'laundry'], {
        errorMap: () => ({ message: "Kategori harus salah satu dari: makanan-minuman, air-galon, atau laundry" })
    })
});
exports.storeSearchSchema = zod_1.z.object({
    q: zod_1.z.string().min(1, "Keyword pencarian tidak boleh kosong")
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 10))
});
