import { z } from "zod";

export const addCartItemSchema = z
  .object({
    produkId: z.number().int().positive("ID produk harus positif").optional(),
    layananId: z.number().int().positive("ID layanan harus positif").optional(),
    jumlah: z.number().int().min(1, "Jumlah minimal 1"),
  })
  .refine((data) => Boolean(data.produkId) !== Boolean(data.layananId), {
    message: "Harus menyertakan produkId ATAU layananId, tidak keduanya",
  });

export const updateCartItemSchema = z.object({
  jumlah: z.number().int().min(1, "Jumlah minimal 1"),
});

export const cartItemIdParamSchema = z.object({
  id: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
    message: "ID item cart tidak valid",
  }),
});

export type AddCartItemDto = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;
