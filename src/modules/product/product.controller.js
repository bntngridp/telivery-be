"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductRecommendations = exports.getPopularProducts = exports.searchProducts = exports.getProductsByCategoryForBuyer = exports.getProductByIdForBuyer = exports.getAllProductsForBuyer = exports.deleteAllProducts = exports.deleteProduct = exports.updateProductStock = exports.updateProduct = exports.getProductsByCategory = exports.getProductById = exports.getAllProducts = exports.createProduct = void 0;
const client_1 = require("@prisma/client");
const product_schema_1 = require("./product.schema");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const product_service_1 = require("./product.service");
const prisma = new client_1.PrismaClient();
const createProduct = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'penjual') {
            return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat menambah produk.' });
        }
        const { nama, harga, stok, kategori } = product_schema_1.createProductSchema.parse(req.body);
        if (!req.file) {
            return res.status(400).json({ message: 'Gambar produk wajib diupload.' });
        }
        const kategoriRecord = await prisma.kategori.findFirst({
            where: { nama_kategori: kategori }
        });
        if (!kategoriRecord) {
            return res.status(400).json({ message: 'Kategori tidak ditemukan di database.' });
        }
        const id_kategori = kategoriRecord.id_kategori;
        const uploadDir = path_1.default.join(__dirname, '../../../documents/products');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const ext = path_1.default.extname(req.file.originalname);
        const fileName = `produk-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path_1.default.join(uploadDir, fileName);
        fs_1.default.writeFileSync(filePath, req.file.buffer);
        const pathGambar = `/documents/products/${fileName}`;
        const produk = await (0, product_service_1.createProductService)({
            nama,
            harga: harga.toString(),
            stok,
            pathGambar,
            penjualId: user.sellerId,
            id_kategori,
        });
        return res.status(201).json({
            message: 'Produk berhasil ditambahkan',
            produk
        });
    }
    catch (err) {
        console.error('Error creating product:', err);
        return res.status(400).json({
            message: err.message || 'Gagal menambahkan produk'
        });
    }
};
exports.createProduct = createProduct;
const getAllProducts = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'penjual') {
            return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat mengakses produk.' });
        }
        const products = await prisma.produk.findMany({
            where: { mitra_id: user.sellerId },
            include: {
                kategori: true
            }
        });
        return res.status(200).json({
            message: 'Produk berhasil diambil',
            data: products
        });
    }
    catch (err) {
        console.error('Error getting products:', err);
        return res.status(500).json({ message: 'Gagal mengambil produk' });
    }
};
exports.getAllProducts = getAllProducts;
const getProductById = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'penjual') {
            return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat mengakses produk.' });
        }
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID produk tidak valid' });
        }
        const product = await prisma.produk.findFirst({
            where: {
                produk_id: id,
                mitra_id: user.sellerId
            },
            include: {
                kategori: true
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        return res.status(200).json({
            message: 'Detail produk berhasil diambil',
            data: product
        });
    }
    catch (err) {
        console.error('Error getting product by id:', err);
        return res.status(500).json({ message: 'Gagal mengambil detail produk' });
    }
};
exports.getProductById = getProductById;
const getProductsByCategory = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'penjual') {
            return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat mengakses produk.' });
        }
        const category = req.params.category.toUpperCase();
        const kategoriRecord = await prisma.kategori.findFirst({
            where: { nama_kategori: category }
        });
        if (!kategoriRecord) {
            return res.status(400).json({ message: 'Kategori tidak ditemukan' });
        }
        const products = await prisma.produk.findMany({
            where: {
                mitra_id: user.sellerId,
                id_kategori: kategoriRecord.id_kategori
            },
            include: {
                kategori: true
            }
            // Removed orderBy clause as waktu_dibuat doesn't exist in produk model
        });
        return res.status(200).json({
            message: `Produk kategori ${category} berhasil diambil`,
            data: products
        });
    }
    catch (err) {
        console.error('Error getting products by category:', err);
        return res.status(500).json({ message: 'Gagal mengambil produk berdasarkan kategori' });
    }
};
exports.getProductsByCategory = getProductsByCategory;
const updateProduct = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'penjual') {
            return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat mengupdate produk.' });
        }
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID produk tidak valid' });
        }
        console.log('Request Body:', req.body);
        const parsed = product_schema_1.updateProductSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Data tidak valid',
                errors: parsed.error.flatten().fieldErrors
            });
        }
        console.log('Parsed Data:', parsed.data);
        // Cek apakah produk milik seller yang login
        const existingProduct = await prisma.produk.findFirst({
            where: {
                produk_id: id,
                mitra_id: user.sellerId
            }
        });
        if (!existingProduct) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        console.log('Existing Product:', existingProduct);
        let id_kategori = existingProduct.id_kategori;
        if (parsed.data.kategori) {
            console.log('Finding category:', parsed.data.kategori);
            const kategoriRecord = await prisma.kategori.findFirst({
                where: { nama_kategori: parsed.data.kategori }
            });
            console.log('Category Record:', kategoriRecord);
            if (!kategoriRecord) {
                return res.status(400).json({ message: 'Kategori tidak ditemukan di database' });
            }
            id_kategori = kategoriRecord.id_kategori;
        }
        let pathGambar = existingProduct.foto;
        if (req.file) {
            console.log('Processing new image file');
            const uploadDir = path_1.default.join(__dirname, '../../../documents/products');
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            if (!req.file.buffer) {
                console.error('File buffer is undefined');
                return res.status(400).json({ message: 'File upload error: Empty file buffer' });
            }
            const ext = path_1.default.extname(req.file.originalname);
            const fileName = `produk-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            const filePath = path_1.default.join(uploadDir, fileName);
            fs_1.default.writeFileSync(filePath, req.file.buffer);
            pathGambar = `/documents/products/${fileName}`;
            if (existingProduct.foto) {
                const oldFilePath = path_1.default.join(__dirname, '../../../', existingProduct.foto);
                if (fs_1.default.existsSync(oldFilePath)) {
                    fs_1.default.unlinkSync(oldFilePath);
                }
            }
        }
        const updateData = {
            id_kategori,
            foto: pathGambar
        };
        if (parsed.data.nama)
            updateData.nama_produk = parsed.data.nama;
        if (parsed.data.deskripsi)
            updateData.deskripsi_produk = parsed.data.deskripsi;
        if (parsed.data.harga !== undefined)
            updateData.harga = parsed.data.harga.toString();
        if (parsed.data.stok !== undefined)
            updateData.stok_produk = parsed.data.stok;
        console.log('Update data:', updateData);
        const updatedProduct = await prisma.produk.update({
            where: { produk_id: id },
            data: updateData,
            include: {
                kategori: true
            }
        });
        console.log('Updated Product:', updatedProduct);
        return res.status(200).json({
            message: 'Produk berhasil diupdate',
            data: updatedProduct
        });
    }
    catch (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({
            message: 'Gagal mengupdate produk',
            error: err.message
        });
    }
};
exports.updateProduct = updateProduct;
const updateProductStock = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'penjual') {
            return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat mengupdate stok.' });
        }
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID produk tidak valid' });
        }
        const parsed = product_schema_1.updateStockSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Data tidak valid',
                errors: parsed.error.flatten().fieldErrors
            });
        }
        const existingProduct = await prisma.produk.findFirst({
            where: {
                produk_id: id,
                mitra_id: user.sellerId
            }
        });
        if (!existingProduct) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        const updatedProduct = await prisma.produk.update({
            where: { produk_id: id },
            data: {
                stok_produk: parsed.data.stok
            },
            include: {
                kategori: true
            }
        });
        return res.status(200).json({
            message: 'Stok produk berhasil diupdate',
            data: updatedProduct
        });
    }
    catch (err) {
        console.error('Error updating product stock:', err);
        return res.status(500).json({ message: 'Gagal mengupdate stok produk' });
    }
};
exports.updateProductStock = updateProductStock;
const deleteProduct = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'penjual') {
            return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat menghapus produk.' });
        }
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID produk tidak valid' });
        }
        const existingProduct = await prisma.produk.findFirst({
            where: {
                produk_id: id,
                mitra_id: user.sellerId
            }
        });
        if (!existingProduct) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }
        if (existingProduct.foto) {
            const filePath = path_1.default.join(__dirname, '../../../', existingProduct.foto);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
        }
        await prisma.produk.delete({
            where: { produk_id: id }
        });
        return res.status(200).json({
            message: 'Produk berhasil dihapus'
        });
    }
    catch (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ message: 'Gagal menghapus produk' });
    }
};
exports.deleteProduct = deleteProduct;
const deleteAllProducts = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'penjual') {
            return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat menghapus produk.' });
        }
        const products = await prisma.produk.findMany({
            where: { mitra_id: user.sellerId }
        });
        products.forEach(product => {
            if (product.foto) {
                const filePath = path_1.default.join(__dirname, '../../../', product.foto);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
        });
        const result = await prisma.produk.deleteMany({
            where: { mitra_id: user.sellerId }
        });
        return res.status(200).json({
            message: `${result.count} produk berhasil dihapus`
        });
    }
    catch (err) {
        console.error('Error deleting all products:', err);
        return res.status(500).json({ message: 'Gagal menghapus semua produk' });
    }
};
exports.deleteAllProducts = deleteAllProducts;
const getAllProductsForBuyer = async (req, res) => {
    try {
        const products = await prisma.produk.findMany({
            where: {
                status_ketersediaan: true,
                stok_produk: {
                    gt: 0
                }
            },
            include: {
                kategori: true,
                penjual: {
                    select: {
                        nama_toko: true,
                        alamat_toko: true,
                        status_toko: true
                    }
                }
            },
            orderBy: {
                produk_id: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            message: 'Produk berhasil diambil',
            data: products
        });
    }
    catch (err) {
        console.error('Error getting products:', err);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil produk'
        });
    }
};
exports.getAllProductsForBuyer = getAllProductsForBuyer;
const getProductByIdForBuyer = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID produk tidak valid'
            });
        }
        const product = await prisma.produk.findFirst({
            where: {
                produk_id: id,
                status_ketersediaan: true
            },
            include: {
                kategori: true,
                penjual: {
                    select: {
                        nama_toko: true,
                        alamat_toko: true,
                        status_toko: true,
                        jenis_usaha: true
                    }
                }
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Detail produk berhasil diambil',
            data: product
        });
    }
    catch (err) {
        console.error('Error getting product by id:', err);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil detail produk'
        });
    }
};
exports.getProductByIdForBuyer = getProductByIdForBuyer;
const getProductsByCategoryForBuyer = async (req, res) => {
    try {
        const categoryParam = req.params.kategori.toUpperCase();
        let kategori;
        // Convert URL-friendly parameter to DB category
        switch (categoryParam) {
            case 'MAKANAN-MINUMAN':
                kategori = 'MAKANAN_MINUMAN';
                break;
            case 'AIR-GALON':
                kategori = 'AIR_GALON';
                break;
            case 'LAUNDRY':
                kategori = 'LAUNDRY';
                break;
            default:
                kategori = categoryParam;
        }
        const kategoriRecord = await prisma.kategori.findFirst({
            where: { nama_kategori: kategori }
        });
        if (!kategoriRecord) {
            return res.status(400).json({
                success: false,
                message: 'Kategori tidak ditemukan'
            });
        }
        const products = await prisma.produk.findMany({
            where: {
                id_kategori: kategoriRecord.id_kategori,
                status_ketersediaan: true,
                stok_produk: {
                    gt: 0
                }
            },
            include: {
                kategori: true,
                penjual: {
                    select: {
                        nama_toko: true,
                        alamat_toko: true,
                        status_toko: true
                    }
                }
            },
            orderBy: {
                produk_id: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            message: `Produk kategori ${kategori} berhasil diambil`,
            data: products
        });
    }
    catch (err) {
        console.error('Error getting products by category:', err);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil produk berdasarkan kategori'
        });
    }
};
exports.getProductsByCategoryForBuyer = getProductsByCategoryForBuyer;
/**
 * Search products by keyword for buyers
 */
const searchProducts = async (req, res) => {
    try {
        const keyword = req.query.q;
        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Parameter pencarian tidak boleh kosong'
            });
        }
        const products = await prisma.produk.findMany({
            where: {
                OR: [
                    {
                        nama_produk: {
                            contains: keyword
                        }
                    }
                    // Menghapus pencarian pada field deskripsi yang tidak ada di schema Prisma
                ],
                AND: {
                    status_ketersediaan: true,
                    stok_produk: {
                        gt: 0
                    }
                }
            },
            include: {
                kategori: true,
                penjual: {
                    select: {
                        nama_toko: true,
                        alamat_toko: true
                    }
                }
            },
            orderBy: {
                produk_id: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            message: 'Hasil pencarian produk',
            data: products
        });
    }
    catch (err) {
        console.error('Error searching products:', err);
        return res.status(500).json({
            success: false,
            message: 'Gagal melakukan pencarian produk'
        });
    }
};
exports.searchProducts = searchProducts;
/**
 * Get popular products for buyers
 */
const getPopularProducts = async (req, res) => {
    try {
        // Get products with most order details
        const popularProducts = await prisma.produk.findMany({
            where: {
                status_ketersediaan: true,
                stok_produk: {
                    gt: 0
                }
            },
            include: {
                kategori: true,
                penjual: {
                    select: {
                        nama_toko: true,
                        alamat_toko: true
                    }
                },
                detail_pesanan_produk: true
            },
            orderBy: {
                detail_pesanan_produk: {
                    _count: 'desc'
                }
            },
            take: 10
        });
        // Reformat to remove sensitive details
        const formattedProducts = popularProducts.map(product => {
            const { detail_pesanan_produk, ...rest } = product;
            return {
                ...rest,
                orderCount: detail_pesanan_produk.length
            };
        });
        return res.status(200).json({
            success: true,
            message: 'Produk populer berhasil diambil',
            data: formattedProducts
        });
    }
    catch (err) {
        console.error('Error getting popular products:', err);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil produk populer'
        });
    }
};
exports.getPopularProducts = getPopularProducts;
/**
 * Get product recommendations for buyers
 */
const getProductRecommendations = async (req, res) => {
    try {
        // Get the user ID from the authenticated user (if available)
        const userId = req.user?.id;
        let recommendedProducts;
        if (userId) {
            const userOrders = await prisma.pesanan.findMany({
                where: {
                    user_id: userId
                },
                include: {
                    detail_pesanan_produk: {
                        include: {
                            produk: {
                                include: {
                                    kategori: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    waktu_pesan: 'desc'
                },
                take: 5
            });
            // Extract categories from previous orders
            const orderedCategoryIds = userOrders
                .flatMap(order => order.detail_pesanan_produk)
                .map(detail => detail.produk?.id_kategori)
                .filter(Boolean);
            if (orderedCategoryIds.length > 0) {
                // Find products in the same categories
                recommendedProducts = await prisma.produk.findMany({
                    where: {
                        id_kategori: {
                            in: orderedCategoryIds
                        },
                        status_ketersediaan: true,
                        stok_produk: {
                            gt: 0
                        }
                    },
                    include: {
                        kategori: true,
                        penjual: {
                            select: {
                                nama_toko: true,
                                alamat_toko: true
                            }
                        }
                    },
                    orderBy: {
                        produk_id: 'desc'
                    },
                    take: 10
                });
            }
        }
        if (!recommendedProducts || recommendedProducts.length === 0) {
            recommendedProducts = await prisma.produk.findMany({
                where: {
                    status_ketersediaan: true,
                    stok_produk: {
                        gt: 0
                    }
                },
                include: {
                    kategori: true,
                    penjual: {
                        select: {
                            nama_toko: true,
                            alamat_toko: true
                        }
                    }
                },
                orderBy: {
                    produk_id: 'desc'
                },
                take: 10
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Rekomendasi produk berhasil diambil',
            data: recommendedProducts
        });
    }
    catch (err) {
        console.error('Error getting product recommendations:', err);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengambil rekomendasi produk'
        });
    }
};
exports.getProductRecommendations = getProductRecommendations;
