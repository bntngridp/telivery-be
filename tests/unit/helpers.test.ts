import { describe, it, expect } from 'vitest';
import { generateOtp, sanitizeFileName, deleteFileIfExists, toNumber, toInt } from '../../src/utils/helpers';

describe('helpers', () => {
    describe('generateOtp', () => {
        it('returns 5-digit string by default', () => {
            const otp = generateOtp();
            expect(otp).toHaveLength(5);
            expect(/^\d{5}$/.test(otp)).toBe(true);
        });

        it('returns N-digit string when length specified', () => {
            for (const len of [3, 4, 6, 8]) {
                const otp = generateOtp(len);
                expect(otp).toHaveLength(len);
                expect(/^\d+$/.test(otp)).toBe(true);
            }
        });

        it('produces different values across calls (probabilistic)', () => {
            const values = new Set(Array.from({ length: 50 }, () => generateOtp()));
            expect(values.size).toBeGreaterThan(10);
        });

        it('does not include leading zeros for short lengths', () => {
            for (let i = 0; i < 20; i++) {
                const otp = generateOtp(1);
                expect(otp).toMatch(/^[1-9]\d*$/);
            }
        });
    });

    describe('sanitizeFileName', () => {
        it('replaces unsafe chars with underscore', () => {
            expect(sanitizeFileName('hello world.txt')).toBe('hello_world.txt');
            expect(sanitizeFileName('a/b\\c.txt')).toBe('a_b_c.txt');
            expect(sanitizeFileName('name<>:"?*|')).toBe('name_______');
        });

        it('keeps dots, dashes, underscores', () => {
            expect(sanitizeFileName('valid-name_1.0.jpg')).toBe('valid-name_1.0.jpg');
        });
    });

    describe('deleteFileIfExists', () => {
        it('does nothing when path is undefined/null/empty', () => {
            expect(() => deleteFileIfExists(undefined)).not.toThrow();
            expect(() => deleteFileIfExists(null)).not.toThrow();
            expect(() => deleteFileIfExists('')).not.toThrow();
        });

        it('does nothing when file does not exist', () => {
            expect(() => deleteFileIfExists('/tmp/nonexistent-xxx-yyy-12345')).not.toThrow();
        });
    });

    describe('toNumber', () => {
        it('converts valid values', () => {
            expect(toNumber('5')).toBe(5);
            expect(toNumber(5)).toBe(5);
            expect(toNumber('5.5')).toBe(5.5);
            expect(toNumber(0)).toBe(0);
        });

        it('uses fallback for empty/invalid', () => {
            expect(toNumber(undefined, 10)).toBe(10);
            expect(toNumber(null, 10)).toBe(10);
            expect(toNumber('', 10)).toBe(10);
            expect(toNumber('abc', 10)).toBe(10);
        });
    });

    describe('toInt', () => {
        it('truncates to integer', () => {
            expect(toInt('5.7')).toBe(5);
            expect(toInt(5.9)).toBe(5);
            expect(toInt('0')).toBe(0);
        });

        it('uses fallback for invalid', () => {
            expect(toInt('xyz', 99)).toBe(99);
            expect(toInt('', 0)).toBe(0);
        });
    });
});
