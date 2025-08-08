import { z } from 'zod';

export const storeIdSchema = z.object({
  id: z.string().refine((val) => !isNaN(Number(val)), {
    message: "ID toko harus berupa angka"
  })
});

export const storeCategorySchema = z.object({
  kategori: z.enum(['makanan-minuman', 'air-galon', 'laundry'], {
    errorMap: () => ({ message: "Kategori harus salah satu dari: makanan-minuman, air-galon, atau laundry" })
  })
});

export const storeSearchSchema = z.object({
  q: z.string().min(1, "Keyword pencarian tidak boleh kosong")
});

export const paginationSchema = z.object({
  page: z.string().optional().transform(val => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val) : 10))
});

export type StoreIdParams = z.infer<typeof storeIdSchema>;
export type StoreCategoryParams = z.infer<typeof storeCategorySchema>;
export type StoreSearchQuery = z.infer<typeof storeSearchSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
