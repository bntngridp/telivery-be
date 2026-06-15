import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { generateOtp } from "../../utils/helpers";
import {
  createRefreshToken,
  revokeRefreshToken,
  refreshTokenExpiresInSeconds,
} from "../../utils/refreshToken";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../../utils/errors";
import { sendOtp } from "../../services/notification/otp.sender";
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
  LoginBuyerDto,
  RefreshTokenDto,
  SetBuyerPasswordDto,
} from "./auth.schema";

const OTP_EXPIRE_MINUTES = 5;
const SALT_ROUNDS = env.BCRYPT_ROUNDS;

function signToken(
  payload: object,
  expiresIn: SignOptions["expiresIn"],
): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

interface BuyerTokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    email: string | null;
    full_name: string | null;
    phone_number: string | null;
  };
}

interface SellerTokenBundle {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    sellerId: number;
    nama_toko: string | null;
    email: string | null;
    role_penjual: string | null;
  };
}

async function issueTokensForBuyer(
  buyer: {
    user_id: number;
    email: string | null;
    full_name: string | null;
    phone_number: string | null;
  },
  userAgent?: string,
): Promise<BuyerTokenBundle> {
  const accessToken = signToken(
    { id: buyer.user_id, role: "pembeli" },
    env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  );
  const { token: refreshToken } = await createRefreshToken({
    userId: buyer.user_id,
    userAgent,
  });
  return {
    accessToken,
    refreshToken,
    expiresIn: refreshTokenExpiresInSeconds(),
    user: {
      id: buyer.user_id,
      email: buyer.email,
      full_name: buyer.full_name,
      phone_number: buyer.phone_number,
    },
  };
}

async function issueTokensForSeller(
  seller: {
    mitra_id: number;
    nama_toko: string | null;
    email: string | null;
    role_penjual: string | null;
  },
  userAgent?: string,
): Promise<SellerTokenBundle> {
  const accessToken = signToken(
    { sellerId: seller.mitra_id, role: "penjual" },
    env.SELLER_JWT_EXPIRES_IN as SignOptions["expiresIn"],
  );
  const { token: refreshToken } = await createRefreshToken({
    mitraId: seller.mitra_id,
    userAgent,
  });
  return {
    accessToken,
    refreshToken,
    expiresIn: refreshTokenExpiresInSeconds(),
    user: {
      sellerId: seller.mitra_id,
      nama_toko: seller.nama_toko,
      email: seller.email,
      role_penjual: seller.role_penjual,
    },
  };
}

async function issueOtp(phone: string): Promise<string> {
  if (!phone) {
    throw new Error("Phone number is required to issue OTP");
  }
  const otp = generateOtp(5);
  const expiredAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60_000);
  await prisma.otp_verify.create({ data: { phone, otp, expiredAt } });

  sendOtp(phone, otp).catch((err) => {
    console.error("[auth] OTP dispatch failed:", err);
  });

  return otp;
}

export const authService = {
  async registerBuyer(data: RegisterBuyerDto) {
    const existing = await prisma.pembeli.findFirst({
      where: {
        OR: [
          { phone_number: data.phoneNumber },
          data.email ? { email: data.email } : undefined,
        ].filter(Boolean) as never,
      },
    });
    if (existing) throw new ConflictError("Nomor atau email sudah terdaftar.");

    const hashedPassword =
      data.password && data.password.length > 0
        ? await bcrypt.hash(data.password, SALT_ROUNDS)
        : null;

    await prisma.pembeli.create({
      data: {
        full_name: data.fullName,
        phone_number: data.phoneNumber,
        delivery_address: data.address,
        birth_date: new Date(data.birthDate),
        domicile: data.domicile,
        faculty: data.faculty,
        major: data.major,
        email: data.email ?? null,
        password: hashedPassword,
      },
    });

    await issueOtp(data.phoneNumber);
    return { message: "Register berhasil. OTP dikirim ke nomor kamu." };
  },

  async loginOtp(data: LoginOtpDto) {
    const buyer = await prisma.pembeli.findFirst({
      where: { phone_number: data.phoneNumber },
    });
    if (!buyer)
      throw new NotFoundError("Nomor telepon tidak terdaftar sebagai pembeli.");

    await issueOtp(data.phoneNumber);
    return { message: "OTP dikirim ke nomor kamu." };
  },

  async verifyOtp(data: VerifyOtpDto, userAgent?: string) {
    const otpRecord = await prisma.otp_verify.findFirst({
      where: {
        phone: data.phoneNumber,
        otp: data.otp,
        expiredAt: { gte: new Date() },
      },
    });
    if (!otpRecord)
      throw new UnauthorizedError("OTP salah atau sudah expired.");

    const buyer = await prisma.pembeli.findFirst({
      where: { phone_number: data.phoneNumber },
    });
    if (!buyer) throw new NotFoundError("Pembeli tidak ditemukan.");

    await prisma.otp_verify.delete({ where: { id: otpRecord.id } });

    const tokens = await issueTokensForBuyer(buyer, userAgent);

    prisma.pembeli
      .update({
        where: { user_id: buyer.user_id },
        data: { last_login_at: new Date() },
      })
      .catch(() => {});

    return { ...tokens, token: tokens.accessToken };
  },

  async loginBuyer(data: LoginBuyerDto, userAgent?: string) {
    const buyer = await prisma.pembeli.findFirst({
      where: { email: data.email },
    });
    if (!buyer || !buyer.password)
      throw new UnauthorizedError("Email atau password salah");

    const match = await bcrypt.compare(data.password, buyer.password);
    if (!match) throw new UnauthorizedError("Email atau password salah");

    const tokens = await issueTokensForBuyer(buyer, userAgent);

    prisma.pembeli
      .update({
        where: { user_id: buyer.user_id },
        data: { last_login_at: new Date() },
      })
      .catch(() => {});

    return { ...tokens, token: tokens.accessToken };
  },

  async refreshAccessToken(data: RefreshTokenDto, userAgent?: string) {
    const { hashToken } = await import("../../utils/refreshToken");
    const tokenHash = hashToken(data.refreshToken);
    const found = await prisma.refresh_token.findUnique({
      where: { token_hash: tokenHash },
    });
    if (!found) throw new UnauthorizedError("Refresh token tidak valid");
    if (found.revoked_at)
      throw new UnauthorizedError("Refresh token sudah di-revoke");
    if (found.expires_at.getTime() < Date.now())
      throw new UnauthorizedError("Refresh token sudah expired");

    if (found.user_id) {
      const buyer = await prisma.pembeli.findUnique({
        where: { user_id: found.user_id },
      });
      if (!buyer) throw new UnauthorizedError("User tidak ditemukan");
      const tokens = await issueTokensForBuyer(buyer, userAgent);
      await prisma.refresh_token.update({
        where: { token_id: found.token_id },
        data: { revoked_at: new Date() },
      });
      return { ...tokens, token: tokens.accessToken };
    }
    if (found.mitra_id) {
      const seller = await prisma.penjual.findUnique({
        where: { mitra_id: found.mitra_id },
      });
      if (!seller) throw new UnauthorizedError("User tidak ditemukan");
      const tokens = await issueTokensForSeller(seller, userAgent);
      await prisma.refresh_token.update({
        where: { token_id: found.token_id },
        data: { revoked_at: new Date() },
      });
      return { ...tokens, token: tokens.accessToken };
    }
    throw new UnauthorizedError("Refresh token tidak valid");
  },

  async logout(refreshTokenValue?: string) {
    if (refreshTokenValue) {
      await revokeRefreshToken(refreshTokenValue);
    }
    return { message: "Logout berhasil" };
  },

  async setBuyerPassword(
    userId: number,
    data: SetBuyerPasswordDto,
  ): Promise<{ message: string }> {
    const buyer = await prisma.pembeli.findUnique({
      where: { user_id: userId },
    });
    if (!buyer) throw new NotFoundError("Pembeli tidak ditemukan");

    if (buyer.password) {
      if (!data.oldPassword)
        throw new BadRequestError(
          "Password lama wajib diisi untuk mengubah password",
        );
      const match = await bcrypt.compare(data.oldPassword, buyer.password);
      if (!match) throw new UnauthorizedError("Password lama salah");
    }

    const hashed = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    await prisma.pembeli.update({
      where: { user_id: userId },
      data: { password: hashed },
    });
    return { message: "Password berhasil disimpan" };
  },

  async requestSellerOtp(data: RequestSellerOtpDto) {
    await issueOtp(data.phoneNumber);
    return { message: "OTP dikirim ke nomor kamu." };
  },

  async verifyOtpAndRegisterSeller(
    data: VerifyOtpAndRegisterSellerDto,
    userAgent?: string,
  ) {
    const otpRecord = await prisma.otp_verify.findFirst({
      where: {
        phone: data.phoneNumber,
        otp: data.otp,
        expiredAt: { gte: new Date() },
      },
    });
    if (!otpRecord)
      throw new UnauthorizedError("OTP salah atau sudah expired.");

    const existing = await prisma.penjual.findFirst({
      where: {
        OR: [{ email: data.email }, { phone_number: data.phoneNumber }],
      },
    });
    if (existing)
      throw new ConflictError(
        "Nomor atau email sudah terdaftar sebagai penjual.",
      );

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    const seller = await prisma.penjual.create({
      data: {
        phone_number: data.phoneNumber,
        email: data.email,
        password: hashedPassword,
      },
    });
    await prisma.otp_verify.delete({ where: { id: otpRecord.id } });

    const tokens = await issueTokensForSeller(seller, userAgent);
    return { ...tokens, token: tokens.accessToken };
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
        status_verifikasi: "pending",
      },
    });
    return { message: "Profil toko berhasil dikirim, menunggu verifikasi." };
  },

  async loginSeller(email: string, password: string, userAgent?: string) {
    const seller = await prisma.penjual.findFirst({ where: { email } });
    if (!seller)
      throw new NotFoundError("Email tidak terdaftar sebagai penjual.");
    if (!seller.password)
      throw new UnauthorizedError("Penjual belum memiliki password.");

    const match = await bcrypt.compare(password, seller.password);
    if (!match) throw new UnauthorizedError("Password salah.");

    const tokens = await issueTokensForSeller(seller, userAgent);

    prisma.penjual
      .update({
        where: { mitra_id: seller.mitra_id },
        data: { last_login_at: new Date() },
      })
      .catch(() => {});

    return { ...tokens, token: tokens.accessToken };
  },

  async adminLogin(email: string, password: string) {
    if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
      throw new UnauthorizedError("Email atau password admin salah");
    }
    const accessToken = signToken(
      { adminId: -1, role: "admin" },
      env.ADMIN_JWT_EXPIRES_IN as SignOptions["expiresIn"],
    );
    return {
      accessToken,
      refreshToken: "",
      expiresIn: refreshTokenExpiresInSeconds(),
      user: { adminId: -1, email, role: "admin" },
      token: accessToken,
    };
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
    if (!seller) throw new NotFoundError("Penjual tidak ditemukan.");

    const phone = seller.phone_number || data.phoneNumber || "";
    await issueOtp(phone);
    return { message: "OTP reset password dikirim." };
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
    if (!seller) throw new NotFoundError("Penjual tidak ditemukan.");

    const phone = seller.phone_number || data.phoneNumber || "";
    const otpRecord = await prisma.otp_verify.findFirst({
      where: { phone, otp: data.otp, expiredAt: { gte: new Date() } },
    });
    if (!otpRecord)
      throw new UnauthorizedError("OTP salah atau sudah expired.");

    return { message: "OTP valid." };
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
    if (!seller) throw new NotFoundError("Penjual tidak ditemukan.");

    const phone = seller.phone_number || data.phoneNumber || "";
    const otpRecord = await prisma.otp_verify.findFirst({
      where: { phone, otp: data.otp, expiredAt: { gte: new Date() } },
    });
    if (!otpRecord)
      throw new UnauthorizedError("OTP salah atau sudah expired.");

    const hashedPassword = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    await prisma.penjual.update({
      where: { mitra_id: seller.mitra_id },
      data: { password: hashedPassword },
    });
    await prisma.otp_verify.delete({ where: { id: otpRecord.id } });
    return { message: "Password berhasil direset." };
  },
};
