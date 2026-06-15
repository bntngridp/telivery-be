import crypto from "crypto";

export function generateOtp(length = 5): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const range = max - min + 1;
  const value = crypto.randomInt(0, range) + min;
  return String(value);
}

export function deleteFileIfExists(filePath?: string | null): void {
  if (!filePath) return;
  try {
    const fs = require("fs") as typeof import("fs");
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // swallow — best-effort cleanup
  }
}

export function toNumber(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function toInt(value: unknown, fallback = 0): number {
  return Math.trunc(toNumber(value, fallback));
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function generateUniqueId(): string {
  return crypto.randomBytes(8).toString("hex");
}
