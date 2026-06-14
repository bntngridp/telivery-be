import { Router } from "express";
import { buyerProfileController } from "./buyer.controller";
import { jwtMiddleware } from "../../middlewares/jwt.middleware";

const router = Router();

router.get("/profile", jwtMiddleware, buyerProfileController.getProfile);
router.patch("/profile", jwtMiddleware, buyerProfileController.updateProfile);

export default router;
