import { z } from 'zod';

export const orderIdSchema = z.object({
  id: z.string().or(z.number()).transform(val => String(val))
});

export const orderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'accepted',
    'rejected',
    'processing',
    'delivered',
    'completed',
    'canceled'
  ])
});

export const orderPaginationSchema = z.object({
  page: z.string().or(z.number()).transform(val => Number(val)).default('1'),
  limit: z.string().or(z.number()).transform(val => Number(val)).default('10')
});

export const rejectOrderSchema = z.object({
  reason: z.string().min(1, 'Alasan penolakan harus diisi')
});
export const deliveryNoteSchema = z.object({
  note: z.string().optional()
});

