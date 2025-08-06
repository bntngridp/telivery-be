import multer from "multer";
import path from "path";
import fs from "fs";

// Helper untuk menentukan folder tujuan berdasarkan fieldname
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = "./documents/";
    if (file.fieldname === "ownerKtpPhoto") {
      dest += "ktp";
    } else if (file.fieldname === "ownerFacePhoto") {
      dest += "owner_face";
    } else {
      dest += "other";
    }
    // Pastikan folder ada
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

export const uploadSellerDocs = multer({ storage });

