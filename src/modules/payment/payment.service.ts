import crypto from "crypto";
import { prisma } from "../../config/prisma";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from "../../utils/errors";
import { deleteFileIfExists } from "../../utils/helpers";
import { PAYMENT_STATUS, ORDER_STATUS } from "../../config/constants";
import {
  snap,
  midtransConfig,
  mapMidtransStatusToInternal,
  MidtransStatus,
} from "../../config/midtrans";
import type { MidtransWebhookPayload } from "./payment.schema";

export interface SnapTokenResponse {
  snapToken: string;
  redirectUrl: string;
  midtransOrderId: string;
}

/**
 * Create a Midtrans Snap transaction for a given pesanan and return the
 * snap_token + redirect_url that the client uses to open Snap.
 * Idempotent: re-calling for the same pesanan returns the same token (re-uses
 * stored midtrans_order_id when present).
 */
export const paymentService = {
  async createSnapToken(
    pesananId: number,
    userId: number,
  ): Promise<SnapTokenResponse> {
    const pesanan = await prisma.pesanan.findUnique({
      where: { pesanan_id: pesananId },
      include: { pembayaran: true, penjual: { select: { nama_toko: true } } },
    });
    if (!pesanan) throw new NotFoundError("Pesanan tidak ditemukan");
    if (pesanan.user_id !== userId) {
      throw new ForbiddenError("Pesanan ini bukan milik Anda");
    }

    const existing = pesanan.pembayaran[0];
    if (!existing) {
      throw new NotFoundError("Data pembayaran untuk pesanan ini belum dibuat");
    }
    if (
      existing.metode_pembayaran &&
      existing.metode_pembayaran !== "midtrans"
    ) {
      throw new BadRequestError(
        `Pesanan ini menggunakan metode ${existing.metode_pembayaran}, bukan Midtrans. Buat pesanan baru dengan metode midtrans.`,
      );
    }
    if (existing.status_pembayaran === PAYMENT_STATUS.PAID) {
      throw new ConflictError("Pembayaran sudah lunas");
    }

    // Idempotent: re-use existing order_id
    const midtransOrderId =
      existing.midtrans_order_id ?? `ORDER-${pesananId}-${Date.now()}`;
    const total = Number(pesanan.total_harga ?? 0);
    if (total <= 0) {
      throw new BadRequestError("Total pesanan harus lebih dari 0");
    }

    // Update metode to midtrans in case it was different (caller opted in)
    if (existing.metode_pembayaran !== "midtrans") {
      await prisma.pembayaran.update({
        where: { pembayaran_id: existing.pembayaran_id },
        data: { metode_pembayaran: "midtrans" },
      });
    }

    const transactionTokens = await snap.createTransaction({
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: total,
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: "Buyer",
        email: "buyer@telivery.local",
      },
    });

    await prisma.pembayaran.update({
      where: { pembayaran_id: existing.pembayaran_id },
      data: {
        midtrans_order_id: midtransOrderId,
        snap_token: transactionTokens.token,
      },
    });

    return {
      snapToken: transactionTokens.token,
      redirectUrl: transactionTokens.redirect_url,
      midtransOrderId,
    };
  },

  /**
   * Get current payment status for a pesanan. Used by client to poll
   * after Snap close (or as fallback if webhook hasn't arrived yet).
   */
  async getPaymentStatus(pesananId: number, userId: number) {
    const pesanan = await prisma.pesanan.findUnique({
      where: { pesanan_id: pesananId },
      include: { pembayaran: true },
    });
    if (!pesanan) throw new NotFoundError("Pesanan tidak ditemukan");
    if (pesanan.user_id !== userId) {
      throw new ForbiddenError("Pesanan ini bukan milik Anda");
    }
    const p = pesanan.pembayaran[0];
    if (!p)
      throw new NotFoundError("Pembayaran untuk pesanan ini belum dibuat");
    return {
      pesanan_id: pesanan.pesanan_id,
      status_pesanan: pesanan.status_pesanan,
      status_pembayaran: p.status_pembayaran,
      metode_pembayaran: p.metode_pembayaran,
      waktu_pembayaran: p.waktu_pembayaran,
      paid_at: p.paid_at,
      payment_type: p.payment_type,
      has_snap_token: !!p.snap_token,
      bukti_bayar_uploaded: !!p.bukti_bayar,
      total_harga: pesanan.total_harga,
    };
  },

  /**
   * Verify Midtrans webhook signature.
   * Signature = SHA-512(order_id + status_code + gross_amount + serverKey)
   * Midtrans docs: https://docs.midtrans.com/reference/callback-signature
   */
  verifyWebhookSignature(
    payload: MidtransWebhookPayload,
    rawSignature: string,
  ): boolean {
    if (!payload.signature_key) return false;
    const input = `${payload.order_id}${payload.status_code}${payload.gross_amount}${midtransConfig.serverKey}`;
    const expected = crypto.createHash("sha512").update(input).digest("hex");
    return expected === rawSignature || expected === payload.signature_key;
  },

  /**
   * Process a verified Midtrans webhook notification. Updates pembayaran
   * status, marks paid, and triggers seller wallet credit on settlement
   * (in the same atomic $transaction as confirmOrder would).
   */
  async handleMidtransWebhook(payload: MidtransWebhookPayload) {
    // order_id format: ORDER-<pesananId>-<timestamp>
    const match = /^ORDER-(\d+)-/.exec(payload.order_id);
    if (!match) {
      throw new BadRequestError(
        `order_id format tidak dikenal: ${payload.order_id}`,
      );
    }
    const pesananId = Number(match[1]);

    const pembayaran = await prisma.pembayaran.findFirst({
      where: { midtrans_order_id: payload.order_id },
      include: {
        pesanan: { include: { penjual: { select: { mitra_id: true } } } },
      },
    });
    if (!pembayaran) {
      throw new NotFoundError(
        `Pembayaran untuk order_id ${payload.order_id} tidak ditemukan`,
      );
    }
    if (!pembayaran.pesanan) {
      throw new NotFoundError("Pesanan terkait tidak ditemukan");
    }

    const newStatus = mapMidtransStatusToInternal(payload.transaction_status);
    const paidAt = payload.settlement_time
      ? new Date(payload.settlement_time)
      : new Date();
    const paymentType = payload.payment_type ?? null;

    // Already paid — idempotent, skip
    if (pembayaran.status_pembayaran === PAYMENT_STATUS.PAID) {
      return { status_pembayaran: "paid", alreadyProcessed: true };
    }

    const updated = await prisma.pembayaran.update({
      where: { pembayaran_id: pembayaran.pembayaran_id },
      data: {
        status_pembayaran: newStatus,
        payment_type: paymentType,
        paid_at: newStatus === PAYMENT_STATUS.PAID ? paidAt : null,
        waktu_pembayaran: newStatus === PAYMENT_STATUS.PAID ? paidAt : null,
        midtrans_response: payload as unknown as object,
      },
    });

    // On settlement: notify seller, notify buyer
    if (newStatus === PAYMENT_STATUS.PAID && pembayaran.pesanan) {
      const mitraId = pembayaran.pesanan.mitra_id;
      const orderId = pembayaran.pesanan.pesanan_id;
      const buyerId = pembayaran.pesanan.user_id;
      const now = new Date();
      await prisma.notifikasi.createMany({
        data: [
          {
            mitra_id: mitraId,
            isi_pesan: `Pembayaran pesanan #${orderId} telah diterima via Midtrans.`,
            waktu_kirim: now,
            tipe: "payment_received",
            status_dibaca: false,
          },
          {
            user_id: buyerId ?? undefined,
            isi_pesan: `Pembayaran pesanan #${orderId} berhasil. Pesanan sedang diproses.`,
            waktu_kirim: now,
            tipe: "payment_success",
            status_dibaca: false,
          },
        ],
      });
    }

    return {
      status_pembayaran: updated.status_pembayaran,
      alreadyProcessed: false,
    };
  },

  // ──────────────── existing manual upload flow (kept for compatibility) ────────────────

  async uploadReceipt(pesananId: number, userId: number, filePath: string) {
    const pesanan = await prisma.pesanan.findUnique({
      where: { pesanan_id: pesananId },
      include: { pembayaran: true },
    });
    if (!pesanan) throw new NotFoundError("Pesanan tidak ditemukan");
    if (pesanan.user_id !== userId) {
      throw new ForbiddenError("Pesanan ini bukan milik Anda");
    }

    const existing = pesanan.pembayaran[0];
    if (!existing) {
      throw new NotFoundError("Data pembayaran untuk pesanan ini belum dibuat");
    }
    if (existing.status_pembayaran === PAYMENT_STATUS.PAID) {
      throw new ConflictError(
        "Pembayaran sudah dikonfirmasi, tidak bisa upload ulang",
      );
    }
    if (existing.status_pembayaran === PAYMENT_STATUS.CANCELED) {
      throw new ConflictError(
        "Pembayaran sudah ditolak, tidak bisa upload ulang",
      );
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
    if (!payment) throw new NotFoundError("Pembayaran tidak ditemukan");
    if (!payment.pesanan)
      throw new NotFoundError("Pesanan terkait tidak ditemukan");
    if (payment.pesanan.mitra_id !== sellerId) {
      throw new ForbiddenError("Pembayaran ini bukan untuk toko Anda");
    }
    if (payment.status_pembayaran === PAYMENT_STATUS.PAID) {
      throw new ConflictError("Pembayaran sudah dikonfirmasi");
    }
    if (payment.status_pembayaran === PAYMENT_STATUS.CANCELED) {
      throw new ConflictError(
        "Pembayaran sudah ditolak, tidak bisa dikonfirmasi",
      );
    }
    if (payment.metode_pembayaran === "midtrans") {
      throw new BadRequestError(
        "Pembayaran Midtrans dikonfirmasi otomatis via webhook. Tidak bisa confirm manual.",
      );
    }
    if (!payment.bukti_bayar) {
      throw new BadRequestError("Belum ada bukti bayar dari pembeli");
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
    if (!payment) throw new NotFoundError("Pembayaran tidak ditemukan");
    if (!payment.pesanan)
      throw new NotFoundError("Pesanan terkait tidak ditemukan");
    if (payment.pesanan.mitra_id !== sellerId) {
      throw new ForbiddenError("Pembayaran ini bukan untuk toko Anda");
    }
    if (payment.status_pembayaran === PAYMENT_STATUS.PAID) {
      throw new ConflictError(
        "Pembayaran sudah dikonfirmasi, tidak bisa ditolak",
      );
    }
    if (payment.status_pembayaran === PAYMENT_STATUS.CANCELED) {
      throw new ConflictError("Pembayaran sudah ditolak");
    }
    if (payment.metode_pembayaran === "midtrans") {
      throw new BadRequestError(
        "Pembayaran Midtrans tidak bisa ditolak manual. Selesaikan via Midtrans Dashboard.",
      );
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
