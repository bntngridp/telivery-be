import nodemailer, { Transporter } from "nodemailer";
import { env } from "./env";

let transporter: Transporter | null = null;
let initialized = false;

export function getTransporter(): Transporter | null {
  if (initialized) return transporter;
  initialized = true;
  if (!env.SMTP_HOST) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

export function isEmailEnabled(): boolean {
  return !!env.SMTP_HOST;
}
