import { describe, it, expect } from "vitest";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import os from "os";
import { optimizeImage } from "../../src/config/imageOptimization";

async function makeJpegBuffer(w: number, h: number): Promise<Buffer> {
  return sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: { r: 100, g: 200, b: 50 },
    },
  })
    .jpeg()
    .toBuffer();
}

describe("optimizeImage", () => {
  it("mengompres JPEG ke WebP dengan width <= maxWidth", async () => {
    const buf = await makeJpegBuffer(2000, 1500);
    const tmp = path.join(os.tmpdir(), `test-${Date.now()}.jpg`);
    fs.writeFileSync(tmp, buf);
    const r = await optimizeImage(tmp, "product");
    expect(r.width).toBeLessThanOrEqual(800);
    expect(r.outputPath).toMatch(/\.webp$/);
    expect(fs.existsSync(tmp)).toBe(false);
    expect(fs.existsSync(r.outputPath)).toBe(true);
    fs.unlinkSync(r.outputPath);
  });

  it("withoutEnlargement: gambar 300x300 tidak di-upscale ke 800", async () => {
    const buf = await makeJpegBuffer(300, 300);
    const tmp = path.join(os.tmpdir(), `test-small-${Date.now()}.jpg`);
    fs.writeFileSync(tmp, buf);
    const r = await optimizeImage(tmp, "product");
    expect(r.width).toBe(300);
    expect(r.height).toBe(300);
    fs.unlinkSync(r.outputPath);
  });

  it("reject kalau dimensi < 200x200", async () => {
    const buf = await makeJpegBuffer(100, 100);
    const tmp = path.join(os.tmpdir(), `test-tiny-${Date.now()}.jpg`);
    fs.writeFileSync(tmp, buf);
    await expect(optimizeImage(tmp, "product")).rejects.toThrow(
      /terlalu kecil/i,
    );
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  });

  it("profile 'ktp' membatasi maxWidth 1200", async () => {
    const buf = await makeJpegBuffer(3000, 2000);
    const tmp = path.join(os.tmpdir(), `test-ktp-${Date.now()}.jpg`);
    fs.writeFileSync(tmp, buf);
    const r = await optimizeImage(tmp, "ktp");
    expect(r.width).toBeLessThanOrEqual(1200);
    fs.unlinkSync(r.outputPath);
  });
});
