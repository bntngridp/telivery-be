import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/errors";
import { NotificationType } from "./notification.schema";

function buyerWhere(
  userId: number,
  tipe?: NotificationType,
): Prisma.notifikasiWhereInput {
  const where: Prisma.notifikasiWhereInput = { user_id: userId };
  if (tipe) where.tipe = tipe;
  return where;
}

function sellerWhere(
  sellerId: number,
  tipe?: NotificationType,
): Prisma.notifikasiWhereInput {
  const where: Prisma.notifikasiWhereInput = { mitra_id: sellerId };
  if (tipe) where.tipe = tipe;
  return where;
}

export const notificationService = {
  async getBuyerNotifications(
    buyerId: number,
    page: number,
    limit: number,
    tipe?: NotificationType,
  ) {
    const skip = (page - 1) * limit;
    const where = buyerWhere(buyerId, tipe);

    const [notifications, totalCount] = await Promise.all([
      prisma.notifikasi.findMany({
        where,
        orderBy: { waktu_kirim: "desc" },
        skip,
        take: limit,
      }),
      prisma.notifikasi.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    };
  },

  async getSellerNotifications(
    sellerId: number,
    page: number,
    limit: number,
    tipe?: NotificationType,
  ) {
    const skip = (page - 1) * limit;
    const where = sellerWhere(sellerId, tipe);

    const [notifications, totalCount] = await Promise.all([
      prisma.notifikasi.findMany({
        where,
        orderBy: { waktu_kirim: "desc" },
        skip,
        take: limit,
      }),
      prisma.notifikasi.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    };
  },

  async markAsRead(
    notifId: number,
    userId: number,
    role: "pembeli" | "penjual",
  ) {
    const where: Prisma.notifikasiWhereInput = { notifikasi_id: notifId };
    if (role === "pembeli") where.user_id = userId;
    else where.mitra_id = userId;

    const existing = await prisma.notifikasi.findFirst({ where });
    if (!existing) return null;

    return prisma.notifikasi.update({
      where: { notifikasi_id: notifId },
      data: { status_dibaca: true },
    });
  },

  async markAllAsRead(userId: number, role: "pembeli" | "penjual") {
    const baseWhere: Prisma.notifikasiWhereInput =
      role === "pembeli" ? { user_id: userId } : { mitra_id: userId };

    const result = await prisma.notifikasi.updateMany({
      where: { ...baseWhere, status_dibaca: false },
      data: { status_dibaca: true },
    });

    return {
      message: `${result.count} notifikasi ditandai dibaca`,
      count: result.count,
    };
  },

  async getUnreadCount(userId: number, role: "pembeli" | "penjual") {
    const where: Prisma.notifikasiWhereInput = { status_dibaca: false };
    if (role === "pembeli") where.user_id = userId;
    else where.mitra_id = userId;

    return prisma.notifikasi.count({ where });
  },

  async deleteNotification(
    notifId: number,
    userId: number,
    role: "pembeli" | "penjual",
  ) {
    const where: Prisma.notifikasiWhereInput = { notifikasi_id: notifId };
    if (role === "pembeli") where.user_id = userId;
    else where.mitra_id = userId;

    const existing = await prisma.notifikasi.findFirst({ where });
    if (!existing) return null;

    await prisma.notifikasi.delete({ where: { notifikasi_id: notifId } });
    return { message: "Notifikasi berhasil dihapus" };
  },
};
