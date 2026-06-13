import { z } from 'zod';

const idParam = z.object({
    id: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
        message: 'ID toko tidak valid',
    }),
});

export const storeIdParamSchema = idParam;

export const rejectStoreSchema = z.object({
    alasan: z.string().min(5, 'Alasan penolakan minimal 5 karakter').max(500),
});

export const adminPaginationSchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => Math.max(1, parseInt(v ?? '1', 10) || 1)),
    limit: z
        .string()
        .optional()
        .transform((v) => Math.min(50, Math.max(1, parseInt(v ?? '10', 10) || 10))),
});

export type StoreIdParams = z.infer<typeof storeIdParamSchema>;
export type RejectStoreDto = z.infer<typeof rejectStoreSchema>;
export type AdminPaginationQuery = z.infer<typeof adminPaginationSchema>;
