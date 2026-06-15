import { Request, Response } from "express";
import { buyerOrderService } from "./buyer.order.service";
import {
  createOrderSchema,
  orderIdSchema,
  orderStatusSchema,
  orderPaginationSchema,
  cancelOrderSchema,
  reviewOrderSchema,
} from "./buyer.order.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { success, created, paginated } from "../../utils/response";
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../../utils/errors";
import { sendOrderEmail } from "../../services/notification/email.sender";

function requireUserId(req: Request): number {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError("Unauthorized, silakan login sebagai pembeli");
  }
  return userId;
}

/**
 * @openapi
 * /api/buyer/orders:
 *   post:
 *     tags: [Order]
 *     summary: Buat pesanan baru
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_produk: { type: array, items: { type: object } }
 *               id_layanan: { type: array, items: { type: object } }
 *               alamat_pengiriman: { type: string }
 *               alamat_id: { type: integer, nullable: true }
 *               ongkir: { type: number, default: 0 }
 *               metode_pembayaran:
 *                 type: string
 *                 enum: [cash, transfer, "e-wallet", midtrans]
 *               catatan: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Pesanan berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Pesanan" }
 */
export const buyerOrderController = {
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const data = createOrderSchema.parse(req.body);
    const orders = await buyerOrderService.createOrder(userId, data);
    return created(res, "Pesanan berhasil dibuat", orders);
  }),

  /**
   * @openapi
   * /api/buyer/orders:
   *   get:
   *     tags: [Order]
   *     summary: List pesanan pembeli (paginated)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: limit
   *         schema: { type: integer, default: 10 }
   *     responses:
   *       200: { description: Daftar pesanan }
   */
  getBuyerOrders: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const pagination = orderPaginationSchema.parse(req.query);
    const result = await buyerOrderService.getBuyerOrders(
      userId,
      pagination.page,
      pagination.limit,
    );
    return paginated(
      res,
      "Daftar pesanan berhasil diambil",
      result.orders,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
    );
  }),

  /**
   * @openapi
   * /api/buyer/orders/{id}:
   *   get:
   *     tags: [Order]
   *     summary: Detail pesanan
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - $ref: "#/components/parameters/IdParam"
   *     responses:
   *       200: { description: Detail pesanan }
   *       404: { $ref: "#/components/responses/NotFound" }
   */
  getOrderById: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const params = orderIdSchema.parse(req.params);
    const order = await buyerOrderService.getOrderById(
      Number(params.id),
      userId,
    );
    if (!order) throw new NotFoundError("Pesanan tidak ditemukan");
    return success(res, "Detail pesanan berhasil diambil", order);
  }),

  /**
   * @openapi
   * /api/buyer/orders/{id}/cancel:
   *   post:
   *     tags: [Order]
   *     summary: Cancel pesanan
   *     security: [{ bearerAuth: [] }]
   */
  cancelOrder: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const params = orderIdSchema.parse(req.params);
    const body = cancelOrderSchema.parse(req.body);
    const updatedOrder = await buyerOrderService.cancelOrder(
      Number(params.id),
      userId,
      body.reason,
    );
    if (!updatedOrder)
      throw new BadRequestError(
        "Pesanan tidak ditemukan atau tidak dapat dibatalkan",
      );
    return success(res, "Pesanan berhasil dibatalkan", updatedOrder);
  }),

  /**
   * @openapi
   * /api/buyer/orders/{id}/confirm:
   *   post:
   *     tags: [Order]
   *     summary: Konfirmasi pesanan diterima (selesai)
   *     security: [{ bearerAuth: [] }]
   */
  confirmOrder: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const params = orderIdSchema.parse(req.params);
    const updatedOrder = await buyerOrderService.confirmOrder(
      Number(params.id),
      userId,
    );
    if (!updatedOrder)
      throw new BadRequestError(
        "Pesanan tidak ditemukan atau tidak dapat dikonfirmasi",
      );
    return success(res, "Pesanan berhasil dikonfirmasi selesai", updatedOrder);
  }),

  /**
   * @openapi
   * /api/buyer/orders/by-status/{status}:
   *   get:
   *     tags: [Order]
   *     summary: Pesanan by status
   *     security: [{ bearerAuth: [] }]
   */
  getOrdersByStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const params = orderStatusSchema.parse(req.params);
    const pagination = orderPaginationSchema.parse(req.query);
    const result = await buyerOrderService.getOrdersByStatus(
      userId,
      params.status,
      pagination.page,
      pagination.limit,
    );
    return paginated(
      res,
      `Pesanan dengan status ${params.status} berhasil diambil`,
      { status: result.status, orders: result.orders },
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
    );
  }),

  /**
   * @openapi
   * /api/buyer/orders/{id}/track:
   *   get:
   *     tags: [Order]
   *     summary: Tracking pesanan
   *     security: [{ bearerAuth: [] }]
   */
  trackOrder: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const params = orderIdSchema.parse(req.params);
    const trackingInfo = await buyerOrderService.trackOrder(
      Number(params.id),
      userId,
    );
    if (!trackingInfo) throw new NotFoundError("Pesanan tidak ditemukan");
    return success(
      res,
      "Informasi tracking pesanan berhasil diambil",
      trackingInfo,
    );
  }),

  /**
   * @openapi
   * /api/buyer/orders/summary:
   *   get:
   *     tags: [Order]
   *     summary: Ringkasan pesanan (dashboard)
   *     security: [{ bearerAuth: [] }]
   */
  getOrderSummary: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const summary = await buyerOrderService.getOrderSummary(userId);
    return success(res, "Ringkasan pesanan berhasil diambil", summary);
  }),

  /**
   * @openapi
   * /api/buyer/orders/{id}/review:
   *   post:
   *     tags: [Order]
   *     summary: Submit review
   *     security: [{ bearerAuth: [] }]
   */
  reviewOrder: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req);
    const params = orderIdSchema.parse(req.params);
    const body = reviewOrderSchema.parse(req.body);
    const review = await buyerOrderService.reviewOrder(
      Number(params.id),
      userId,
      body,
    );
    if (!review)
      throw new BadRequestError("Pesanan tidak ditemukan atau belum selesai");
    return success(res, "Ulasan berhasil ditambahkan", review);
  }),
};
