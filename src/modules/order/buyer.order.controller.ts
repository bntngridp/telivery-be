import { Request, Response } from 'express';
import { buyerOrderService } from './buyer.order.service';
import {
  createOrderSchema,
  orderIdSchema,
  orderStatusSchema,
  orderPaginationSchema,
  cancelOrderSchema,
  reviewOrderSchema
} from './buyer.order.schema';

export const buyerOrderController = {
  async createOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai pembeli'
        });
      }

      const validatedData = createOrderSchema.parse(req.body);
      const orders = await buyerOrderService.createOrder(userId, validatedData);

      return res.status(201).json({
        success: true,
        message: 'Pesanan berhasil dibuat',
        data: orders
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Data pesanan tidak valid',
          errors: err.errors
        });
      }

      console.error('Error creating order:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Gagal membuat pesanan',
        error: err.message
      });
    }
  },

  async getBuyerOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai pembeli'
        });
      }

      const pagination = orderPaginationSchema.parse(req.query);
      const result = await buyerOrderService.getBuyerOrders(
        userId,
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
      console.error('Error getting buyer orders:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar pesanan',
        error: err.message
      });
    }
  },

  async getOrderById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai pembeli'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const order = await buyerOrderService.getOrderById(Number(id), userId);

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

  async cancelOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai pembeli'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const { reason } = cancelOrderSchema.parse(req.body);

      const updatedOrder = await buyerOrderService.cancelOrder(Number(id), userId, reason);

      if (!updatedOrder) {
        return res.status(400).json({
          success: false,
          message: 'Pesanan tidak ditemukan atau tidak dapat dibatalkan'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pesanan berhasil dibatalkan',
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

      console.error('Error canceling order:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal membatalkan pesanan',
        error: err.message
      });
    }
  },

  async confirmOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai pembeli'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const updatedOrder = await buyerOrderService.confirmOrder(Number(id), userId);

      if (!updatedOrder) {
        return res.status(400).json({
          success: false,
          message: 'Pesanan tidak ditemukan atau tidak dapat dikonfirmasi'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pesanan berhasil dikonfirmasi selesai',
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

      console.error('Error confirming order:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengonfirmasi pesanan',
        error: err.message
      });
    }
  },

  async getOrdersByStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai pembeli'
        });
      }

      const { status } = orderStatusSchema.parse(req.params);
      const pagination = orderPaginationSchema.parse(req.query);

      const result = await buyerOrderService.getOrdersByStatus(
        userId,
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

  async trackOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai pembeli'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const trackingInfo = await buyerOrderService.trackOrder(Number(id), userId);

      if (!trackingInfo) {
        return res.status(404).json({
          success: false,
          message: 'Pesanan tidak ditemukan'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Informasi tracking pesanan berhasil diambil',
        data: trackingInfo
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'ID pesanan tidak valid',
          errors: err.errors
        });
      }

      console.error('Error tracking order:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal melacak pesanan',
        error: err.message
      });
    }
  },

  async getOrderSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai pembeli'
        });
      }

      const summary = await buyerOrderService.getOrderSummary(userId);

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
  },

  async reviewOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized, silakan login sebagai pembeli'
        });
      }

      const { id } = orderIdSchema.parse(req.params);
      const reviewData = reviewOrderSchema.parse(req.body);

      const review = await buyerOrderService.reviewOrder(Number(id), userId, reviewData);

      if (!review) {
        return res.status(400).json({
          success: false,
          message: 'Pesanan tidak ditemukan atau belum selesai'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Ulasan berhasil ditambahkan',
        data: review
      });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Input tidak valid',
          errors: err.errors
        });
      }

      console.error('Error adding review:', err);
      return res.status(500).json({
        success: false,
        message: 'Gagal menambahkan ulasan',
        error: err.message
      });
    }
  }
};
