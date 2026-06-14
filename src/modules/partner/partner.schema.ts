import { z } from "zod";

const optionalStr = (max: number) => z.string().max(max).optional();

export const updateStoreProfileSchema = z
  .object({
    namaToko: z
      .string()
      .min(3, "Nama toko minimal 3 karakter")
      .max(100)
      .optional(),
    deskripsiToko: z.string().max(1000).optional(),
    jamOprasional: z.string().max(50).optional(),
    alamatToko: z
      .string()
      .min(5, "Alamat toko minimal 5 karakter")
      .max(500)
      .optional(),
    statusToko: z.enum(["OPEN", "CLOSED"]).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi",
  });

export type UpdateStoreProfileDto = z.infer<typeof updateStoreProfileSchema>;
