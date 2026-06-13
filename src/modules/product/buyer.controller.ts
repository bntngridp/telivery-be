import { Request, Response } from 'express';
import { buyerProductService } from './buyer.service';
import {
    productIdSchema,
    productCategorySchema,
    productSearchSchema,
    paginationSchema,
} from './buyer.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { success, paginated } from '../../utils/response';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export const buyerProductController = {
    getAllProducts: asyncHandler(async (req: Request, res: Response) => {
        const pagination = paginationSchema.parse(req.query);
        const result = await buyerProductService.getAllProducts(pagination.page, pagination.limit);
        return paginated(
            res,
            'Produk berhasil diambil',
            result.products,
            result.pagination.page,
            result.pagination.limit,
            result.pagination.total,
        );
    }),

    getProductById: asyncHandler(async (req: Request, res: Response) => {
        const params = productIdSchema.parse(req.params);
        const product = await buyerProductService.getProductById(Number(params.id));
        if (!product) throw new NotFoundError('Produk tidak ditemukan');
        return success(res, 'Detail produk berhasil diambil', product);
    }),

    getProductsByCategory: asyncHandler(async (req: Request, res: Response) => {
        const params = productCategorySchema.parse(req.params);
        const pagination = paginationSchema.parse(req.query);
        const result = await buyerProductService.getProductsByCategory(
            params.kategori,
            pagination.page,
            pagination.limit,
        );
        if (!result) throw new BadRequestError('Kategori tidak ditemukan');
        return paginated(
            res,
            `Produk kategori ${result.kategori} berhasil diambil`,
            { products: result.products },
            result.pagination.page,
            result.pagination.limit,
            result.pagination.total,
        );
    }),

    searchProducts: asyncHandler(async (req: Request, res: Response) => {
        const query = productSearchSchema.parse(req.query);
        const pagination = paginationSchema.parse(req.query);
        const result = await buyerProductService.searchProducts(query.q, pagination.page, pagination.limit);
        return paginated(
            res,
            'Hasil pencarian produk',
            { keyword: result.keyword, products: result.products },
            result.pagination.page,
            result.pagination.limit,
            result.pagination.total,
        );
    }),

    getPopularProducts: asyncHandler(async (req: Request, res: Response) => {
        const pagination = paginationSchema.parse(req.query);
        const products = await buyerProductService.getPopularProducts(pagination.limit);
        return success(res, 'Produk populer berhasil diambil', products);
    }),

    getProductRecommendations: asyncHandler(async (req: Request, res: Response) => {
        const pagination = paginationSchema.parse(req.query);
        const userId = req.user?.id;
        const products = await buyerProductService.getProductRecommendations(userId, pagination.limit);
        return success(res, 'Rekomendasi produk berhasil diambil', products);
    }),
};
