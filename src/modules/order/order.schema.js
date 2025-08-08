"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryNoteSchema = exports.rejectOrderSchema = exports.orderDateFilterSchema = exports.orderPaginationSchema = exports.orderStatusSchema = exports.orderIdSchema = void 0;
const zod_1 = require("zod");
// Skema untuk validasi parameter ID
exports.orderIdSchema = zod_1.z.object({
    id: zod_1.z.string().refine((val) => !isNaN(Number(val)), {
        message: "ID pesanan harus berupa angka"
    })
});
// Skema untuk filter status pesanan
exports.orderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'accepted', 'rejected', 'processing', 'delivered', 'completed', 'canceled'], {
        errorMap: () => ({ message: "Status pesanan tidak valid" })
    })
});
// Skema untuk pagination
exports.orderPaginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 1)),
    limit: zod_1.z.string().optional().transform(val => (val ? parseInt(val) : 10))
});
// Skema untuk filter tanggal
exports.orderDateFilterSchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional()
});
// Skema untuk alasan penolakan pesanan
exports.rejectOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().min(5, "Alasan penolakan minimal 5 karakter")
});
// Skema untuk update catatan pengiriman
exports.deliveryNoteSchema = zod_1.z.object({
    note: zod_1.z.string().optional()
});
