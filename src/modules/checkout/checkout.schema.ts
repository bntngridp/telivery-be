import { z } from "zod";

export const checkoutSchema = z.object({
  alamat_pengiriman: z.string().min(5, "Alamat pengiriman terlalu pendek"),
  alamat_id: z.number().int().positive().optional(),
  ongkir: z
    .number()
    .min(0, "Ongkir tidak boleh negatif")
    .max(1_000_000, "Ongkir terlalu besar")
    .optional()
    .default(0),
  metode_pembayaran: z.enum(["cash", "transfer", "e-wallet", "midtrans"], {
    errorMap: () => ({ message: "Metode pembayaran tidak valid" }),
  }),
  catatan: z.string().max(500).optional(),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;
