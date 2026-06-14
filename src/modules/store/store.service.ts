import { prisma } from "../../config/prisma";
import { Prisma } from "@prisma/client";
import { STORE_STATUS, SELLER_VERIFICATION } from "../../config/constants";
import { NotFoundError } from "../../utils/errors";

export const APPROVED_OPEN_FILTER = {
  status_toko: STORE_STATUS.OPEN,
  status_verifikasi: SELLER_VERIFICATION.APPROVED,
} as const;

const STORE_PUBLIC_SELECT = {
  mitra_id: true,
  nama_toko: true,
  alamat_toko: true,
  jenis_usaha: true,
  deskripsi_toko: true,
  jam_oprasional: true,
  status_toko: true,
  status_verifikasi: true,
} as const;

const STORE_PUBLIC_SELECT_WITH_VERIF = {
  ...STORE_PUBLIC_SELECT,
} as const;

export const storeService = {
  async getAllStores(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [stores, totalCount] = await Promise.all([
      prisma.penjual.findMany({
        where: APPROVED_OPEN_FILTER,
        orderBy: {
          mitra_id: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.penjual.count({ where: APPROVED_OPEN_FILTER }),
    ]);

    return {
      stores,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    };
  },

  async getStoreById(id: number) {
    const store = await prisma.penjual.findFirst({
      where: {
        mitra_id: id,
        ...APPROVED_OPEN_FILTER,
      },
      select: {
        mitra_id: true,
        nama_toko: true,
        alamat_toko: true,
        jenis_usaha: true,
        deskripsi_toko: true,
        jam_oprasional: true,
        status_toko: true,
        waktu_dibuat: true,
      },
    });

    if (!store) return null;

    const [productCount, orderCount, ratings] = await Promise.all([
      prisma.produk.count({
        where: { mitra_id: id, status_ketersediaan: true },
      }),
      prisma.pesanan.count({ where: { mitra_id: id } }),
      prisma.ulasan.findMany({
        where: { pesanan: { mitra_id: id } },
        select: { rating: true },
      }),
    ]);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, item) => sum + (item.rating || 0), 0) /
          ratings.length
        : 0;

    return {
      ...store,
      productCount,
      orderCount,
      ratingCount: ratings.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
    };
  },

  async searchStores(keyword: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: Prisma.penjualWhereInput = {
      ...APPROVED_OPEN_FILTER,
      OR: [
        { nama_toko: { contains: keyword } },
        { deskripsi_toko: { contains: keyword } },
      ],
    };

    const [stores, totalCount] = await Promise.all([
      prisma.penjual.findMany({
        where,
        select: STORE_PUBLIC_SELECT,
        orderBy: { mitra_id: "desc" },
        skip,
        take: limit,
      }),
      prisma.penjual.count({ where }),
    ]);

    return {
      stores,
      keyword,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },

  async getStoresByCategory(
    kategoriParam: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const jenisUsahaMap: Record<string, string> = {
      "makanan-minuman": "makanan",
      "air-galon": "air_galon",
      laundry: "laundry",
    };
    const jenisUsaha = jenisUsahaMap[kategoriParam] ?? kategoriParam;

    const where: Prisma.penjualWhereInput = {
      jenis_usaha: jenisUsaha,
      ...APPROVED_OPEN_FILTER,
    };

    const [stores, totalCount] = await Promise.all([
      prisma.penjual.findMany({
        where,
        select: STORE_PUBLIC_SELECT,
        orderBy: { mitra_id: "desc" },
        skip,
        take: limit,
      }),
      prisma.penjual.count({ where }),
    ]);

    return {
      stores,
      kategori: kategoriParam,
      jenisUsaha,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },

  async getPopularStores(limit: number = 10) {
    const stores = await prisma.penjual.findMany({
      where: APPROVED_OPEN_FILTER,
      include: { pesanan: true },
      orderBy: {
        pesanan: { _count: "desc" },
      },
      take: limit,
    });

    return Promise.all(
      stores.map(async (store) => {
        const { pesanan, ...storeData } = store;
        const ratings = await prisma.ulasan.findMany({
          where: { pesanan: { mitra_id: store.mitra_id } },
          select: { rating: true },
        });
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, item) => sum + (item.rating || 0), 0) /
              ratings.length
            : 0;
        return {
          ...storeData,
          orderCount: pesanan.length,
          ratingCount: ratings.length,
          averageRating: parseFloat(averageRating.toFixed(1)),
        };
      }),
    );
  },

  async getStoreRecommendations(userId?: number, limit: number = 10) {
    if (userId) {
      const userOrders = await prisma.pesanan.findMany({
        where: { user_id: userId },
        select: { mitra_id: true },
        orderBy: { waktu_pesan: "desc" },
        take: 5,
      });

      const storeIds = userOrders
        .map((o) => o.mitra_id)
        .filter((id): id is number => typeof id === "number");

      if (storeIds.length > 0) {
        const storeTypes = await prisma.penjual.findMany({
          where: { mitra_id: { in: storeIds } },
          select: { jenis_usaha: true },
        });
        const businessTypes = storeTypes
          .map((s) => s.jenis_usaha)
          .filter((t): t is string => typeof t === "string");

        if (businessTypes.length > 0) {
          const recommended = await prisma.penjual.findMany({
            where: {
              ...APPROVED_OPEN_FILTER,
              jenis_usaha: { in: businessTypes },
              mitra_id: { notIn: storeIds },
            },
            select: STORE_PUBLIC_SELECT,
            take: limit,
          });
          if (recommended.length > 0) return recommended;
        }
      }
    }

    return prisma.penjual.findMany({
      where: APPROVED_OPEN_FILTER,
      select: STORE_PUBLIC_SELECT,
      orderBy: { mitra_id: "desc" },
      take: limit,
    });
  },

  async getStoreProducts(
    storeId: number,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const store = await prisma.penjual.findFirst({
      where: {
        mitra_id: storeId,
        ...APPROVED_OPEN_FILTER,
      },
      select: {
        mitra_id: true,
        nama_toko: true,
        jenis_usaha: true,
      },
    });

    if (!store) {
      throw new NotFoundError("Toko tidak ditemukan atau belum buka");
    }

    const where = {
      mitra_id: storeId,
      status_ketersediaan: true,
      stok_produk: { gt: 0 },
    };

    const [products, totalCount] = await Promise.all([
      prisma.produk.findMany({
        where,
        include: { kategori: true },
        orderBy: { produk_id: "desc" },
        skip,
        take: limit,
      }),
      prisma.produk.count({ where }),
    ]);

    return {
      store,
      products,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },
};
