import { z } from 'zod';

const idParam = z
    .string()
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, { message: 'ID harus berupa angka positif' });

export const pesananIdParamSchema = z.object({
    pesananId: idParam,
});

export const pembayaranIdParamSchema = z.object({
    pembayaranId: idParam,
});

export const rejectPaymentBodySchema = z.object({
    catatan: z.string().min(3, 'Catatan penolakan minimal 3 karakter').max(500),
});

export type PesananIdParam = z.infer<typeof pesananIdParamSchema>;
export type PembayaranIdParam = z.infer<typeof pembayaranIdParamSchema>;
export type RejectPaymentBody = z.infer<typeof rejectPaymentBodySchema>;
