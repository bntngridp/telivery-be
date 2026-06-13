import { z } from 'zod';

const optionalString = (max: number) => z.string().max(max).optional();

export const updateProfileSchema = z
    .object({
        fullName: z.string().min(1, 'Nama lengkap wajib diisi').max(100).optional(),
        phoneNumber: z
            .string()
            .min(10, 'Nomor telepon minimal 10 digit')
            .max(20, 'Nomor telepon terlalu panjang')
            .optional(),
        birthDate: z
            .string()
            .refine((v) => !isNaN(Date.parse(v)), { message: 'Format tanggal lahir tidak valid' })
            .optional(),
        domicile: optionalString(100),
        faculty: optionalString(100),
        major: optionalString(100),
        deliveryAddress: z.string().max(500).optional(),
    })
    .strict();

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
