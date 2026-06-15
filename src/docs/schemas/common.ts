/**
 * @openapi
 * components:
 *   schemas:
 *     SuccessResponse:
 *       type: object
 *       required: [success, message, data]
 *       properties:
 *         success: { type: boolean, example: true }
 *         message: { type: string, example: "Data berhasil diambil" }
 *         data: {}
 *     ErrorResponse:
 *       type: object
 *       required: [success, message, error]
 *       properties:
 *         success: { type: boolean, example: false }
 *         message: { type: string }
 *         error: { type: string, description: "Error code" }
 *         details: { type: object, additionalProperties: true }
 *     Buyer:
 *       type: object
 *       properties:
 *         user_id: { type: integer }
 *         email: { type: string, format: email, nullable: true }
 *         full_name: { type: string, nullable: true }
 *         phone_number: { type: string, nullable: true }
 *         domicile: { type: string, nullable: true }
 *         faculty: { type: string, nullable: true }
 *         major: { type: string, nullable: true }
 *         delivery_address: { type: string, nullable: true }
 *         birth_date: { type: string, format: date-time, nullable: true }
 *     Seller:
 *       type: object
 *       properties:
 *         mitra_id: { type: integer }
 *         nama_toko: { type: string }
 *         email: { type: string, format: email, nullable: true }
 *         phone_number: { type: string, nullable: true }
 *         status_verifikasi:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           nullable: true
 *         status_toko:
 *           type: string
 *           enum: [OPEN, CLOSED]
 *           nullable: true
 *     Pesanan:
 *       type: object
 *       properties:
 *         pesanan_id: { type: integer }
 *         user_id: { type: integer, nullable: true }
 *         mitra_id: { type: integer, nullable: true }
 *         total_harga:
 *           type: number
 *           format: double
 *           nullable: true
 *           description: "Decimal dikonversi ke number"
 *         ongkir: { type: number, format: double, nullable: true }
 *         alamat_pengiriman: { type: string, nullable: true }
 *         alamat_id: { type: integer, nullable: true }
 *         status_pesanan:
 *           type: string
 *           enum: [pending, accepted, rejected, processing, delivered, completed, canceled]
 *           nullable: true
 *         metode_pembayaran:
 *           type: string
 *           enum: [cash, transfer, "e-wallet", midtrans]
 *           nullable: true
 *         waktu_pesan: { type: string, format: date-time, nullable: true }
 *         waktu_dikirim: { type: string, format: date-time, nullable: true }
 *         waktu_diterima: { type: string, format: date-time, nullable: true }
 *     Pembayaran:
 *       type: object
 *       properties:
 *         pembayaran_id: { type: integer }
 *         pesanan_id: { type: integer, nullable: true }
 *         status_pembayaran:
 *           type: string
 *           enum: [pending, paid, canceled]
 *           nullable: true
 *         metode_pembayaran: { type: string, nullable: true }
 *         waktu_pembayaran: { type: string, format: date-time, nullable: true }
 *         bukti_bayar: { type: string, nullable: true, description: "Path .webp atau .pdf" }
 *         midtrans_order_id: { type: string, nullable: true }
 *         snap_token: { type: string, nullable: true }
 *         payment_type: { type: string, nullable: true }
 *         paid_at: { type: string, format: date-time, nullable: true }
 *     Produk:
 *       type: object
 *       properties:
 *         produk_id: { type: integer }
 *         nama_produk: { type: string, nullable: true }
 *         harga: { type: number, format: double, nullable: true }
 *         foto: { type: string, nullable: true, description: "URL atau path .webp" }
 *         status_ketersediaan: { type: boolean, nullable: true }
 *         stok_produk: { type: integer, nullable: true }
 *     Pagination:
 *       type: object
 *       properties:
 *         total: { type: integer }
 *         page: { type: integer }
 *         limit: { type: integer }
 *         totalPages: { type: integer }
 *     Alamat:
 *       type: object
 *       properties:
 *         alamat_id: { type: integer }
 *         user_id: { type: integer }
 *         label: { type: string }
 *         alamat_lengkap: { type: string }
 *         catatan: { type: string, nullable: true }
 *         latitude: { type: number, format: double, nullable: true }
 *         longitude: { type: number, format: double, nullable: true }
 *         is_primary: { type: boolean }
 *         created_at: { type: string, format: date-time, nullable: true }
 *         updated_at: { type: string, format: date-time, nullable: true }
 */
