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

  // Midtrans Snap
  MIDTRANS_SERVER_KEY: required("MIDTRANS_SERVER_KEY", "SB-Mid-server-DUMMY"),
  MIDTRANS_CLIENT_KEY: required("MIDTRANS_CLIENT_KEY", "SB-Mid-client-DUMMY"),
  MIDTRANS_IS_PRODUCTION:
    (process.env.MIDTRANS_IS_PRODUCTION ?? "false").toLowerCase() === "true",
  MIDTRANS_NOTIFICATION_URL: process.env.MIDTRANS_NOTIFICATION_URL ?? "",

  // Refresh token (#13)
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d",
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS ?? 10),

  // Email (#16)
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 2525),
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM: process.env.SMTP_FROM ?? "noreply@telivery.local",
};

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
