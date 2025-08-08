import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateProductInput {
  nama: string;
  harga: number | string;
  stok: number;
  pathGambar: string;
  penjualId: number;
  id_kategori: number;
}

export async function createProductService({
  nama,
  harga,
  stok,
  pathGambar,
  penjualId,
  id_kategori
}: CreateProductInput) {
  const produk = await prisma.produk.create({
    data: {
      nama_produk: nama,
      harga: harga.toString(),
      stok_produk: stok,
      foto: pathGambar,
      mitra_id: penjualId,
      id_kategori,
      status_ketersediaan: true
    }
  });

  return produk;
}
