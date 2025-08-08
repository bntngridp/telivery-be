import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const orderService = {
  /**
   * Mengambil semua pesanan dari penjual
   */
  async getSellerOrders(sellerId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.pesanan.findMany({
        where: {
          mitra_id: sellerId
        },
        include: {
          pembeli: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true
            }
          },
          detail_pesanan_produk: {
            include: {
              produk: true
            }
          },
          detail_pesanan_layanan: {
            include: {
              layanan: true
            }
          },
          pembayaran: true
        },
        orderBy: {
          waktu_pesan: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.pesanan.count({
        where: {
          mitra_id: sellerId
        }
      })
    ]);

    return {
      orders,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  },

  /**
   * Mengambil detail satu pesanan
   */
  async getOrderById(orderId: number, sellerId: number) {
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true,
            delivery_address: true
          }
        },
        detail_pesanan_produk: {
          include: {
            produk: true
          }
        },
        detail_pesanan_layanan: {
          include: {
            layanan: true
          }
        },
        pembayaran: true,
        ulasan: true
      }
    });

    return order;
  },

  /**
   * Filter pesanan berdasarkan status
   */
  async getOrdersByStatus(sellerId: number, status: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.pesanan.findMany({
        where: {
          mitra_id: sellerId,
          status_pesanan: status
        },
        include: {
          pembeli: {
            select: {
              user_id: true,
              full_name: true,
              phone_number: true
            }
          },
          detail_pesanan_produk: {
            include: {
              produk: true
            }
          },
          detail_pesanan_layanan: {
            include: {
              layanan: true
            }
          },
          pembayaran: true
        },
        orderBy: {
          waktu_pesan: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.pesanan.count({
        where: {
          mitra_id: sellerId,
          status_pesanan: status
        }
      })
    ]);

    return {
      orders,
      status,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  },

  /**
   * Menerima pesanan
   */
  async acceptOrder(orderId: number, sellerId: number) {
    // Cek status pesanan saat ini
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId,
        status_pesanan: 'pending'
      }
    });

    if (!order) {
      return null;
    }

    // Update status pesanan
    const updatedOrder = await prisma.pesanan.update({
      where: {
        pesanan_id: orderId
      },
      data: {
        status_pesanan: 'accepted'
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true
          }
        }
      }
    });

    // Buat notifikasi untuk pembeli
    if (updatedOrder.user_id) {
      await prisma.notifikasi.create({
        data: {
          user_id: updatedOrder.user_id,
          isi_pesan: `Pesanan #${orderId} telah diterima oleh penjual.`,
          waktu_kirim: new Date(),
          tipe: 'order_accepted',
          status_dibaca: false
        }
      });
    }

    return updatedOrder;
  },

  /**
   * Menolak pesanan
   */
  async rejectOrder(orderId: number, sellerId: number, reason: string) {
    // Cek status pesanan saat ini
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId,
        status_pesanan: 'pending'
      }
    });

    if (!order) {
      return null;
    }

    // Update status pesanan
    const updatedOrder = await prisma.pesanan.update({
      where: {
        pesanan_id: orderId
      },
      data: {
        status_pesanan: 'rejected'
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true
          }
        }
      }
    });

    // Buat notifikasi untuk pembeli
    if (updatedOrder.user_id) {
      await prisma.notifikasi.create({
        data: {
          user_id: updatedOrder.user_id,
          isi_pesan: `Pesanan #${orderId} ditolak oleh penjual. Alasan: ${reason}`,
          waktu_kirim: new Date(),
          tipe: 'order_rejected',
          status_dibaca: false
        }
      });
    }

    return updatedOrder;
  },

  /**
   * Update status pesanan menjadi sedang diproses
   */
  async processOrder(orderId: number, sellerId: number) {
    // Cek status pesanan saat ini
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId,
        status_pesanan: 'accepted'
      }
    });

    if (!order) {
      return null;
    }

    // Update status pesanan
    const updatedOrder = await prisma.pesanan.update({
      where: {
        pesanan_id: orderId
      },
      data: {
        status_pesanan: 'processing'
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true
          }
        }
      }
    });

    // Buat notifikasi untuk pembeli
    if (updatedOrder.user_id) {
      await prisma.notifikasi.create({
        data: {
          user_id: updatedOrder.user_id,
          isi_pesan: `Pesanan #${orderId} sedang diproses.`,
          waktu_kirim: new Date(),
          tipe: 'order_processing',
          status_dibaca: false
        }
      });
    }

    return updatedOrder;
  },

  /**
   * Update status pesanan menjadi dikirim
   */
  async deliverOrder(orderId: number, sellerId: number, note?: string) {
    // Cek status pesanan saat ini
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        mitra_id: sellerId,
        status_pesanan: 'processing'
      }
    });

    if (!order) {
      return null;
    }

    // Update status pesanan
    const updatedOrder = await prisma.pesanan.update({
      where: {
        pesanan_id: orderId
      },
      data: {
        status_pesanan: 'delivered',
        waktu_dikirim: new Date()
      },
      include: {
        pembeli: {
          select: {
            user_id: true,
            full_name: true,
            phone_number: true
          }
        }
      }
    });

    // Buat notifikasi untuk pembeli
    if (updatedOrder.user_id) {
      await prisma.notifikasi.create({
        data: {
          user_id: updatedOrder.user_id,
          isi_pesan: `Pesanan #${orderId} sedang dikirim${note ? `. Catatan: ${note}` : '.'}`,
          waktu_kirim: new Date(),
          tipe: 'order_delivered',
          status_dibaca: false
        }
      });
    }

    return updatedOrder;
  },

  /**
   * Mendapatkan ringkasan statistik pesanan dan pendapatan toko
   */
  async getOrderSummary(sellerId: number) {
    // Hitung total pendapatan
    const revenue = await prisma.pesanan.aggregate({
      where: {
        mitra_id: sellerId,
        status_pesanan: {
          in: ['completed', 'delivered']
        }
      },
      _sum: {
        total_harga: true
      }
    });

    // Hitung jumlah pesanan per status
    const ordersByStatus = await prisma.pesanan.groupBy({
      by: ['status_pesanan'],
      where: {
        mitra_id: sellerId
      },
      _count: {
        pesanan_id: true
      }
    });

    // Format ordersByStatus menjadi objek yang lebih mudah dibaca
    const orderCounts = {
      pending: 0,
      accepted: 0,
      processing: 0,
      delivered: 0,
      completed: 0,
      rejected: 0,
      canceled: 0
    };

    ordersByStatus.forEach(item => {
      if (item.status_pesanan) {
        orderCounts[item.status_pesanan as keyof typeof orderCounts] = item._count.pesanan_id;
      }
    });

    // Ambil 5 pesanan terbaru
    const recentOrders = await prisma.pesanan.findMany({
      where: {
        mitra_id: sellerId
      },
      include: {
        pembeli: {
          select: {
            full_name: true
          }
        }
      },
      orderBy: {
        waktu_pesan: 'desc'
      },
      take: 5
    });

    // Pendapatan per hari dalam seminggu terakhir
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
      dailyRevenue
    };
  }
};
