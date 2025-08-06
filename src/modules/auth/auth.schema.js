"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSellerSchema = exports.verifyResetOtpSellerSchema = exports.forgotPasswordSellerSchema = exports.registerSellerStoreSchema = exports.verifyOtpAndRegisterSellerSchema = exports.requestSellerOtpSchema = exports.verifyOtpSchema = exports.loginOtpSchema = exports.registerBuyerSchema = void 0;
const zod_1 = require("zod");
exports.registerBuyerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, "Nama lengkap wajib diisi"),
    phoneNumber: zod_1.z.string().min(10, "Nomor telepon tidak valid"),
    birthDate: zod_1.z.string(),
    domicile: zod_1.z.string(),
    faculty: zod_1.z.string(),
    major: zod_1.z.string(),
    address: zod_1.z.string(),
    email: zod_1.z.string().email("Email tidak valid"),
});
exports.loginOtpSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().min(10, "Nomor telepon tidak valid")
});
exports.verifyOtpSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().min(10, "Nomor telepon tidak valid"),
    otp: zod_1.z.string().length(5, "OTP harus 5 digit")
});
exports.requestSellerOtpSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().min(10, "Nomor telepon tidak valid")
});
exports.verifyOtpAndRegisterSellerSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().min(10, "Nomor telepon tidak valid"),
    otp: zod_1.z.string().length(5, "OTP harus 5 digit"),
    email: zod_1.z.string().email("Email tidak valid"),
    password: zod_1.z.string().min(6, "Password minimal 6 karakter")
});
exports.registerSellerStoreSchema = zod_1.z.object({
    businessType: zod_1.z.enum(["makanan", "minuman", "air_galon", "laundry"]),
    ownerKtpPhoto: zod_1.z.string(),
    storeName: zod_1.z.string().min(3),
    storeAddress: zod_1.z.string().min(5),
    ownerFacePhoto: zod_1.z.string()
});
exports.forgotPasswordSellerSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    phoneNumber: zod_1.z.string().min(10).optional(),
});
exports.verifyResetOtpSellerSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    phoneNumber: zod_1.z.string().min(10).optional(),
    otp: zod_1.z.string().length(5, "OTP harus 5 digit"),
});
exports.resetPasswordSellerSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    phoneNumber: zod_1.z.string().min(10).optional(),
    otp: zod_1.z.string().length(5, "OTP harus 5 digit"),
    newPassword: zod_1.z.string().min(6, "Password minimal 6 karakter"),
});
