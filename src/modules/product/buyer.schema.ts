import { z } from 'zod';

export const productIdSchema = z.object({
  id: z.string().refine((val) => !isNaN(Number(val)), {
    message: "ID produk harus berupa angka"
  })
});

export const productCategorySchema = z.object({
  kategori: z.enum(['makanan-minuman', 'air-galon', 'laundry'], {
    errorMap: () => ({ message: "Kategori harus salah satu dari: makanan-minuman, air-galon, atau laundry" })
  })
});

export const productSearchSchema = z.object({
  q: z.string().min(1, "Keyword pencarian tidak boleh kosong")
});

export const paginationSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10))
});

export type ProductIdParams = z.infer<typeof productIdSchema>;
export type ProductCategoryParams = z.infer<typeof productCategorySchema>;
export type ProductSearchQuery = z.infer<typeof productSearchSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
