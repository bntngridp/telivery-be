"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
router.post("/register/buyer", auth_controller_1.registerBuyer);
router.post("/login-otp", auth_controller_1.loginOtp);
router.post("/verify-otp", auth_controller_1.verifyOtp);
exports.default = router;
