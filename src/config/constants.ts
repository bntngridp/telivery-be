export const ORDER_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    PROCESSING: 'processing',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELED: 'canceled',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_FLOW: OrderStatus[] = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
];

export const BUSINESS_TYPES = ['makanan', 'minuman', 'air_galon', 'laundry'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const CATEGORY_URL_TO_DB: Record<string, string> = {
    'makanan-minuman': 'MAKANAN_MINUMAN',
    'air-galon': 'AIR_GALON',
    laundry: 'LAUNDRY',
};

export const CATEGORY_DB_VALUES = ['MAKANAN_MINUMAN', 'AIR_GALON', 'LAUNDRY'] as const;
export type CategoryDb = (typeof CATEGORY_DB_VALUES)[number];

export const PAYMENT_METHODS = ['cash', 'transfer', 'e-wallet'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    CANCELED: 'canceled',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const SELLER_VERIFICATION = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export const STORE_STATUS = {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
} as const;

export const UPLOAD_PATHS = {
    KTP: './documents/ktp',
    OWNER_FACE: './documents/owner_face',
    PRODUCTS: './documents/products',
    PAYMENT_RECEIPTS: './documents/payment_receipts',
} as const;

export const UPLOAD_LIMITS = {
    SELLER_DOCS: 10 * 1024 * 1024,
    PRODUCT_IMAGE: 5 * 1024 * 1024,
    PAYMENT_RECEIPT: 5 * 1024 * 1024,
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
} as const;
