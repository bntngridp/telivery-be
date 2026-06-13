import { Request, Response } from 'express';
import { buyerOrderService } from './buyer.order.service';
import {
    createOrderSchema,
    orderIdSchema,
    orderStatusSchema,
    orderPaginationSchema,
    cancelOrderSchema,
    reviewOrderSchema,
} from './buyer.order.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { success, created, paginated } from '../../utils/response';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../utils/errors';

function requireUserId(req: Request): number {
    const userId = req.user?.id;
    if (!userId) {
        throw new UnauthorizedError('Unauthorized, silakan login sebagai pembeli');
    }
    return userId;
}

export const buyerOrderController = {
    createOrder: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const data = createOrderSchema.parse(req.body);
        const orders = await buyerOrderService.createOrder(userId, data);
        return created(res, 'Pesanan berhasil dibuat', orders);
    }),

    getBuyerOrders: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const pagination = orderPaginationSchema.parse(req.query);
        const result = await buyerOrderService.getBuyerOrders(userId, pagination.page, pagination.limit);
        return paginated(
            res,
            'Daftar pesanan berhasil diambil',
            result.orders,
            result.pagination.page,
            result.pagination.limit,
            result.pagination.total,
        );
    }),

    getOrderById: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const params = orderIdSchema.parse(req.params);
        const order = await buyerOrderService.getOrderById(Number(params.id), userId);
        if (!order) throw new NotFoundError('Pesanan tidak ditemukan');
        return success(res, 'Detail pesanan berhasil diambil', order);
    }),

    cancelOrder: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const params = orderIdSchema.parse(req.params);
        const body = cancelOrderSchema.parse(req.body);
        const updatedOrder = await buyerOrderService.cancelOrder(Number(params.id), userId, body.reason);
        if (!updatedOrder) throw new BadRequestError('Pesanan tidak ditemukan atau tidak dapat dibatalkan');
        return success(res, 'Pesanan berhasil dibatalkan', updatedOrder);
    }),

    confirmOrder: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const params = orderIdSchema.parse(req.params);
        const updatedOrder = await buyerOrderService.confirmOrder(Number(params.id), userId);
        if (!updatedOrder) throw new BadRequestError('Pesanan tidak ditemukan atau tidak dapat dikonfirmasi');
        return success(res, 'Pesanan berhasil dikonfirmasi selesai', updatedOrder);
    }),

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

    trackOrder: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const params = orderIdSchema.parse(req.params);
        const trackingInfo = await buyerOrderService.trackOrder(Number(params.id), userId);
        if (!trackingInfo) throw new NotFoundError('Pesanan tidak ditemukan');
        return success(res, 'Informasi tracking pesanan berhasil diambil', trackingInfo);
    }),

    getOrderSummary: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const summary = await buyerOrderService.getOrderSummary(userId);
        return success(res, 'Ringkasan pesanan berhasil diambil', summary);
    }),

    reviewOrder: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const params = orderIdSchema.parse(req.params);
        const body = reviewOrderSchema.parse(req.body);
        const review = await buyerOrderService.reviewOrder(Number(params.id), userId, body);
        if (!review) throw new BadRequestError('Pesanan tidak ditemukan atau belum selesai');
        return success(res, 'Ulasan berhasil ditambahkan', review);
    }),
};
