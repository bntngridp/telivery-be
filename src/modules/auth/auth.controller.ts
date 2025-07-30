import { Request, Response } from "express";
import { registerBuyerSchema, loginOtpSchema, verifyOtpSchema } from "./auth.schema";
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
