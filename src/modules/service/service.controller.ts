import { Request, Response } from "express";
import { serviceService } from "./service.service";
import {
  createLayananSchema,
  updateLayananSchema,
  layananIdParamSchema,
  storeIdParamSchema,
} from "./service.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { success, created } from "../../utils/response";
import { UnauthorizedError, BadRequestError } from "../../utils/errors";

function requireSellerId(req: Request): number {
  const id = req.user?.sellerId;
  if (!id)
    throw new UnauthorizedError("Unauthorized, silakan login sebagai penjual");
  return id;
}

function parseId(value: string, fieldName: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0)
    throw new BadRequestError(`${fieldName} tidak valid`);
  return n;
}

export const serviceController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const data = createLayananSchema.parse(req.body);
    const createdLayanan = await serviceService.create(sellerId, data);
    return created(res, "Layanan berhasil ditambahkan", createdLayanan);
  }),

  listBySeller: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const data = await serviceService.listBySeller(sellerId);
    return success(res, "Daftar layanan berhasil diambil", data);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const { id } = layananIdParamSchema.parse(req.params);
    const layanan = await serviceService.findOwnedById(
      parseId(id, "id"),
      sellerId,
    );
    if (!layanan) throw new BadRequestError("Layanan tidak ditemukan");
    return success(res, "Detail layanan berhasil diambil", layanan);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const { id } = layananIdParamSchema.parse(req.params);
    const data = updateLayananSchema.parse(req.body);
    const updated = await serviceService.update(
      parseId(id, "id"),
      sellerId,
      data,
    );
    return success(res, "Layanan berhasil diperbarui", updated);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSellerId(req);
    const { id } = layananIdParamSchema.parse(req.params);
    const result = await serviceService.delete(parseId(id, "id"), sellerId);
    return success(res, result.message);
  }),

  listByStore: asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = storeIdParamSchema.parse(req.params);
    const data = await serviceService.listByStore(parseId(storeId, "storeId"));
    return success(res, "Daftar layanan toko berhasil diambil", data);
  }),
};
