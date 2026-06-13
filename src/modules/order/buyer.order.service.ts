import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../config/constants';

export const buyerOrderService = {
  async createOrder(userId: number, data: {
    id_produk: Array<{ produk_id: number, jumlah: number }>,
    alamat_pengiriman: string,
    metode_pembayaran: string,
    catatan?: string
  }) {
    const productIds = data.id_produk.map(item => item.produk_id);

    const products = await prisma.produk.findMany({
      where: {
        produk_id: { in: productIds },
        status_ketersediaan: true,
        stok_produk: { gt: 0 }
      },
      include: {
        penjual: {
          select: {
            mitra_id: true,
            nama_toko: true
          }
        }
      }
    });

    if (products.length !== productIds.length) {
      throw new Error('Beberapa produk tidak ditemukan atau tidak tersedia');
    }

    for (const item of data.id_produk) {
      const product = products.find(p => p.produk_id === item.produk_id);
      if (!product || (product.stok_produk !== null && product.stok_produk < item.jumlah)) {
        throw new Error(`Stok tidak mencukupi untuk produk ${product?.nama_produk || item.produk_id}`);
      }
    }

    const productsByStore: { [key: number]: typeof data.id_produk } = {};
    products.forEach((product) => {
      const storeId = product.mitra_id;
      if (!storeId) return;

      if (!productsByStore[storeId]) {
        productsByStore[storeId] = [];
      }

      const orderItem = data.id_produk.find(item => item.produk_id === product.produk_id);
      if (orderItem) {
        productsByStore[storeId].push(orderItem);
      }
    });

    const orders = [];
    for (const storeId in productsByStore) {
      const storeProducts = productsByStore[storeId];
      const storeProductDetails = products.filter(p => p.mitra_id === Number(storeId));

      let totalAmount = 0;
      for (const item of storeProducts) {
        const product = storeProductDetails.find(p => p.produk_id === item.produk_id);
        if (product && product.harga) {
          totalAmount += Number(product.harga) * item.jumlah;
        }
      }
      const { catatan, ...orderData } = data;

      const newOrder = await prisma.pesanan.create({
        data: {
          user_id: userId,
          mitra_id: Number(storeId),
          total_harga: totalAmount,
          alamat_pengiriman: data.alamat_pengiriman,
          status_pesanan: ORDER_STATUS.PENDING,
          metode_pembayaran: data.metode_pembayaran,
          waktu_pesan: new Date(),
        },
        include: {
          pembeli: {
            select: {
              full_name: true,
              phone_number: true
            }
          },
          penjual: {
            select: {
              nama_toko: true
            }
          }
        }
      });

      for (const item of storeProducts) {
        const product = storeProductDetails.find(p => p.produk_id === item.produk_id);
        if (!product) continue;

        const subtotal = Number(product.harga) * item.jumlah;
        await prisma.detail_pesanan_produk.create({
          data: {
            pesanan_id: newOrder.pesanan_id,
            produk_id: item.produk_id,
            jumlah_item: item.jumlah,
            subtotal: subtotal
          }
        });

        if (product.stok_produk !== null) {
          await prisma.produk.update({
            where: { produk_id: item.produk_id },
            data: { stok_produk: product.stok_produk - item.jumlah }
          });
        }
      }

      await prisma.pembayaran.create({
        data: {
          pesanan_id: newOrder.pesanan_id,
          status_pembayaran: PAYMENT_STATUS.PENDING,
          metode_pembayaran: data.metode_pembayaran,
          waktu_pembayaran: null
        }
      });

      await prisma.notifikasi.create({
        data: {
          mitra_id: Number(storeId),
          isi_pesan: `Pesanan baru #${newOrder.pesanan_id} dari ${newOrder.pembeli?.full_name || 'Pembeli'}${catatan ? `. Catatan: ${catatan}` : ''}`,
          waktu_kirim: new Date(),
          tipe: 'new_order',
          status_dibaca: false
        }
      });

      orders.push(newOrder);
    }

    return orders;
  },

  async getBuyerOrders(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.pesanan.findMany({
        where: {
          user_id: userId
        },
        include: {
          penjual: {
            select: {
              mitra_id: true,
              nama_toko: true
            }
          },
          detail_pesanan_produk: {
            include: {
              produk: true
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
          user_id: userId
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
  async getOrderById(orderId: number, userId: number) {
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        user_id: userId
      },
      include: {
        penjual: {
          select: {
            mitra_id: true,
            nama_toko: true,
            alamat_toko: true,
            phone_number: true
          }
        },
        detail_pesanan_produk: {
          include: {
            produk: true
          }
        },
        pembayaran: true,
        ulasan: true
      }
    });

    return order;
  },

  async cancelOrder(orderId: number, userId: number, reason: string) {
    // Cek status pesanan saat ini
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        user_id: userId,
        status_pesanan: ORDER_STATUS.PENDING
      }
    });

    if (!order) {
      return null;
    }
    const updatedOrder = await prisma.pesanan.update({
      where: {
        pesanan_id: orderId
      },
      data: {
        status_pesanan: ORDER_STATUS.CANCELED
      },
      include: {
        penjual: {
          select: {
            mitra_id: true,
            nama_toko: true
          }
        }
      }
    });

    const orderDetails = await prisma.detail_pesanan_produk.findMany({
      where: {
        pesanan_id: orderId
      },
      include: {
        produk: true
      }
    });

    for (const item of orderDetails) {
      if (item.produk && item.produk.stok_produk !== null && item.jumlah_item) {
        await prisma.produk.update({
          where: { produk_id: item.produk.produk_id },
          data: { stok_produk: item.produk.stok_produk + item.jumlah_item }
        });
      }
    }

    await prisma.pembayaran.updateMany({
      where: { pesanan_id: orderId },
      data: { status_pembayaran: PAYMENT_STATUS.CANCELED }
    });

    if (updatedOrder.mitra_id) {
      await prisma.notifikasi.create({
        data: {
          mitra_id: updatedOrder.mitra_id,
          isi_pesan: `Pesanan #${orderId} dibatalkan oleh pembeli. Alasan: ${reason}`,
          waktu_kirim: new Date(),
          tipe: 'order_canceled',
          status_dibaca: false
        }
      });
    }

    return updatedOrder;
  },
  async confirmOrder(orderId: number, userId: number) {
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        user_id: userId,
        status_pesanan: ORDER_STATUS.DELIVERED
      }
    });

    if (!order) {
      return null;
    }

    const now = new Date();
    const totalHarga = new Prisma.Decimal(order.total_harga ?? 0);

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.pesanan.update({
        where: { pesanan_id: orderId },
        data: {
          status_pesanan: ORDER_STATUS.COMPLETED,
          waktu_diterima: now,
        },
        include: {
          penjual: {
            select: {
              mitra_id: true,
              nama_toko: true,
            },
          },
        },
      });

      await tx.pembayaran.updateMany({
        where: {
          pesanan_id: orderId,
          status_pembayaran: PAYMENT_STATUS.PENDING,
        },
        data: {
          status_pembayaran: PAYMENT_STATUS.PAID,
          waktu_pembayaran: now,
        },
      });

      if (updatedOrder.mitra_id && totalHarga.greaterThan(0)) {
        const existingWallet = await tx.dompet_mitra.findFirst({
          where: { mitra_id: updatedOrder.mitra_id },
        });

        let walletId: number;
        if (existingWallet) {
          walletId = existingWallet.id_dompet;
          await tx.dompet_mitra.update({
            where: { id_dompet: existingWallet.id_dompet },
            data: {
              saldo: { increment: totalHarga },
              tanggal_diubah: now,
            },
          });
        } else {
          const created = await tx.dompet_mitra.create({
            data: {
              mitra_id: updatedOrder.mitra_id,
              saldo: totalHarga,
              status_dompet: 'active',
              tanggal_dibuat: now,
              tanggal_diubah: now,
            },
          });
          walletId = created.id_dompet;
        }

        await tx.riwayat_dompet.create({
          data: {
            id_dompet: walletId,
            jenis_transaksi: 'credit',
            jumlah_diterima: totalHarga,
            deskripsi_transaksi: `Pembayaran pesanan #${orderId}`,
            waktu_transaksi: now,
          },
        });

        await tx.notifikasi.create({
          data: {
            mitra_id: updatedOrder.mitra_id,
            isi_pesan: `Pesanan #${orderId} telah diterima oleh pembeli. Saldo dompet bertambah ${totalHarga.toString()}.`,
            waktu_kirim: now,
            tipe: 'order_completed',
            status_dibaca: false,
          },
        });
      }

      return updatedOrder;
    });

    return result;
  },

  async getOrdersByStatus(userId: number, status: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.pesanan.findMany({
        where: {
          user_id: userId,
          status_pesanan: status
        },
        include: {
          penjual: {
            select: {
              mitra_id: true,
              nama_toko: true
            }
          },
          detail_pesanan_produk: {
            include: {
              produk: true
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
          user_id: userId,
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

  async trackOrder(orderId: number, userId: number) {
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        user_id: userId
      },
      select: {
        pesanan_id: true,
        status_pesanan: true,
        waktu_pesan: true,
        waktu_dikirim: true,
        waktu_diterima: true,
        penjual: {
          select: {
            nama_toko: true,
            alamat_toko: true,
            phone_number: true
          }
        }
      }
    });

    if (!order) {
      return null;
    }

    const statusHistory: Array<{ status: string; label: string; time: Date | null; completed: boolean }> = [
      {
        status: ORDER_STATUS.PENDING,
        label: 'Pesanan Dibuat',
        time: order.waktu_pesan,
        completed: true,
      },
    ];

    const currentStatus = order.status_pesanan;

    if ([ORDER_STATUS.ACCEPTED, ORDER_STATUS.PROCESSING, ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(currentStatus as never)) {
      statusHistory.push({
        status: ORDER_STATUS.ACCEPTED,
        label: 'Pesanan Diterima Penjual',
        time: null,
        completed: true,
      });
    } else {
      statusHistory.push({
        status: ORDER_STATUS.ACCEPTED,
        label: 'Pesanan Diterima Penjual',
        time: null,
        completed: false,
      });
    }

    if ([ORDER_STATUS.PROCESSING, ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(currentStatus as never)) {
      statusHistory.push({
        status: ORDER_STATUS.PROCESSING,
        label: 'Pesanan Sedang Diproses',
        time: null,
        completed: true,
      });
    } else {
      statusHistory.push({
        status: ORDER_STATUS.PROCESSING,
        label: 'Pesanan Sedang Diproses',
        time: null,
        completed: false,
      });
    }

    if ([ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED].includes(currentStatus as never)) {
      statusHistory.push({
        status: ORDER_STATUS.DELIVERED,
        label: 'Pesanan Dikirim',
        time: order.waktu_dikirim,
        completed: true,
      });
    } else {
      statusHistory.push({
        status: ORDER_STATUS.DELIVERED,
        label: 'Pesanan Dikirim',
        time: null,
        completed: false,
      });
    }

    if (currentStatus === ORDER_STATUS.COMPLETED) {
      statusHistory.push({
        status: ORDER_STATUS.COMPLETED,
        label: 'Pesanan Selesai',
        time: order.waktu_diterima,
        completed: true,
      });
    } else {
      statusHistory.push({
        status: ORDER_STATUS.COMPLETED,
        label: 'Pesanan Selesai',
        time: null,
        completed: false,
      });
    }

    return {
      order,
      statusHistory
    };
  },

  async getOrderSummary(userId: number) {
    const ordersByStatus = await prisma.pesanan.groupBy({
      by: ['status_pesanan'],
      where: {
        user_id: userId
      },
      _count: {
        pesanan_id: true
      }
    });

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

    const spending = await prisma.pesanan.aggregate({
      where: {
        user_id: userId,
        status_pesanan: {
          in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.DELIVERED]
        }
      },
      _sum: {
        total_harga: true
      }
    });

    const recentOrders = await prisma.pesanan.findMany({
      where: {
        user_id: userId
      },
      include: {
        penjual: {
          select: {
            nama_toko: true
          }
        }
      },
      orderBy: {
        waktu_pesan: 'desc'
      },
      take: 5
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySpending = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(waktu_pesan, '%Y-%m') as month, 
        SUM(total_harga) as spending
      FROM 
        pesanan
      WHERE 
        user_id = ${userId}
        AND waktu_pesan >= ${sixMonthsAgo}
        AND status_pesanan IN ('completed', 'delivered')
      GROUP BY 
        DATE_FORMAT(waktu_pesan, '%Y-%m')
      ORDER BY 
        month ASC
    `;

    return {
      totalSpending: spending._sum.total_harga || 0,
      orderCounts,
      totalOrders: Object.values(orderCounts).reduce((a, b) => a + b, 0),
      recentOrders,
      monthlySpending
    };
  },

  async reviewOrder(orderId: number, userId: number, data: { rating: number, komentar?: string }) {
    const order = await prisma.pesanan.findFirst({
      where: {
        pesanan_id: orderId,
        user_id: userId,
        status_pesanan: ORDER_STATUS.COMPLETED
      }
    });

    if (!order) {
      return null;
    }

    const existingReview = await prisma.ulasan.findFirst({
      where: {
        id_pesanan: orderId
      }
    });

    if (existingReview) {
      const updatedReview = await prisma.ulasan.update({
        where: {
          id_ulasan: existingReview.id_ulasan
        },
        data: {
          rating: data.rating,
          komentar: data.komentar,
          waktu_ulasan: new Date()
        }
      });
      return updatedReview;
    } else {
      const newReview = await prisma.ulasan.create({
        data: {
          id_pesanan: orderId,
          rating: data.rating,
          komentar: data.komentar,
          waktu_ulasan: new Date()
        }
      });

      if (order.mitra_id) {
        await prisma.notifikasi.create({
          data: {
            mitra_id: order.mitra_id,
            isi_pesan: `Pesanan #${orderId} mendapatkan ulasan baru dengan rating ${data.rating}/5.`,
            waktu_kirim: new Date(),
            tipe: 'new_review',
            status_dibaca: false
          }
        });
      }

      return newReview;
    }
  }
};
