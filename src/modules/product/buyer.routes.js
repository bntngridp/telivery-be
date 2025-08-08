"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const buyer_controller_1 = require("./buyer.controller");
const router = (0, express_1.Router)();
// GET /buyer/products - Ambil semua produk yang tersedia
router.get('/', buyer_controller_1.buyerProductController.getAllProducts);
// GET /buyer/products/popular - Ambil produk paling populer
router.get('/popular', buyer_controller_1.buyerProductController.getPopularProducts);
// GET /buyer/products/recommendations - Rekomendasi produk untuk pembeli
router.get('/recommendations', buyer_controller_1.buyerProductController.getProductRecommendations);
// GET /buyer/products/search?q=keyword - Cari produk berdasarkan nama/deskripsi
router.get('/search', buyer_controller_1.buyerProductController.searchProducts);
// GET /buyer/products/category/:kategori - Filter produk berdasarkan kategori
router.get('/category/:kategori', buyer_controller_1.buyerProductController.getProductsByCategory);
// GET /buyer/products/:id - Ambil detail produk berdasarkan ID
router.get('/:id', buyer_controller_1.buyerProductController.getProductById);
exports.default = router;
