import { Request, Response } from 'express';
import { buyerProductService } from './buyer.service';
import {
  productIdSchema,
  productCategorySchema,
  productSearchSchema,
  paginationSchema
} from './buyer.schema';

export const buyerProductController = {
  async getAllProducts(req: Request, res: Response) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const result = await buyerProductService.getAllProducts(pagination.page, pagination.limit);

      return res.status(200).json({
        success: true,
        message: 'Produk berhasil diambil',
        data: result.products,
        pagination: result.pagination
      });
    } catch (err: any) {
      console.error('Error getting products for buyer:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil produk',
        error: err.message
      });
    }
  },

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = productIdSchema.parse(req.params);
      const product = await buyerProductService.getProductById(Number(id));

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produk tidak ditemukan'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Detail produk berhasil diambil',
        data: product
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'ID produk tidak valid',
          errors: err.errors
        });
      }

      console.error('Error getting product by id for buyer:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail produk',
        error: err.message
      });
    }
  },

  async getProductsByCategory(req: Request, res: Response) {
    try {
      const { kategori } = productCategorySchema.parse(req.params);
      const pagination = paginationSchema.parse(req.query);

      const result = await buyerProductService.getProductsByCategory(
        kategori,
        pagination.page,
        pagination.limit
      );

      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Kategori tidak ditemukan'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Produk kategori ${result.kategori} berhasil diambil`,
        data: result.products,
        pagination: result.pagination
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Parameter kategori tidak valid',
          errors: err.errors
        });
      }

      console.error('Error getting products by category for buyer:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil produk berdasarkan kategori',
        error: err.message
      });
    }
  },

  async searchProducts(req: Request, res: Response) {
    try {
      const { q } = productSearchSchema.parse(req.query);
      const pagination = paginationSchema.parse(req.query);

      const result = await buyerProductService.searchProducts(
        q,
        pagination.page,
        pagination.limit
      );

      return res.status(200).json({
        success: true,
        message: 'Hasil pencarian produk',
        keyword: result.keyword,
        data: result.products,
        pagination: result.pagination
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Parameter pencarian tidak valid',
          errors: err.errors
        });
      }

      console.error('Error searching products for buyer:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal melakukan pencarian produk',
        error: err.message
      });
    }
  },

  async getPopularProducts(req: Request, res: Response) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const products = await buyerProductService.getPopularProducts(pagination.limit);

      return res.status(200).json({
        success: true,
        message: 'Produk populer berhasil diambil',
        data: products
      });
    } catch (err: any) {
      console.error('Error getting popular products for buyer:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil produk populer',
        error: err.message
      });
    }
  },

  async getProductRecommendations(req: Request, res: Response) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const userId = (req as any).user?.id;

      const products = await buyerProductService.getProductRecommendations(
        userId,
        pagination.limit
      );

      return res.status(200).json({
        success: true,
        message: 'Rekomendasi produk berhasil diambil',
        data: products
      });
    } catch (err: any) {
      console.error('Error getting product recommendations for buyer:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil rekomendasi produk',
        error: err.message
      });
    }
  }
};
