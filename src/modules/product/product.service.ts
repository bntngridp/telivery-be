import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { UPLOAD_PATHS, CATEGORY_DB_VALUES } from "../../config/constants";
import { NotFoundError, BadRequestError } from "../../utils/errors";
import { deleteFileIfExists, sanitizeFileName } from "../../utils/helpers";

export interface CreateProductInput {
  nama: string;
  harga: number;
  stok: number;
  pathGambar: string;
  penjualId: number;
  id_kategori: number;
}

export interface UpdateProductInput {
  nama?: string;
  deskripsi?: string;
  harga?: number;
  stok?: number;
  kategori?: (typeof CATEGORY_DB_VALUES)[number];
  pathGambar?: string;
}

const PRODUK_INCLUDE = { kategori: true } as const;

export const productService = {
  async create(input: CreateProductInput) {
    return prisma.produk.create({
      data: {
        nama_produk: input.nama,
        harga: input.harga.toString(),
        stok_produk: input.stok,
        foto: input.pathGambar,
        mitra_id: input.penjualId,
        id_kategori: input.id_kategori,
        status_ketersediaan: true,
      },
      include: PRODUK_INCLUDE,
    });
  },

  async findOwnedById(productId: number, sellerId: number) {
    return prisma.produk.findFirst({
      where: { produk_id: productId, mitra_id: sellerId },
      include: PRODUK_INCLUDE,
    });
  },

  async findByIdForBuyer(productId: number) {
    return prisma.produk.findFirst({
      where: { produk_id: productId, status_ketersediaan: true },
      include: {
        kategori: true,
        penjual: {
          select: {
            nama_toko: true,
            alamat_toko: true,
            status_toko: true,
            jenis_usaha: true,
          },
        },
      },
    });
  },

  async listBySeller(sellerId: number) {
    return prisma.produk.findMany({
      where: { mitra_id: sellerId },
      include: PRODUK_INCLUDE,
    });
  },

  async listBySellerAndCategory(sellerId: number, kategoriDb: string) {
    const kategoriRecord = await prisma.kategori.findFirst({
      where: { nama_kategori: kategoriDb },
    });
    if (!kategoriRecord) throw new BadRequestError("Kategori tidak ditemukan");
    return prisma.produk.findMany({
      where: { mitra_id: sellerId, id_kategori: kategoriRecord.id_kategori },
      include: PRODUK_INCLUDE,
    });
  },

  async listForBuyer() {
    return prisma.produk.findMany({
      where: { status_ketersediaan: true, stok_produk: { gt: 0 } },
      include: {
        kategori: true,
        penjual: {
          select: { nama_toko: true, alamat_toko: true, status_toko: true },
        },
      },
      orderBy: { produk_id: "desc" },
    });
  },

  async listForBuyerByCategory(kategoriDb: string) {
    const kategoriRecord = await prisma.kategori.findFirst({
      where: { nama_kategori: kategoriDb },
    });
    if (!kategoriRecord) throw new BadRequestError("Kategori tidak ditemukan");
    return prisma.produk.findMany({
      where: {
        id_kategori: kategoriRecord.id_kategori,
        status_ketersediaan: true,
        stok_produk: { gt: 0 },
      },
      include: {
        kategori: true,
        penjual: {
          select: { nama_toko: true, alamat_toko: true, status_toko: true },
        },
      },
      orderBy: { produk_id: "desc" },
    });
  },

  async searchForBuyer(keyword: string) {
    return prisma.produk.findMany({
      where: {
        nama_produk: { contains: keyword },
        status_ketersediaan: true,
        stok_produk: { gt: 0 },
      },
      include: {
        kategori: true,
        penjual: { select: { nama_toko: true, alamat_toko: true } },
      },
      orderBy: { produk_id: "desc" },
    });
  },

  async listPopular(limit = 10) {
    const products = await prisma.produk.findMany({
      where: { status_ketersediaan: true, stok_produk: { gt: 0 } },
      include: {
        kategori: true,
        penjual: { select: { nama_toko: true, alamat_toko: true } },
        detail_pesanan_produk: true,
      },
      orderBy: { detail_pesanan_produk: { _count: "desc" } },
      take: limit,
    });
    return products.map(({ detail_pesanan_produk, ...rest }) => ({
      ...rest,
      orderCount: detail_pesanan_produk.length,
    }));
  },

  async listRecommendations(userId: number | undefined, limit = 10) {
    if (userId) {
      const userOrders = await prisma.pesanan.findMany({
        where: { user_id: userId },
        include: {
          detail_pesanan_produk: {
            include: { produk: { include: { kategori: true } } },
          },
        },
        orderBy: { waktu_pesan: "desc" },
        take: 5,
      });

      const orderedCategoryIds = userOrders
        .flatMap((o) => o.detail_pesanan_produk)
        .map((d) => d.produk?.id_kategori)
        .filter((id): id is number => typeof id === "number");

      if (orderedCategoryIds.length > 0) {
        return prisma.produk.findMany({
          where: {
            id_kategori: { in: orderedCategoryIds },
            status_ketersediaan: true,
            stok_produk: { gt: 0 },
          },
          include: {
            kategori: true,
            penjual: { select: { nama_toko: true, alamat_toko: true } },
          },
          orderBy: { produk_id: "desc" },
          take: limit,
        });
      }
    }

    return prisma.produk.findMany({
      where: { status_ketersediaan: true, stok_produk: { gt: 0 } },
      include: {
        kategori: true,
        penjual: { select: { nama_toko: true, alamat_toko: true } },
      },
      orderBy: { produk_id: "desc" },
      take: limit,
    });
  },

  async update(productId: number, sellerId: number, input: UpdateProductInput) {
    const existing = await this.findOwnedById(productId, sellerId);
    if (!existing) throw new NotFoundError("Produk tidak ditemukan");

    let id_kategori = existing.id_kategori;
    if (input.kategori) {
      const rec = await prisma.kategori.findFirst({
        where: { nama_kategori: input.kategori },
      });
      if (!rec) throw new BadRequestError("Kategori tidak ditemukan");
      id_kategori = rec.id_kategori;
    }

    const foto = input.pathGambar ?? existing.foto;
    if (
      input.pathGambar &&
      existing.foto &&
      input.pathGambar !== existing.foto
    ) {
      deleteFileIfExists(existing.foto);
    }

    const data: Prisma.produkUpdateInput = {
      foto,
    };
    if (id_kategori !== existing.id_kategori) {
      (data as Record<string, unknown>).id_kategori = id_kategori;
    }
    if (input.nama !== undefined) data.nama_produk = input.nama;
    if (input.harga !== undefined) data.harga = input.harga.toString();
    if (input.stok !== undefined) data.stok_produk = input.stok;

    return prisma.produk.update({
      where: { produk_id: productId },
      data,
      include: PRODUK_INCLUDE,
    });
  },

  async updateStock(productId: number, sellerId: number, stok: number) {
    const existing = await this.findOwnedById(productId, sellerId);
    if (!existing) throw new NotFoundError("Produk tidak ditemukan");
    return prisma.produk.update({
      where: { produk_id: productId },
      data: { stok_produk: stok },
      include: PRODUK_INCLUDE,
    });
  },

  async delete(productId: number, sellerId: number) {
    const existing = await this.findOwnedById(productId, sellerId);
    if (!existing) throw new NotFoundError("Produk tidak ditemukan");
    deleteFileIfExists(existing.foto);
    await prisma.produk.delete({ where: { produk_id: productId } });
    return { message: "Produk berhasil dihapus" };
  },

  async deleteAll(sellerId: number) {
    const products = await prisma.produk.findMany({
      where: { mitra_id: sellerId },
    });
    for (const p of products) deleteFileIfExists(p.foto);
    const result = await prisma.produk.deleteMany({
      where: { mitra_id: sellerId },
    });
    return { message: `${result.count} produk berhasil dihapus` };
  },
};

export function buildProductImagePath(filename: string): string {
  return `${UPLOAD_PATHS.PRODUCTS}/${sanitizeFileName(filename)}`;
}
