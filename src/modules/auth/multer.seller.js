"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSellerDocs = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Helper untuk menentukan folder tujuan berdasarkan fieldname
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let dest = "./documents/";
        if (file.fieldname === "ownerKtpPhoto") {
            dest += "ktp";
        }
        else if (file.fieldname === "ownerFacePhoto") {
            dest += "owner_face";
        }
        else {
            dest += "other";
        }
        // Pastikan folder ada
        fs_1.default.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
});
exports.uploadSellerDocs = (0, multer_1.default)({ storage });
