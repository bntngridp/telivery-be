import { prisma } from "../../config/prisma";
import { BadRequestError } from "../../utils/errors";
import { CheckoutDto } from "./checkout.schema";
import { APPROVED_OPEN_FILTER } from "../store/store.service";

export const checkoutService = {
  async checkoutFromCart(userId: number, data: CheckoutDto) {
    const items = await prisma.cart.findMany({
      where: { user_id: userId },
      include: {
        produk: {
          include: {
            penjual: {
              select: {
                mitra_id: true,
                status_toko: true,
                status_verifikasi: true,
              },
            },
          },
        },
        layanan: {
          include: {
            penjual: {
              select: {
                mitra_id: true,
                status_toko: true,
                status_verifikasi: true,
              },
            },
          },
        },
      },
    });

    if (items.length === 0) {
      throw new BadRequestError("Cart kosong, tidak bisa checkout");
    }

    if (data.alamat_id) {
      const alamat = await prisma.alamat.findUnique({
        where: { alamat_id: data.alamat_id },
      });
      if (!alamat || alamat.user_id !== userId) {
        throw new BadRequestError("Alamat tidak valid atau bukan milik Anda");
      }
    }

    // Pre-validate toko + stock
    for (const it of items) {
      const seller = it.produk?.penjual ?? it.layanan?.penjual;
      if (!seller) {
        throw new BadRequestError("Item cart tidak valid");
      }
      if (
        seller.status_verifikasi !== APPROVED_OPEN_FILTER.status_verifikasi ||
        seller.status_toko !== APPROVED_OPEN_FILTER.status_toko
      ) {
        throw new BadRequestError(
          `Toko ${seller.mitra_id} sudah tutup atau belum diverifikasi, hapus dari cart dulu`,
        );
      }
      if (
        it.produk &&
        it.produk.stok_produk !== null &&
        it.produk.stok_produk < it.jumlah
      ) {
        throw new BadRequestError(
          `Stok produk "${it.produk.nama_produk}" tidak cukup (sisa: ${it.produk.stok_produk})`,
        );
      }
    }

    // Group by store
    const byStore: Record<number, typeof items> = {};
    for (const it of items) {
      const seller = it.produk?.penjual ?? it.layanan?.penjual;
      if (!seller) continue;
      const storeId = seller.mitra_id;
      if (!byStore[storeId]) byStore[storeId] = [];
      byStore[storeId].push(it);
    }

    const createdOrders: Array<{
      pesanan_id: number;
      mitra_id: number;
      subtotal: number;
      ongkir: number;
      total: number;
    }> = [];

    await prisma.$transaction(async (tx) => {
      for (const [storeIdStr, storeItems] of Object.entries(byStore)) {
        const storeId = Number(storeIdStr);
        let subtotal = 0;
        for (const it of storeItems) {
          const price = it.produk?.harga ?? it.layanan?.harga;
          if (price) subtotal += Number(price) * it.jumlah;
        }
        const total = subtotal + (data.ongkir ?? 0);

        const order = await tx.pesanan.create({
          data: {
            user_id: userId,
            mitra_id: storeId,
            total_harga: total,
            ongkir: data.ongkir ?? 0,
            alamat_pengiriman: data.alamat_pengiriman,
            alamat_id: data.alamat_id ?? null,
            status_pesanan: "pending",
            metode_pembayaran: data.metode_pembayaran,
            waktu_pesan: new Date(),
          },
        });

        for (const it of storeItems) {
          const price = it.produk?.harga ?? it.layanan?.harga;
          const subtotal = price ? Number(price) * it.jumlah : 0;

          if (it.produk) {
            await tx.detail_pesanan_produk.create({
              data: {
                pesanan_id: order.pesanan_id,
                produk_id: it.produk_id!,
                jumlah_item: it.jumlah,
                subtotal,
              },
            });
            await tx.produk.update({
              where: { produk_id: it.produk_id! },
              data: { stok_produk: { decrement: it.jumlah } },
            });
          } else if (it.layanan) {
            await tx.detail_pesanan_layanan.create({
              data: {
                pesanan_id: order.pesanan_id,
                layanan_id: it.layanan_id!,
                jumlah_item: it.jumlah,
                subtotal,
              },
            });
          }
        }

        await tx.pembayaran.create({
          data: {
            pesanan_id: order.pesanan_id,
            status_pembayaran: "pending",
            metode_pembayaran: data.metode_pembayaran,
          },
        });

        const itemSummary = storeItems
          .map((i) =>
            i.produk
              ? `${i.produk.nama_produk || "produk"} x${i.jumlah}`
              : `${i.layanan?.nama_layanan || "layanan"} x${i.jumlah}`,
          )
          .join(", ");

        await tx.notifikasi.create({
          data: {
            mitra_id: storeId,
            isi_pesan: `Pesanan baru #${order.pesanan_id} dari cart checkout: ${itemSummary}${
              data.catatan ? `. Catatan: ${data.catatan}` : ""
            }`,
            waktu_kirim: new Date(),
            tipe: "new_order",
            status_dibaca: false,
          },
        });

        createdOrders.push({
          pesanan_id: order.pesanan_id,
          mitra_id: storeId,
          subtotal,
          ongkir: data.ongkir ?? 0,
          total,
        });
      }

      // Clear cart
      await tx.cart.deleteMany({ where: { user_id: userId } });
    });

    return createdOrders;
  },
};
