import { Request, Response } from "express";
import { cartService } from "./cart.service";
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemIdParamSchema,
} from "./cart.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { success, created } from "../../utils/response";
import { UnauthorizedError } from "../../utils/errors";

function requireUserId(req: Request): number {
  const id = req.user?.id;
  if (!id)
    throw new UnauthorizedError("Unauthorized, silakan login sebagai pembeli");
  return id;
}

/**
 * @openapi
 * /api/buyer/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Tambah item ke cart
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               produkId: { type: integer, nullable: true }
 *               layananId: { type: integer, nullable: true }
 *               jumlah: { type: integer, minimum: 1, default: 1 }
 *     responses:
 *       201: { description: Item ditambahkan }
 *       400: { $ref: "#/components/responses/BadRequest" }
 */
export const cartController = {
  add: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const data = addCartItemSchema.parse(req.body);
    const item = await cartService.addItem(userId, data);
    return created(res, "Item berhasil ditambahkan ke cart", item);
  }),

  /**
   * @openapi
   * /api/buyer/cart:
   *   get:
   *     tags: [Cart]
   *     summary: List cart + grouped by store
   *     security: [{ bearerAuth: [] }]
   */
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const cart = await cartService.getCart(userId);
    return success(res, "Cart berhasil diambil", cart);
  }),

  /**
   * @openapi
   * /api/buyer/cart/items/{id}:
   *   patch:
   *     tags: [Cart]
   *     summary: Update qty cart item
   *     security: [{ bearerAuth: [] }]
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { id } = cartItemIdParamSchema.parse(req.params);
    const data = updateCartItemSchema.parse(req.body);
    const item = await cartService.updateItemQuantity(Number(id), userId, data);
    return success(res, "Jumlah item berhasil diupdate", item);
  }),

  /**
   * @openapi
   * /api/buyer/cart/items/{id}:
   *   delete:
   *     tags: [Cart]
   *     summary: Hapus cart item
   *     security: [{ bearerAuth: [] }]
   */
  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const { id } = cartItemIdParamSchema.parse(req.params);
    const result = await cartService.removeItem(Number(id), userId);
    return success(res, result.message);
  }),

  /**
   * @openapi
   * /api/buyer/cart:
   *   delete:
   *     tags: [Cart]
   *     summary: Kosongkan cart
   *     security: [{ bearerAuth: [] }]
   */
  clear: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const result = await cartService.clearCart(userId);
    return success(res, result.message);
  }),
};
