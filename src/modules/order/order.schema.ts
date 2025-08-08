import { z } from 'zod';

// Schema untuk validasi ID pesanan
export const orderIdSchema = z.object({
  id: z.string().or(z.number()).transform(val => String(val))
});

// Schema untuk validasi status pesanan
export const orderStatusSchema = z.object({
  status: z.enum([
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
export const orderPaginationSchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val)).default('1'),
  limit: z.string().or(z.number()).transform(val => Number(val)).default('10')
});

// Schema untuk validasi penolakan pesanan
export const rejectOrderSchema = z.object({
  reason: z.string().min(1, 'Alasan penolakan harus diisi')
});

// Schema untuk validasi catatan pengiriman
export const deliveryNoteSchema = z.object({
  note: z.string().optional()
});

