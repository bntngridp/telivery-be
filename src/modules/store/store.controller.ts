import { Request, Response } from 'express';
import { storeService } from './store.service';
import {
  storeIdSchema,
  storeCategorySchema,
  storeSearchSchema,
  paginationSchema
} from './store.schema';

export const storeController = {
  async getAllStores(req: Request, res: Response) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const result = await storeService.getAllStores(pagination.page, pagination.limit);

      return res.status(200).json({
        success: true,
        message: 'Daftar toko berhasil diambil',
        data: result.stores,
        pagination: result.pagination
      });
    } catch (err: any) {
      console.error('Error getting stores:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar toko',
        error: err.message
      });
    }
  },


  async getStoreById(req: Request, res: Response) {
    try {
      const { id } = storeIdSchema.parse(req.params);
      const store = await storeService.getStoreById(Number(id));

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Toko tidak ditemukan'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Detail toko berhasil diambil',
        data: store
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'ID toko tidak valid',
          errors: err.errors
        });
      }

      console.error('Error getting store by id:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail toko',
        error: err.message
      });
    }
  },


  async searchStores(req: Request, res: Response) {
    try {
      const { q } = storeSearchSchema.parse(req.query);
      const pagination = paginationSchema.parse(req.query);

      const result = await storeService.searchStores(
        q,
        pagination.page,
        pagination.limit
      );

      return res.status(200).json({
        success: true,
        message: 'Hasil pencarian toko',
        keyword: result.keyword,
        data: result.stores,
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

      console.error('Error searching stores:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal melakukan pencarian toko',
        error: err.message
      });
    }
  },

  async getStoresByCategory(req: Request, res: Response) {
    try {
      const { kategori } = storeCategorySchema.parse(req.params);
      const pagination = paginationSchema.parse(req.query);

      const result = await storeService.getStoresByCategory(
        kategori,
        pagination.page,
        pagination.limit
      );

      return res.status(200).json({
        success: true,
        message: `Toko kategori ${result.kategori} berhasil diambil`,
        data: result.stores,
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

      console.error('Error getting stores by category:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil toko berdasarkan kategori',
        error: err.message
      });
    }
  },

  async getPopularStores(req: Request, res: Response) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const stores = await storeService.getPopularStores(pagination.limit);

      return res.status(200).json({
        success: true,
        message: 'Toko populer berhasil diambil',
        data: stores
      });
    } catch (err: any) {
      console.error('Error getting popular stores:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil toko populer',
        error: err.message
      });
    }
  },

  async getStoreRecommendations(req: Request, res: Response) {
    try {
      const pagination = paginationSchema.parse(req.query);
      // Get user ID if available from authentication middleware
      const userId = (req as any).user?.id;

      const stores = await storeService.getStoreRecommendations(
        userId,
        pagination.limit
      );

      return res.status(200).json({
        success: true,
        message: 'Rekomendasi toko berhasil diambil',
        data: stores
      });
    } catch (err: any) {
      console.error('Error getting store recommendations:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil rekomendasi toko',
        error: err.message
      });
    }
  },

  async getStoreProducts(req: Request, res: Response) {
    try {
      const { id } = storeIdSchema.parse(req.params);
      const pagination = paginationSchema.parse(req.query);

      const result = await storeService.getStoreProducts(
        Number(id),
        pagination.page,
        pagination.limit
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Toko tidak ditemukan'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Produk toko berhasil diambil',
        store: result.store,
        data: result.products,
        pagination: result.pagination
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'ID toko tidak valid',
          errors: err.errors
        });
      }

      console.error('Error getting store products:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil produk toko',
        error: err.message
      });
    }
  }
};
