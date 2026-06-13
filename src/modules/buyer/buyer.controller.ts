import { Request, Response } from 'express';
import { buyerProfileService } from './buyer.service';
import { updateProfileSchema } from './buyer.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { success } from '../../utils/response';
import { UnauthorizedError } from '../../utils/errors';

function requireUserId(req: Request): number {
    const id = req.user?.id;
    if (!id) throw new UnauthorizedError('Unauthorized, silakan login sebagai pembeli');
    return id;
}

export const buyerProfileController = {
    getProfile: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const profile = await buyerProfileService.getProfile(userId);
        return success(res, 'Profil pembeli berhasil diambil', profile);
    }),

    updateProfile: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const data = updateProfileSchema.parse(req.body);
        const updated = await buyerProfileService.updateProfile(userId, data);
        return success(res, 'Profil pembeli berhasil diperbarui', updated);
    }),
};
