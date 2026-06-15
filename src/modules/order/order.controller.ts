import { Request, Response } from "express";
import { orderService } from "./order.service";
import {
  orderIdSchema,
  orderStatusSchema,
  orderPaginationSchema,
  rejectOrderSchema,
  deliveryNoteSchema,
} from "./order.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { success, paginated } from "../../utils/response";
import { NotFoundError, UnauthorizedError } from "../../utils/errors";
import { sendOrderEmail } from "../../services/notification/email.sender";

function requireSellerId(req: Request): number {
  const sellerId = req.user?.sellerId;
  if (!sellerId) {
    throw new UnauthorizedError("Unauthorized, silakan login sebagai penjual");
  }
  return sellerId;
}

export const orderController = {
  getSellerOrders: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const pagination = orderPaginationSchema.parse(req.query);
    const result = await orderService.getSellerOrders(
      sellerId,
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

  getOrderById: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const params = orderIdSchema.parse(req.params);
    const order = await orderService.getOrderById(Number(params.id), sellerId);
    if (!order) throw new NotFoundError("Pesanan tidak ditemukan");
    return success(res, "Detail pesanan berhasil diambil", order);
  }),

  getOrdersByStatus: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const params = orderStatusSchema.parse(req.params);
    const pagination = orderPaginationSchema.parse(req.query);
    const result = await orderService.getOrdersByStatus(
      sellerId,
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

  acceptOrder: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const params = orderIdSchema.parse(req.params);
    const updatedOrder = await orderService.acceptOrder(
      Number(params.id),
      sellerId,
    );
    if (!updatedOrder)
      throw new NotFoundError(
        "Pesanan tidak ditemukan atau tidak dapat diubah statusnya",
      );
    if (updatedOrder.user_id) {
      sendOrderEmail({
        orderId: updatedOrder.pesanan_id,
        buyerId: updatedOrder.user_id,
        template: "orderAccepted",
      }).catch((err) => console.error("[email] orderAccepted gagal:", err));
    }
    return success(res, "Pesanan berhasil diterima", updatedOrder);
  }),

  rejectOrder: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const params = orderIdSchema.parse(req.params);
    const body = rejectOrderSchema.parse(req.body);
    const updatedOrder = await orderService.rejectOrder(
      Number(params.id),
      sellerId,
      body.reason,
    );
    if (!updatedOrder)
      throw new NotFoundError(
        "Pesanan tidak ditemukan atau tidak dapat diubah statusnya",
      );
    if (updatedOrder.user_id) {
      sendOrderEmail({
        orderId: updatedOrder.pesanan_id,
        buyerId: updatedOrder.user_id,
        template: "orderCanceled",
        reason: body.reason,
      }).catch((err) => console.error("[email] orderCanceled gagal:", err));
    }
    return success(res, "Pesanan berhasil ditolak", updatedOrder);
  }),

  processOrder: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const params = orderIdSchema.parse(req.params);
    const updatedOrder = await orderService.processOrder(
      Number(params.id),
      sellerId,
    );
    if (!updatedOrder)
      throw new NotFoundError(
        "Pesanan tidak ditemukan atau tidak dapat diubah statusnya",
      );
    return success(
      res,
      "Status pesanan berhasil diubah menjadi diproses",
      updatedOrder,
    );
  }),

  deliverOrder: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const params = orderIdSchema.parse(req.params);
    const body = deliveryNoteSchema.parse(req.body);
    const updatedOrder = await orderService.deliverOrder(
      Number(params.id),
      sellerId,
      body.note,
    );
    if (!updatedOrder)
      throw new NotFoundError(
        "Pesanan tidak ditemukan atau tidak dapat diubah statusnya",
      );
    if (updatedOrder.user_id) {
      sendOrderEmail({
        orderId: updatedOrder.pesanan_id,
        buyerId: updatedOrder.user_id,
        template: "orderDelivered",
      }).catch((err) => console.error("[email] orderDelivered gagal:", err));
    }
    return success(
      res,
      "Status pesanan berhasil diubah menjadi dikirim",
      updatedOrder,
    );
  }),

  getOrderSummary: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const summary = await orderService.getOrderSummary(sellerId);
    return success(res, "Ringkasan pesanan berhasil diambil", summary);
  }),
};
