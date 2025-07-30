"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtpSchema = exports.loginOtpSchema = exports.registerBuyerSchema = void 0;
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
