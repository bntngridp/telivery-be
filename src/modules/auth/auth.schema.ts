import { z } from "zod";

const idParam = z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
  message: "ID harus berupa angka positif",
});

export const registerBuyerSchema = z
  .object({
    phoneNumber: z
      .string()
      .min(8, "Nomor HP minimal 8 digit")
      .max(20, "Nomor HP terlalu panjang"),
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
    birthDate: z.string().refine((v) => !isNaN(Date.parse(v)), {
      message: "Tanggal lahir tidak valid",
    }),
    email: z
      .string()
      .email("Email tidak valid")
      .optional()
      .transform((v) => v?.toLowerCase()),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(72, "Password maksimal 72 karakter")
      .optional()
      .or(z.literal("")),
    domicile: z.string().optional(),
    faculty: z.string().optional(),
    major: z.string().optional(),
    address: z.string().optional(),
  })
  .refine(
    (d) =>
      d.password === undefined ||
      (d.password as string) === "" ||
      (d.password as string).length >= 8,
    {
      message: "Password minimal 8 karakter",
      path: ["password"],
    },
  );

export const loginOtpSchema = z.object({
  phoneNumber: z.string().min(8).max(20),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z.string().min(8).max(20),
  otp: z.string().min(4).max(6),
});

export const requestSellerOtpSchema = z.object({
  phoneNumber: z.string().min(8).max(20),
});

export const verifyOtpAndRegisterSellerSchema = z.object({
  phoneNumber: z.string().min(8).max(20),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
  otp: z.string().min(4).max(6),
});

export const registerSellerStoreSchema = z.object({
  businessType: z.string().min(2),
  storeName: z.string().min(2),
  storeAddress: z.string().min(5),
  ownerKtpPhoto: z.string().min(1),
  ownerFacePhoto: z.string().min(1),
});

export const loginBuyerSchema = z.object({
  email: z
    .string()
    .email("Email tidak valid")
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password wajib diisi"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20, "Refresh token tidak valid"),
});

export const setBuyerPasswordSchema = z
  .object({
    oldPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter").max(72),
  })
  .refine((d) => d.newPassword.length >= 8, {
    message: "Password baru minimal 8 karakter",
    path: ["newPassword"],
  });

export const forgotPasswordSellerSchema = z
  .object({
    email: z.string().email().optional(),
    phoneNumber: z.string().min(8).max(20).optional(),
  })
  .refine((d) => d.email || d.phoneNumber, {
    message: "Email atau nomor HP wajib diisi",
  });

export const verifyResetOtpSellerSchema = z
  .object({
    email: z.string().email().optional(),
    phoneNumber: z.string().min(8).max(20).optional(),
    otp: z.string().min(4).max(6),
  })
  .refine((d) => d.email || d.phoneNumber, {
    message: "Email atau nomor HP wajib diisi",
  });

export const resetPasswordSellerSchema = z
  .object({
    email: z.string().email().optional(),
    phoneNumber: z.string().min(8).max(20).optional(),
    otp: z.string().min(4).max(6),
    newPassword: z.string().min(8).max(72),
  })
  .refine((d) => d.email || d.phoneNumber, {
    message: "Email atau nomor HP wajib diisi",
  });

export const _idParam = idParam;

export type RegisterBuyerDto = z.infer<typeof registerBuyerSchema>;
export type LoginOtpDto = z.infer<typeof loginOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type RequestSellerOtpDto = z.infer<typeof requestSellerOtpSchema>;
export type VerifyOtpAndRegisterSellerDto = z.infer<
  typeof verifyOtpAndRegisterSellerSchema
>;
export type RegisterSellerStoreDto = z.infer<typeof registerSellerStoreSchema>;
export type LoginBuyerDto = z.infer<typeof loginBuyerSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type SetBuyerPasswordDto = z.infer<typeof setBuyerPasswordSchema>;
export type ForgotPasswordSellerDto = z.infer<
  typeof forgotPasswordSellerSchema
>;
export type VerifyResetOtpSellerDto = z.infer<
  typeof verifyResetOtpSellerSchema
>;
export type ResetPasswordSellerDto = z.infer<typeof resetPasswordSellerSchema>;
