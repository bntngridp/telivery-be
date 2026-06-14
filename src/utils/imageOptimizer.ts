import sharp from "sharp";
import path from "path";
import fs from "fs";

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "png";
}

/**
 * Compress + resize image. Preserves original format unless format override given.
 * Returns the same input path (in-place overwrite).
 */
export async function optimizeImage(
  filePath: string,
  options: OptimizeOptions = {},
): Promise<string> {
  if (!fs.existsSync(filePath)) return filePath;

  const { maxWidth = 1280, maxHeight = 1280, quality = 80, format } = options;

  const ext = path.extname(filePath).toLowerCase();
  const detectedFormat = format ?? (ext === ".png" ? "png" : "jpeg");

  let pipeline = sharp(filePath).rotate().resize({
    width: maxWidth,
    height: maxHeight,
    fit: "inside",
    withoutEnlargement: true,
  });

  switch (detectedFormat) {
    case "png":
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality });
      break;
    case "jpeg":
    default:
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  const buffer = await pipeline.toBuffer();

  // If format change, write to new path
  if (format && ext !== `.${format}`) {
    const newPath = filePath.replace(ext, `.${format}`);
    fs.writeFileSync(newPath, buffer);
    fs.unlinkSync(filePath);
    return newPath;
  }

  fs.writeFileSync(filePath, buffer);
  return filePath;
}

/**
 * Generate thumbnail (smaller, lower quality) for product listings.
 */
export async function generateThumbnail(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) return filePath;

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const thumbPath = path.join(dir, `${base}_thumb${ext}`);

  await sharp(filePath)
    .rotate()
    .resize({ width: 320, height: 320, fit: "cover" })
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(thumbPath);

  return thumbPath;
}
