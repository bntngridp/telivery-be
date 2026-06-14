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
} from "./auth.schema";
import { authService } from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { created, success } from "../../utils/response";
import { UnauthorizedError, BadRequestError } from "../../utils/errors";

export const registerBuyer = asyncHandler(
  async (req: Request, res: Response) => {
    const data = registerBuyerSchema.parse(req.body);
    const result = await authService.registerBuyer(data);
    return created(res, result.message, result);
  },
);

export const loginOtp = asyncHandler(async (req: Request, res: Response) => {
  const data = loginOtpSchema.parse(req.body);
  const result = await authService.loginOtp(data);
  return success(res, result.message, result);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const data = verifyOtpSchema.parse(req.body);
  const result = await authService.verifyOtp(data);
  return success(res, "Login berhasil", result);
});

export const requestSellerOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const data = requestSellerOtpSchema.parse(req.body);
    const result = await authService.requestSellerOtp(data);
    return success(res, result.message, result);
  },
);

export const verifyOtpAndRegisterSeller = asyncHandler(
  async (req: Request, res: Response) => {
    const data = verifyOtpAndRegisterSellerSchema.parse(req.body);
    const result = await authService.verifyOtpAndRegisterSeller(data);
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

export const loginSeller = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    throw new BadRequestError("Email dan password wajib diisi");
  const result = await authService.loginSeller(email, password);
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
