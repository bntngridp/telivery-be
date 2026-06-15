import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { paymentService } from "../../src/modules/payment/payment.service";
import { mapMidtransStatusToInternal } from "../../src/config/midtrans";

describe("payment.service.verifyWebhookSignature", () => {
  const serverKey = "SB-Mid-server-DUMMY";
  const orderId = "ORDER-42-1700000000";
  const statusCode = "200";
  const grossAmount = "15000.00";

  function buildPayload(signature?: string) {
    return {
      transaction_time: "2024-01-01 00:00:00",
      transaction_status: "settlement",
      transaction_id: "tx-1",
      status_message: "Success",
      status_code: statusCode,
      signature_key: signature,
      payment_type: "qris",
      order_id: orderId,
      merchant_id: "M-1",
      gross_amount: grossAmount,
      fraud_status: "accept",
      currency: "IDR",
      settlement_time: "2024-01-01 00:00:05",
    };
  }

  function expectedSig(): string {
    return crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");
  }

  it("returns true when header signature matches SHA-512(order_id+status_code+gross_amount+serverKey)", () => {
    const sig = expectedSig();
    const ok = paymentService.verifyWebhookSignature(buildPayload(sig), sig);
    expect(ok).toBe(true);
  });

  it("returns false when signature_key in body mismatches", () => {
    const ok = paymentService.verifyWebhookSignature(
      buildPayload("bogus-signature"),
      "bogus-signature",
    );
    expect(ok).toBe(false);
  });

  it("returns false when payload has no signature_key and header is empty", () => {
    const ok = paymentService.verifyWebhookSignature(buildPayload(), "");
    expect(ok).toBe(false);
  });

  it("falls back to body signature_key when header is empty", () => {
    const sig = expectedSig();
    const ok = paymentService.verifyWebhookSignature(buildPayload(sig), "");
    expect(ok).toBe(true);
  });
});

describe("mapMidtransStatusToInternal", () => {
  it("maps capture/settlement to paid", () => {
    expect(mapMidtransStatusToInternal("capture")).toBe("paid");
    expect(mapMidtransStatusToInternal("settlement")).toBe("paid");
  });

  it("maps pending/authorize to pending", () => {
    expect(mapMidtransStatusToInternal("pending")).toBe("pending");
    expect(mapMidtransStatusToInternal("authorize")).toBe("pending");
  });

  it("maps deny/cancel/expire/refund/chargeback to canceled", () => {
    for (const s of ["deny", "cancel", "expire", "refund", "chargeback"]) {
      expect(mapMidtransStatusToInternal(s)).toBe("canceled");
    }
  });
});
