import { prisma } from "../../config/prisma";
import { NotFoundError, ConflictError } from "../../utils/errors";
import { UpdateProfileDto } from "./buyer.schema";

const PUBLIC_FIELDS = {
  user_id: true,
  email: true,
  phone_number: true,
  full_name: true,
  birth_date: true,
  domicile: true,
  faculty: true,
  major: true,
  delivery_address: true,
} as const;

export const buyerProfileService = {
  async getProfile(userId: number) {
    const buyer = await prisma.pembeli.findUnique({
      where: { user_id: userId },
      select: PUBLIC_FIELDS,
    });
    if (!buyer) throw new NotFoundError("Profil pembeli tidak ditemukan");
    return buyer;
  },

  async updateProfile(userId: number, data: UpdateProfileDto) {
    const existing = await prisma.pembeli.findUnique({
      where: { user_id: userId },
      select: { user_id: true, phone_number: true },
    });
    if (!existing) throw new NotFoundError("Profil pembeli tidak ditemukan");

    if (data.phoneNumber && data.phoneNumber !== existing.phone_number) {
      const duplicate = await prisma.pembeli.findFirst({
        where: { phone_number: data.phoneNumber, NOT: { user_id: userId } },
        select: { user_id: true },
      });
      if (duplicate)
        throw new ConflictError("Nomor telepon sudah digunakan pembeli lain");
    }

    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.phoneNumber !== undefined)
      updateData.phone_number = data.phoneNumber;
    if (data.birthDate !== undefined)
      updateData.birth_date = new Date(data.birthDate);
    if (data.domicile !== undefined) updateData.domicile = data.domicile;
    if (data.faculty !== undefined) updateData.faculty = data.faculty;
    if (data.major !== undefined) updateData.major = data.major;
    if (data.deliveryAddress !== undefined)
      updateData.delivery_address = data.deliveryAddress;

    if (Object.keys(updateData).length === 0) {
      return this.getProfile(userId);
    }

    return prisma.pembeli.update({
      where: { user_id: userId },
      data: updateData,
      select: PUBLIC_FIELDS,
    });
  },
};
