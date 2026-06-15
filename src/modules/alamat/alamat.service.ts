import { prisma } from "../../config/prisma";
import { ForbiddenError, NotFoundError } from "../../utils/errors";
import { CreateAlamatDto, UpdateAlamatDto } from "./alamat.schema";

export const alamatService = {
  async listAlamat(userId: number) {
    return prisma.alamat.findMany({
      where: { user_id: userId },
      orderBy: [{ is_primary: "desc" }, { created_at: "asc" }],
    });
  },

  async getAlamatById(alamatId: number, userId: number) {
    const a = await prisma.alamat.findUnique({
      where: { alamat_id: alamatId },
    });
    if (!a) throw new NotFoundError("Alamat tidak ditemukan");
    if (a.user_id !== userId)
      throw new ForbiddenError("Alamat ini bukan milik Anda");
    return a;
  },

  async createAlamat(userId: number, data: CreateAlamatDto) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.alamat.count({ where: { user_id: userId } });
      const makePrimary = count === 0 || data.is_primary === true;
      if (makePrimary) {
        await tx.alamat.updateMany({
          where: { user_id: userId },
          data: { is_primary: false },
        });
      }
      return tx.alamat.create({
        data: {
          user_id: userId,
          label: data.label,
          alamat_lengkap: data.alamat_lengkap,
          catatan: data.catatan ?? null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          is_primary: makePrimary,
        },
      });
    });
  },

  async updateAlamat(alamatId: number, userId: number, data: UpdateAlamatDto) {
    await this.getAlamatById(alamatId, userId);
    return prisma.$transaction(async (tx) => {
      if (data.is_primary === true) {
        await tx.alamat.updateMany({
          where: { user_id: userId, NOT: { alamat_id: alamatId } },
          data: { is_primary: false },
        });
      }
      return tx.alamat.update({
        where: { alamat_id: alamatId },
        data: {
          label: data.label,
          alamat_lengkap: data.alamat_lengkap,
          catatan: data.catatan,
          latitude: data.latitude,
          longitude: data.longitude,
          is_primary: data.is_primary,
        },
      });
    });
  },

  async deleteAlamat(alamatId: number, userId: number) {
    const a = await this.getAlamatById(alamatId, userId);
    await prisma.$transaction(async (tx) => {
      await tx.alamat.delete({ where: { alamat_id: a.alamat_id } });
      if (a.is_primary) {
        const next = await tx.alamat.findFirst({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
        });
        if (next) {
          await tx.alamat.update({
            where: { alamat_id: next.alamat_id },
            data: { is_primary: true },
          });
        }
      }
    });
  },

  async setPrimary(alamatId: number, userId: number) {
    await this.getAlamatById(alamatId, userId);
    return prisma.$transaction(async (tx) => {
      await tx.alamat.updateMany({
        where: { user_id: userId },
        data: { is_primary: false },
      });
      return tx.alamat.update({
        where: { alamat_id: alamatId },
        data: { is_primary: true },
      });
    });
  },
};
