import { Request, Response } from "express";
import { registerBuyerSchema } from "./auth.schema";
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
