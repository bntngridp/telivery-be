import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  updateProduct,
  updateProductStock,
  deleteProduct,
  deleteAllProducts,
} from "./product.controller";
import { jwtMiddleware } from "../../middlewares/jwt.middleware";
import {
  uploadProductImageSingle,
  processProductImage,
} from "../../middlewares/multer.seller";

const router = Router();

router.post(
  "/seller/create",
  jwtMiddleware,
  uploadProductImageSingle,
  processProductImage,
  createProduct,
);
router.get("/seller", jwtMiddleware, getAllProducts);
router.get("/seller/category/:category", jwtMiddleware, getProductsByCategory);
router.get("/seller/:id", jwtMiddleware, getProductById);
router.put(
  "/seller/:id",
  jwtMiddleware,
  uploadProductImageSingle,
  processProductImage,
  updateProduct,
);
router.patch("/seller/:id/stock", jwtMiddleware, updateProductStock);
router.delete("/seller/:id", jwtMiddleware, deleteProduct);
router.delete("/seller", jwtMiddleware, deleteAllProducts);

export default router;
