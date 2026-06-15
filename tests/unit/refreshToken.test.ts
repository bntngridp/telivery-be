import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { hashToken, generateOpaqueToken } from "../../src/utils/refreshToken";

describe("refreshToken utils", () => {
  it("hashToken deterministik", () => {
    const t = "abc";
    const h1 = hashToken(t);
    const h2 = hashToken(t);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it("hashToken match dengan sha256", () => {
    const t = "hello";
    const expected = crypto.createHash("sha256").update(t).digest("hex");
    expect(hashToken(t)).toBe(expected);
  });

  it("generateOpaqueToken return 128 hex chars (64 bytes)", () => {
    const t = generateOpaqueToken();
    expect(t).toHaveLength(128);
    expect(t).toMatch(/^[0-9a-f]+$/);
  });

  it("generateOpaqueToken selalu unique", () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) set.add(generateOpaqueToken());
    expect(set.size).toBe(100);
  });
});
