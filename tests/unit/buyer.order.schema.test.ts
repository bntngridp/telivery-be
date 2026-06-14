import { describe, it, expect } from 'vitest';
import {
    createOrderSchema,
    orderIdSchema,
    orderStatusSchema,
    orderPaginationSchema,
    cancelOrderSchema,
    reviewOrderSchema,
} from '../../src/modules/order/buyer.order.schema';

describe('buyer order schemas', () => {
    describe('createOrderSchema', () => {
        it('accepts valid order with only id_produk', () => {
            const r = createOrderSchema.safeParse({
                id_produk: [{ produk_id: 1, jumlah: 2 }],
                alamat_pengiriman: 'Gedung A Lt 3',
                metode_pembayaran: 'transfer',
            });
            expect(r.success).toBe(true);
        });

        it('accepts valid order with only id_layanan', () => {
            const r = createOrderSchema.safeParse({
                id_layanan: [{ layanan_id: 1, jumlah: 1 }],
                alamat_pengiriman: 'Gedung A',
                metode_pembayaran: 'cash',
            });
            expect(r.success).toBe(true);
        });

        it('accepts valid order with both produk + layanan', () => {
            const r = createOrderSchema.safeParse({
                id_produk: [{ produk_id: 1, jumlah: 2 }],
                id_layanan: [{ layanan_id: 1, jumlah: 1 }],
                alamat_pengiriman: 'Gedung A',
                metode_pembayaran: 'e-wallet',
            });
            expect(r.success).toBe(true);
        });

        it('rejects empty order (no produk, no layanan)', () => {
            const r = createOrderSchema.safeParse({
                alamat_pengiriman: 'Gedung A',
                metode_pembayaran: 'cash',
            });
            expect(r.success).toBe(false);
            if (!r.success) {
                expect(r.error.issues.some((i) => i.message.includes('1 produk atau 1 layanan'))).toBe(
                    true,
                );
            }
        });

        it('rejects short alamat_pengiriman', () => {
            const r = createOrderSchema.safeParse({
                id_produk: [{ produk_id: 1, jumlah: 1 }],
                alamat_pengiriman: 'a',
                metode_pembayaran: 'cash',
            });
            expect(r.success).toBe(false);
        });

        it('rejects invalid metode_pembayaran', () => {
            const r = createOrderSchema.safeParse({
                id_produk: [{ produk_id: 1, jumlah: 1 }],
                alamat_pengiriman: 'Gedung A',
                metode_pembayaran: 'bitcoin',
            });
            expect(r.success).toBe(false);
        });

        it('rejects jumlah < 1', () => {
            const r = createOrderSchema.safeParse({
                id_produk: [{ produk_id: 1, jumlah: 0 }],
                alamat_pengiriman: 'Gedung A',
                metode_pembayaran: 'cash',
            });
            expect(r.success).toBe(false);
        });
    });

    describe('orderIdSchema', () => {
        it('accepts numeric string', () => {
            expect(orderIdSchema.safeParse({ id: '5' }).success).toBe(true);
        });
        it('rejects non-numeric', () => {
            expect(orderIdSchema.safeParse({ id: 'abc' }).success).toBe(false);
        });
    });

    describe('orderStatusSchema', () => {
        it.each(['pending', 'accepted', 'rejected', 'processing', 'delivered', 'completed', 'canceled'])(
            'accepts %s',
            (s) => {
                expect(orderStatusSchema.safeParse({ status: s }).success).toBe(true);
            },
        );
        it('rejects unknown status', () => {
            expect(orderStatusSchema.safeParse({ status: 'BOGUS' }).success).toBe(false);
        });
    });

    describe('orderPaginationSchema', () => {
        it('defaults page=1, limit=10', () => {
            const r = orderPaginationSchema.safeParse({});
            expect(r.success).toBe(true);
            if (r.success) {
                expect(r.data.page).toBe(1);
                expect(r.data.limit).toBe(10);
            }
        });

        it('parses page and limit from string', () => {
            const r = orderPaginationSchema.safeParse({ page: '3', limit: '25' });
            expect(r.success).toBe(true);
            if (r.success) {
                expect(r.data.page).toBe(3);
                expect(r.data.limit).toBe(25);
            }
        });
    });

    describe('cancelOrderSchema', () => {
        it('requires reason >= 5 chars', () => {
            expect(cancelOrderSchema.safeParse({ reason: 'ok' }).success).toBe(false);
            expect(cancelOrderSchema.safeParse({ reason: 'berubah pikiran' }).success).toBe(true);
        });
    });

    describe('reviewOrderSchema', () => {
        it('accepts rating 1-5', () => {
            for (const r of [1, 2, 3, 4, 5]) {
                expect(reviewOrderSchema.safeParse({ rating: r }).success).toBe(true);
            }
        });
        it('rejects rating < 1 or > 5', () => {
            expect(reviewOrderSchema.safeParse({ rating: 0 }).success).toBe(false);
            expect(reviewOrderSchema.safeParse({ rating: 6 }).success).toBe(false);
        });
    });
});
