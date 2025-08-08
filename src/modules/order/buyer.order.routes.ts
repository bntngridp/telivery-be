import { Router } from 'express';
import { buyerOrderController } from './buyer.order.controller';
import { jwtMiddleware } from '../middlewares/jwt.middleware';

const router = Router();

router.use(jwtMiddleware);
router.post('/', buyerOrderController.createOrder);
router.get('/summary', buyerOrderController.getOrderSummary);
router.get('/status/:status', buyerOrderController.getOrdersByStatus);
router.get('/track/:id', buyerOrderController.trackOrder);
router.get('/', buyerOrderController.getBuyerOrders);
router.get('/:id', buyerOrderController.getOrderById);
router.patch('/:id/cancel', buyerOrderController.cancelOrder);
router.patch('/:id/confirm', buyerOrderController.confirmOrder);
router.post('/:id/review', buyerOrderController.reviewOrder);

export default router;
