import multer, { FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { UPLOAD_LIMITS, UPLOAD_PATHS } from "../config/constants";
import { BadRequestError } from "../utils/errors";
import { sanitizeFileName } from "../utils/helpers";
import {
  optimizeImage,
  isImageMime,
  ImageProfile,
} from "../config/imageOptimization";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);
const ALLOWED_RECEIPT_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "application/pdf",
]);

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (_req: Request, file: Express.Multer.File, cb) => {
    let folder: string;
    switch (file.fieldname) {
      case "ownerKtpPhoto":
        folder = UPLOAD_PATHS.KTP;
        break;
      case "ownerFacePhoto":
        folder = UPLOAD_PATHS.OWNER_FACE;
        break;
      case "gambar":
        folder = UPLOAD_PATHS.PRODUCTS;
        break;
      case "receipt":
        folder = UPLOAD_PATHS.PAYMENT_RECEIPTS;
        break;
      default:
        folder = path.join("./documents", "other");
    }
    ensureDir(folder);
    cb(null, folder);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const base = sanitizeFileName(
      path.basename(file.originalname, path.extname(file.originalname)),
    );
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const ext = file.mimetype === "application/pdf" ? ".pdf" : ".tmp";
    cb(null, `${base}-${unique}${ext}`);
  },
});

function imageFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new BadRequestError(`Unsupported file type: ${file.mimetype}`));
}

function receiptFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (ALLOWED_RECEIPT_MIME.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new BadRequestError(`Unsupported file type: ${file.mimetype}`));
}

function buildProcessMiddleware(profile: ImageProfile) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const files: Express.Multer.File[] = [];
      if (req.file) files.push(req.file);
      if (req.files) {
        for (const arr of Object.values(
          req.files as Record<string, Express.Multer.File[]>,
        )) {
          if (Array.isArray(arr)) files.push(...arr);
        }
      }
      for (const f of files) {
        if (f.mimetype === "application/pdf") {
          const finalPath = f.path.replace(/\.tmp$/, ".pdf");
          if (finalPath !== f.path) {
            await fs.promises.rename(f.path, finalPath).catch(() => {});
            f.path = finalPath;
            f.filename = path.basename(finalPath);
          }
          continue;
        }
        if (!isImageMime(f.mimetype)) continue;
        const { outputPath } = await optimizeImage(f.path, profile);
        f.path = outputPath;
        f.filename = path.basename(outputPath);
        f.mimetype = "image/webp";
      }
      next();
    } catch (e) {
      next(e);
    }
  };
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

export const uploadPaymentReceipt = multer({
  storage,
  fileFilter: receiptFilter,
  limits: { fileSize: UPLOAD_LIMITS.PAYMENT_RECEIPT },
});

export const uploadProductImageSingle = uploadProductImage.single("gambar");
export const uploadSellerDocsFields = uploadSellerDocs.fields([
  { name: "ownerKtpPhoto", maxCount: 1 },
  { name: "ownerFacePhoto", maxCount: 1 },
]);
export const uploadPaymentReceiptSingle =
  uploadPaymentReceipt.single("receipt");

export const processKtpImage = buildProcessMiddleware("ktp");
export const processOwnerFaceImage = buildProcessMiddleware("ownerFace");
export const processProductImage = buildProcessMiddleware("product");
export const processReceiptImage = buildProcessMiddleware("receipt");
