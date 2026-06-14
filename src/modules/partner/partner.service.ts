import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { UpdateStoreProfileDto } from "./partner.schema";

const PROFILE_FIELDS = {
  mitra_id: true,
  nama_pemilik: true,
  nama_toko: true,
  email: true,
  phone_number: true,
  jenis_usaha: true,
  alamat_toko: true,
  deskripsi_toko: true,
  jam_oprasional: true,
  status_toko: true,
  status_verifikasi: true,
  verifikasi_toko: true,
  foto_ktp_pemilik: true,
  foto_pemilik: true,
  waktu_dibuat: true,
} as const;

export const partnerService = {
  async getProfile(sellerId: number) {
    const seller = await prisma.penjual.findUnique({
      where: { mitra_id: sellerId },
      select: PROFILE_FIELDS,
    });
    if (!seller) throw new NotFoundError("Profil penjual tidak ditemukan");
    return seller;
  },

  async updateProfile(sellerId: number, data: UpdateStoreProfileDto) {
    const existing = await prisma.penjual.findUnique({
      where: { mitra_id: sellerId },
      select: { mitra_id: true, nama_toko: true },
    });
    if (!existing) throw new NotFoundError("Profil penjual tidak ditemukan");

    if (data.namaToko && data.namaToko !== existing.nama_toko) {
      const duplicate = await prisma.penjual.findFirst({
        where: { nama_toko: data.namaToko, NOT: { mitra_id: sellerId } },
        select: { mitra_id: true },
      });
      if (duplicate)
        throw new ConflictError("Nama toko sudah digunakan penjual lain");
    }

    const updateData: Prisma.penjualUpdateInput = {};
    if (data.namaToko !== undefined) updateData.nama_toko = data.namaToko;
    if (data.deskripsiToko !== undefined)
      updateData.deskripsi_toko = data.deskripsiToko;
    if (data.jamOprasional !== undefined)
      updateData.jam_oprasional = data.jamOprasional;
    if (data.alamatToko !== undefined) updateData.alamat_toko = data.alamatToko;
    if (data.statusToko !== undefined) {
      updateData.status_toko = data.statusToko;
      updateData.verifikasi_toko = data.statusToko === "OPEN";
    }

    return prisma.penjual.update({
      where: { mitra_id: sellerId },
      data: updateData,
      select: PROFILE_FIELDS,
    });
  },
};
