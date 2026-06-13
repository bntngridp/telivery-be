import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../../utils/errors';
import { deleteFileIfExists } from '../../utils/helpers';
import { PAYMENT_STATUS } from '../../config/constants';

export const paymentService = {
    async uploadReceipt(pesananId: number, userId: number, filePath: string) {
        const pesanan = await prisma.pesanan.findUnique({
            where: { pesanan_id: pesananId },
            include: { pembayaran: true },
        });
        if (!pesanan) throw new NotFoundError('Pesanan tidak ditemukan');
        if (pesanan.user_id !== userId) {
            throw new ForbiddenError('Pesanan ini bukan milik Anda');
        }

        const existing = pesanan.pembayaran[0];
        if (!existing) {
            throw new NotFoundError('Data pembayaran untuk pesanan ini belum dibuat');
        }
        if (existing.status_pembayaran === PAYMENT_STATUS.PAID) {
            throw new ConflictError('Pembayaran sudah dikonfirmasi, tidak bisa upload ulang');
        }
        if (existing.status_pembayaran === PAYMENT_STATUS.CANCELED) {
            throw new ConflictError('Pembayaran sudah ditolak, tidak bisa upload ulang');
        }

        if (existing.bukti_bayar && existing.bukti_bayar !== filePath) {
            deleteFileIfExists(existing.bukti_bayar);
        }

        return prisma.pembayaran.update({
            where: { pembayaran_id: existing.pembayaran_id },
            data: {
                bukti_bayar: filePath,
                status_pembayaran: PAYMENT_STATUS.PENDING,
            },
        });
    },

    async confirmPayment(pembayaranId: number, sellerId: number) {
        const payment = await prisma.pembayaran.findUnique({
            where: { pembayaran_id: pembayaranId },
            include: { pesanan: true },
        });
        if (!payment) throw new NotFoundError('Pembayaran tidak ditemukan');
        if (!payment.pesanan) throw new NotFoundError('Pesanan terkait tidak ditemukan');
        if (payment.pesanan.mitra_id !== sellerId) {
            throw new ForbiddenError('Pembayaran ini bukan untuk toko Anda');
        }
        if (payment.status_pembayaran === PAYMENT_STATUS.PAID) {
            throw new ConflictError('Pembayaran sudah dikonfirmasi');
        }
        if (payment.status_pembayaran === PAYMENT_STATUS.CANCELED) {
            throw new ConflictError('Pembayaran sudah ditolak, tidak bisa dikonfirmasi');
        }
        if (!payment.bukti_bayar) {
            throw new BadRequestError('Belum ada bukti bayar dari pembeli');
        }

        return prisma.pembayaran.update({
            where: { pembayaran_id: pembayaranId },
            data: {
                status_pembayaran: PAYMENT_STATUS.PAID,
                waktu_pembayaran: new Date(),
            },
        });
    },

    async rejectPayment(pembayaranId: number, sellerId: number, catatan: string) {
        const payment = await prisma.pembayaran.findUnique({
            where: { pembayaran_id: pembayaranId },
            include: { pesanan: true },
        });
        if (!payment) throw new NotFoundError('Pembayaran tidak ditemukan');
        if (!payment.pesanan) throw new NotFoundError('Pesanan terkait tidak ditemukan');
        if (payment.pesanan.mitra_id !== sellerId) {
            throw new ForbiddenError('Pembayaran ini bukan untuk toko Anda');
        }
        if (payment.status_pembayaran === PAYMENT_STATUS.PAID) {
            throw new ConflictError('Pembayaran sudah dikonfirmasi, tidak bisa ditolak');
        }
        if (payment.status_pembayaran === PAYMENT_STATUS.CANCELED) {
            throw new ConflictError('Pembayaran sudah ditolak');
        }

        return prisma.pembayaran.update({
            where: { pembayaran_id: pembayaranId },
            data: {
                status_pembayaran: PAYMENT_STATUS.CANCELED,
                catatan_penjual: catatan,
                waktu_pembayaran: new Date(),
            },
        });
    },
};
