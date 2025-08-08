"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const multer_seller_1 = require("../middlewares/multer.seller");
const jwt_middleware_1 = require("../middlewares/jwt.middleware");
const router = (0, express_1.Router)();
router.post("/buyer/register", auth_controller_1.registerBuyer);
router.post("/buyer/request-otp", auth_controller_1.loginOtp);
router.post("/buyer/verify-otp", auth_controller_1.verifyOtp);
router.post("/seller/request-otp", auth_controller_1.requestSellerOtp);
router.post("/seller/verify-otp", auth_controller_1.verifyOtpAndRegisterSeller);
router.post("/seller/register", auth_controller_1.verifyOtpAndRegisterSeller);
router.post("/seller/login", auth_controller_1.loginSeller);
router.post("/seller/forgot-password", auth_controller_1.forgotPasswordSeller);
router.post("/seller/verify-reset-otp", auth_controller_1.verifyResetOtpSeller);
router.patch("/seller/reset-password", auth_controller_1.resetPasswordSeller);
router.post("/seller/register-store", jwt_middleware_1.jwtMiddleware, multer_seller_1.uploadSellerDocs.fields([
    { name: "ownerKtpPhoto", maxCount: 1 },
    { name: "ownerFacePhoto", maxCount: 1 },
]), auth_controller_1.registerSellerStore);
exports.default = router;
