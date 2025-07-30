import { z } from "zod";

export const registerBuyerSchema = z.object({
    fullName: z.string().min(1, "Nama lengkap wajib diisi"),
    phoneNumber: z.string().min(10, "Nomor telepon tidak valid"),
    birthDate: z.string(),
    domicile: z.string(),
    faculty: z.string(),
    major: z.string(),
    address: z.string(),
    email: z.string().email("Email tidak valid"),
});

export type RegisterBuyerDto = z.infer<typeof registerBuyerSchema>;
