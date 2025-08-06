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

export const requestSellerOtpSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor telepon tidak valid")
});

export const verifyOtpAndRegisterSellerSchema = z.object({
  phoneNumber: z.string().min(10, "Nomor telepon tidak valid"),
  otp: z.string().length(5, "OTP harus 5 digit"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter")
});

export const registerSellerStoreSchema = z.object({
  businessType: z.enum(["makanan", "minuman", "air_galon", "laundry"]),
  ownerKtpPhoto: z.string(),
  storeName: z.string().min(3),
  storeAddress: z.string().min(5),
  ownerFacePhoto: z.string()
});

export const forgotPasswordSellerSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().min(10).optional(),
});

export const verifyResetOtpSellerSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().min(10).optional(),
  otp: z.string().length(5, "OTP harus 5 digit"),
});

export const resetPasswordSellerSchema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().min(10).optional(),
  otp: z.string().length(5, "OTP harus 5 digit"),
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
});

export type RegisterBuyerDto = z.infer<typeof registerBuyerSchema>;
export type LoginOtpDto = z.infer<typeof loginOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type RequestSellerOtpDto = z.infer<typeof requestSellerOtpSchema>;
export type VerifyOtpAndRegisterSellerDto = z.infer<typeof verifyOtpAndRegisterSellerSchema>;
export type RegisterSellerStoreDto = z.infer<typeof registerSellerStoreSchema>;
export type ForgotPasswordSellerDto = z.infer<typeof forgotPasswordSellerSchema>;
export type VerifyResetOtpSellerDto = z.infer<typeof verifyResetOtpSellerSchema>;
export type ResetPasswordSellerDto = z.infer<typeof resetPasswordSellerSchema>;
