import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {
  registerBuyer,
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
} from "./auth.controller";
import { jwtMiddleware } from "../../middlewares/jwt.middleware";
import { uploadSellerDocsFields } from "../../middlewares/multer.seller";

const router = Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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
router.post("/buyer/request-otp", otpLimiter, loginOtp);
router.post("/buyer/verify-otp", verifyOtp);

router.post("/admin/login", adminLogin);

router.post("/seller/request-otp", otpLimiter, requestSellerOtp);
router.post("/seller/verify-otp", verifyOtpAndRegisterSeller);
router.post("/seller/register", verifyOtpAndRegisterSeller);
router.post("/seller/login", loginSeller);
router.post("/seller/forgot-password", otpLimiter, forgotPasswordSeller);
router.post("/seller/verify-reset-otp", verifyResetOtpSeller);
router.patch("/seller/reset-password", resetPasswordSeller);

router.post(
  "/seller/register-store",
  jwtMiddleware,
  uploadSellerDocsFields,
  registerSellerStore,
);

export default router;
