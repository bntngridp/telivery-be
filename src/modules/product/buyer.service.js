"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerProductService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.buyerProductService = {
    /**
     * Mendapatkan semua produk yang tersedia
     */
    async getAllProducts(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [products, totalCount] = await Promise.all([
            prisma.produk.findMany({
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
                },
                skip,
                take: limit
            }),
            prisma.produk.count({
                where: {
                    status_ketersediaan: true,
                    stok_produk: {
                        gt: 0
                    }
                }
            })
        ]);
        return {
            products,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    },
    /**
     * Mendapatkan detail produk berdasarkan ID
     */
    async getProductById(id) {
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
        return product;
    },
    /**
     * Mendapatkan produk berdasarkan kategori
     */
    async getProductsByCategory(kategoriParam, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        // Convert URL-friendly parameter to DB category
        let kategori;
        switch (kategoriParam) {
            case 'makanan-minuman':
                kategori = 'MAKANAN_MINUMAN';
                break;
            case 'air-galon':
                kategori = 'AIR_GALON';
                break;
            case 'laundry':
                kategori = 'LAUNDRY';
                break;
            default:
                kategori = kategoriParam.toUpperCase();
        }
        // Find the category ID
        const kategoriRecord = await prisma.kategori.findFirst({
            where: { nama_kategori: kategori }
        });
        if (!kategoriRecord) {
            return null;
        }
        const [products, totalCount] = await Promise.all([
            prisma.produk.findMany({
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
                },
                skip,
                take: limit
            }),
            prisma.produk.count({
                where: {
                    id_kategori: kategoriRecord.id_kategori,
                    status_ketersediaan: true,
                    stok_produk: {
                        gt: 0
                    }
                }
            })
        ]);
        return {
            products,
            kategori: kategori,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    },
    /**
     * Mencari produk berdasarkan keyword
     */
    async searchProducts(keyword, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [products, totalCount] = await Promise.all([
            prisma.produk.findMany({
                where: {
                    OR: [
                        {
                            nama_produk: {
                                contains: keyword
                            }
                        }
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
                },
                skip,
                take: limit
            }),
            prisma.produk.count({
                where: {
                    OR: [
                        {
                            nama_produk: {
                                contains: keyword
                            }
                        }
                    ],
                    AND: {
                        status_ketersediaan: true,
                        stok_produk: {
                            gt: 0
                        }
                    }
                }
            })
        ]);
        return {
            products,
            keyword,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    },
    /**
     * Mendapatkan produk populer berdasarkan jumlah pesanan
     */
    async getPopularProducts(limit = 10) {
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
            take: limit
        });
        // Reformat to remove sensitive details
        const formattedProducts = popularProducts.map(product => {
            const { detail_pesanan_produk, ...rest } = product;
            return {
                ...rest,
                orderCount: detail_pesanan_produk.length
            };
        });
        return formattedProducts;
    },
    /**
     * Mendapatkan rekomendasi produk untuk pembeli
     */
    async getProductRecommendations(userId, limit = 10) {
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
                    take: limit
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
                take: limit
            });
        }
        return recommendedProducts;
    }
};
