import { prisma } from "../../config/prisma";
import { ORDER_STATUS } from "../../config/constants";

export const orderService = {
  async getSellerOrders(
    sellerId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.pesanan.findMany({
        where: {
          mitra_id: sellerId,
        },
        include: {
          pembeli: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          detail_pesanan_produk: {
            include: {
              produk: true,
            },
          },
          detail_pesanan_layanan: {
            include: {
              layanan: true,
            },
          },
          pembayaran: true,
        },
        orderBy: {
          waktu_pesan: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.pesanan.count({
        where: {
          mitra_id: sellerId,
        },
      }),
    ]);

    return {
      orders,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },

  async getOrderById(orderId: number, sellerId: number) {
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId,
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
            delivery_address: true,
          },
        },
        detail_pesanan_produk: {
          include: {
            produk: true,
          },
        },
        detail_pesanan_layanan: {
          include: {
            layanan: true,
          },
        },
        pembayaran: true,
        ulasan: true,
      },
    });

    return order;
  },

  async getOrdersByStatus(
    sellerId: number,
    status: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.pesanan.findMany({
        where: {
          mitra_id: sellerId,
          status_pesanan: status,
        },
        include: {
          pembeli: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true,
            },
          },
          detail_pesanan_produk: {
            include: {
              produk: true,
            },
          },
          detail_pesanan_layanan: {
            include: {
              layanan: true,
            },
          },
          pembayaran: true,
        },
        orderBy: {
          waktu_pesan: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.pesanan.count({
        where: {
          mitra_id: sellerId,
          status_pesanan: status,
        },
      }),
    ]);

    return {
      orders,
      status,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },

  async acceptOrder(orderId: number, sellerId: number) {
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId,
        status_pesanan: ORDER_STATUS.PENDING,
      },
    });

    if (!order) {
      return null;
    }
    const updatedOrder = await prisma.pesanan.update({
      where: {
        pesanan_id: orderId,
      },
      data: {
        status_pesanan: ORDER_STATUS.ACCEPTED,
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
          },
        },
      },
    });
    if (updatedOrder.user_id) {
      await prisma.notifikasi.create({
        data: {
          user_id: updatedOrder.user_id,
          isi_pesan: `Pesanan #${orderId} telah diterima oleh penjual.`,
          waktu_kirim: new Date(),
          tipe: "order_accepted",
          status_dibaca: false,
        },
      });
    }

    return updatedOrder;
  },

  async rejectOrder(orderId: number, sellerId: number, reason: string) {
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId,
        status_pesanan: ORDER_STATUS.PENDING,
      },
    });

    if (!order) {
      return null;
    }
    const updatedOrder = await prisma.pesanan.update({
      where: {
        pesanan_id: orderId,
      },
      data: {
        status_pesanan: ORDER_STATUS.REJECTED,
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
          },
        },
      },
    });

    if (updatedOrder.user_id) {
      await prisma.notifikasi.create({
        data: {
          user_id: updatedOrder.user_id,
          isi_pesan: `Pesanan #${orderId} ditolak oleh penjual. Alasan: ${reason}`,
          waktu_kirim: new Date(),
          tipe: "order_rejected",
          status_dibaca: false,
        },
      });
    }

    return updatedOrder;
  },

  async processOrder(orderId: number, sellerId: number) {
    // Cek status pesanan saat ini
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId,
        status_pesanan: ORDER_STATUS.ACCEPTED,
      },
    });

    if (!order) {
      return null;
    }
    const updatedOrder = await prisma.pesanan.update({
      where: {
        pesanan_id: orderId,
      },
      data: {
        status_pesanan: ORDER_STATUS.PROCESSING,
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
          },
        },
      },
    });
    if (updatedOrder.user_id) {
      await prisma.notifikasi.create({
        data: {
          user_id: updatedOrder.user_id,
          isi_pesan: `Pesanan #${orderId} sedang diproses.`,
          waktu_kirim: new Date(),
          tipe: "order_processing",
          status_dibaca: false,
        },
      });
    }

    return updatedOrder;
  },
  async deliverOrder(orderId: number, sellerId: number, note?: string) {
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId,
        status_pesanan: ORDER_STATUS.PROCESSING,
      },
    });

    if (!order) {
      return null;
    }
    const updatedOrder = await prisma.pesanan.update({
      where: {
        pesanan_id: orderId,
      },
      data: {
        status_pesanan: ORDER_STATUS.DELIVERED,
        waktu_dikirim: new Date(),
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
          },
        },
      },
    });
    if (updatedOrder.user_id) {
      await prisma.notifikasi.create({
        data: {
          user_id: updatedOrder.user_id,
          isi_pesan: `Pesanan #${orderId} sedang dikirim${note ? `. Catatan: ${note}` : "."}`,
          waktu_kirim: new Date(),
          tipe: "order_delivered",
          status_dibaca: false,
        },
      });
    }

    return updatedOrder;
  },
  async getOrderSummary(sellerId: number) {
    const revenue = await prisma.pesanan.aggregate({
      where: {
        mitra_id: sellerId,
        status_pesanan: {
          in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.DELIVERED],
        },
      },
      _sum: {
        total_harga: true,
      },
    });
    const ordersByStatus = await prisma.pesanan.groupBy({
      by: ["status_pesanan"],
      where: {
        mitra_id: sellerId,
      },
      _count: {
        pesanan_id: true,
      },
    });
    const orderCounts = {
      pending: 0,
      accepted: 0,
      processing: 0,
      delivered: 0,
      completed: 0,
      rejected: 0,
      canceled: 0,
    };

    ordersByStatus.forEach((item) => {
      if (item.status_pesanan) {
        orderCounts[item.status_pesanan as keyof typeof orderCounts] =
          item._count.pesanan_id;
      }
    });
    const recentOrders = await prisma.pesanan.findMany({
      where: {
        mitra_id: sellerId,
      },
      include: {
        pembeli: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: {
        waktu_pesan: "desc",
      },
      take: 5,
    });
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const dailyRevenue = await prisma.$queryRaw`
      SELECT
        DATE(waktu_pesan) as date,
        SUM(total_harga) as revenue
      FROM
        pesanan
      WHERE
        mitra_id = ${sellerId}
        AND waktu_pesan >= ${oneWeekAgo}
        AND status_pesanan IN ('completed', 'delivered')
      GROUP BY
        DATE(waktu_pesan)
      ORDER BY
        date ASC
    `;

    return {
      totalRevenue: revenue._sum.total_harga || 0,
      orderCounts,
      recentOrders,
      dailyRevenue,
    };
  },
};
