import { Router } from "express";
import { buyerProductController } from "./buyer.controller";

const router = Router();

router.get("/", buyerProductController.getAllProducts);
router.get("/popular", buyerProductController.getPopularProducts);
router.get(
  "/recommendations",
  buyerProductController.getProductRecommendations,
);
router.get("/search", buyerProductController.searchProducts);
router.get("/category/:kategori", buyerProductController.getProductsByCategory);
router.get("/:id", buyerProductController.getProductById);

export default router;
