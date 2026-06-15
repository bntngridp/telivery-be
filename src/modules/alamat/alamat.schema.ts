import { z } from "zod";

const idParam = z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
  message: "ID harus berupa angka positif",
});

export const createAlamatSchema = z.object({
  label: z.string().min(2, "Label minimal 2 karakter").max(50),
  alamat_lengkap: z.string().min(5, "Alamat terlalu pendek").max(500),
  catatan: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  is_primary: z.boolean().optional().default(false),
});

export const updateAlamatSchema = createAlamatSchema.partial();

export const alamatIdParamSchema = z.object({
  id: idParam,
});

export type CreateAlamatDto = z.infer<typeof createAlamatSchema>;
export type UpdateAlamatDto = z.infer<typeof updateAlamatSchema>;
