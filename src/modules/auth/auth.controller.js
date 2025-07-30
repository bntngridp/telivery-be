"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.loginOtp = exports.registerBuyer = void 0;
const auth_schema_1 = require("./auth.schema");
const auth_service_1 = require("./auth.service");
const registerBuyer = async (req, res) => {
    try {
        const parsed = auth_schema_1.registerBuyerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Data tidak valid",
                errors: parsed.error.flatten().fieldErrors,
            });
        }
        const result = await auth_service_1.authService.registerBuyer(parsed.data);
        return res.status(201).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "Gagal register" });
    }
};
exports.registerBuyer = registerBuyer;
const loginOtp = async (req, res) => {
    const parsed = auth_schema_1.loginOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Data tidak valid",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        const result = await auth_service_1.authService.loginOtp(parsed.data);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "Gagal mengirim OTP" });
    }
};
exports.loginOtp = loginOtp;
const verifyOtp = async (req, res) => {
    const parsed = auth_schema_1.verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Data tidak valid",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        const result = await auth_service_1.authService.verifyOtp(parsed.data);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "OTP tidak valid" });
    }
};
exports.verifyOtp = verifyOtp;
