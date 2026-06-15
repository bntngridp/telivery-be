import { describe, it, expect } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../../src/app";
import { prisma } from "../../src/config/prisma";

const PREFIX = "/api";

function signBuyer(id: number) {
  return jwt.sign({ id, role: "pembeli" }, process.env.JWT_SECRET ?? "dev", {
    expiresIn: "1d",
  });
}

async function makeBuyer(opts: { password?: string; email?: string } = {}) {
  const email = opts.email ?? `b-${Date.now()}-${Math.random()}@test.com`;
  return prisma.pembeli.create({
    data: {
      full_name: "Buyer",
      phone_number: `08${Date.now()}${Math.floor(Math.random() * 1000)}`,
      email,
      password: opts.password ? await bcrypt.hash(opts.password, 4) : null,
    },
  });
}

describe("Refresh token & login buyer", () => {
  it("loginBuyer dengan email+password benar return access+refresh", async () => {
    const buyer = await makeBuyer({
      password: "password123",
      email: `login-${Date.now()}@test.com`,
    });
    const res = await request(app)
      .post(`${PREFIX}/auth/buyer/login`)
      .send({ email: buyer.email, password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.token).toBeDefined();
  });

  it("loginBuyer password salah return 401", async () => {
    const buyer = await makeBuyer({
      password: "password123",
      email: `wrong-${Date.now()}@test.com`,
    });
    const res = await request(app)
      .post(`${PREFIX}/auth/buyer/login`)
      .send({ email: buyer.email, password: "salah" });
    expect(res.status).toBe(401);
  });

  it("loginBuyer email tidak ada return 401", async () => {
    const res = await request(app)
      .post(`${PREFIX}/auth/buyer/login`)
      .send({ email: "ghost@test.com", password: "x" });
    expect(res.status).toBe(401);
  });

  it("refresh-token menukar refresh valid dengan token baru, refresh lama ter-revoke", async () => {
    const buyer = await makeBuyer({
      password: "password123",
      email: `ref-${Date.now()}@test.com`,
    });
    const login = await request(app)
      .post(`${PREFIX}/auth/buyer/login`)
      .send({ email: buyer.email, password: "password123" });
    const oldRefresh = login.body.data.refreshToken;

    const ref = await request(app)
      .post(`${PREFIX}/auth/refresh-token`)
      .send({ refreshToken: oldRefresh });
    expect(ref.status).toBe(200);
    expect(ref.body.data.refreshToken).not.toBe(oldRefresh);

    // Pakai refresh lama kedua kali -> 401
    const ref2 = await request(app)
      .post(`${PREFIX}/auth/refresh-token`)
      .send({ refreshToken: oldRefresh });
    expect(ref2.status).toBe(401);
  });

  it("refresh-token invalid return 401", async () => {
    const res = await request(app)
      .post(`${PREFIX}/auth/refresh-token`)
      .send({ refreshToken: "invalid-token-1234567890" });
    expect(res.status).toBe(401);
  });

  it("logout dengan JWT revoke refresh token", async () => {
    const buyer = await makeBuyer({
      password: "password123",
      email: `lo-${Date.now()}@test.com`,
    });
    const login = await request(app)
      .post(`${PREFIX}/auth/buyer/login`)
      .send({ email: buyer.email, password: "password123" });
    const refresh = login.body.data.refreshToken;
    const access = login.body.data.accessToken;

    const lo = await request(app)
      .post(`${PREFIX}/auth/logout`)
      .set("Authorization", `Bearer ${access}`)
      .send({ refreshToken: refresh });
    expect(lo.status).toBe(200);

    const ref = await request(app)
      .post(`${PREFIX}/auth/refresh-token`)
      .send({ refreshToken: refresh });
    expect(ref.status).toBe(401);
  });
});

describe("setBuyerPassword", () => {
  it("set password untuk buyer yang belum punya", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .patch(`${PREFIX}/auth/buyer/password`)
      .set("Authorization", `Bearer ${token}`)
      .send({ newPassword: "newpassword123" });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post(`${PREFIX}/auth/buyer/login`)
      .send({ email: buyer.email, password: "newpassword123" });
    expect(login.status).toBe(200);
  });

  it("ubah password butuh oldPassword yang benar", async () => {
    const buyer = await makeBuyer({
      password: "oldpass123",
      email: `chg-${Date.now()}@test.com`,
    });
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .patch(`${PREFIX}/auth/buyer/password`)
      .set("Authorization", `Bearer ${token}`)
      .send({ oldPassword: "wrong", newPassword: "newpass123" });
    expect(res.status).toBe(401);
  });
});
