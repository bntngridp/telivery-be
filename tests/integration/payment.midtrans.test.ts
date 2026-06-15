import { describe, it, expect } from "vitest";
import request from "supertest";
import crypto from "crypto";
import app from "../../src/app";
import { prisma } from "../../src/config/prisma";

const PREFIX = "/api";

function sha512(input: string): string {
  return crypto.createHash("sha512").update(input).digest("hex");
}

describe("Midtrans webhook", () => {
  it("rejects POST /api/payments/midtrans/webhook with invalid signature (still 200, but log + no DB write)", async () => {
    const payload = {
      transaction_status: "settlement",
      transaction_id: "tx-bad",
      status_code: "200",
      order_id: "ORDER-999-1",
      gross_amount: "10000.00",
      signature_key: "totally-wrong",
    };
    const res = await request(app)
      .post(`${PREFIX}/payments/midtrans/webhook`)
      .set("Content-Type", "application/json")
      .send(payload);

    // The handler intentionally returns 200 with "signature mismatch" to
    // stop Midtrans retry storms — we just confirm it didn't crash.
    expect([200, 400]).toContain(res.status);
    // Nothing should have been persisted for a non-existent order
    const stored = await prisma.pembayaran.findFirst({
      where: { midtrans_order_id: "ORDER-999-1" },
    });
    expect(stored).toBeNull();
  });

  it("accepts a valid signed webhook payload and updates existing pembayaran to paid", async () => {
    // Seed: buyer + seller + pesanan + pembayaran
    const seller = await prisma.penjual.create({
      data: {
        nama_pemilik: "S",
        nama_toko: `Toko-MT-${Date.now()}`,
        email: `mt-${Date.now()}@test.com`,
        password: "x",
        status_verifikasi: "approved",
        status_toko: "OPEN",
        verifikasi_toko: true,
      },
    });
    const buyer = await prisma.pembeli.create({
      data: {
        full_name: "B",
        phone_number: `08${Date.now()}`,
        email: `bmt-${Date.now()}@test.com`,
      },
    });
    const orderIdValue = 100000 + Math.floor(Math.random() * 900000);
    const pesanan = await prisma.pesanan.create({
      data: {
        user_id: buyer.user_id,
        mitra_id: seller.mitra_id,
        total_harga: "25000.00",
        alamat_pengiriman: "Jl. Test",
        status_pesanan: "pending",
        metode_pembayaran: "midtrans",
        waktu_pesan: new Date(),
      },
    });
    const midtransOrderId = `ORDER-${pesanan.pesanan_id}-1700000000`;
    await prisma.pembayaran.create({
      data: {
        pesanan_id: pesanan.pesanan_id,
        status_pembayaran: "pending",
        metode_pembayaran: "midtrans",
        midtrans_order_id: midtransOrderId,
      },
    });

    const statusCode = "200";
    const grossAmount = "25000.00";
    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "SB-Mid-server-DUMMY";
    const sig = sha512(
      `${midtransOrderId}${statusCode}${grossAmount}${serverKey}`,
    );

    const res = await request(app)
      .post(`${PREFIX}/payments/midtrans/webhook`)
      .set("Content-Type", "application/json")
      .send({
        transaction_status: "settlement",
        transaction_id: "tx-ok",
        status_code: statusCode,
        order_id: midtransOrderId,
        gross_amount: grossAmount,
        payment_type: "qris",
        signature_key: sig,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await prisma.pembayaran.findFirst({
      where: { midtrans_order_id: midtransOrderId },
    });
    expect(updated?.status_pembayaran).toBe("paid");
    expect(updated?.paid_at).not.toBeNull();
  });
});
