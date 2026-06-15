import { Router, raw } from "express";
import { paymentController } from "./payment.controller";
import { jwtMiddleware } from "../../middlewares/jwt.middleware";
import {
  uploadPaymentReceiptSingle,
  processReceiptImage,
} from "../../middlewares/multer.seller";

// Main authenticated router (JSON body, JWT-protected)
const router = Router();

// ─── Midtrans Snap (buyer) ───
router.post(
  "/buyer/pesanan/:pesananId/snap-token",
  jwtMiddleware,
  paymentController.createSnapToken,
);
router.get(
  "/buyer/pesanan/:pesananId/status",
  jwtMiddleware,
  paymentController.getPaymentStatus,
);

// Midtrans client config (public — needed to open Snap popup on frontend)
router.get("/midtrans/config", paymentController.getClientConfig);

// ─── Manual upload flow (kept for compatibility, non-Midtrans) ───
router.post(
  "/buyer/pesanan/:pesananId/receipt",
  jwtMiddleware,
  uploadPaymentReceiptSingle,
  processReceiptImage,
  paymentController.uploadReceipt,
);

// ─── Seller actions (only for non-Midtrans payments) ───
router.patch(
  "/seller/pembayaran/:pembayaranId/confirm",
  jwtMiddleware,
  paymentController.confirmPayment,
);
router.patch(
  "/seller/pembayaran/:pembayaranId/reject",
  jwtMiddleware,
  paymentController.rejectPayment,
);

// ─── Midtrans webhook ───
// IMPORTANT: must use raw body parser (NOT express.json) so signature can
// be verified using the exact bytes Midtrans signed. The global JSON parser
// in app.ts is bypassed for this route.
const webhookRouter = Router();
webhookRouter.post(
  "/webhook",
  raw({ type: "application/json" }),
  paymentController.midtransWebhook,
);

export default router;
export { webhookRouter };
