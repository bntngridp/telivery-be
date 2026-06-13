import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { UPLOAD_LIMITS, UPLOAD_PATHS } from '../config/constants';
import { BadRequestError } from '../utils/errors';
import { sanitizeFileName } from '../utils/helpers';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

function ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const storage = multer.diskStorage({
    destination: (_req: Request, file: Express.Multer.File, cb) => {
        let folder: string;
        switch (file.fieldname) {
            case 'ownerKtpPhoto':
                folder = UPLOAD_PATHS.KTP;
                break;
            case 'ownerFacePhoto':
                folder = UPLOAD_PATHS.OWNER_FACE;
                break;
            case 'gambar':
                folder = UPLOAD_PATHS.PRODUCTS;
                break;
            default:
                folder = path.join('./documents', 'other');
        }
        ensureDir(folder);
        cb(null, folder);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = sanitizeFileName(path.basename(file.originalname, ext));
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${base}-${unique}${ext}`);
    },
});

function imageFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
    if (ALLOWED_MIME.has(file.mimetype)) {
        cb(null, true);
        return;
    }
    cb(new BadRequestError(`Unsupported file type: ${file.mimetype}`));
}

export const uploadSellerDocs = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: UPLOAD_LIMITS.SELLER_DOCS },
});

export const uploadProductImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: UPLOAD_LIMITS.PRODUCT_IMAGE },
});

export const uploadProductImageSingle = uploadProductImage.single('gambar');
export const uploadSellerDocsFields = uploadSellerDocs.fields([
    { name: 'ownerKtpPhoto', maxCount: 1 },
    { name: 'ownerFacePhoto', maxCount: 1 },
]);
