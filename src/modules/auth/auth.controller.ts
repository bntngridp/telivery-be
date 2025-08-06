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
    resetPasswordSellerSchema
} from "./auth.schema";
import { authService } from "./auth.service";

export const registerBuyer = async (req: Request, res: Response) => {
    try {
        const parsed = registerBuyerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Data tidak valid",
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        const result = await authService.registerBuyer(parsed.data);
        return res.status(201).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "Gagal register" });
    }
};

export const loginOtp = async (req: Request, res: Response) => {
    const parsed = loginOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Data tidak valid",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        const result = await authService.loginOtp(parsed.data);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "Gagal mengirim OTP" });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Data tidak valid",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        const result = await authService.verifyOtp(parsed.data);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "OTP tidak valid" });
    }
};

export const requestSellerOtp = async (req: Request, res: Response) => {
    const parsed = requestSellerOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Data tidak valid",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        const result = await authService.requestSellerOtp(parsed.data);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "Gagal mengirim OTP" });
    }
};

export const verifyOtpAndRegisterSeller = async (req: Request, res: Response) => {
    const parsed = verifyOtpAndRegisterSellerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Data tidak valid",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        const result = await authService.verifyOtpAndRegisterSeller(parsed.data);
        return res.status(201).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "Gagal register penjual" });
    }
};

export const registerSellerStore = async (req: Request, res: Response) => {
    // Ambil sellerId dari JWT (misal sudah ada middleware auth)
    const sellerId = (req as any).user?.sellerId;
    if (!sellerId) return res.status(401).json({ message: "Unauthorized" });

    // Ambil file path dari req.files
    const files = req.files as Record<string, Express.Multer.File[]>;
    const ownerKtpPhoto = files?.ownerKtpPhoto?.[0]?.path || "";
    const ownerFacePhoto = files?.ownerFacePhoto?.[0]?.path || "";

    // Ambil data lain dari body
    const { businessType, storeName, storeAddress } = req.body;

    // Validasi manual (karena file tidak divalidasi oleh zod)
    if (!businessType || !storeName || !storeAddress || !ownerKtpPhoto || !ownerFacePhoto) {
        return res.status(400).json({ message: "Data tidak lengkap" });
    }

    try {
        const result = await authService.registerSellerStore(sellerId, {
            businessType,
            ownerKtpPhoto,
            storeName,
            storeAddress,
            ownerFacePhoto,
        });
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "Gagal melengkapi profil toko" });
    }
};

export const loginSeller = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi" });
    }
    try {
        const result = await authService.loginSeller(email, password);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "Gagal login penjual" });
    }
};

export const forgotPasswordSeller = async (req: Request, res: Response) => {
    const parsed = forgotPasswordSellerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsed.error.flatten().fieldErrors });
    }
    try {
        const result = await authService.forgotPasswordSeller(parsed.data);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "Gagal mengirim OTP reset password" });
    }
};

export const verifyResetOtpSeller = async (req: Request, res: Response) => {
    const parsed = verifyResetOtpSellerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsed.error.flatten().fieldErrors });
    }
    try {
        const result = await authService.verifyResetOtpSeller(parsed.data);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "OTP tidak valid" });
    }
};

export const resetPasswordSeller = async (req: Request, res: Response) => {
    const parsed = resetPasswordSellerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsed.error.flatten().fieldErrors });
    }
    try {
        const result = await authService.resetPasswordSeller(parsed.data);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(400).json({ message: err.message || "Gagal reset password" });
    }
};
