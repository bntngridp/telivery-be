"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSeller = exports.verifyResetOtpSeller = exports.forgotPasswordSeller = exports.loginSeller = exports.registerSellerStore = exports.verifyOtpAndRegisterSeller = exports.requestSellerOtp = exports.verifyOtp = exports.loginOtp = exports.registerBuyer = void 0;
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
const requestSellerOtp = async (req, res) => {
    const parsed = auth_schema_1.requestSellerOtpSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Data tidak valid",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        const result = await auth_service_1.authService.requestSellerOtp(parsed.data);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "Gagal mengirim OTP" });
    }
};
exports.requestSellerOtp = requestSellerOtp;
const verifyOtpAndRegisterSeller = async (req, res) => {
    const parsed = auth_schema_1.verifyOtpAndRegisterSellerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            message: "Data tidak valid",
            errors: parsed.error.flatten().fieldErrors,
        });
    }
    try {
        const result = await auth_service_1.authService.verifyOtpAndRegisterSeller(parsed.data);
        return res.status(201).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "Gagal register penjual" });
    }
};
exports.verifyOtpAndRegisterSeller = verifyOtpAndRegisterSeller;
const registerSellerStore = async (req, res) => {
    const sellerId = req.user?.sellerId;
    if (!sellerId)
        return res.status(401).json({ message: "Unauthorized" });
    const files = req.files;
    const ownerKtpPhoto = files?.ownerKtpPhoto?.[0]?.path || "";
    const ownerFacePhoto = files?.ownerFacePhoto?.[0]?.path || "";
    const { businessType, storeName, storeAddress } = req.body;
    if (!businessType || !storeName || !storeAddress || !ownerKtpPhoto || !ownerFacePhoto) {
        return res.status(400).json({ message: "Data tidak lengkap" });
    }
    try {
        const result = await auth_service_1.authService.registerSellerStore(sellerId, {
            businessType,
            ownerKtpPhoto,
            storeName,
            storeAddress,
            ownerFacePhoto,
        });
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "Gagal melengkapi profil toko" });
    }
};
exports.registerSellerStore = registerSellerStore;
const loginSeller = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi" });
    }
    try {
        const result = await auth_service_1.authService.loginSeller(email, password);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "Gagal login penjual" });
    }
};
exports.loginSeller = loginSeller;
const forgotPasswordSeller = async (req, res) => {
    const parsed = auth_schema_1.forgotPasswordSellerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsed.error.flatten().fieldErrors });
    }
    try {
        const result = await auth_service_1.authService.forgotPasswordSeller(parsed.data);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "Gagal mengirim OTP reset password" });
    }
};
exports.forgotPasswordSeller = forgotPasswordSeller;
const verifyResetOtpSeller = async (req, res) => {
    const parsed = auth_schema_1.verifyResetOtpSellerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsed.error.flatten().fieldErrors });
    }
    try {
        const result = await auth_service_1.authService.verifyResetOtpSeller(parsed.data);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "OTP tidak valid" });
    }
};
exports.verifyResetOtpSeller = verifyResetOtpSeller;
const resetPasswordSeller = async (req, res) => {
    const parsed = auth_schema_1.resetPasswordSellerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Data tidak valid", errors: parsed.error.flatten().fieldErrors });
    }
    try {
        const result = await auth_service_1.authService.resetPasswordSeller(parsed.data);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(400).json({ message: err.message || "Gagal reset password" });
    }
};
exports.resetPasswordSeller = resetPasswordSeller;
