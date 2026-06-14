import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import {
    notificationIdSchema,
    notificationPaginationSchema,
    notificationTypeFilterSchema,
} from './notification.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { success, paginated } from '../../utils/response';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';

function requireBuyerId(req: Request): number {
    const id = req.user?.id;
    if (!id) throw new UnauthorizedError('Unauthorized, silakan login sebagai pembeli');
    return id;
}

function requireSellerId(req: Request): number {
    const id = req.user?.sellerId;
    if (!id) throw new UnauthorizedError('Unauthorized, silakan login sebagai penjual');
    return id;
}

export const buyerNotificationController = {
    list: asyncHandler(async (req: Request, res: Response) => {
        const buyerId = requireBuyerId(req);
        const pagination = notificationPaginationSchema.parse(req.query);
        const { tipe } = notificationTypeFilterSchema.parse(req.query);
        const result = await notificationService.getBuyerNotifications(
            buyerId,
            pagination.page,
            pagination.limit,
            tipe,
        );

        return paginated(
            res,
            'Daftar notifikasi berhasil diambil',
            { notifications: result.notifications },
            result.pagination.page,
            result.pagination.limit,
            result.pagination.total,
        );
    }),

    unreadCount: asyncHandler(async (req: Request, res: Response) => {
        const buyerId = requireBuyerId(req);
        const count = await notificationService.getUnreadCount(buyerId, 'pembeli');
        return success(res, 'Jumlah notifikasi belum dibaca', { unread: count });
    }),

    markRead: asyncHandler(async (req: Request, res: Response) => {
        const buyerId = requireBuyerId(req);
        const { id } = notificationIdSchema.parse(req.params);
        const updated = await notificationService.markAsRead(Number(id), buyerId, 'pembeli');
        if (!updated) throw new NotFoundError('Notifikasi tidak ditemukan');
        return success(res, 'Notifikasi ditandai sudah dibaca', updated);
    }),

    markAllRead: asyncHandler(async (req: Request, res: Response) => {
        const buyerId = requireBuyerId(req);
        const result = await notificationService.markAllAsRead(buyerId, 'pembeli');
        return success(res, result.message, { count: result.count });
    }),

    delete: asyncHandler(async (req: Request, res: Response) => {
        const buyerId = requireBuyerId(req);
        const { id } = notificationIdSchema.parse(req.params);
        const result = await notificationService.deleteNotification(Number(id), buyerId, 'pembeli');
        if (!result) throw new NotFoundError('Notifikasi tidak ditemukan');
        return success(res, result.message);
    }),
};

export const sellerNotificationController = {
    list: asyncHandler(async (req: Request, res: Response) => {
        const sellerId = requireSellerId(req);
        const pagination = notificationPaginationSchema.parse(req.query);
        const { tipe } = notificationTypeFilterSchema.parse(req.query);
        const result = await notificationService.getSellerNotifications(
            sellerId,
            pagination.page,
            pagination.limit,
            tipe,
        );
        return paginated(
            res,
            'Daftar notifikasi berhasil diambil',
            { notifications: result.notifications },
            result.pagination.page,
            result.pagination.limit,
            result.pagination.total,
        );
    }),

    unreadCount: asyncHandler(async (req: Request, res: Response) => {
        const sellerId = requireSellerId(req);
        const count = await notificationService.getUnreadCount(sellerId, 'penjual');
        return success(res, 'Jumlah notifikasi belum dibaca', { unread: count });
    }),

    markRead: asyncHandler(async (req: Request, res: Response) => {
        const sellerId = requireSellerId(req);
        const { id } = notificationIdSchema.parse(req.params);
        const updated = await notificationService.markAsRead(Number(id), sellerId, 'penjual');
        if (!updated) throw new NotFoundError('Notifikasi tidak ditemukan');
        return success(res, 'Notifikasi ditandai sudah dibaca', updated);
    }),

    markAllRead: asyncHandler(async (req: Request, res: Response) => {
        const sellerId = requireSellerId(req);
        const result = await notificationService.markAllAsRead(sellerId, 'penjual');
        return success(res, result.message, { count: result.count });
    }),

    delete: asyncHandler(async (req: Request, res: Response) => {
        const sellerId = requireSellerId(req);
        const { id } = notificationIdSchema.parse(req.params);
        const result = await notificationService.deleteNotification(Number(id), sellerId, 'penjual');
        if (!result) throw new NotFoundError('Notifikasi tidak ditemukan');
        return success(res, result.message);
    }),
};
