import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecret(): string {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET tidak ditemukan di environment variable. Pastikan .env sudah benar!");
    }
    return JWT_SECRET;
}

export function jwtMiddleware(req: Request, res: Response, next: NextFunction) {
    const secret = getJwtSecret();
    console.log("[DEBUG jwt.middleware] JWT_SECRET:", secret);
    const authHeader = req.headers.authorization;
    console.log("[DEBUG jwt.middleware] Authorization Header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, secret);
        console.log("[DEBUG jwt.middleware] Decoded Token:", decoded);
        (req as any).user = decoded;
        next();
    } catch (err: any) {
        console.log("[DEBUG jwt.middleware] JWT Error:", err);
        return res.status(401).json({ message: `Token tidak valid: ${err.message}` });
    }
}
