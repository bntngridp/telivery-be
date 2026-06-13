import { Router } from 'express';
import { paymentController } from './payment.controller';
import { jwtMiddleware } from '../../middlewares/jwt.middleware';
import { uploadPaymentReceiptSingle } from '../../middlewares/multer.seller';

const router = Router();

router.post(
    '/buyer/pesanan/:pesananId/receipt',
    jwtMiddleware,
    uploadPaymentReceiptSingle,
    paymentController.uploadReceipt,
);

router.patch(
    '/seller/pembayaran/:pembayaranId/confirm',
    jwtMiddleware,
    paymentController.confirmPayment,
);

router.patch(
    '/seller/pembayaran/:pembayaranId/reject',
    jwtMiddleware,
    paymentController.rejectPayment,
);

export default router;
