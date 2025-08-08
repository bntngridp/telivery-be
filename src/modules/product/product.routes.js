"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("./product.controller");
const jwt_middleware_1 = require("../middlewares/jwt.middleware");
const multer_seller_1 = require("../middlewares/multer.seller");
const router = (0, express_1.Router)();
// === SELLER ROUTES ===
// POST /api/product/seller/create - Tambah produk baru
router.post('/seller/create', jwt_middleware_1.jwtMiddleware, multer_seller_1.uploadProductImage, product_controller_1.createProduct);
// GET /api/product/seller - Ambil semua produk milik seller
router.get('/seller', jwt_middleware_1.jwtMiddleware, product_controller_1.getAllProducts);
// GET /api/product/seller/category/:category - Ambil produk berdasarkan kategori
router.get('/seller/category/:category', jwt_middleware_1.jwtMiddleware, product_controller_1.getProductsByCategory);
// GET /api/product/seller/:id - Ambil detail satu produk
router.get('/seller/:id', jwt_middleware_1.jwtMiddleware, product_controller_1.getProductById);
// PUT /api/product/seller/:id - Update data produk
router.put('/seller/:id', jwt_middleware_1.jwtMiddleware, multer_seller_1.uploadProductImage, product_controller_1.updateProduct);
// PATCH /api/product/seller/:id/stock - Update stok produk
router.patch('/seller/:id/stock', jwt_middleware_1.jwtMiddleware, product_controller_1.updateProductStock);
// DELETE /api/product/seller/:id - Hapus satu produk
router.delete('/seller/:id', jwt_middleware_1.jwtMiddleware, product_controller_1.deleteProduct);
// DELETE /api/product/seller - Hapus semua produk milik seller
router.delete('/seller', jwt_middleware_1.jwtMiddleware, product_controller_1.deleteAllProducts);
// === BUYER ROUTES ===
// GET /api/product/buyer - Ambil semua produk yang tersedia
router.get('/buyer', product_controller_1.getAllProductsForBuyer);
// GET /api/product/buyer/popular - Ambil produk paling populer
router.get('/buyer/popular', product_controller_1.getPopularProducts);
// GET /api/product/buyer/recommendations - Rekomendasi produk untuk pembeli
router.get('/buyer/recommendations', product_controller_1.getProductRecommendations);
// GET /api/product/buyer/search - Cari produk berdasarkan nama/deskripsi
router.get('/buyer/search', product_controller_1.searchProducts);
// GET /api/product/buyer/category/:kategori - Filter produk berdasarkan kategori
router.get('/buyer/category/:kategori', product_controller_1.getProductsByCategoryForBuyer);
// GET /api/product/buyer/:id - Ambil detail produk berdasarkan ID
router.get('/buyer/:id', product_controller_1.getProductByIdForBuyer);
exports.default = router;
