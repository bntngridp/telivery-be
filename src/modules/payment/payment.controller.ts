import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import {
  pesananIdParamSchema,
  pembayaranIdParamSchema,
  rejectPaymentBodySchema,
  midtransWebhookSchema,
} from "./payment.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { success, created } from "../../utils/response";
import { BadRequestError, UnauthorizedError } from "../../utils/errors";

function requireUserId(req: Request): number {
  const id = req.user?.id;
  if (!id)
    throw new UnauthorizedError("Unauthorized, silakan login sebagai pembeli");
  return id;
}

function requireSellerId(req: Request): number {
  const id = req.user?.sellerId;
  if (!id)
    throw new UnauthorizedError("Unauthorized, silakan login sebagai penjual");
  return id;
}

/**
 * @openapi
 * /api/payments/buyer/pesanan/{pesananId}/snap-token:
 *   post:
 *     tags: [Payment]
 *     summary: Buat Midtrans Snap token untuk in-app payment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: pesananId
 *         required: true
 *         schema: { type: integer }
 */
export const paymentController = {
  createSnapToken: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { pesananId } = pesananIdParamSchema.parse(req.params);
    const result = await paymentService.createSnapToken(
      Number(pesananId),
      userId,
    );
    return success(res, "Snap token berhasil dibuat", result);
  }),

  /**
   * @openapi
   * /api/payments/buyer/pesanan/{pesananId}/status:
   *   get:
   *     tags: [Payment]
   *     summary: Poll status pembayaran (fallback webhook)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: pesananId
   *         required: true
   *         schema: { type: integer }
   */
  getPaymentStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { pesananId } = pesananIdParamSchema.parse(req.params);
    const status = await paymentService.getPaymentStatus(
      Number(pesananId),
      userId,
    );
    return success(res, "Status pembayaran berhasil diambil", status);
  }),

  /**
   * @openapi
   * /api/payments/midtrans/config:
   *   get:
   *     tags: [Payment]
   *     summary: Midtrans client config (client_key untuk Snap JS)
   */
  getClientConfig: asyncHandler(async (_req: Request, res: Response) => {
    const { midtransConfig } = await import("../../config/midtrans");
    return success(res, "Midtrans client config", {
      clientKey: midtransConfig.clientKey,
      isProduction: midtransConfig.isProduction,
    });
  }),

  /**
   * @openapi
   * /api/payments/midtrans/webhook:
   *   post:
   *     tags: [Payment]
   *     summary: Webhook dari Midtrans (no JWT, signature verified)
   */
  midtransWebhook: asyncHandler(async (req: Request, res: Response) => {
    const rawBody: string =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new BadRequestError("Body bukan JSON valid");
    }
    const payload = midtransWebhookSchema.parse(parsed);

    const sigHeader =
      (req.headers["x-signature-key"] as string) || payload.signature_key || "";
    const ok = paymentService.verifyWebhookSignature(payload, sigHeader);
    if (!ok) {
      console.warn(
        "[midtrans] webhook signature mismatch for order",
        payload.order_id,
      );
      return success(res, "signature mismatch (ignored)", { received: true });
    }

    const result = await paymentService.handleMidtransWebhook(payload);
    return success(res, "Webhook processed", result);
  }),

  /**
   * @openapi
   * /api/payments/buyer/pesanan/{pesananId}/receipt:
   *   post:
   *     tags: [Payment]
   *     summary: Upload bukti bayar manual (multipart, non-Midtrans)
   *     security: [{ bearerAuth: [] }]
   */
  uploadReceipt: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { pesananId } = pesananIdParamSchema.parse(req.params);
    if (!req.file) {
      throw new BadRequestError(
        "File bukti bayar wajib diupload (field: receipt)",
      );
    }

    const filePath = `./documents/payment_receipts/${req.file.filename}`;
    const updated = await paymentService.uploadReceipt(
      Number(pesananId),
      userId,
      filePath,
    );
    return success(res, "Bukti pembayaran berhasil diupload", updated);
  }),

  /**
   * @openapi
   * /api/payments/seller/pembayaran/{pembayaranId}/confirm:
   *   patch:
   *     tags: [Payment]
   *     summary: Konfirmasi pembayaran (seller, non-Midtrans)
   *     security: [{ bearerAuth: [] }]
   */
  confirmPayment: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const { pembayaranId } = pembayaranIdParamSchema.parse(req.params);
    const updated = await paymentService.confirmPayment(
      Number(pembayaranId),
      sellerId,
    );
    return success(res, "Pembayaran berhasil dikonfirmasi", updated);
  }),

  /**
   * @openapi
   * /api/payments/seller/pembayaran/{pembayaranId}/reject:
   *   patch:
   *     tags: [Payment]
   *     summary: Tolak pembayaran (seller, non-Midtrans)
   *     security: [{ bearerAuth: [] }]
   */
  rejectPayment: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const { pembayaranId } = pembayaranIdParamSchema.parse(req.params);
    const { catatan } = rejectPaymentBodySchema.parse(req.body);
    const updated = await paymentService.rejectPayment(
      Number(pembayaranId),
      sellerId,
      catatan,
    );
    return success(res, "Pembayaran berhasil ditolak", updated);
  }),
};
