"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtMiddleware = jwtMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
function getJwtSecret() {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET tidak ditemukan di environment variable. Pastikan .env sudah benar!");
    }
    return JWT_SECRET;
}
function jwtMiddleware(req, res, next) {
    const secret = getJwtSecret();
    console.log("[DEBUG jwt.middleware] JWT_SECRET:", secret);
    const authHeader = req.headers.authorization;
    console.log("[DEBUG jwt.middleware] Authorization Header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token tidak ditemukan" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        console.log("[DEBUG jwt.middleware] Decoded Token:", decoded);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.log("[DEBUG jwt.middleware] JWT Error:", err);
        return res.status(401).json({ message: `Token tidak valid: ${err.message}` });
    }
}
