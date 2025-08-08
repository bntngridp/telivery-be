import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = "./documents/";
    if (file.fieldname === "ownerKtpPhoto") {
      dest += "ktp";
    } else if (file.fieldname === "ownerFacePhoto") {
      dest += "owner_face";
    } else if (file.fieldname === "gambar") {
      dest += "products";
    } else {
      dest += "other";
    }
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Configure memory storage for buffer access
const memoryStorage = multer.memoryStorage();

// Create multer instances
export const uploadSellerDocs = multer({
  storage: diskStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Separate multer instance for product images with memory storage
export const uploadProductImage = multer({
  storage: memoryStorage, // Use memory storage to allow buffer access
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single("gambar");

// Debug middleware to log file information
export const logFileInfo = (req: Request, res: Response, next: NextFunction) => {
  console.log("File request:", {
    body: req.body,
    file: req.file,
    files: req.files
  });
  next();
};
