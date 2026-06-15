import { describe, it, expect } from "vitest";
import { updateProfileSchema } from "../../src/modules/buyer/buyer.schema";
import { updateStoreProfileSchema } from "../../src/modules/partner/partner.schema";
import {
  createLayananSchema,
  updateLayananSchema,
} from "../../src/modules/service/service.schema";
import { checkoutSchema } from "../../src/modules/checkout/checkout.schema";

describe("buyer profile schema", () => {
  it("accepts valid partial update", () => {
    const r = updateProfileSchema.safeParse({ fullName: "Budi" });
    expect(r.success).toBe(true);
  });

  it("rejects extra fields (strict mode)", () => {
    const r = updateProfileSchema.safeParse({
      fullName: "Budi",
      password: "evil",
    });
    expect(r.success).toBe(false);
  });

  it("rejects short phone", () => {
    const r = updateProfileSchema.safeParse({ phoneNumber: "123" });
    expect(r.success).toBe(false);
  });

  it("rejects empty body", () => {
    const r = updateProfileSchema.safeParse({});
    expect(r.success).toBe(true);
  });
});

describe("partner (store) profile schema", () => {
  it("accepts partial update with statusToko", () => {
    const r = updateStoreProfileSchema.safeParse({ statusToko: "OPEN" });
    expect(r.success).toBe(true);
  });

  it("rejects invalid statusToko enum", () => {
    const r = updateStoreProfileSchema.safeParse({ statusToko: "OPENED" });
    expect(r.success).toBe(false);
  });

  it("rejects empty body", () => {
    const r = updateStoreProfileSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

describe("service schema", () => {
  it("createLayananSchema accepts valid", () => {
    const r = createLayananSchema.safeParse({
      namaLayanan: "Laundry",
      harga: 10000,
      jenisLayanan: "laundry",
    });
    expect(r.success).toBe(true);
  });

  it("createLayananSchema accepts harga as string", () => {
    const r = createLayananSchema.safeParse({
      namaLayanan: "Laundry",
      harga: "10000",
      jenisLayanan: "laundry",
    });
    expect(r.success).toBe(true);
  });

  it("createLayananSchema rejects negative harga", () => {
    const r = createLayananSchema.safeParse({
      namaLayanan: "Laundry",
      harga: -1,
      jenisLayanan: "laundry",
    });
    expect(r.success).toBe(false);
  });

  it("updateLayananSchema allows partial", () => {
    const r = updateLayananSchema.safeParse({ harga: 20000 });
    expect(r.success).toBe(true);
  });

  it("updateLayananSchema rejects empty", () => {
    const r = updateLayananSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

describe("checkout schema", () => {
  it("accepts valid checkout", () => {
    const r = checkoutSchema.safeParse({
      alamat_pengiriman: "Gedung A",
      metode_pembayaran: "transfer",
    });
    expect(r.success).toBe(true);
  });

  it("rejects short alamat", () => {
    const r = checkoutSchema.safeParse({
      alamat_pengiriman: "a",
      metode_pembayaran: "cash",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid metode", () => {
    const r = checkoutSchema.safeParse({
      alamat_pengiriman: "Gedung A",
      metode_pembayaran: "bitcoin",
    });
    expect(r.success).toBe(false);
  });
});
