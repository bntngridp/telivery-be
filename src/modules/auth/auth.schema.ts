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

export const loginOtpSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor telepon tidak valid")
});

export const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor telepon tidak valid"),
  otp: z.string().length(5, "OTP harus 5 digit")
});

export type RegisterBuyerDto = z.infer<typeof registerBuyerSchema>;
export type LoginOtpDto = z.infer<typeof loginOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
