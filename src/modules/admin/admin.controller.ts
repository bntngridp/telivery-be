import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { storeIdParamSchema, rejectStoreSchema, adminPaginationSchema } from './admin.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { success, paginated } from '../../utils/response';
import { UnauthorizedError } from '../../utils/errors';

function requireAdmin(req: Request): void {
    if (req.user?.role !== 'admin') {
        throw new UnauthorizedError('Akses ditolak. Hanya admin yang diizinkan');
    }
}

export const adminController = {
    listPendingStores: asyncHandler(async (req: Request, res: Response) => {
        requireAdmin(req);
        const pagination = adminPaginationSchema.parse(req.query);
        const result = await adminService.listPendingStores(pagination.page, pagination.limit);
        return paginated(
            res,
            'Daftar toko pending berhasil diambil',
            result.stores,
            result.pagination.page,
            result.pagination.limit,
            result.pagination.total,
        );
    }),

    approveStore: asyncHandler(async (req: Request, res: Response) => {
        requireAdmin(req);
        const { id } = storeIdParamSchema.parse(req.params);
        const updated = await adminService.approveStore(Number(id));
        return success(res, 'Toko berhasil disetujui', updated);
    }),

    rejectStore: asyncHandler(async (req: Request, res: Response) => {
        requireAdmin(req);
        const { id } = storeIdParamSchema.parse(req.params);
        const { alasan } = rejectStoreSchema.parse(req.body);
        const updated = await adminService.rejectStore(Number(id), alasan);
        return success(res, 'Toko berhasil ditolak', updated);
    }),
};
