import sharp from "sharp";
import fs from "fs";
import path from "path";

export type ImageProfile = "ktp" | "ownerFace" | "product" | "receipt";

export interface ImageProfileConfig {
  maxWidth: number;
  quality: number;
  outputFormat: "webp";
  minWidth: number;
  minHeight: number;
}

export const IMAGE_PROFILES: Record<ImageProfile, ImageProfileConfig> = {
  ktp: {
    maxWidth: 1200,
    quality: 85,
    outputFormat: "webp",
    minWidth: 200,
    minHeight: 200,
  },
  ownerFace: {
    maxWidth: 1200,
    quality: 85,
    outputFormat: "webp",
    minWidth: 200,
    minHeight: 200,
  },
  product: {
    maxWidth: 800,
    quality: 80,
    outputFormat: "webp",
    minWidth: 200,
    minHeight: 200,
  },
  receipt: {
    maxWidth: 1600,
    quality: 85,
    outputFormat: "webp",
    minWidth: 200,
    minHeight: 200,
  },
};

export interface OptimizeResult {
  outputPath: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
}

export async function optimizeImage(
  inputPath: string,
  profile: ImageProfile,
): Promise<OptimizeResult> {
  const config = IMAGE_PROFILES[profile];
  const originalSize = (await fs.promises.stat(inputPath)).size;

  const meta = await sharp(inputPath).metadata();
  if (
    (meta.width ?? 0) < config.minWidth ||
    (meta.height ?? 0) < config.minHeight
  ) {
    throw new Error(
      `Gambar terlalu kecil (${meta.width}x${meta.height}), minimal ${config.minWidth}x${config.minHeight} px`,
    );
  }

  const outputPath = inputPath.replace(/\.[^.]+$/, "") + ".webp";

  const pipeline = sharp(inputPath)
    .rotate()
    .resize({
      width: config.maxWidth,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: config.quality });

  const info = await pipeline.toFile(outputPath);

  await fs.promises.unlink(inputPath).catch(() => {});

  return {
    outputPath,
    originalSize,
    optimizedSize: info.size,
    width: info.width,
    height: info.height,
  };
}

export function isImageMime(mime: string): boolean {
  return /^image\/(jpeg|png|webp|jpg)$/.test(mime);
}
