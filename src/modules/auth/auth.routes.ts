import { Router } from "express";
import { registerBuyer, loginOtp, verifyOtp } from "./auth.controller";

const router = Router();

router.post("/register/buyer", registerBuyer);
router.post("/login-otp", loginOtp);
router.post("/verify-otp", verifyOtp);

export default router;
