import { z } from "zod";

const positiveNumber = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().positive("Harga harus lebih dari 0"));

const nonNegativeInt = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .pipe(z.number().int("Estimasi harus bilangan bulat").min(0));

export const createLayananSchema = z
  .object({
    namaLayanan: z.string().min(1, "Nama layanan wajib diisi").max(100),
    harga: positiveNumber,
    jenisLayanan: z.string().min(1, "Jenis layanan wajib diisi").max(100),
    estimasiDurasi: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v !== undefined ? Number(v) : undefined)),
    catatan: z.string().max(500).optional(),
  })
  .strict();

export const updateLayananSchema = createLayananSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi",
  });

export const layananIdParamSchema = z.object({
  id: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
    message: "ID layanan harus berupa angka positif",
  }),
});

export const storeIdParamSchema = z.object({
  storeId: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
    message: "ID toko harus berupa angka positif",
  }),
});

export const layananItemSchema = z.object({
  layanan_id: z.number().int().positive("ID layanan harus positif"),
  jumlah: z.number().int().min(1, "Jumlah minimal 1"),
});

export type CreateLayananDto = z.infer<typeof createLayananSchema>;
export type UpdateLayananDto = z.infer<typeof updateLayananSchema>;
export type LayananItemDto = z.infer<typeof layananItemSchema>;
