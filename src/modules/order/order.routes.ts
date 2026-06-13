import { Router } from 'express';
import { orderController } from './order.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';

const router = Router();

router.use(jwtMiddleware);
router.get('/', orderController.getSellerOrders);
router.get('/summary', orderController.getOrderSummary);
router.get('/status/:status', orderController.getOrdersByStatus);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/accept', orderController.acceptOrder);
router.patch('/:id/reject', orderController.rejectOrder);
router.patch('/:id/processing', orderController.processOrder);
router.patch('/:id/deliver', orderController.deliverOrder);
export default router;
