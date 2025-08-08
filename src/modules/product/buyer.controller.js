"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerProductController = void 0;
const buyer_service_1 = require("./buyer.service");
const buyer_schema_1 = require("./buyer.schema");
exports.buyerProductController = {
    async getAllProducts(req, res) {
        try {
            const pagination = buyer_schema_1.paginationSchema.parse(req.query);
            const result = await buyer_service_1.buyerProductService.getAllProducts(pagination.page, pagination.limit);
            return res.status(200).json({
                success: true,
                message: 'Produk berhasil diambil',
                data: result.products,
                pagination: result.pagination
            });
        }
        catch (err) {
            console.error('Error getting products for buyer:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil produk',
                error: err.message
            });
        }
    },
    async getProductById(req, res) {
        try {
            const { id } = buyer_schema_1.productIdSchema.parse(req.params);
            const product = await buyer_service_1.buyerProductService.getProductById(Number(id));
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Produk tidak ditemukan'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Detail produk berhasil diambil',
                data: product
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'ID produk tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error getting product by id for buyer:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail produk',
                error: err.message
            });
        }
    },
    async getProductsByCategory(req, res) {
        try {
            const { kategori } = buyer_schema_1.productCategorySchema.parse(req.params);
            const pagination = buyer_schema_1.paginationSchema.parse(req.query);
            const result = await buyer_service_1.buyerProductService.getProductsByCategory(kategori, pagination.page, pagination.limit);
            if (!result) {
                return res.status(400).json({
                    success: false,
                    message: 'Kategori tidak ditemukan'
                });
            }
            return res.status(200).json({
                success: true,
                message: `Produk kategori ${result.kategori} berhasil diambil`,
                data: result.products,
                pagination: result.pagination
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Parameter kategori tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error getting products by category for buyer:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil produk berdasarkan kategori',
                error: err.message
            });
        }
    },
    async searchProducts(req, res) {
        try {
            const { q } = buyer_schema_1.productSearchSchema.parse(req.query);
            const pagination = buyer_schema_1.paginationSchema.parse(req.query);
            const result = await buyer_service_1.buyerProductService.searchProducts(q, pagination.page, pagination.limit);
            return res.status(200).json({
                success: true,
                message: 'Hasil pencarian produk',
                keyword: result.keyword,
                data: result.products,
                pagination: result.pagination
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Parameter pencarian tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error searching products for buyer:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal melakukan pencarian produk',
                error: err.message
            });
        }
    },
    async getPopularProducts(req, res) {
        try {
            const pagination = buyer_schema_1.paginationSchema.parse(req.query);
            const products = await buyer_service_1.buyerProductService.getPopularProducts(pagination.limit);
            return res.status(200).json({
                success: true,
                message: 'Produk populer berhasil diambil',
                data: products
            });
        }
        catch (err) {
            console.error('Error getting popular products for buyer:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil produk populer',
                error: err.message
            });
        }
    },
    async getProductRecommendations(req, res) {
        try {
            const pagination = buyer_schema_1.paginationSchema.parse(req.query);
            const userId = req.user?.id;
            const products = await buyer_service_1.buyerProductService.getProductRecommendations(userId, pagination.limit);
            return res.status(200).json({
                success: true,
                message: 'Rekomendasi produk berhasil diambil',
                data: products
            });
        }
        catch (err) {
            console.error('Error getting product recommendations for buyer:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil rekomendasi produk',
                error: err.message
            });
        }
    }
};
