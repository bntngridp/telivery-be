"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryNoteSchema = exports.rejectOrderSchema = exports.orderPaginationSchema = exports.orderStatusSchema = exports.orderIdSchema = void 0;
const zod_1 = require("zod");
// Schema untuk validasi ID pesanan
exports.orderIdSchema = zod_1.z.object({
    id: zod_1.z.string().or(zod_1.z.number()).transform(val => String(val))
});
// Schema untuk validasi status pesanan
exports.orderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'PROCESSING',
        'DELIVERING',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED'
    ])
});
// Schema untuk validasi pagination pada daftar pesanan
exports.orderPaginationSchema = zod_1.z.object({
    page: zod_1.z.string().or(zod_1.z.number()).transform(val => Number(val)).default('1'),
    limit: zod_1.z.string().or(zod_1.z.number()).transform(val => Number(val)).default('10')
});
// Schema untuk validasi penolakan pesanan
exports.rejectOrderSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Alasan penolakan harus diisi')
});
// Schema untuk validasi catatan pengiriman
exports.deliveryNoteSchema = zod_1.z.object({
    note: zod_1.z.string().optional()
});
