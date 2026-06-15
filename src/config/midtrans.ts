import midtransClient from "midtrans-client";
import { env } from "./env";

/**
 * Singleton Midtrans Snap instance. Use `snap.createTransaction(...)` to mint
 * a Snap token, `coreApi.transaction.status(id)` to query, and verify webhook
 * signatures via crypto.createHmac('sha512', serverKey) on the raw body.
 */
export const snap = new midtransClient.Snap({
  isProduction: env.MIDTRANS_IS_PRODUCTION,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});

export const coreApi = new midtransClient.CoreApi({
  isProduction: env.MIDTRANS_IS_PRODUCTION,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
});

export const midtransConfig = {
  isProduction: env.MIDTRANS_IS_PRODUCTION,
  serverKey: env.MIDTRANS_SERVER_KEY,
  clientKey: env.MIDTRANS_CLIENT_KEY,
  notificationUrl: env.MIDTRANS_NOTIFICATION_URL,
};

/**
 * Map Midtrans `transaction_status` to our internal `status_pembayaran` enum.
 * Midtrans docs: https://docs.midtrans.com/reference/transaction-status
 */
export type MidtransStatus =
  | "capture"
  | "settlement"
  | "pending"
  | "deny"
  | "cancel"
  | "expire"
  | "refund"
  | "partial_refund"
  | "chargeback"
  | "partial_chargeback"
  | "authorize";

export function mapMidtransStatusToInternal(
  status: MidtransStatus | string,
): "paid" | "pending" | "canceled" {
  if (status === "capture" || status === "settlement") return "paid";
  if (status === "pending" || status === "authorize") return "pending";
  return "canceled";
}
