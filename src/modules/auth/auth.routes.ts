import { Router } from "express";
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
  resetPasswordSeller
} from "./auth.controller";
import { uploadSellerDocs } from "../middlewares/multer.seller";
import { jwtMiddleware } from "../middlewares/jwt.middleware";

const router = Router();

router.post("/buyer/register", registerBuyer);
router.post("/buyer/request-otp", loginOtp);
router.post("/buyer/verify-otp", verifyOtp);

router.post("/seller/request-otp", requestSellerOtp);
router.post("/seller/verify-otp", verifyOtpAndRegisterSeller);
router.post("/seller/register", verifyOtpAndRegisterSeller);
router.post("/seller/login", loginSeller);
router.post("/seller/forgot-password", forgotPasswordSeller);
router.post("/seller/verify-reset-otp", verifyResetOtpSeller);
router.patch("/seller/reset-password", resetPasswordSeller);

router.post(
    "/seller/register-store",
    jwtMiddleware,
    uploadSellerDocs.fields([
        { name: "ownerKtpPhoto", maxCount: 1 },
        { name: "ownerFacePhoto", maxCount: 1 },
    ]),
    registerSellerStore
);

export default router;
