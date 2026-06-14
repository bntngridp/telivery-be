import { Router } from "express";
import { checkoutController } from "./checkout.controller";
import { jwtMiddleware } from "../../middlewares/jwt.middleware";

const router = Router();

router.use(jwtMiddleware);
router.post("/", checkoutController.checkout);

export default router;
