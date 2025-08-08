import { Router } from 'express';
import {
  // Seller controllers
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  updateProduct,
  updateProductStock,
  deleteProduct,
  deleteAllProducts,

  // Buyer controllers
  getAllProductsForBuyer,
  getProductByIdForBuyer,
  getProductsByCategoryForBuyer,
  searchProducts,
  getPopularProducts,
  getProductRecommendations
} from './product.controller';
import { jwtMiddleware } from '../middlewares/jwt.middleware';
import { uploadProductImage } from '../middlewares/multer.seller';

const router = Router();

// === SELLER ROUTES ===
router.post('/seller/create', jwtMiddleware, uploadProductImage, createProduct);
router.get('/seller', jwtMiddleware, getAllProducts);
router.get('/seller/category/:category', jwtMiddleware, getProductsByCategory);
router.get('/seller/:id', jwtMiddleware, getProductById);
router.put('/seller/:id', jwtMiddleware, uploadProductImage, updateProduct);
router.patch('/seller/:id/stock', jwtMiddleware, updateProductStock);
router.delete('/seller/:id', jwtMiddleware, deleteProduct);
router.delete('/seller', jwtMiddleware, deleteAllProducts);

// === BUYER ROUTES ===
router.get('/buyer', getAllProductsForBuyer);
router.get('/buyer/popular', getPopularProducts);
router.get('/buyer/recommendations', getProductRecommendations);
router.get('/buyer/search', searchProducts);
router.get('/buyer/category/:kategori', getProductsByCategoryForBuyer);
router.get('/buyer/:id', getProductByIdForBuyer);
export default router;