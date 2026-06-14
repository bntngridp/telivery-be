import { z } from "zod";

export const checkoutSchema = z.object({
  alamat_pengiriman: z.string().min(5, "Alamat pengiriman terlalu pendek"),
  metode_pembayaran: z.enum(["cash", "transfer", "e-wallet"], {
    errorMap: () => ({ message: "Metode pembayaran tidak valid" }),
  }),
  catatan: z.string().max(500).optional(),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;
