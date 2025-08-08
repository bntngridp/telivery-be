"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logFileInfo = exports.uploadProductImage = exports.uploadSellerDocs = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const diskStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let dest = "./documents/";
        if (file.fieldname === "ownerKtpPhoto") {
            dest += "ktp";
        }
        else if (file.fieldname === "ownerFacePhoto") {
            dest += "owner_face";
        }
        else if (file.fieldname === "gambar") {
            dest += "products";
        }
        else {
            dest += "other";
        }
        fs_1.default.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});
// Configure memory storage for buffer access
const memoryStorage = multer_1.default.memoryStorage();
// Create multer instances
exports.uploadSellerDocs = (0, multer_1.default)({
    storage: diskStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
// Separate multer instance for product images with memory storage
exports.uploadProductImage = (0, multer_1.default)({
    storage: memoryStorage, // Use memory storage to allow buffer access
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single("gambar");
// Debug middleware to log file information
const logFileInfo = (req, res, next) => {
    console.log("File request:", {
        body: req.body,
        file: req.file,
        files: req.files
    });
    next();
};
exports.logFileInfo = logFileInfo;
