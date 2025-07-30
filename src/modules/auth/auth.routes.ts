import { Router } from "express";
import { registerBuyer } from "./auth.controller";

const router = Router();

router.post("/register/buyer", registerBuyer);

export default router;
