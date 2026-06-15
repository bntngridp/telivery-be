import { z } from "zod";

const idParam = z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
  message: "ID harus berupa angka positif",
});

export const pesananIdParamSchema = z.object({
  pesananId: idParam,
});

export const pembayaranIdParamSchema = z.object({
  pembayaranId: idParam,
});

export const rejectPaymentBodySchema = z.object({
  catatan: z.string().min(3, "Catatan penolakan minimal 3 karakter").max(500),
});

// Midtrans webhook payload (subset of fields we care about)
export const midtransWebhookSchema = z.object({
  transaction_time: z.string().optional(),
  transaction_status: z.string(),
  transaction_id: z.string(),
  status_message: z.string().optional(),
  status_code: z.string(),
  signature_key: z.string().optional(),
  payment_type: z.string().optional(),
  order_id: z.string(),
  merchant_id: z.string().optional(),
  gross_amount: z.string(),
  fraud_status: z.string().optional(),
  currency: z.string().optional(),
  settlement_time: z.string().optional(),
});

export type MidtransWebhookPayload = z.infer<typeof midtransWebhookSchema>;
export type PesananIdParam = z.infer<typeof pesananIdParamSchema>;
export type PembayaranIdParam = z.infer<typeof pembayaranIdParamSchema>;
export type RejectPaymentBody = z.infer<typeof rejectPaymentBodySchema>;
