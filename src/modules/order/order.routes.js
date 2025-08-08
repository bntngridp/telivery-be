"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("./order.controller");
const jwt_middleware_1 = require("../middlewares/jwt.middleware");
const router = (0, express_1.Router)();
// Terapkan middleware JWT untuk semua route
router.use(jwt_middleware_1.jwtMiddleware);
// Endpoint untuk mengambil semua pesanan
router.get('/', order_controller_1.orderController.getSellerOrders);
// Endpoint untuk mengambil ringkasan statistik
router.get('/summary', order_controller_1.orderController.getOrderSummary);
// Endpoint untuk filter berdasarkan status
router.get('/status/:status', order_controller_1.orderController.getOrdersByStatus);
// Endpoint untuk mengambil detail pesanan
router.get('/:id', order_controller_1.orderController.getOrderById);
// Endpoint untuk menerima pesanan
router.patch('/:id/accept', order_controller_1.orderController.acceptOrder);
// Endpoint untuk menolak pesanan
router.patch('/:id/reject', order_controller_1.orderController.rejectOrder);
// Endpoint untuk memproses pesanan
router.patch('/:id/processing', order_controller_1.orderController.processOrder);
// Endpoint untuk mengirim pesanan
router.patch('/:id/deliver', order_controller_1.orderController.deliverOrder);
exports.default = router;
