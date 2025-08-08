"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const order_service_1 = require("./order.service");
const order_schema_1 = require("./order.schema");
exports.orderController = {
    /**
     * Mengambil semua pesanan penjual
     */
    async getSellerOrders(req, res) {
        try {
            const sellerId = req.user?.sellerId;
            if (!sellerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized, silakan login sebagai penjual'
                });
            }
            const pagination = order_schema_1.orderPaginationSchema.parse(req.query);
            const result = await order_service_1.orderService.getSellerOrders(sellerId, pagination.page, pagination.limit);
            return res.status(200).json({
                success: true,
                message: 'Daftar pesanan berhasil diambil',
                data: result.orders,
                pagination: result.pagination
            });
        }
        catch (err) {
            console.error('Error getting seller orders:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil daftar pesanan',
                error: err.message
            });
        }
    },
    /**
     * Mengambil detail satu pesanan
     */
    async getOrderById(req, res) {
        try {
            const sellerId = req.user?.sellerId;
            if (!sellerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized, silakan login sebagai penjual'
                });
            }
            const { id } = order_schema_1.orderIdSchema.parse(req.params);
            const order = await order_service_1.orderService.getOrderById(Number(id), sellerId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Pesanan tidak ditemukan'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Detail pesanan berhasil diambil',
                data: order
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'ID pesanan tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error getting order by id:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil detail pesanan',
                error: err.message
            });
        }
    },
    /**
     * Mengambil pesanan berdasarkan status
     */
    async getOrdersByStatus(req, res) {
        try {
            const sellerId = req.user?.sellerId;
            if (!sellerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized, silakan login sebagai penjual'
                });
            }
            const { status } = order_schema_1.orderStatusSchema.parse(req.params);
            const pagination = order_schema_1.orderPaginationSchema.parse(req.query);
            const result = await order_service_1.orderService.getOrdersByStatus(sellerId, status, pagination.page, pagination.limit);
            return res.status(200).json({
                success: true,
                message: `Pesanan dengan status ${status} berhasil diambil`,
                status: result.status,
                data: result.orders,
                pagination: result.pagination
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Parameter status tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error getting orders by status:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil pesanan berdasarkan status',
                error: err.message
            });
        }
    },
    /**
     * Menerima pesanan
     */
    async acceptOrder(req, res) {
        try {
            const sellerId = req.user?.sellerId;
            if (!sellerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized, silakan login sebagai penjual'
                });
            }
            const { id } = order_schema_1.orderIdSchema.parse(req.params);
            const updatedOrder = await order_service_1.orderService.acceptOrder(Number(id), sellerId);
            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Pesanan tidak ditemukan atau tidak dapat diubah statusnya'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Pesanan berhasil diterima',
                data: updatedOrder
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'ID pesanan tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error accepting order:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal menerima pesanan',
                error: err.message
            });
        }
    },
    /**
     * Menolak pesanan
     */
    async rejectOrder(req, res) {
        try {
            const sellerId = req.user?.sellerId;
            if (!sellerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized, silakan login sebagai penjual'
                });
            }
            const { id } = order_schema_1.orderIdSchema.parse(req.params);
            const { reason } = order_schema_1.rejectOrderSchema.parse(req.body);
            const updatedOrder = await order_service_1.orderService.rejectOrder(Number(id), sellerId, reason);
            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Pesanan tidak ditemukan atau tidak dapat diubah statusnya'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Pesanan berhasil ditolak',
                data: updatedOrder
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Input tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error rejecting order:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal menolak pesanan',
                error: err.message
            });
        }
    },
    /**
     * Memproses pesanan
     */
    async processOrder(req, res) {
        try {
            const sellerId = req.user?.sellerId;
            if (!sellerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized, silakan login sebagai penjual'
                });
            }
            const { id } = order_schema_1.orderIdSchema.parse(req.params);
            const updatedOrder = await order_service_1.orderService.processOrder(Number(id), sellerId);
            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Pesanan tidak ditemukan atau tidak dapat diubah statusnya'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Status pesanan berhasil diubah menjadi diproses',
                data: updatedOrder
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'ID pesanan tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error processing order:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal memproses pesanan',
                error: err.message
            });
        }
    },
    /**
     * Mengirim pesanan
     */
    async deliverOrder(req, res) {
        try {
            const sellerId = req.user?.sellerId;
            if (!sellerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized, silakan login sebagai penjual'
                });
            }
            const { id } = order_schema_1.orderIdSchema.parse(req.params);
            const { note } = order_schema_1.deliveryNoteSchema.parse(req.body);
            const updatedOrder = await order_service_1.orderService.deliverOrder(Number(id), sellerId, note);
            if (!updatedOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Pesanan tidak ditemukan atau tidak dapat diubah statusnya'
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Status pesanan berhasil diubah menjadi dikirim',
                data: updatedOrder
            });
        }
        catch (err) {
            if (err.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    message: 'Input tidak valid',
                    errors: err.errors
                });
            }
            console.error('Error delivering order:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengubah status pesanan menjadi dikirim',
                error: err.message
            });
        }
    },
    /**
     * Mendapatkan ringkasan statistik pesanan dan pendapatan
     */
    async getOrderSummary(req, res) {
        try {
            const sellerId = req.user?.sellerId;
            if (!sellerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized, silakan login sebagai penjual'
                });
            }
            const summary = await order_service_1.orderService.getOrderSummary(sellerId);
            return res.status(200).json({
                success: true,
                message: 'Ringkasan pesanan berhasil diambil',
                data: summary
            });
        }
        catch (err) {
            console.error('Error getting order summary:', err);
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil ringkasan pesanan',
                error: err.message
            });
        }
    }
};
