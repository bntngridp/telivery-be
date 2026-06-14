import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET", "cheva_telivery_dev_secret_change_me"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
  SELLER_JWT_EXPIRES_IN: process.env.SELLER_JWT_EXPIRES_IN ?? "7d",
  OTP_GATEWAY_URL: process.env.OTP_GATEWAY_URL ?? "",
  OTP_GATEWAY_TOKEN: process.env.OTP_GATEWAY_TOKEN ?? "",
  OTP_DRY_RUN: (process.env.OTP_DRY_RUN ?? "true").toLowerCase() !== "false",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "bntngrid@gmail.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "admin123",
  ADMIN_JWT_EXPIRES_IN: process.env.ADMIN_JWT_EXPIRES_IN ?? "1d",
};

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
