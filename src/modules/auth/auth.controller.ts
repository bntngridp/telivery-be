import { Request, Response } from "express";
import {
  registerBuyerSchema,
  loginOtpSchema,
  verifyOtpSchema,
  requestSellerOtpSchema,
  verifyOtpAndRegisterSellerSchema,
  registerSellerStoreSchema,
  forgotPasswordSellerSchema,
  verifyResetOtpSellerSchema,
  resetPasswordSellerSchema,
  loginBuyerSchema,
  refreshTokenSchema,
  setBuyerPasswordSchema,
} from "./auth.schema";
import { authService } from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, success } from "../../utils/response";
import { UnauthorizedError, BadRequestError } from "../../utils/errors";

/**
 * @openapi
 * /api/auth/buyer/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register pembeli baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, fullName, birthDate]
 *             properties:
 *               phoneNumber: { type: string, example: "081234567890" }
 *               fullName: { type: string }
 *               birthDate: { type: string, format: date }
 *               email: { type: string, format: email, nullable: true }
 *               password: { type: string, minLength: 8, nullable: true }
 *               domicile: { type: string, nullable: true }
 *               faculty: { type: string, nullable: true }
 *               major: { type: string, nullable: true }
 *               address: { type: string, nullable: true }
 *     responses:
 *       201: { description: "Buyer registered, OTP dispatched" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       409: { description: "Phone/email already registered" }
 */
export const registerBuyer = asyncHandler(
  async (req: Request, res: Response) => {
    const data = registerBuyerSchema.parse(req.body);
    const result = await authService.registerBuyer(data);
    return created(res, result.message, result);
  },
);

/**
 * @openapi
 * /api/auth/buyer/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login pembeli dengan email + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *                     expiresIn: { type: integer }
 *                     user: { $ref: "#/components/schemas/Buyer" }
 *       401: { description: "Email atau password salah" }
 */
export const loginBuyer = asyncHandler(async (req: Request, res: Response) => {
  const data = loginBuyerSchema.parse(req.body);
  const result = await authService.loginBuyer(data, req.headers["user-agent"]);
  return success(res, "Login berhasil", result);
});

export const loginOtp = asyncHandler(async (req: Request, res: Response) => {
  const data = loginOtpSchema.parse(req.body);
  const result = await authService.loginOtp(data);
  return success(res, result.message, result);
});

/**
 * @openapi
 * /api/auth/buyer/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verifikasi OTP dan dapatkan access + refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, otp]
 *             properties:
 *               phoneNumber: { type: string }
 *               otp: { type: string }
 *     responses:
 *       200: { description: "Login berhasil" }
 *       401: { description: "OTP salah atau expired" }
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const data = verifyOtpSchema.parse(req.body);
  const result = await authService.verifyOtp(data, req.headers["user-agent"]);
  return success(res, "Login berhasil", result);
});

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Tukar refresh token dengan access token baru (rotation)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: "Token baru" }
 *       401: { description: "Refresh token invalid/revoked/expired" }
 */
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const data = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshAccessToken(
      data,
      req.headers["user-agent"],
    );
    return success(res, "Token diperbarui", result);
  },
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout, revoke refresh token
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string, nullable: true }
 *     responses:
 *       200: { description: "Logout berhasil" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id && !req.user?.sellerId) {
    throw new UnauthorizedError("Unauthorized");
  }
  const body = (req.body ?? {}) as { refreshToken?: string };
  const result = await authService.logout(body.refreshToken);
  return success(res, result.message, result);
});

/**
 * @openapi
 * /api/auth/buyer/password:
 *   patch:
 *     tags: [Auth]
 *     summary: Set atau ubah password pembeli (untuk user OTP-only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               oldPassword: { type: string, nullable: true }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: "Password berhasil disimpan" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
export const setBuyerPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError("Unauthorized");
    const data = setBuyerPasswordSchema.parse(req.body);
    const result = await authService.setBuyerPassword(userId, data);
    return success(res, result.message, result);
  },
);

export const requestSellerOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const data = requestSellerOtpSchema.parse(req.body);
    const result = await authService.requestSellerOtp(data);
    return success(res, result.message, result);
  },
);

/**
 * @openapi
 * /api/auth/seller/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register dan verifikasi OTP penjual
 */
export const verifyOtpAndRegisterSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const data = verifyOtpAndRegisterSellerSchema.parse(req.body);
    const result = await authService.verifyOtpAndRegisterSeller(
      data,
      req.headers["user-agent"],
    );
    return created(res, "Register penjual berhasil", result);
  },
);

export const registerSellerStore = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = req.user?.sellerId;
    if (!sellerId) throw new UnauthorizedError("Unauthorized");

    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const body = {
      businessType: req.body.businessType,
      storeName: req.body.storeName,
      storeAddress: req.body.storeAddress,
      ownerKtpPhoto: files?.ownerKtpPhoto?.[0]?.path ?? "",
      ownerFacePhoto: files?.ownerFacePhoto?.[0]?.path ?? "",
    };

    const data = registerSellerStoreSchema.parse(body);
    const result = await authService.registerSellerStore(sellerId, data);
    return success(res, result.message, result);
  },
);

/**
 * @openapi
 * /api/auth/seller/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login penjual dengan email + password
 */
export const loginSeller = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    throw new BadRequestError("Email dan password wajib diisi");
  const result = await authService.loginSeller(
    email,
    password,
    req.headers["user-agent"],
  );
  return success(res, "Login berhasil", result);
});

export const forgotPasswordSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const data = forgotPasswordSellerSchema.parse(req.body);
    const result = await authService.forgotPasswordSeller(data);
    return success(res, result.message, result);
  },
);

export const verifyResetOtpSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const data = verifyResetOtpSellerSchema.parse(req.body);
    const result = await authService.verifyResetOtpSeller(data);
    return success(res, result.message, result);
  },
);

export const resetPasswordSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const data = resetPasswordSellerSchema.parse(req.body);
    const result = await authService.resetPasswordSeller(data);
    return success(res, result.message, result);
  },
);

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    throw new BadRequestError("Email dan password wajib diisi");
  const result = await authService.adminLogin(email, password);
  return success(res, "Login admin berhasil", result);
});
