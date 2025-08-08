"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeController = void 0;
const store_service_1 = require("./store.service");
const store_schema_1 = require("./store.schema");
exports.storeController = {
    async getAllStores(req, res) {
        try {
            const pagination = store_schema_1.paginationSchema.parse(req.query);
            const result = await store_service_1.storeService.getAllStores(pagination.page, pagination.limit);
            return res.status(200).json({
                success: true,
                message: 'Daftar toko berhasil diambil',
                data: result.stores,
                pagination: result.pagination
            });
        }
        catch (err) {
            console.error('Error getting stores:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil daftar toko',
                error: err.message
            });
        }
    },
    async getStoreById(req, res) {
        try {
            const { id } = store_schema_1.storeIdSchema.parse(req.params);
            const store = await store_service_1.storeService.getStoreById(Number(id));
            if (!store) {
                return res.status(404).json({
                    success: false,
                    message: 'Toko tidak ditemukan'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Detail toko berhasil diambil',
                data: store
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'ID toko tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error getting store by id:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail toko',
                error: err.message
            });
        }
    },
    async searchStores(req, res) {
        try {
            const { q } = store_schema_1.storeSearchSchema.parse(req.query);
            const pagination = store_schema_1.paginationSchema.parse(req.query);
            const result = await store_service_1.storeService.searchStores(q, pagination.page, pagination.limit);
            return res.status(200).json({
                success: true,
                message: 'Hasil pencarian toko',
                keyword: result.keyword,
                data: result.stores,
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
            console.error('Error searching stores:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal melakukan pencarian toko',
                error: err.message
            });
        }
    },
    async getStoresByCategory(req, res) {
        try {
            const { kategori } = store_schema_1.storeCategorySchema.parse(req.params);
            const pagination = store_schema_1.paginationSchema.parse(req.query);
            const result = await store_service_1.storeService.getStoresByCategory(kategori, pagination.page, pagination.limit);
            return res.status(200).json({
                success: true,
                message: `Toko kategori ${result.kategori} berhasil diambil`,
                data: result.stores,
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
            console.error('Error getting stores by category:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil toko berdasarkan kategori',
                error: err.message
            });
        }
    },
    async getPopularStores(req, res) {
        try {
            const pagination = store_schema_1.paginationSchema.parse(req.query);
            const stores = await store_service_1.storeService.getPopularStores(pagination.limit);
            return res.status(200).json({
                success: true,
                message: 'Toko populer berhasil diambil',
                data: stores
            });
        }
        catch (err) {
            console.error('Error getting popular stores:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil toko populer',
                error: err.message
            });
        }
    },
    async getStoreRecommendations(req, res) {
        try {
            const pagination = store_schema_1.paginationSchema.parse(req.query);
            // Get user ID if available from authentication middleware
            const userId = req.user?.id;
            const stores = await store_service_1.storeService.getStoreRecommendations(userId, pagination.limit);
            return res.status(200).json({
                success: true,
                message: 'Rekomendasi toko berhasil diambil',
                data: stores
            });
        }
        catch (err) {
            console.error('Error getting store recommendations:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil rekomendasi toko',
                error: err.message
            });
        }
    },
    async getStoreProducts(req, res) {
        try {
            const { id } = store_schema_1.storeIdSchema.parse(req.params);
            const pagination = store_schema_1.paginationSchema.parse(req.query);
            const result = await store_service_1.storeService.getStoreProducts(Number(id), pagination.page, pagination.limit);
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Toko tidak ditemukan'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Produk toko berhasil diambil',
                store: result.store,
                data: result.products,
                pagination: result.pagination
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'ID toko tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error getting store products:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil produk toko',
                error: err.message
            });
        }
    }
};
