"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductService = createProductService;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createProductService({ nama, harga, stok, pathGambar, penjualId, id_kategori }) {
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
