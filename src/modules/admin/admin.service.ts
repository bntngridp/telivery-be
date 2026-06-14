import { prisma } from "../../config/prisma";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { SELLER_VERIFICATION, STORE_STATUS } from "../../config/constants";

export const adminService = {
  async listPendingStores(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { status_verifikasi: SELLER_VERIFICATION.PENDING };

    const [stores, totalCount] = await Promise.all([
      prisma.penjual.findMany({
        where,
        orderBy: { mitra_id: "asc" },
        skip,
        take: limit,
      }),
      prisma.penjual.count({ where }),
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

  async approveStore(storeId: number) {
    const store = await prisma.penjual.findUnique({
      where: { mitra_id: storeId },
      select: { mitra_id: true, nama_toko: true, status_verifikasi: true },
    });
    if (!store) throw new NotFoundError("Toko tidak ditemukan");
    if (store.status_verifikasi === SELLER_VERIFICATION.APPROVED) {
      throw new ConflictError("Toko sudah disetujui");
    }

    const updated = await prisma.penjual.update({
      where: { mitra_id: storeId },
      data: {
        status_verifikasi: SELLER_VERIFICATION.APPROVED,
        verifikasi_toko: true,
        status_toko: STORE_STATUS.OPEN,
      },
    });

    await prisma.notifikasi.create({
      data: {
        mitra_id: storeId,
        isi_pesan: `Selamat! Toko "${store.nama_toko}" telah disetujui. Silakan mulai jualan.`,
        waktu_kirim: new Date(),
        tipe: "store_approved",
        status_dibaca: false,
      },
    });

    return updated;
  },

  async rejectStore(storeId: number, alasan: string) {
    const store = await prisma.penjual.findUnique({
      where: { mitra_id: storeId },
      select: { mitra_id: true, nama_toko: true, status_verifikasi: true },
    });
    if (!store) throw new NotFoundError("Toko tidak ditemukan");
    if (store.status_verifikasi === SELLER_VERIFICATION.REJECTED) {
      throw new ConflictError("Toko sudah ditolak sebelumnya");
    }

    const updated = await prisma.penjual.update({
      where: { mitra_id: storeId },
      data: {
        status_verifikasi: SELLER_VERIFICATION.REJECTED,
        verifikasi_toko: false,
        status_toko: STORE_STATUS.CLOSED,
      },
    });

    await prisma.notifikasi.create({
      data: {
        mitra_id: storeId,
        isi_pesan: `Maaf, toko "${store.nama_toko}" ditolak. Alasan: ${alasan}`,
        waktu_kirim: new Date(),
        tipe: "store_rejected",
        status_dibaca: false,
      },
    });

    return updated;
  },
};
