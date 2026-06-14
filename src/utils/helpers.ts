export function generateOtp(length = 5): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
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
