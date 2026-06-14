import { describe, it, expect } from 'vitest';
import {
    addCartItemSchema,
    updateCartItemSchema,
    cartItemIdParamSchema,
} from '../../src/modules/cart/cart.schema';

describe('cart schemas', () => {
    describe('addCartItemSchema', () => {
        it('accepts produkId with jumlah', () => {
            const r = addCartItemSchema.safeParse({ produkId: 1, jumlah: 2 });
            expect(r.success).toBe(true);
        });

        it('accepts layananId with jumlah', () => {
            const r = addCartItemSchema.safeParse({ layananId: 1, jumlah: 1 });
            expect(r.success).toBe(true);
        });

        it('rejects when both produkId and layananId provided', () => {
            const r = addCartItemSchema.safeParse({ produkId: 1, layananId: 1, jumlah: 1 });
            expect(r.success).toBe(false);
            if (!r.success) {
                expect(r.error.issues[0].message).toContain('produkId ATAU layananId');
            }
        });

        it('rejects when neither produkId nor layananId provided', () => {
            const r = addCartItemSchema.safeParse({ jumlah: 1 });
            expect(r.success).toBe(false);
        });

        it('rejects when jumlah < 1', () => {
            expect(addCartItemSchema.safeParse({ produkId: 1, jumlah: 0 }).success).toBe(false);
            expect(addCartItemSchema.safeParse({ produkId: 1, jumlah: -1 }).success).toBe(false);
        });

        it('rejects missing jumlah', () => {
            expect(addCartItemSchema.safeParse({ produkId: 1 }).success).toBe(false);
        });
    });

    describe('updateCartItemSchema', () => {
        it('accepts positive jumlah', () => {
            expect(updateCartItemSchema.safeParse({ jumlah: 5 }).success).toBe(true);
        });

        it('rejects jumlah < 1', () => {
            expect(updateCartItemSchema.safeParse({ jumlah: 0 }).success).toBe(false);
        });
    });

    describe('cartItemIdParamSchema', () => {
        it('accepts positive integer string', () => {
            expect(cartItemIdParamSchema.safeParse({ id: '5' }).success).toBe(true);
        });

        it('rejects non-numeric', () => {
            expect(cartItemIdParamSchema.safeParse({ id: 'abc' }).success).toBe(false);
        });

        it('rejects zero', () => {
            expect(cartItemIdParamSchema.safeParse({ id: '0' }).success).toBe(false);
        });
    });
});
