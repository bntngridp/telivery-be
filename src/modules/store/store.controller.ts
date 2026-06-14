import { Request, Response } from "express";
import { storeService } from "./store.service";
import {
  storeIdSchema,
  storeCategorySchema,
  storeSearchSchema,
  paginationSchema,
} from "./store.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { success, paginated } from "../../utils/response";
import { NotFoundError } from "../../utils/errors";

export const storeController = {
  getAllStores: asyncHandler(async (req: Request, res: Response) => {
    const pagination = paginationSchema.parse(req.query);
    const result = await storeService.getAllStores(
      pagination.page,
      pagination.limit,
    );
    return paginated(
      res,
      "Daftar toko berhasil diambil",
      result.stores,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
    );
  }),

  getStoreById: asyncHandler(async (req: Request, res: Response) => {
    const params = storeIdSchema.parse(req.params);
    const store = await storeService.getStoreById(Number(params.id));
    if (!store) throw new NotFoundError("Toko tidak ditemukan");
    return success(res, "Detail toko berhasil diambil", store);
  }),

  searchStores: asyncHandler(async (req: Request, res: Response) => {
    const query = storeSearchSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);
    const result = await storeService.searchStores(
      query.q,
      pagination.page,
      pagination.limit,
    );
    return paginated(
      res,
      "Hasil pencarian toko",
      { keyword: result.keyword, stores: result.stores },
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
    );
  }),

  getStoresByCategory: asyncHandler(async (req: Request, res: Response) => {
    const params = storeCategorySchema.parse(req.params);
    const pagination = paginationSchema.parse(req.query);
    const result = await storeService.getStoresByCategory(
      params.kategori,
      pagination.page,
      pagination.limit,
    );
    return paginated(
      res,
      `Toko kategori ${result.kategori} berhasil diambil`,
      { stores: result.stores },
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
    );
  }),

  getPopularStores: asyncHandler(async (req: Request, res: Response) => {
    const pagination = paginationSchema.parse(req.query);
    const stores = await storeService.getPopularStores(pagination.limit);
    return success(res, "Toko populer berhasil diambil", stores);
  }),

  getStoreRecommendations: asyncHandler(async (req: Request, res: Response) => {
    const pagination = paginationSchema.parse(req.query);
    const userId = req.user?.id;
    const stores = await storeService.getStoreRecommendations(
      userId,
      pagination.limit,
    );
    return success(res, "Rekomendasi toko berhasil diambil", stores);
  }),

  getStoreProducts: asyncHandler(async (req: Request, res: Response) => {
    const params = storeIdSchema.parse(req.params);
    const pagination = paginationSchema.parse(req.query);
    const result = await storeService.getStoreProducts(
      Number(params.id),
      pagination.page,
      pagination.limit,
    );
    if (!result) throw new NotFoundError("Toko tidak ditemukan");
    return paginated(
      res,
      "Produk toko berhasil diambil",
      { store: result.store, products: result.products },
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
    );
  }),
};
