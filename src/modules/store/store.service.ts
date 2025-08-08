import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const storeService = {
  async getAllStores(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [stores, totalCount] = await Promise.all([
      prisma.penjual.findMany({
        where: {
          // Menghapus filter ketat untuk mengambil semua toko
          // status_toko: 'OPEN',
          // status_verifikasi: 'approved'
        },
        select: {
          mitra_id: true,
          nama_toko: true,
          alamat_toko: true,
          jenis_usaha: true,
          deskripsi_toko: true,
          jam_oprasional: true,
          status_toko: true,
          status_verifikasi: true,
        },
        orderBy: {
          mitra_id: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.penjual.count({
        where: {
          // Menghapus filter ketat untuk menghitung semua toko
          // status_toko: 'OPEN',
          // status_verifikasi: 'approved'
        }
      })
    ]);

    return {
      stores,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  },
  async getStoreById(id: number) {
    const store = await prisma.penjual.findFirst({
      where: {
        mitra_id: id,
        status_toko: 'OPEN',
        status_verifikasi: 'approved'
      },
      select: {
        mitra_id: true,
        nama_toko: true,
        alamat_toko: true,
        jenis_usaha: true,
        deskripsi_toko: true,
        jam_oprasional: true,
        status_toko: true,
        waktu_dibuat: true
      }
    });

    if (!store) return null;

    const productCount = await prisma.produk.count({
      where: {
        mitra_id: id,
        status_ketersediaan: true
      }
    });

    const orderCount = await prisma.pesanan.count({
      where: {
        mitra_id: id
      }
    });

    const ratings = await prisma.ulasan.findMany({
      where: {
        pesanan: {
          mitra_id: id
        }
      },
      select: {
        rating: true
      }
    });

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, item) => sum + (item.rating || 0), 0) / ratings.length
      : 0;

    return {
      ...store,
      productCount,
      orderCount,
      ratingCount: ratings.length,
      averageRating: parseFloat(averageRating.toFixed(1))
    };
  },

  async searchStores(keyword: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [stores, totalCount] = await Promise.all([
      prisma.penjual.findMany({
        where: {
          AND: {
            status_toko: 'OPEN',
            status_verifikasi: 'approved'
          },
          OR: [
            {
              nama_toko: {
                contains: keyword
              }
            },
            {
              deskripsi_toko: {
                contains: keyword
              }
            }
          ]
        },
        select: {
          mitra_id: true,
          nama_toko: true,
          alamat_toko: true,
          jenis_usaha: true,
          deskripsi_toko: true,
          status_toko: true,
        },
        orderBy: {
          mitra_id: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.penjual.count({
        where: {
          AND: {
            status_toko: 'OPEN',
            status_verifikasi: 'approved'
          },
          OR: [
            {
              nama_toko: {
                contains: keyword
              }
            },
            {
              deskripsi_toko: {
                contains: keyword
              }
            }
          ]
        }
      })
    ]);

    return {
      stores,
      keyword,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  },

  async getStoresByCategory(kategoriParam: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    let jenisUsaha: string;
    switch(kategoriParam) {
      case 'makanan-minuman':
        jenisUsaha = 'makanan';
        break;
      case 'air-galon':
        jenisUsaha = 'air_galon';
        break;
      case 'laundry':
        jenisUsaha = 'laundry';
        break;
      default:
        jenisUsaha = kategoriParam;
    }

    const [stores, totalCount] = await Promise.all([
      prisma.penjual.findMany({
        where: {
          jenis_usaha: jenisUsaha,
          status_toko: 'OPEN',
          status_verifikasi: 'approved'
        },
        select: {
          mitra_id: true,
          nama_toko: true,
          alamat_toko: true,
          jenis_usaha: true,
          deskripsi_toko: true,
          status_toko: true,
        },
        orderBy: {
          mitra_id: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.penjual.count({
        where: {
          jenis_usaha: jenisUsaha,
          status_toko: 'OPEN',
          status_verifikasi: 'approved'
        }
      })
    ]);

    return {
      stores,
      kategori: kategoriParam,
      jenisUsaha,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  },

  async getPopularStores(limit: number = 10) {
    // Get stores with most orders
    const stores = await prisma.penjual.findMany({
      where: {
        status_toko: 'OPEN',
        status_verifikasi: 'approved'
      },
      include: {
        pesanan: true
      },
      orderBy: {
        pesanan: {
          _count: 'desc'
        }
      },
      take: limit
    });

    // Reformat results to count orders and add rating
    const formattedStores = await Promise.all(stores.map(async (store) => {
      const { pesanan, ...storeData } = store;

      // Get ratings for this store
      const ratings = await prisma.ulasan.findMany({
        where: {
          pesanan: {
            mitra_id: store.mitra_id
          }
        },
        select: {
          rating: true
        }
      });

      const averageRating = ratings.length > 0
        ? ratings.reduce((sum, item) => sum + (item.rating || 0), 0) / ratings.length
        : 0;

      return {
        ...storeData,
        orderCount: pesanan.length,
        ratingCount: ratings.length,
        averageRating: parseFloat(averageRating.toFixed(1))
      };
    }));

    return formattedStores;
  },

  async getStoreRecommendations(userId?: number, limit: number = 10) {
    // Definisikan tipe untuk recommendedStores
    let recommendedStores: {
      mitra_id: number;
      nama_toko: string | null;
      alamat_toko: string | null;
      jenis_usaha: string | null;
      deskripsi_toko: string | null;
      status_toko: string | null;
    }[] = [];

    if (userId) {
      const userOrders = await prisma.pesanan.findMany({
        where: {
          user_id: userId
        },
        select: {
          mitra_id: true
        },
        orderBy: {
          waktu_pesan: 'desc'
        },
        take: 5
      });

      const storeIds = userOrders.map(order => order.mitra_id).filter(Boolean) as number[];

      if (storeIds.length > 0) {
        // Get the business types from stores the user has ordered from
        const storeTypes = await prisma.penjual.findMany({
          where: {
            mitra_id: {
              in: storeIds
            }
          },
          select: {
            jenis_usaha: true
          }
        });

        const businessTypes = storeTypes
          .map(store => store.jenis_usaha)
          .filter(Boolean) as string[];

        if (businessTypes.length > 0) {
          recommendedStores = await prisma.penjual.findMany({
            where: {
              status_toko: 'OPEN',
              status_verifikasi: 'approved',
              jenis_usaha: {
                in: businessTypes
              },
              mitra_id: {
                notIn: storeIds
              }
            },
            select: {
              mitra_id: true,
              nama_toko: true,
              alamat_toko: true,
              jenis_usaha: true,
              deskripsi_toko: true,
              status_toko: true
            },
            take: limit
          });
        }
      }
    }

    if (recommendedStores.length === 0) {
      // Ambil semua toko dengan orderBy mitra_id sebagai fallback
      // Menghindari penggunaan pesanan._count yang mungkin tidak didukung
      recommendedStores = await prisma.penjual.findMany({
        where: {
          status_toko: 'OPEN',
          status_verifikasi: 'approved'
        },
        select: {
          mitra_id: true,
          nama_toko: true,
          alamat_toko: true,
          jenis_usaha: true,
          deskripsi_toko: true,
          status_toko: true
        },
        orderBy: {
          mitra_id: 'desc' // Menggunakan mitra_id sebagai pengganti pesanan._count
        },
        take: limit
      });
    }

    return recommendedStores;
  },

  async getStoreProducts(storeId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const store = await prisma.penjual.findFirst({
      where: {
        mitra_id: storeId,
        status_toko: 'OPEN',
        status_verifikasi: 'approved'
      },
      select: {
        mitra_id: true,
        nama_toko: true,
        jenis_usaha: true
      }
    });

    if (!store) return null;

    const [products, totalCount] = await Promise.all([
      prisma.produk.findMany({
        where: {
          mitra_id: storeId,
          status_ketersediaan: true,
          stok_produk: {
            gt: 0
          }
        },
        include: {
          kategori: true
        },
        orderBy: {
          produk_id: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.produk.count({
        where: {
          mitra_id: storeId,
          status_ketersediaan: true,
          stok_produk: {
            gt: 0
          }
        }
      })
    ]);

    return {
      store,
      products,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }
};
