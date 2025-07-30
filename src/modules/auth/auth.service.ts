import { PrismaClient } from "@prisma/client";
import { RegisterBuyerDto, LoginOtpDto, VerifyOtpDto } from "./auth.schema";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const OTP_EXPIRE_MINUTES = 5;
const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const authService = {
    async registerBuyer(data: RegisterBuyerDto) {
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

    async loginOtp(data: LoginOtpDto) {
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

    async verifyOtp(data: VerifyOtpDto) {
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
        const token = jwt.sign({ id: buyer.user_id, role: "pembeli" }, JWT_SECRET, { expiresIn: "1d" });
        // Hapus OTP setelah sukses verifikasi
        await prisma.otp_verify.delete({ where: { id: otpRecord.id } });
        return { token };
    }
};
