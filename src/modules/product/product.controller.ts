import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createProductSchema, updateProductSchema, updateStockSchema } from './product.schema';
import path from 'path';
import fs from 'fs';
import { createProductService } from './product.service';

const prisma = new PrismaClient();

export const createProduct = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'penjual') {
      return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat menambah produk.' });
    }

    const { nama, harga, stok, kategori } = createProductSchema.parse(req.body);
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

    const uploadDir = path.join(__dirname, '../../../documents/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname);
    const fileName = `produk-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, req.file.buffer);
    const pathGambar = `/documents/products/${fileName}`;

    const produk = await createProductService({
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
  } catch (err: any) {
    console.error('Error creating product:', err);
    return res.status(400).json({
      message: err.message || 'Gagal menambahkan produk'
    });
  }
};

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
  } catch (err: any) {
    console.error('Error getting products:', err);
    return res.status(500).json({ message: 'Gagal mengambil produk' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
  } catch (err: any) {
    console.error('Error getting product by id:', err);
    return res.status(500).json({ message: 'Gagal mengambil detail produk' });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
  } catch (err: any) {
    console.error('Error getting products by category:', err);
    return res.status(500).json({ message: 'Gagal mengambil produk berdasarkan kategori' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'penjual') {
      return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat mengupdate produk.' });
    }

    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    console.log('Request Body:', req.body);
    const parsed = updateProductSchema.safeParse(req.body);
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
      const uploadDir = path.join(__dirname, '../../../documents/products');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      if (!req.file.buffer) {
        console.error('File buffer is undefined');
        return res.status(400).json({ message: 'File upload error: Empty file buffer' });
      }

      const ext = path.extname(req.file.originalname);
      const fileName = `produk-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, req.file.buffer);
      pathGambar = `/documents/products/${fileName}`;

      if (existingProduct.foto) {
        const oldFilePath = path.join(__dirname, '../../../', existingProduct.foto);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    const updateData = {
      id_kategori,
      foto: pathGambar
    } as any;

    if (parsed.data.nama) updateData.nama_produk = parsed.data.nama;
    if (parsed.data.deskripsi) updateData.deskripsi_produk = parsed.data.deskripsi;
    if (parsed.data.harga !== undefined) updateData.harga = parsed.data.harga.toString();
    if (parsed.data.stok !== undefined) updateData.stok_produk = parsed.data.stok;

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
  } catch (err: any) {
    console.error('Error updating product:', err);
    return res.status(500).json({
      message: 'Gagal mengupdate produk',
      error: err.message
    });
  }
};

export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'penjual') {
      return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat mengupdate stok.' });
    }

    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID produk tidak valid' });
    }

    const parsed = updateStockSchema.safeParse(req.body);
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
  } catch (err: any) {
    console.error('Error updating product stock:', err);
    return res.status(500).json({ message: 'Gagal mengupdate stok produk' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
      const filePath = path.join(__dirname, '../../../', existingProduct.foto);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.produk.delete({
      where: { produk_id: id }
    });

    return res.status(200).json({
      message: 'Produk berhasil dihapus'
    });
  } catch (err: any) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ message: 'Gagal menghapus produk' });
  }
};

export const deleteAllProducts = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'penjual') {
      return res.status(403).json({ message: 'Unauthorized, hanya penjual yang dapat menghapus produk.' });
    }

    const products = await prisma.produk.findMany({
      where: { mitra_id: user.sellerId }
    });

    products.forEach(product => {
      if (product.foto) {
        const filePath = path.join(__dirname, '../../../', product.foto);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    const result = await prisma.produk.deleteMany({
      where: { mitra_id: user.sellerId }
    });

    return res.status(200).json({
      message: `${result.count} produk berhasil dihapus`
    });
  } catch (err: any) {
    console.error('Error deleting all products:', err);
    return res.status(500).json({ message: 'Gagal menghapus semua produk' });
  }
};

export const getAllProductsForBuyer = async (req: Request, res: Response) => {
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
  } catch (err: any) {
    console.error('Error getting products:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil produk'
    });
  }
};


export const getProductByIdForBuyer = async (req: Request, res: Response) => {
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
  } catch (err: any) {
    console.error('Error getting product by id:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail produk'
    });
  }
};

export const getProductsByCategoryForBuyer = async (req: Request, res: Response) => {
  try {
    const categoryParam = req.params.kategori.toUpperCase();
    let kategori: string;

    // Convert URL-friendly parameter to DB category
    switch(categoryParam) {
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
  } catch (err: any) {
    console.error('Error getting products by category:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil produk berdasarkan kategori'
    });
  }
};

/**
 * Search products by keyword for buyers
 */
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.q as string;

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
  } catch (err: any) {
    console.error('Error searching products:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal melakukan pencarian produk'
    });
  }
};

/**
 * Get popular products for buyers
 */
export const getPopularProducts = async (req: Request, res: Response) => {
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
  } catch (err: any) {
    console.error('Error getting popular products:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil produk populer'
    });
  }
};

/**
 * Get product recommendations for buyers
 */
export const getProductRecommendations = async (req: Request, res: Response) => {
  try {
    // Get the user ID from the authenticated user (if available)
    const userId = (req as any).user?.id;

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
        .filter(Boolean) as number[];

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
  } catch (err: any) {
    console.error('Error getting product recommendations:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil rekomendasi produk'
    });
  }
};
