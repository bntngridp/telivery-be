import { Request, Response } from 'express';
import { orderService } from './order.service';
import {
  orderIdSchema,
  orderStatusSchema,
  orderPaginationSchema,
  rejectOrderSchema,
  deliveryNoteSchema
} from './order.schema';

export const orderController = {
  /**
   * Mengambil semua pesanan penjual
   */
  async getSellerOrders(req: Request, res: Response) {
    try {
      const sellerId = (req as any).user?.sellerId;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai penjual'
        });
      }

      const pagination = orderPaginationSchema.parse(req.query);
      const result = await orderService.getSellerOrders(
        sellerId,
        pagination.page,
        pagination.limit
      );

      return res.status(200).json({
        success: true,
        message: 'Daftar pesanan berhasil diambil',
        data: result.orders,
        pagination: result.pagination
      });
    } catch (err: any) {
      console.error('Error getting seller orders:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar pesanan',
        error: err.message
      });
    }
  },

  /**
   * Mengambil detail satu pesanan
   */
  async getOrderById(req: Request, res: Response) {
    try {
      const sellerId = (req as any).user?.sellerId;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai penjual'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const order = await orderService.getOrderById(Number(id), sellerId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Detail pesanan berhasil diambil',
        data: order
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'ID pesanan tidak valid',
          errors: err.errors
        });
      }

      console.error('Error getting order by id:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail pesanan',
        error: err.message
      });
    }
  },

  /**
   * Mengambil pesanan berdasarkan status
   */
  async getOrdersByStatus(req: Request, res: Response) {
    try {
      const sellerId = (req as any).user?.sellerId;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai penjual'
        });
      }

      const { status } = orderStatusSchema.parse(req.params);
      const pagination = orderPaginationSchema.parse(req.query);

      const result = await orderService.getOrdersByStatus(
        sellerId,
        status,
        pagination.page,
        pagination.limit
      );

      return res.status(200).json({
        success: true,
        message: `Pesanan dengan status ${status} berhasil diambil`,
        status: result.status,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Parameter status tidak valid',
          errors: err.errors
        });
      }

      console.error('Error getting orders by status:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil pesanan berdasarkan status',
        error: err.message
      });
    }
  },

  /**
   * Menerima pesanan
   */
  async acceptOrder(req: Request, res: Response) {
    try {
      const sellerId = (req as any).user?.sellerId;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai penjual'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const updatedOrder = await orderService.acceptOrder(Number(id), sellerId);

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan atau tidak dapat diubah statusnya'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pesanan berhasil diterima',
        data: updatedOrder
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'ID pesanan tidak valid',
          errors: err.errors
        });
      }

      console.error('Error accepting order:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal menerima pesanan',
        error: err.message
      });
    }
  },

  /**
   * Menolak pesanan
   */
  async rejectOrder(req: Request, res: Response) {
    try {
      const sellerId = (req as any).user?.sellerId;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai penjual'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const { reason } = rejectOrderSchema.parse(req.body);

      const updatedOrder = await orderService.rejectOrder(Number(id), sellerId, reason);

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan atau tidak dapat diubah statusnya'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pesanan berhasil ditolak',
        data: updatedOrder
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Input tidak valid',
          errors: err.errors
        });
      }

      console.error('Error rejecting order:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal menolak pesanan',
        error: err.message
      });
    }
  },

  /**
   * Memproses pesanan
   */
  async processOrder(req: Request, res: Response) {
    try {
      const sellerId = (req as any).user?.sellerId;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai penjual'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const updatedOrder = await orderService.processOrder(Number(id), sellerId);

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan atau tidak dapat diubah statusnya'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Status pesanan berhasil diubah menjadi diproses',
        data: updatedOrder
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'ID pesanan tidak valid',
          errors: err.errors
        });
      }

      console.error('Error processing order:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal memproses pesanan',
        error: err.message
      });
    }
  },

  /**
   * Mengirim pesanan
   */
  async deliverOrder(req: Request, res: Response) {
    try {
      const sellerId = (req as any).user?.sellerId;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai penjual'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const { note } = deliveryNoteSchema.parse(req.body);

      const updatedOrder = await orderService.deliverOrder(Number(id), sellerId, note);

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan atau tidak dapat diubah statusnya'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Status pesanan berhasil diubah menjadi dikirim',
        data: updatedOrder
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Input tidak valid',
          errors: err.errors
        });
      }

      console.error('Error delivering order:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengubah status pesanan menjadi dikirim',
        error: err.message
      });
    }
  },

  /**
   * Mendapatkan ringkasan statistik pesanan dan pendapatan
   */
  async getOrderSummary(req: Request, res: Response) {
    try {
      const sellerId = (req as any).user?.sellerId;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai penjual'
        });
      }

      const summary = await orderService.getOrderSummary(sellerId);

      return res.status(200).json({
        success: true,
        message: 'Ringkasan pesanan berhasil diambil',
        data: summary
      });
    } catch (err: any) {
      console.error('Error getting order summary:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil ringkasan pesanan',
        error: err.message
      });
    }
  }
};
