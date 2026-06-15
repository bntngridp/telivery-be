import crypto from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { UnauthorizedError } from "./errors";

export interface RefreshTokenRecord {
  token_id: number;
  user_id: number | null;
  mitra_id: number | null;
  expires_at: Date;
  revoked_at: Date | null;
}

function parseDurationToMs(input: string): number {
  const m = /^(\d+)([smhd])$/.exec(input);
  if (!m) return 30 * 24 * 60 * 60 * 1000; // default 30d
  const n = Number(m[1]);
  switch (m[2]) {
    case "s":
      return n * 1000;
    case "m":
      return n * 60 * 1000;
    case "h":
      return n * 60 * 60 * 1000;
    case "d":
      return n * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export async function createRefreshToken(opts: {
  userId?: number;
  mitraId?: number;
  userAgent?: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = generateOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + parseDurationToMs(env.REFRESH_TOKEN_EXPIRES_IN),
  );
  await prisma.refresh_token.create({
    data: {
      user_id: opts.userId ?? null,
      mitra_id: opts.mitraId ?? null,
      token_hash: tokenHash,
      expires_at: expiresAt,
      user_agent: opts.userAgent?.slice(0, 255) ?? null,
    },
  });
  return { token, expiresAt };
}

export async function findActiveRefreshToken(
  token: string,
): Promise<RefreshTokenRecord> {
  const tokenHash = hashToken(token);
  const record = await prisma.refresh_token.findUnique({
    where: { token_hash: tokenHash },
  });
  if (!record) throw new UnauthorizedError("Refresh token tidak valid");
  if (record.revoked_at)
    throw new UnauthorizedError("Refresh token sudah di-revoke");
  if (record.expires_at.getTime() < Date.now())
    throw new UnauthorizedError("Refresh token sudah expired");
  return record;
}

export async function rotateRefreshToken(
  oldToken: string,
  opts: { userId?: number; mitraId?: number; userAgent?: string },
): Promise<{ token: string; expiresAt: Date; record: RefreshTokenRecord }> {
  const record = await findActiveRefreshToken(oldToken);
  const { token, expiresAt } = await createRefreshToken(opts);
  await prisma.refresh_token.update({
    where: { token_id: record.token_id },
    data: { revoked_at: new Date() },
  });
  return { token, expiresAt, record };
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  try {
    await prisma.refresh_token.update({
      where: { token_hash: tokenHash },
      data: { revoked_at: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

export function refreshTokenExpiresInSeconds(): number {
  return Math.floor(parseDurationToMs(env.REFRESH_TOKEN_EXPIRES_IN) / 1000);
}
