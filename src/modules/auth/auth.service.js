"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const OTP_EXPIRE_MINUTES = 5;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
exports.authService = {
    async registerBuyer(data) {
        const existing = await prisma.pembeli.findFirst({
            where: {
                OR: [
                    { phone_number: data.phoneNumber },
                    { email: data.email }
                ]
            }
        });
        if (existing) {
            throw new Error("Nomor atau email sudah terdaftar.");
        }
        // Simpan data pembeli baru
        const newBuyer = await prisma.pembeli.create({
            data: {
                full_name: data.fullName,
                phone_number: data.phoneNumber,
                delivery_address: data.address,
                birth_date: new Date(data.birthDate),
                domicile: data.domicile,
                faculty: data.faculty,
                major: data.major,
                email: data.email,
                // password: ... (jika ada)
            }
        });
        // Generate OTP
        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
        await prisma.otp_verify.create({
            data: {
                phone: data.phoneNumber,
                otp,
                expiredAt,
            }
        });
        // Simulasi kirim OTP via console
        console.log(`OTP ${otp} dikirim ke ${data.phoneNumber}`);
        return {
            message: "Register berhasil. OTP dikirim ke nomor kamu.",
        };
    },
    async loginOtp(data) {
        const buyer = await prisma.pembeli.findFirst({
            where: { phone_number: data.phoneNumber }
        });
        if (!buyer) {
            throw new Error("Nomor telepon tidak terdaftar sebagai pembeli.");
        }
        // Generate OTP
        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
        await prisma.otp_verify.create({
            data: {
                phone: data.phoneNumber,
                otp,
                expiredAt,
            }
        });
        // Simulasi kirim OTP via console
        console.log(`OTP ${otp} dikirim ke ${data.phoneNumber}`);
        return { message: "OTP dikirim ke nomor kamu." };
    },
    async verifyOtp(data) {
        const otpRecord = await prisma.otp_verify.findFirst({
            where: {
                phone: data.phoneNumber,
                otp: data.otp,
                expiredAt: { gte: new Date() }
            }
        });
        if (!otpRecord) {
            throw new Error("OTP salah atau sudah expired.");
        }
        const buyer = await prisma.pembeli.findFirst({
            where: { phone_number: data.phoneNumber }
        });
        if (!buyer) {
            throw new Error("Pembeli tidak ditemukan.");
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: buyer.user_id, role: "pembeli" }, JWT_SECRET, { expiresIn: "1d" });
        // Hapus OTP setelah sukses verifikasi
        await prisma.otp_verify.delete({ where: { id: otpRecord.id } });
        return { token };
    }
};
