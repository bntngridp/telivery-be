import { prisma } from "../../config/prisma";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { AddCartItemDto, UpdateCartItemDto } from "./cart.schema";
import { APPROVED_OPEN_FILTER } from "../store/store.service";

type EnrichedCartItem = {
  cart_id: number;
  user_id: number;
  produk_id: number | null;
  layanan_id: number | null;
  jumlah: number;
  created_at: Date;
  updated_at: Date;
  kind: "produk" | "layanan";
  detail: {
    nama: string | null;
    harga: number;
    stok?: number | null;
    foto?: string | null;
    toko: string | null;
    mitra_id: number;
  } | null;
  subtotal: number;
};

async function validateProdukForCart(produkId: number) {
  const produk = await prisma.produk.findFirst({
    where: {
      produk_id: produkId,
      status_ketersediaan: true,
      stok_produk: { gt: 0 },
    },
    include: {
      penjual: {
        select: { mitra_id: true, status_toko: true, status_verifikasi: true },
      },
    },
  });
  if (!produk)
    throw new BadRequestError("Produk tidak tersedia atau stok habis");
  if (!produk.penjual)
    throw new BadRequestError("Toko tidak ditemukan untuk produk ini");
  if (
    produk.penjual.status_verifikasi !==
      APPROVED_OPEN_FILTER.status_verifikasi ||
    produk.penjual.status_toko !== APPROVED_OPEN_FILTER.status_toko
  ) {
    throw new BadRequestError("Toko belum buka atau belum diverifikasi");
  }
  return produk;
}

async function validateLayananForCart(layananId: number) {
  const layanan = await prisma.layanan.findFirst({
    where: { layanan_id: layananId },
    include: {
      penjual: {
        select: { mitra_id: true, status_toko: true, status_verifikasi: true },
      },
    },
  });
  if (!layanan) throw new BadRequestError("Layanan tidak ditemukan");
  if (!layanan.penjual)
    throw new BadRequestError("Toko tidak ditemukan untuk layanan ini");
  if (
    layanan.penjual.status_verifikasi !==
      APPROVED_OPEN_FILTER.status_verifikasi ||
    layanan.penjual.status_toko !== APPROVED_OPEN_FILTER.status_toko
  ) {
    throw new BadRequestError("Toko belum buka atau belum diverifikasi");
  }
  return layanan;
}

export const cartService = {
  async addItem(userId: number, data: AddCartItemDto) {
    if (data.produkId) {
      await validateProdukForCart(data.produkId);
      const result = await prisma.cart.upsert({
        where: {
          user_id_produk_id: { user_id: userId, produk_id: data.produkId },
        },
        update: { jumlah: { increment: data.jumlah } },
        create: {
          user_id: userId,
          produk_id: data.produkId,
          jumlah: data.jumlah,
        },
      });
      return result;
    }

    if (data.layananId) {
      await validateLayananForCart(data.layananId);
      const result = await prisma.cart.upsert({
        where: {
          user_id_layanan_id: { user_id: userId, layanan_id: data.layananId },
        },
        update: { jumlah: { increment: data.jumlah } },
        create: {
          user_id: userId,
          layanan_id: data.layananId,
          jumlah: data.jumlah,
        },
      });
      return result;
    }

    throw new BadRequestError("produkId atau layananId harus diisi");
  },

  async getCart(userId: number) {
    const items = await prisma.cart.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "asc" },
    });

    const produkIds = items
      .map((i) => i.produk_id)
      .filter((id): id is number => id !== null);
    const layananIds = items
      .map((i) => i.layanan_id)
      .filter((id): id is number => id !== null);

    const [produkRows, layananRows] = await Promise.all([
      produkIds.length > 0
        ? prisma.produk.findMany({
            where: { produk_id: { in: produkIds } },
            include: {
              penjual: { select: { nama_toko: true, mitra_id: true } },
            },
          })
        : Promise.resolve([]),
      layananIds.length > 0
        ? prisma.layanan.findMany({
            where: { layanan_id: { in: layananIds } },
            include: {
              penjual: { select: { nama_toko: true, mitra_id: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const produkMap = new Map(produkRows.map((p) => [p.produk_id, p]));
    const layananMap = new Map(layananRows.map((l) => [l.layanan_id, l]));

    const enriched: EnrichedCartItem[] = items.map((item) => {
      if (item.produk_id !== null) {
        const p = produkMap.get(item.produk_id);
        return {
          ...item,
          kind: "produk",
          detail:
            p && p.penjual
              ? {
                  nama: p.nama_produk,
                  harga: Number(p.harga),
                  stok: p.stok_produk,
                  foto: p.foto,
                  toko: p.penjual.nama_toko,
                  mitra_id: p.penjual.mitra_id,
                }
              : null,
          subtotal: p ? Number(p.harga) * item.jumlah : 0,
        };
      }
      if (item.layanan_id !== null) {
        const l = layananMap.get(item.layanan_id);
        return {
          ...item,
          kind: "layanan",
          detail:
            l && l.penjual
              ? {
                  nama: l.nama_layanan,
                  harga: Number(l.harga),
                  toko: l.penjual.nama_toko,
                  mitra_id: l.penjual.mitra_id,
                }
              : null,
          subtotal: l ? Number(l.harga) * item.jumlah : 0,
        };
      }
      return {
        ...item,
        kind: "produk",
        detail: null,
        subtotal: 0,
      };
    });

    const total = enriched.reduce((sum, e) => sum + e.subtotal, 0);
    const totalItems = items.reduce((s, i) => s + i.jumlah, 0);

    const groupedByStore: Record<string, EnrichedCartItem[]> = {};
    for (const e of enriched) {
      const key = e.detail?.mitra_id ? String(e.detail.mitra_id) : "unknown";
      if (!groupedByStore[key]) groupedByStore[key] = [];
      groupedByStore[key].push(e);
    }

    return { items: enriched, total, totalItems, groupedByStore };
  },

  async updateItemQuantity(
    cartId: number,
    userId: number,
    data: UpdateCartItemDto,
  ) {
    const item = await prisma.cart.findFirst({
      where: { cart_id: cartId, user_id: userId },
    });
    if (!item) throw new NotFoundError("Item cart tidak ditemukan");
    return prisma.cart.update({
      where: { cart_id: cartId },
      data: { jumlah: data.jumlah },
    });
  },

  async removeItem(cartId: number, userId: number) {
    const item = await prisma.cart.findFirst({
      where: { cart_id: cartId, user_id: userId },
    });
    if (!item) throw new NotFoundError("Item cart tidak ditemukan");
    await prisma.cart.delete({ where: { cart_id: cartId } });
    return { message: "Item berhasil dihapus dari cart" };
  },

  async clearCart(userId: number) {
    const result = await prisma.cart.deleteMany({ where: { user_id: userId } });
    return {
      message: `${result.count} item dihapus dari cart`,
      count: result.count,
    };
  },
};
