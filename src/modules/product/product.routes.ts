import { Router } from 'express';
import {
    createProduct,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    updateProduct,
    updateProductStock,
    deleteProduct,
    deleteAllProducts,
    getAllProductsForBuyer,
    getProductByIdForBuyer,
    getProductsByCategoryForBuyer,
    searchProducts,
    getPopularProducts,
    getProductRecommendations,
} from './product.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';
import { uploadProductImageSingle } from '../../middlewares/multer.seller';

const router = Router();

// seller endpoints
router.post('/seller/create', jwtMiddleware, uploadProductImageSingle, createProduct);
router.get('/seller', jwtMiddleware, getAllProducts);
router.get('/seller/category/:category', jwtMiddleware, getProductsByCategory);
router.get('/seller/:id', jwtMiddleware, getProductById);
router.put('/seller/:id', jwtMiddleware, uploadProductImageSingle, updateProduct);
router.patch('/seller/:id/stock', jwtMiddleware, updateProductStock);
router.delete('/seller/:id', jwtMiddleware, deleteProduct);
router.delete('/seller', jwtMiddleware, deleteAllProducts);

// buyer endpoints
router.get('/buyer', getAllProductsForBuyer);
router.get('/buyer/popular', getPopularProducts);
router.get('/buyer/recommendations', jwtMiddleware, getProductRecommendations);
router.get('/buyer/search', searchProducts);
router.get('/buyer/category/:kategori', getProductsByCategoryForBuyer);
router.get('/buyer/:id', getProductByIdForBuyer);

export default router;
