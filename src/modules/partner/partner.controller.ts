import { Request, Response } from "express";
import { partnerService } from "./partner.service";
import { updateStoreProfileSchema } from "./partner.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { success } from "../../utils/response";
import { UnauthorizedError } from "../../utils/errors";

function requireSellerId(req: Request): number {
  const id = req.user?.sellerId;
  if (!id)
    throw new UnauthorizedError("Unauthorized, silakan login sebagai penjual");
  return id;
}

export const partnerController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const profile = await partnerService.getProfile(sellerId);
    return success(res, "Profil toko berhasil diambil", profile);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const data = updateStoreProfileSchema.parse(req.body);
    const updated = await partnerService.updateProfile(sellerId, data);
    return success(res, "Profil toko berhasil diperbarui", updated);
  }),
};
