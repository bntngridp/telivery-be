import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app";
import { prisma } from "../../src/config/prisma";

const PREFIX = "/api";

function signBuyer(id: number) {
  return jwt.sign({ id, role: "pembeli" }, process.env.JWT_SECRET ?? "dev", {
    expiresIn: "1d",
  });
}

async function makeBuyer() {
  return prisma.pembeli.create({
    data: {
      full_name: "B",
      phone_number: `08${Date.now()}${Math.floor(Math.random() * 1000)}`,
      email: `al-${Date.now()}-${Math.random()}@test.com`,
    },
  });
}

describe("CRUD Alamat", () => {
  it("create alamat -> 201, otomatis primary kalau pertama", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .post(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Kost", alamat_lengkap: "Jl. Test 123" });
    expect(res.status).toBe(201);
    expect(res.body.data.is_primary).toBe(true);
  });

  it("create alamat kedua, is_primary=false kalau tidak set", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    await request(app)
      .post(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Kost", alamat_lengkap: "Jl. A" });
    const r2 = await request(app)
      .post(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Rumah", alamat_lengkap: "Jl. B" });
    expect(r2.status).toBe(201);
    expect(r2.body.data.is_primary).toBe(false);
  });

  it("create dengan is_primary=true unset primary di alamat lain", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    const a1 = await request(app)
      .post(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Kost", alamat_lengkap: "Jl. A" });
    const a2 = await request(app)
      .post(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Rumah", alamat_lengkap: "Jl. B", is_primary: true });
    expect(a2.body.data.is_primary).toBe(true);

    const list = await request(app)
      .get(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`);
    const primaryCount = list.body.data.filter(
      (a: { is_primary: boolean }) => a.is_primary,
    ).length;
    expect(primaryCount).toBe(1);
  });

  it("get alamat user lain return 403", async () => {
    const owner = await makeBuyer();
    const intruder = await makeBuyer();
    const ownerAlamat = await prisma.alamat.create({
      data: {
        user_id: owner.user_id,
        label: "Kost",
        alamat_lengkap: "Jl. Test",
      },
    });
    const token = signBuyer(intruder.user_id);
    const res = await request(app)
      .get(`${PREFIX}/buyer/alamat/${ownerAlamat.alamat_id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("setPrimary hanya set 1 primary", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    const a1 = await request(app)
      .post(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Kost A", alamat_lengkap: "Jl. Test A No 1" });
    expect(a1.body.data?.alamat_id).toBeDefined();
    const a2 = await request(app)
      .post(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Rumah B", alamat_lengkap: "Jl. Test B No 2" });
    expect(a2.body.data?.alamat_id).toBeDefined();

    await request(app)
      .patch(`${PREFIX}/buyer/alamat/${a2.body.data.alamat_id}/primary`)
      .set("Authorization", `Bearer ${token}`);

    const list = await request(app)
      .get(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`);
    const primaryCount = list.body.data.filter(
      (a: { is_primary: boolean }) => a.is_primary,
    ).length;
    expect(primaryCount).toBe(1);
  });

  it("delete primary otomatis pindah ke alamat terbaru", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    const a1 = await request(app)
      .post(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Kost A", alamat_lengkap: "Jl. Test A No 1" });
    expect(a1.body.data?.alamat_id).toBeDefined();
    await new Promise((r) => setTimeout(r, 5));
    const a2 = await request(app)
      .post(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`)
      .send({ label: "Rumah B", alamat_lengkap: "Jl. Test B No 2" });
    expect(a2.body.data?.alamat_id).toBeDefined();

    await request(app)
      .delete(`${PREFIX}/buyer/alamat/${a1.body.data.alamat_id}`)
      .set("Authorization", `Bearer ${token}`);

    const list = await request(app)
      .get(`${PREFIX}/buyer/alamat`)
      .set("Authorization", `Bearer ${token}`);
    expect(list.body.data.length).toBe(1);
    expect(list.body.data[0].is_primary).toBe(true);
  });
});
