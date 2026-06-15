import { Request, Response } from "express";
import { checkoutService } from "./checkout.service";
import { checkoutSchema } from "./checkout.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { created } from "../../utils/response";
import { UnauthorizedError } from "../../utils/errors";

function requireUserId(req: Request): number {
  const id = req.user?.id;
  if (!id)
    throw new UnauthorizedError("Unauthorized, silakan login sebagai pembeli");
  return id;
}

export const checkoutController = {
  /**
   * @openapi
   * /api/buyer/checkout:
   *   post:
   *     tags: [Checkout]
   *     summary: Atomic checkout — cart → orders + ongkir + alamat
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [alamat_pengiriman, metode_pembayaran]
   *             properties:
   *               alamat_pengiriman: { type: string }
   *               alamat_id: { type: integer, nullable: true }
   *               ongkir: { type: number, default: 0 }
   *               metode_pembayaran:
   *                 type: string
   *                 enum: [cash, transfer, "e-wallet", midtrans]
   *               catatan: { type: string, nullable: true }
   */
  checkout: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const data = checkoutSchema.parse(req.body);
    const orders = await checkoutService.checkoutFromCart(userId, data);
    return created(res, "Checkout berhasil", orders);
  }),
};
