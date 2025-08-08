import { PrismaClient } from "@prisma/client";
import { RegisterBuyerDto, LoginOtpDto, VerifyOtpDto, RequestSellerOtpDto, VerifyOtpAndRegisterSellerDto, RegisterSellerStoreDto, ForgotPasswordSellerDto, VerifyResetOtpSellerDto, ResetPasswordSellerDto } from "./auth.schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { SignOptions } from "jsonwebtoken";

const prisma = new PrismaClient();
const OTP_EXPIRE_MINUTES = 5;
const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecret(): string {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET tidak ditemukan di environment variable. Pastikan .env sudah benar!");
    }
    return JWT_SECRET;
}

function generateToken(payload: object, expiresIn: SignOptions["expiresIn"] = "1d") {
    const secret = getJwtSecret();
    console.debug("[DEBUG generateToken] JWT_SECRET:", secret);
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, secret, options);
}

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
            }
        });
        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
        await prisma.otp_verify.create({
            data: {
                phone: data.phoneNumber,
                otp,
                expiredAt,
            }
        });
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
        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
        await prisma.otp_verify.create({
            data: {
                phone: data.phoneNumber,
                otp,
                expiredAt,
            }
        });
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
        console.debug("[DEBUG verifyOtp] JWT_SECRET:", JWT_SECRET);
        const token = generateToken({ id: buyer.user_id, role: "pembeli" }, "1d");
        await prisma.otp_verify.delete({ where: { id: otpRecord.id } });
        return { token };
    },



    async requestSellerOtp(data: RequestSellerOtpDto) {
        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
        await prisma.otp_verify.create({
            data: {
                phone: data.phoneNumber,
                otp,
                expiredAt,
            }
        });
        console.log(`OTP ${otp} dikirim ke ${data.phoneNumber}`);
        return { message: "OTP dikirim ke nomor kamu." };
    },

    async verifyOtpAndRegisterSeller(data: VerifyOtpAndRegisterSellerDto) {
        const otpRecord = await prisma.otp_verify.findFirst({
            where: {
                phone: data.phoneNumber,
                otp: data.otp,
                expiredAt: { gte: new Date() }
            }
        });
        if (!otpRecord) throw new Error("OTP salah atau sudah expired.");
        const existing = await prisma.penjual.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { phone_number: data.phoneNumber }
                ]
            }
        });
        if (existing) throw new Error("Nomor atau email sudah terdaftar sebagai penjual.");
        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        const seller = await prisma.penjual.create({
            data: {
                phone_number: data.phoneNumber,
                email: data.email,
                password: hashedPassword
            }
        });
        await prisma.otp_verify.delete({ where: { id: otpRecord.id } });

        console.debug("[DEBUG verifyOtpAndRegisterSeller] JWT_SECRET:", JWT_SECRET);
        const token = generateToken({ sellerId: seller.mitra_id, role: "penjual" }, "7d");
        return { token };
    },

    async registerSellerStore(sellerId: number, data: RegisterSellerStoreDto) {
        await prisma.penjual.update({
            where: { mitra_id: sellerId },
            data: {
                jenis_usaha: data.businessType,
                foto_ktp_pemilik: data.ownerKtpPhoto,
                nama_toko: data.storeName,
                alamat_toko: data.storeAddress,
                foto_pemilik: data.ownerFacePhoto,
                status_verifikasi: "pending"
            }
        });
        return { message: "Profil toko berhasil dikirim, menunggu verifikasi." };
    },

    async loginSeller(email: string, password: string) {
        const seller = await prisma.penjual.findFirst({ where: { email } });
        if (!seller) throw new Error("Email tidak terdaftar sebagai penjual.");
        if (!seller.password) throw new Error("Penjual belum memiliki password.");
        const match = await bcrypt.compare(password, seller.password);
        if (!match) throw new Error("Password salah.");
        const token = generateToken({ sellerId: seller.mitra_id, role: "penjual" }, "7d");
        return { token };
    },

    async forgotPasswordSeller(data: ForgotPasswordSellerDto) {
        const seller = await prisma.penjual.findFirst({
            where: {
                OR: [
                    data.email ? { email: data.email } : undefined,
                    data.phoneNumber ? { phone_number: data.phoneNumber } : undefined,
                ].filter(Boolean) as any,
            },
        });
        if (!seller) throw new Error("Penjual tidak ditemukan.");
        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
        await prisma.otp_verify.create({
            data: {
                phone: seller.phone_number || "",
                otp,
                expiredAt,
            },
        });
        console.log(`OTP reset password ${otp} dikirim ke ${seller.phone_number || seller.email}`);
        return { message: "OTP reset password dikirim." };
    },

    async verifyResetOtpSeller(data: VerifyResetOtpSellerDto) {
        const seller = await prisma.penjual.findFirst({
            where: {
                OR: [
                    data.email ? { email: data.email } : undefined,
                    data.phoneNumber ? { phone_number: data.phoneNumber } : undefined,
                ].filter(Boolean) as any,
            },
        });
        if (!seller) throw new Error("Penjual tidak ditemukan.");
        const otpRecord = await prisma.otp_verify.findFirst({
            where: {
                phone: seller.phone_number || "",
                otp: data.otp,
                expiredAt: { gte: new Date() },
            },
        });
        if (!otpRecord) throw new Error("OTP salah atau sudah expired.");
        return { message: "OTP valid." };
    },

    async resetPasswordSeller(data: ResetPasswordSellerDto) {
        const seller = await prisma.penjual.findFirst({
            where: {
                OR: [
                    data.email ? { email: data.email } : undefined,
                    data.phoneNumber ? { phone_number: data.phoneNumber } : undefined,
                ].filter(Boolean) as any,
            },
        });
        if (!seller) throw new Error("Penjual tidak ditemukan.");
        const otpRecord = await prisma.otp_verify.findFirst({
            where: {
                phone: seller.phone_number || "",
                otp: data.otp,
                expiredAt: { gte: new Date() },
            },
        });
        if (!otpRecord) throw new Error("OTP salah atau sudah expired.");
        const hashedPassword = await bcrypt.hash(data.newPassword, 10);
        await prisma.penjual.update({
            where: { mitra_id: seller.mitra_id },
            data: { password: hashedPassword },
        });
        await prisma.otp_verify.delete({ where: { id: otpRecord.id } });
        return { message: "Password berhasil direset." };
    },
};
