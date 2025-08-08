import { z } from 'zod';

// Skema untuk validasi parameter ID
export const orderIdSchema = z.object({
  id: z.string().refine((val) => !isNaN(Number(val)), {
    message: "ID pesanan harus berupa angka"
  })
});

// Skema untuk filter status pesanan
export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'processing', 'delivered', 'completed', 'canceled'], {
    errorMap: () => ({ message: "Status pesanan tidak valid" })
  })
});

// Skema untuk pagination
export const orderPaginationSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10))
});

// Skema untuk filter tanggal
export const orderDateFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Skema untuk alasan penolakan pesanan
export const rejectOrderSchema = z.object({
  reason: z.string().min(5, "Alasan penolakan minimal 5 karakter")
});

// Skema untuk update catatan pengiriman
export const deliveryNoteSchema = z.object({
  note: z.string().optional()
});

// Export tipe-tipe yang akan digunakan
export type OrderIdParams = z.infer<typeof orderIdSchema>;
export type OrderStatusParams = z.infer<typeof orderStatusSchema>;
export type OrderPaginationQuery = z.infer<typeof orderPaginationSchema>;
export type OrderDateFilterQuery = z.infer<typeof orderDateFilterSchema>;
export type RejectOrderDto = z.infer<typeof rejectOrderSchema>;
export type DeliveryNoteDto = z.infer<typeof deliveryNoteSchema>;
