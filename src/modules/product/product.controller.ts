import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { productService } from './product.service';
import {
    createProductSchema,
    updateProductSchema,
    updateStockSchema,
} from './product.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { success, created } from '../../utils/response';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../utils/errors';
import { CATEGORY_URL_TO_DB, UPLOAD_PATHS } from '../../config/constants';

function requireSeller(req: Request): number {
    if (!req.user || req.user.role !== 'penjual' || typeof req.user.sellerId !== 'number') {
        throw new ForbiddenError('Hanya penjual yang dapat mengakses endpoint ini');
    }
    return req.user.sellerId;
}

function parseId(value: string): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequestError('ID tidak valid');
    return n;
}

function resolveCategoryDb(value: string): string {
    return CATEGORY_URL_TO_DB[value.toLowerCase()] ?? value.toUpperCase();
}

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSeller(req);
    const data = createProductSchema.parse(req.body);
    if (!req.file) throw new BadRequestError('Gambar produk wajib diupload');

    const kategoriRecord = await prisma.kategori.findFirst({ where: { nama_kategori: data.kategori } });
    if (!kategoriRecord) throw new BadRequestError('Kategori tidak ditemukan di database');

    const pathGambar = `${UPLOAD_PATHS.PRODUCTS}/${req.file.filename}`;
    const produk = await productService.create({
        nama: data.nama,
        harga: data.harga,
        stok: data.stok,
        pathGambar,
        penjualId: sellerId,
        id_kategori: kategoriRecord.id_kategori,
    });
    return created(res, 'Produk berhasil ditambahkan', produk);
});

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSeller(req);
    const data = await productService.listBySeller(sellerId);
    return success(res, 'Produk berhasil diambil', data);
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSeller(req);
    const id = parseId(req.params.id);
    const product = await productService.findOwnedById(id, sellerId);
    if (!product) throw new NotFoundError('Produk tidak ditemukan');
    return success(res, 'Detail produk berhasil diambil', product);
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSeller(req);
    const data = await productService.listBySellerAndCategory(sellerId, resolveCategoryDb(req.params.category));
    return success(res, 'Produk berhasil diambil', data);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSeller(req);
    const id = parseId(req.params.id);
    const data = updateProductSchema.parse(req.body);

    const updateInput: Parameters<typeof productService.update>[2] = {
        nama: data.nama,
        deskripsi: data.deskripsi,
        harga: data.harga,
        stok: data.stok,
        kategori: data.kategori,
    };
    if (req.file) {
        updateInput.pathGambar = `${UPLOAD_PATHS.PRODUCTS}/${req.file.filename}`;
    }

    const updated = await productService.update(id, sellerId, updateInput);
    return success(res, 'Produk berhasil diupdate', updated);
});

export const updateProductStock = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSeller(req);
    const id = parseId(req.params.id);
    const data = updateStockSchema.parse(req.body);
    const updated = await productService.updateStock(id, sellerId, data.stok);
    return success(res, 'Stok produk berhasil diupdate', updated);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSeller(req);
    const id = parseId(req.params.id);
    const result = await productService.delete(id, sellerId);
    return success(res, result.message);
});

export const deleteAllProducts = asyncHandler(async (req: Request, res: Response) => {
    const sellerId = requireSeller(req);
    const result = await productService.deleteAll(sellerId);
    return success(res, result.message);
});

export const getAllProductsForBuyer = asyncHandler(async (_req: Request, res: Response) => {
    const data = await productService.listForBuyer();
    return success(res, 'Produk berhasil diambil', data);
});

export const getProductByIdForBuyer = asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const product = await productService.findByIdForBuyer(id);
    if (!product) throw new NotFoundError('Produk tidak ditemukan');
    return success(res, 'Detail produk berhasil diambil', product);
});

export const getProductsByCategoryForBuyer = asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.listForBuyerByCategory(resolveCategoryDb(req.params.kategori));
    return success(res, 'Produk berhasil diambil', data);
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const keyword = String(req.query.q ?? '').trim();
    if (!keyword) throw new BadRequestError('Parameter pencarian tidak boleh kosong');
    const data = await productService.searchForBuyer(keyword);
    return success(res, 'Hasil pencarian produk', data);
});

export const getPopularProducts = asyncHandler(async (_req: Request, res: Response) => {
    const data = await productService.listPopular(10);
    return success(res, 'Produk populer berhasil diambil', data);
});

export const getProductRecommendations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.role === 'pembeli' ? req.user.id : undefined;
    const data = await productService.listRecommendations(userId, 10);
    return success(res, 'Rekomendasi produk berhasil diambil', data);
});
