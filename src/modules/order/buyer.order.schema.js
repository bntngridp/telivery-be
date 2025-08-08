"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewOrderSchema = exports.cancelOrderSchema = exports.orderPaginationSchema = exports.orderStatusSchema = exports.orderIdSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
exports.createOrderSchema = zod_1.z.object({
    id_produk: zod_1.z.array(zod_1.z.object({
        produk_id: zod_1.z.number({
            required_error: "ID produk wajib diisi",
            invalid_type_error: "ID produk harus berupa angka"
        }),
        jumlah: zod_1.z.number({
            required_error: "Jumlah produk wajib diisi",
            invalid_type_error: "Jumlah harus berupa angka"
        }).min(1, "Jumlah minimal 1")
    })).min(1, "Minimal harus ada 1 produk dalam pesanan"),
    alamat_pengiriman: zod_1.z.string({
        required_error: "Alamat pengiriman wajib diisi",
        invalid_type_error: "Alamat pengiriman harus berupa teks"
    }).min(5, "Alamat pengiriman terlalu pendek"),
    metode_pembayaran: zod_1.z.enum(['cash', 'transfer', 'e-wallet'], {
        errorMap: () => ({ message: "Metode pembayaran tidak valid" })
    }),
    catatan: zod_1.z.string().optional()
});
exports.orderIdSchema = zod_1.z.object({
    id: zod_1.z.string().refine((val) => !isNaN(Number(val)), {
        message: "ID pesanan harus berupa angka"
    })
});
exports.orderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'accepted', 'rejected', 'processing', 'delivered', 'completed', 'canceled'], {
        errorMap: () => ({ message: "Status pesanan tidak valid" })
    })
});
exports.orderPaginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 10))
});
exports.cancelOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().min(5, "Alasan pembatalan minimal 5 karakter")
});
exports.reviewOrderSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5),
    komentar: zod_1.z.string().optional()
});
