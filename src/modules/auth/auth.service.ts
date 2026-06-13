import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { generateOtp } from '../../utils/helpers';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../utils/errors';
import { sendOtp } from '../../services/notification/otp.sender';
import {
    RegisterBuyerDto,
    LoginOtpDto,
    VerifyOtpDto,
    RequestSellerOtpDto,
    VerifyOtpAndRegisterSellerDto,
    RegisterSellerStoreDto,
    ForgotPasswordSellerDto,
    VerifyResetOtpSellerDto,
    ResetPasswordSellerDto,
} from './auth.schema';

const OTP_EXPIRE_MINUTES = 5;
const SALT_ROUNDS = 10;

function signToken(payload: object, expiresIn: SignOptions['expiresIn']): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

async function issueOtp(phone: string): Promise<string> {
    if (!phone) {
        throw new Error('Phone number is required to issue OTP');
    }
    const otp = generateOtp(5);
    const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60_000);
    await prisma.otp_verify.create({ data: { phone, otp, expiredAt } });

    // Fire-and-forget: jika gateway gagal, OTP sudah tersimpan di DB
    // sehingga user bisa request ulang. Error hanya dicatat.
    sendOtp(phone, otp).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[auth] OTP dispatch failed:', err);
    });

    return otp;
}

export const authService = {
    async registerBuyer(data: RegisterBuyerDto) {
        const existing = await prisma.pembeli.findFirst({
            where: { OR: [{ phone_number: data.phoneNumber }, { email: data.email }] },
        });
        if (existing) throw new ConflictError('Nomor atau email sudah terdaftar.');

        await prisma.pembeli.create({
            data: {
                full_name: data.fullName,
                phone_number: data.phoneNumber,
                delivery_address: data.address,
                birth_date: new Date(data.birthDate),
                domicile: data.domicile,
                faculty: data.faculty,
                major: data.major,
                email: data.email,
            },
        });

        await issueOtp(data.phoneNumber);
        return { message: 'Register berhasil. OTP dikirim ke nomor kamu.' };
    },

    async loginOtp(data: LoginOtpDto) {
        const buyer = await prisma.pembeli.findFirst({ where: { phone_number: data.phoneNumber } });
        if (!buyer) throw new NotFoundError('Nomor telepon tidak terdaftar sebagai pembeli.');

        await issueOtp(data.phoneNumber);
        return { message: 'OTP dikirim ke nomor kamu.' };
    },

    async verifyOtp(data: VerifyOtpDto) {
        const otpRecord = await prisma.otp_verify.findFirst({
            where: { phone: data.phoneNumber, otp: data.otp, expiredAt: { gte: new Date() } },
        });
        if (!otpRecord) throw new UnauthorizedError('OTP salah atau sudah expired.');

        const buyer = await prisma.pembeli.findFirst({ where: { phone_number: data.phoneNumber } });
        if (!buyer) throw new NotFoundError('Pembeli tidak ditemukan.');

        const token = signToken({ id: buyer.user_id, role: 'pembeli' }, env.JWT_EXPIRES_IN as SignOptions['expiresIn']);
        await prisma.otp_verify.delete({ where: { id: otpRecord.id } });

        prisma.pembeli
            .update({ where: { user_id: buyer.user_id }, data: { last_login_at: new Date() } })
            .catch(() => {});

        return { token };
    },

    async requestSellerOtp(data: RequestSellerOtpDto) {
        await issueOtp(data.phoneNumber);
        return { message: 'OTP dikirim ke nomor kamu.' };
    },

    async verifyOtpAndRegisterSeller(data: VerifyOtpAndRegisterSellerDto) {
        const otpRecord = await prisma.otp_verify.findFirst({
            where: { phone: data.phoneNumber, otp: data.otp, expiredAt: { gte: new Date() } },
        });
        if (!otpRecord) throw new UnauthorizedError('OTP salah atau sudah expired.');

        const existing = await prisma.penjual.findFirst({
            where: { OR: [{ email: data.email }, { phone_number: data.phoneNumber }] },
        });
        if (existing) throw new ConflictError('Nomor atau email sudah terdaftar sebagai penjual.');

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        const seller = await prisma.penjual.create({
            data: { phone_number: data.phoneNumber, email: data.email, password: hashedPassword },
        });
        await prisma.otp_verify.delete({ where: { id: otpRecord.id } });

        const token = signToken(
            { sellerId: seller.mitra_id, role: 'penjual' },
            env.SELLER_JWT_EXPIRES_IN as SignOptions['expiresIn'],
        );
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
                status_verifikasi: 'pending',
            },
        });
        return { message: 'Profil toko berhasil dikirim, menunggu verifikasi.' };
    },

    async loginSeller(email: string, password: string) {
        const seller = await prisma.penjual.findFirst({ where: { email } });
        if (!seller) throw new NotFoundError('Email tidak terdaftar sebagai penjual.');
        if (!seller.password) throw new UnauthorizedError('Penjual belum memiliki password.');

        const match = await bcrypt.compare(password, seller.password);
        if (!match) throw new UnauthorizedError('Password salah.');

        const token = signToken(
            { sellerId: seller.mitra_id, role: 'penjual' },
            env.SELLER_JWT_EXPIRES_IN as SignOptions['expiresIn'],
        );

        prisma.penjual
            .update({ where: { mitra_id: seller.mitra_id }, data: { last_login_at: new Date() } })
            .catch(() => {});

        return { token };
    },

    async adminLogin(email: string, password: string) {
        if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
            throw new UnauthorizedError('Email atau password admin salah');
        }
        const token = signToken(
            { adminId: -1, role: 'admin' },
            env.ADMIN_JWT_EXPIRES_IN as SignOptions['expiresIn'],
        );
        return { token };
    },

    async forgotPasswordSeller(data: ForgotPasswordSellerDto) {
        const seller = await prisma.penjual.findFirst({
            where: {
                OR: [
                    data.email ? { email: data.email } : undefined,
                    data.phoneNumber ? { phone_number: data.phoneNumber } : undefined,
                ].filter(Boolean) as never,
            },
        });
        if (!seller) throw new NotFoundError('Penjual tidak ditemukan.');

        const phone = seller.phone_number || data.phoneNumber || '';
        await issueOtp(phone);
        return { message: 'OTP reset password dikirim.' };
    },

    async verifyResetOtpSeller(data: VerifyResetOtpSellerDto) {
        const seller = await prisma.penjual.findFirst({
            where: {
                OR: [
                    data.email ? { email: data.email } : undefined,
                    data.phoneNumber ? { phone_number: data.phoneNumber } : undefined,
                ].filter(Boolean) as never,
            },
        });
        if (!seller) throw new NotFoundError('Penjual tidak ditemukan.');

        const phone = seller.phone_number || data.phoneNumber || '';
        const otpRecord = await prisma.otp_verify.findFirst({
            where: { phone, otp: data.otp, expiredAt: { gte: new Date() } },
        });
        if (!otpRecord) throw new UnauthorizedError('OTP salah atau sudah expired.');

        return { message: 'OTP valid.' };
    },

    async resetPasswordSeller(data: ResetPasswordSellerDto) {
        const seller = await prisma.penjual.findFirst({
            where: {
                OR: [
                    data.email ? { email: data.email } : undefined,
                    data.phoneNumber ? { phone_number: data.phoneNumber } : undefined,
                ].filter(Boolean) as never,
            },
        });
        if (!seller) throw new NotFoundError('Penjual tidak ditemukan.');

        const phone = seller.phone_number || data.phoneNumber || '';
        const otpRecord = await prisma.otp_verify.findFirst({
            where: { phone, otp: data.otp, expiredAt: { gte: new Date() } },
        });
        if (!otpRecord) throw new UnauthorizedError('OTP salah atau sudah expired.');

        const hashedPassword = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
        await prisma.penjual.update({
            where: { mitra_id: seller.mitra_id },
            data: { password: hashedPassword },
        });
        await prisma.otp_verify.delete({ where: { id: otpRecord.id } });
        return { message: 'Password berhasil direset.' };
    },
};
