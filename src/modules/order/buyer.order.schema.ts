import { z } from 'zod';

export const createOrderSchema = z.object({
  id_produk: z.array(
    z.object({
      produk_id: z.number({
        required_error: "ID produk wajib diisi",
        invalid_type_error: "ID produk harus berupa angka"
      }),
      jumlah: z.number({
        required_error: "Jumlah produk wajib diisi",
        invalid_type_error: "Jumlah harus berupa angka"
      }).min(1, "Jumlah minimal 1")
    })
  ).min(1, "Minimal harus ada 1 produk dalam pesanan"),
  alamat_pengiriman: z.string({
    required_error: "Alamat pengiriman wajib diisi",
    invalid_type_error: "Alamat pengiriman harus berupa teks"
  }).min(5, "Alamat pengiriman terlalu pendek"),
  metode_pembayaran: z.enum(['cash', 'transfer', 'e-wallet'], {
    errorMap: () => ({ message: "Metode pembayaran tidak valid" })
  }),
  catatan: z.string().optional()
});

export const orderIdSchema = z.object({
  id: z.string().refine((val) => !isNaN(Number(val)), {
    message: "ID pesanan harus berupa angka"
  })
});

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'processing', 'delivered', 'completed', 'canceled'], {
    errorMap: () => ({ message: "Status pesanan tidak valid" })
  })
});

export const orderPaginationSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10))
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(5, "Alasan pembatalan minimal 5 karakter")
});

export const reviewOrderSchema = z.object({
  rating: z.number().min(1).max(5),
  komentar: z.string().optional()
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type OrderIdParams = z.infer<typeof orderIdSchema>;
export type OrderStatusParams = z.infer<typeof orderStatusSchema>;
export type OrderPaginationQuery = z.infer<typeof orderPaginationSchema>;
export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;
export type ReviewOrderDto = z.infer<typeof reviewOrderSchema>;
