import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {
  registerBuyer,
  loginBuyer,
  loginOtp,
  verifyOtp,
  requestSellerOtp,
  verifyOtpAndRegisterSeller,
  registerSellerStore,
  loginSeller,
  forgotPasswordSeller,
  verifyResetOtpSeller,
  resetPasswordSeller,
  adminLogin,
  refreshToken,
  logout,
  setBuyerPassword,
} from "./auth.controller";
import { jwtMiddleware } from "../../middlewares/jwt.middleware";
import {
  uploadSellerDocsFields,
  processKtpImage,
  processOwnerFaceImage,
} from "../../middlewares/multer.seller";

const router = Router();

const isTest = process.env.NODE_ENV === "test";
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 5 : 5,
  skip: () => false,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
      error: "TOO_MANY_REQUESTS",
    });
  },
});

router.post("/buyer/register", registerBuyer);
router.post("/buyer/login", loginBuyer);
router.post("/buyer/request-otp", otpLimiter, loginOtp);
router.post("/buyer/verify-otp", verifyOtp);
router.patch("/buyer/password", jwtMiddleware, setBuyerPassword);

router.post("/admin/login", adminLogin);

router.post("/seller/request-otp", otpLimiter, requestSellerOtp);
router.post("/seller/verify-otp", otpLimiter, verifyOtpAndRegisterSeller);
router.post("/seller/register", otpLimiter, verifyOtpAndRegisterSeller);
router.post("/seller/login", loginSeller);
router.post("/seller/forgot-password", otpLimiter, forgotPasswordSeller);
router.post("/seller/verify-reset-otp", otpLimiter, verifyResetOtpSeller);
router.patch("/seller/reset-password", resetPasswordSeller);

router.post("/refresh-token", refreshToken);
router.post("/logout", jwtMiddleware, logout);

router.post(
  "/seller/register-store",
  jwtMiddleware,
  uploadSellerDocsFields,
  processKtpImage,
  processOwnerFaceImage,
  registerSellerStore,
);

export default router;
