import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { CreateLayananDto, UpdateLayananDto } from './service.schema';
import { APPROVED_OPEN_FILTER } from '../store/store.service';

const LAYANAN_INCLUDE = {
    penjual: { select: { mitra_id: true, nama_toko: true } },
} as const;

export const serviceService = {
    async create(sellerId: number, data: CreateLayananDto) {
        return prisma.layanan.create({
            data: {
                mitra_id: sellerId,
                nama_layanan: data.namaLayanan,
                harga: new Prisma.Decimal(data.harga),
                jenis_layanan: data.jenisLayanan,
                estimasi_durasi: data.estimasiDurasi?.toString(),
                catatan: data.catatan,
            },
            include: LAYANAN_INCLUDE,
        });
    },

    async listBySeller(sellerId: number) {
        return prisma.layanan.findMany({
            where: { mitra_id: sellerId },
            orderBy: { layanan_id: 'desc' },
        });
    },

    async findOwnedById(layananId: number, sellerId: number) {
        return prisma.layanan.findFirst({
            where: { layanan_id: layananId, mitra_id: sellerId },
            include: LAYANAN_INCLUDE,
        });
    },

    async update(layananId: number, sellerId: number, data: UpdateLayananDto) {
        const existing = await this.findOwnedById(layananId, sellerId);
        if (!existing) throw new NotFoundError('Layanan tidak ditemukan');

        const updateData: Prisma.layananUpdateInput = {};
        if (data.namaLayanan !== undefined) updateData.nama_layanan = data.namaLayanan;
        if (data.harga !== undefined) updateData.harga = new Prisma.Decimal(data.harga);
        if (data.jenisLayanan !== undefined) updateData.jenis_layanan = data.jenisLayanan;
        if (data.estimasiDurasi !== undefined) updateData.estimasi_durasi = data.estimasiDurasi.toString();
        if (data.catatan !== undefined) updateData.catatan = data.catatan;

        return prisma.layanan.update({
            where: { layanan_id: layananId },
            data: updateData,
            include: LAYANAN_INCLUDE,
        });
    },

    async delete(layananId: number, sellerId: number) {
        const existing = await this.findOwnedById(layananId, sellerId);
        if (!existing) throw new NotFoundError('Layanan tidak ditemukan');

        const referenced = await prisma.detail_pesanan_layanan.findFirst({
            where: { layanan_id: layananId },
            select: { id_detail: true },
        });
        if (referenced) {
            throw new ForbiddenError('Layanan sudah pernah dipesan, tidak bisa dihapus');
        }

        await prisma.layanan.delete({ where: { layanan_id: layananId } });
        return { message: 'Layanan berhasil dihapus' };
    },

    async listByStore(storeId: number) {
        const store = await prisma.penjual.findFirst({
            where: { mitra_id: storeId, ...APPROVED_OPEN_FILTER },
            select: { mitra_id: true, nama_toko: true, jenis_usaha: true },
        });
        if (!store) {
            throw new NotFoundError('Toko tidak ditemukan atau belum buka');
        }

        return prisma.layanan.findMany({
            where: { mitra_id: storeId },
            orderBy: { layanan_id: 'desc' },
        });
    },
};
