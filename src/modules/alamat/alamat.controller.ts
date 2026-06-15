import { Request, Response } from "express";
import { alamatService } from "./alamat.service";
import {
  createAlamatSchema,
  updateAlamatSchema,
  alamatIdParamSchema,
} from "./alamat.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { success, created } from "../../utils/response";
import { UnauthorizedError } from "../../utils/errors";

/**
 * @openapi
 * /api/buyer/alamat:
 *   get:
 *     tags: [Buyer Profile]
 *     summary: List alamat pembeli
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "List alamat" }
 */
export const listAlamat = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError("Unauthorized");
  const data = await alamatService.listAlamat(userId);
  return success(res, "Daftar alamat", data);
});

/**
 * @openapi
 * /api/buyer/alamat/{id}:
 *   get:
 *     tags: [Buyer Profile]
 *     summary: Detail alamat
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
export const getAlamat = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError("Unauthorized");
  const { id } = alamatIdParamSchema.parse(req.params);
  const data = await alamatService.getAlamatById(Number(id), userId);
  return success(res, "Detail alamat", data);
});

/**
 * @openapi
 * /api/buyer/alamat:
 *   post:
 *     tags: [Buyer Profile]
 *     summary: Tambah alamat baru
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label, alamat_lengkap]
 *             properties:
 *               label: { type: string }
 *               alamat_lengkap: { type: string }
 *               catatan: { type: string, nullable: true }
 *               latitude: { type: number, nullable: true }
 *               longitude: { type: number, nullable: true }
 *               is_primary: { type: boolean, default: false }
 */
export const createAlamat = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError("Unauthorized");
    const data = createAlamatSchema.parse(req.body);
    const created_row = await alamatService.createAlamat(userId, data);
    return created(res, "Alamat berhasil dibuat", created_row);
  },
);

/**
 * @openapi
 * /api/buyer/alamat/{id}:
 *   patch:
 *     tags: [Buyer Profile]
 *     summary: Update alamat
 *     security: [{ bearerAuth: [] }]
 */
export const updateAlamat = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError("Unauthorized");
    const { id } = alamatIdParamSchema.parse(req.params);
    const data = updateAlamatSchema.parse(req.body);
    const updated = await alamatService.updateAlamat(Number(id), userId, data);
    return success(res, "Alamat berhasil diupdate", updated);
  },
);

/**
 * @openapi
 * /api/buyer/alamat/{id}:
 *   delete:
 *     tags: [Buyer Profile]
 *     summary: Hapus alamat
 *     security: [{ bearerAuth: [] }]
 */
export const deleteAlamat = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError("Unauthorized");
    const { id } = alamatIdParamSchema.parse(req.params);
    await alamatService.deleteAlamat(Number(id), userId);
    return success(res, "Alamat berhasil dihapus", null);
  },
);

/**
 * @openapi
 * /api/buyer/alamat/{id}/primary:
 *   patch:
 *     tags: [Buyer Profile]
 *     summary: Set alamat sebagai primary
 *     security: [{ bearerAuth: [] }]
 */
export const setPrimary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError("Unauthorized");
  const { id } = alamatIdParamSchema.parse(req.params);
  const updated = await alamatService.setPrimary(Number(id), userId);
  return success(res, "Alamat utama diubah", updated);
});
