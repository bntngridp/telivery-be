import { z } from "zod";

const idParam = z.object({
  id: z.string().refine((v) => /^\d+$/.test(v) && Number(v) > 0, {
    message: "ID notifikasi tidak valid",
  }),
});

export const notificationIdSchema = idParam;

export const notificationPaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v ?? "1", 10) || 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(50, Math.max(1, parseInt(v ?? "10", 10) || 10))),
});

export const NOTIFICATION_TYPES = [
  "new_order",
  "order_completed",
  "order_accepted",
  "order_rejected",
  "order_processing",
  "order_delivered",
  "order_canceled",
  "new_review",
] as const;

export const notificationTypeFilterSchema = z.object({
  tipe: z.enum(NOTIFICATION_TYPES).optional(),
});

export type NotificationIdParams = z.infer<typeof notificationIdSchema>;
export type NotificationPaginationQuery = z.infer<
  typeof notificationPaginationSchema
>;
export type NotificationTypeFilter = z.infer<
  typeof notificationTypeFilterSchema
>;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
