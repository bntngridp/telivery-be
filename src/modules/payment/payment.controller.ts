import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import {
  pesananIdParamSchema,
  pembayaranIdParamSchema,
  rejectPaymentBodySchema,
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

export const paymentController = {
  uploadReceipt: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { pesananId } = pesananIdParamSchema.parse(req.params);
    if (!req.file)
      throw new BadRequestError(
        "File bukti bayar wajib diupload (field: receipt)",
      );

    const filePath = `./documents/payment_receipts/${req.file.filename}`;
    const updated = await paymentService.uploadReceipt(
      Number(pesananId),
      userId,
      filePath,
    );
    return success(res, "Bukti pembayaran berhasil diupload", updated);
  }),

  confirmPayment: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const { pembayaranId } = pembayaranIdParamSchema.parse(req.params);
    const updated = await paymentService.confirmPayment(
      Number(pembayaranId),
      sellerId,
    );
    return success(res, "Pembayaran berhasil dikonfirmasi", updated);
  }),

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
