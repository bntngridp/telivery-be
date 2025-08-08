import { Router } from 'express';
import { orderController } from './order.controller';
import { jwtMiddleware } from '../middlewares/jwt.middleware';

const router = Router();

// Terapkan middleware JWT untuk semua route
router.use(jwtMiddleware);

// Endpoint untuk mengambil semua pesanan
router.get('/', orderController.getSellerOrders);

// Endpoint untuk mengambil ringkasan statistik
router.get('/summary', orderController.getOrderSummary);

// Endpoint untuk filter berdasarkan status
router.get('/status/:status', orderController.getOrdersByStatus);

// Endpoint untuk mengambil detail pesanan
router.get('/:id', orderController.getOrderById);

// Endpoint untuk menerima pesanan
router.patch('/:id/accept', orderController.acceptOrder);

// Endpoint untuk menolak pesanan
router.patch('/:id/reject', orderController.rejectOrder);

// Endpoint untuk memproses pesanan
router.patch('/:id/processing', orderController.processOrder);

// Endpoint untuk mengirim pesanan
router.patch('/:id/deliver', orderController.deliverOrder);

export default router;
