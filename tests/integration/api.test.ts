import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../../src/app";
import { prisma } from "../../src/config/prisma";

const PREFIX = "/api";

async function makeSeller(opts: { verified?: boolean; open?: boolean } = {}) {
  return prisma.penjual.create({
    data: {
      nama_pemilik: "Test Seller",
      nama_toko: `Toko ${Date.now()}-${Math.random()}`,
      email: `seller-${Date.now()}-${Math.random()}@test.com`,
      password: await bcrypt.hash("password123", 10),
      phone_number: `08${Math.floor(Math.random() * 1e10)}`,
      status_verifikasi: opts.verified ? "approved" : "pending",
      status_toko: opts.open === false ? "CLOSED" : "OPEN",
      verifikasi_toko: !!opts.verified,
      jenis_usaha: "makanan",
      alamat_toko: "Jl. Test",
    },
  });
}

async function makeBuyer() {
  return prisma.pembeli.create({
    data: {
      full_name: "Test Buyer",
      phone_number: `08${Math.floor(Math.random() * 1e10)}`,
      email: `buyer-${Date.now()}-${Math.random()}@test.com`,
      delivery_address: "Jl. Buyer",
    },
  });
}

function signBuyer(id: number) {
  return jwt.sign({ id, role: "pembeli" }, process.env.JWT_SECRET ?? "dev", {
    expiresIn: "1d",
  });
}

function signSeller(id: number) {
  return jwt.sign(
    { sellerId: id, role: "penjual" },
    process.env.JWT_SECRET ?? "dev",
    { expiresIn: "7d" },
  );
}

function signAdmin() {
  return jwt.sign(
    { adminId: -1, role: "admin" },
    process.env.JWT_SECRET ?? "dev",
    { expiresIn: "1d" },
  );
}

describe("System endpoints", () => {
  it("GET / returns welcome", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Cheva Telivery");
  });

  it("GET /health returns 200 with DB connected", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.database).toBe("connected");
    expect(res.body.status).toBe("healthy");
  });

  it("GET /api/nope returns 404 with notFoundHandler format", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("not found");
  });
});

describe("Auth endpoints", () => {
  it("POST /api/auth/admin/login with env creds returns token", async () => {
    const res = await request(app)
      .post(`${PREFIX}/auth/admin/login`)
      .send({ email: "bntngrid@gmail.com", password: "admin123" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.success).toBe(true);
  });

  it("POST /api/auth/admin/login with wrong creds returns 401", async () => {
    const res = await request(app)
      .post(`${PREFIX}/auth/admin/login`)
      .send({ email: "bntngrid@gmail.com", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/salah|invalid/i);
  });

  it("POST /api/auth/admin/login missing fields returns 400", async () => {
    const res = await request(app).post(`${PREFIX}/auth/admin/login`).send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/seller/login with bad body returns 400", async () => {
    const res = await request(app).post(`${PREFIX}/auth/seller/login`).send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/seller/login non-existent email returns 404", async () => {
    const res = await request(app)
      .post(`${PREFIX}/auth/seller/login`)
      .send({ email: "nonexistent@test.com", password: "x" });
    expect(res.status).toBe(404);
  });

  it("POST /api/auth/seller/login valid creds returns token + updates last_login_at", async () => {
    const seller = await makeSeller({ verified: true, open: true });
    console.log("Created seller email:", seller.email);
    console.log(
      "All sellers in DB:",
      await prisma.penjual.findMany({ select: { email: true } }),
    );
    const res = await request(app)
      .post(`${PREFIX}/auth/seller/login`)
      .send({ email: seller.email, password: "password123" });
    if (res.status !== 200) {
      console.log("Login failed body:", res.body);
    }
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();

    // Wait briefly for fire-and-forget update
    await new Promise((r) => setTimeout(r, 100));
    const updated = await prisma.penjual.findUnique({
      where: { mitra_id: seller.mitra_id },
    });
    expect(updated?.last_login_at).not.toBeNull();
  });

  it("POST /api/auth/buyer/register with valid data returns 201", async () => {
    const phone = `08${Math.floor(Math.random() * 1e10)}`;
    const res = await request(app)
      .post(`${PREFIX}/auth/buyer/register`)
      .send({
        fullName: "Budi Test",
        phoneNumber: phone,
        birthDate: "2000-01-01",
        domicile: "Jakarta",
        faculty: "FTI",
        major: "TI",
        address: "Jl. Test No. 1",
        email: `register-${Date.now()}@test.com`,
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toContain("OTP");

    // Verify buyer created
    const created = await prisma.pembeli.findFirst({
      where: { phone_number: phone },
    });
    expect(created).not.toBeNull();
  });

  it("POST /api/auth/buyer/register with duplicate phone returns 409", async () => {
    const phone = `08${Math.floor(Math.random() * 1e10)}`;
    const email = `dup-${Date.now()}@test.com`;
    const body = {
      fullName: "Budi 1",
      phoneNumber: phone,
      birthDate: "2000-01-01",
      domicile: "Jakarta",
      faculty: "FTI",
      major: "TI",
      address: "Jl. Test No. 1",
      email,
    };
    await request(app).post(`${PREFIX}/auth/buyer/register`).send(body);
    const res = await request(app)
      .post(`${PREFIX}/auth/buyer/register`)
      .send({ ...body, email: `dup2-${Date.now()}@test.com` });
    expect(res.status).toBe(409);
  });

  it("POST /api/auth/buyer/register with invalid data returns 400", async () => {
    const res = await request(app).post(`${PREFIX}/auth/buyer/register`).send({
      fullName: "X",
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

describe("Admin endpoints (role enforcement)", () => {
  it("GET /api/admin/stores/pending no auth returns 401", async () => {
    const res = await request(app).get(`${PREFIX}/admin/stores/pending`);
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stores/pending with buyer token returns 401", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .get(`${PREFIX}/admin/stores/pending`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stores/pending with admin token returns 200", async () => {
    await makeSeller({ verified: false });
    await makeSeller({ verified: false });
    const token = signAdmin();
    const res = await request(app)
      .get(`${PREFIX}/admin/stores/pending`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
  });

  it("PATCH /api/admin/stores/:id/approve with reason-less body is fine (approve has no body)", async () => {
    const seller = await makeSeller({ verified: false });
    const token = signAdmin();
    const res = await request(app)
      .patch(`${PREFIX}/admin/stores/${seller.mitra_id}/approve`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const updated = await prisma.penjual.findUnique({
      where: { mitra_id: seller.mitra_id },
    });
    expect(updated?.status_verifikasi).toBe("approved");
  });

  it("PATCH /api/admin/stores/:id/reject with short reason returns 400", async () => {
    const seller = await makeSeller({ verified: false });
    const token = signAdmin();
    const res = await request(app)
      .patch(`${PREFIX}/admin/stores/${seller.mitra_id}/reject`)
      .set("Authorization", `Bearer ${token}`)
      .send({ alasan: "x" });
    expect(res.status).toBe(400);
  });

  it("PATCH /api/admin/stores/:id/reject with valid reason returns 200 + notifikasi", async () => {
    const seller = await makeSeller({ verified: false });
    const token = signAdmin();
    const res = await request(app)
      .patch(`${PREFIX}/admin/stores/${seller.mitra_id}/reject`)
      .set("Authorization", `Bearer ${token}`)
      .send({ alasan: "Dokumen tidak valid, mohon upload ulang" });
    expect(res.status).toBe(200);
    const notif = await prisma.notifikasi.findFirst({
      where: { mitra_id: seller.mitra_id, tipe: "store_rejected" },
    });
    expect(notif).not.toBeNull();
  });

  it("PATCH /api/admin/stores/:id/approve twice returns 409", async () => {
    const seller = await makeSeller({ verified: false });
    const token = signAdmin();
    await request(app)
      .patch(`${PREFIX}/admin/stores/${seller.mitra_id}/approve`)
      .set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .patch(`${PREFIX}/admin/stores/${seller.mitra_id}/approve`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(409);
  });
});

describe("Buyer Profile endpoints", () => {
  it("GET /api/buyer/profile no auth returns 401", async () => {
    const res = await request(app).get(`${PREFIX}/buyer/profile`);
    expect(res.status).toBe(401);
  });

  it("GET /api/buyer/profile with buyer token returns 200", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .get(`${PREFIX}/buyer/profile`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(buyer.email);
  });

  it("PATCH /api/buyer/profile with strict mode rejects password field", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .patch(`${PREFIX}/buyer/profile`)
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Budi X", password: "evil" });
    expect(res.status).toBe(400);
  });

  it("PATCH /api/buyer/profile with valid data updates DB", async () => {
    const buyer = await makeBuyer();
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .patch(`${PREFIX}/buyer/profile`)
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Budi Updated", faculty: "FTE" });
    expect(res.status).toBe(200);
    const updated = await prisma.pembeli.findUnique({
      where: { user_id: buyer.user_id },
    });
    expect(updated?.full_name).toBe("Budi Updated");
    expect(updated?.faculty).toBe("FTE");
  });
});

describe("Notification endpoints (role isolation)", () => {
  it("GET /api/buyer/notifications with seller token returns 401", async () => {
    const seller = await makeSeller();
    const token = signSeller(seller.mitra_id);
    const res = await request(app)
      .get(`${PREFIX}/buyer/notifications`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("GET /api/buyer/notifications with valid token returns list", async () => {
    const buyer = await makeBuyer();
    await prisma.notifikasi.create({
      data: {
        user_id: buyer.user_id,
        isi_pesan: "Test",
        waktu_kirim: new Date(),
        tipe: "order_accepted",
        status_dibaca: false,
      },
    });
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .get(`${PREFIX}/buyer/notifications`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    // After my Issue #8 fix, controller wraps response: data: { notifications: [...], pagination: ... }
    const notifList = Array.isArray(res.body.data)
      ? res.body.data
      : res.body.data?.notifications;
    expect(notifList).toHaveLength(1);
    expect(res.body.pagination).toBeDefined();
  });

  it("GET /api/buyer/notifications/unread-count returns count", async () => {
    const buyer = await makeBuyer();
    await prisma.notifikasi.create({
      data: {
        user_id: buyer.user_id,
        isi_pesan: "Test 1",
        waktu_kirim: new Date(),
        tipe: "order_accepted",
        status_dibaca: false,
      },
    });
    await prisma.notifikasi.create({
      data: {
        user_id: buyer.user_id,
        isi_pesan: "Test 2",
        waktu_kirim: new Date(),
        tipe: "order_delivered",
        status_dibaca: true,
      },
    });
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .get(`${PREFIX}/buyer/notifications/unread-count`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.unread).toBe(1);
  });

  it("PATCH /api/buyer/notifications/:id/read marks as read", async () => {
    const buyer = await makeBuyer();
    const notif = await prisma.notifikasi.create({
      data: {
        user_id: buyer.user_id,
        isi_pesan: "Test",
        waktu_kirim: new Date(),
        tipe: "order_accepted",
        status_dibaca: false,
      },
    });
    const token = signBuyer(buyer.user_id);
    const res = await request(app)
      .patch(`${PREFIX}/buyer/notifications/${notif.notifikasi_id}/read`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const updated = await prisma.notifikasi.findUnique({
      where: { notifikasi_id: notif.notifikasi_id },
    });
    expect(updated?.status_dibaca).toBe(true);
  });

  it("cannot mark another buyer notification (returns 404)", async () => {
    const buyerA = await makeBuyer();
    const buyerB = await makeBuyer();
    const notif = await prisma.notifikasi.create({
      data: {
        user_id: buyerA.user_id,
        isi_pesan: "For A",
        waktu_kirim: new Date(),
        tipe: "order_accepted",
        status_dibaca: false,
      },
    });
    const tokenB = signBuyer(buyerB.user_id);
    const res = await request(app)
      .patch(`${PREFIX}/buyer/notifications/${notif.notifikasi_id}/read`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});

describe("Cart endpoints", () => {
  let buyerToken: string;
  let buyerId: number;
  let sellerId: number;
  let produkId: number;
  let layananId: number;

  beforeEach(async () => {
    // Each test in this block seeds its own data
    const buyer = await makeBuyer();
    const seller = await makeSeller({ verified: true, open: true });
    const kategori = await prisma.kategori.create({
      data: { nama_kategori: "MAKANAN_MINUMAN" },
    });
    const produk = await prisma.produk.create({
      data: {
        nama_produk: "Test Nasi",
        harga: "15000",
        stok_produk: 100,
        status_ketersediaan: true,
        mitra_id: seller.mitra_id,
        id_kategori: kategori.id_kategori,
      },
    });
    const layanan = await prisma.layanan.create({
      data: {
        nama_layanan: "Laundry",
        harga: "12000",
        jenis_layanan: "laundry",
        mitra_id: seller.mitra_id,
      },
    });
    buyerId = buyer.user_id;
    sellerId = seller.mitra_id;
    produkId = produk.produk_id;
    layananId = layanan.layanan_id;
    buyerToken = signBuyer(buyerId);
  });

  it("POST /api/buyer/cart/items adds produk", async () => {
    const res = await request(app)
      .post(`${PREFIX}/buyer/cart/items`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ produkId, jumlah: 2 });
    if (res.status !== 201) {
      console.error("CART DEBUG add:", res.body);
      console.error(
        "  produkId:",
        produkId,
        "sellerId:",
        sellerId,
        "buyerId:",
        buyerId,
      );
    }
    expect(res.status).toBe(201);
  });

  it("POST same produk merges jumlah", async () => {
    // Add first item
    const r1 = await request(app)
      .post(`${PREFIX}/buyer/cart/items`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ produkId, jumlah: 2 });
    if (r1.status !== 201) console.error("CART r1:", r1.body);

    // Add same item
    const r2 = await request(app)
      .post(`${PREFIX}/buyer/cart/items`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ produkId, jumlah: 3 });
    if (r2.status !== 201) console.error("CART r2:", r2.body);

    const res = await request(app)
      .get(`${PREFIX}/buyer/cart`)
      .set("Authorization", `Bearer ${buyerToken}`);
    if (res.body.data.items.length === 0) console.error("CART GET:", res.body);
    const item = res.body.data.items.find(
      (i: { produk_id: number }) => i.produk_id === produkId,
    );
    expect(item?.jumlah).toBe(5);
  });

  it("POST with both produkId+layananId returns 400 (refine)", async () => {
    const res = await request(app)
      .post(`${PREFIX}/buyer/cart/items`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ produkId, layananId, jumlah: 1 });
    expect(res.status).toBe(400);
  });

  it("GET /api/buyer/cart returns total + grouped by store", async () => {
    // Pre-seed
    await request(app)
      .post(`${PREFIX}/buyer/cart/items`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ produkId, jumlah: 2 });
    const res = await request(app)
      .get(`${PREFIX}/buyer/cart`)
      .set("Authorization", `Bearer ${buyerToken}`);
    if (res.body.data.total === 0) console.error("CART GET total:", res.body);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThan(0);
    expect(res.body.data.groupedByStore).toBeDefined();
  });

  it("DELETE /api/buyer/cart clears all", async () => {
    const res = await request(app)
      .delete(`${PREFIX}/buyer/cart`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
  });
});

describe("Store filter integration", () => {
  it("GET /api/buyer/stores returns only approved+open", async () => {
    const approvedOpen = await makeSeller({ verified: true, open: true });
    const pending = await makeSeller({ verified: false, open: true });
    const closed = await makeSeller({ verified: true, open: false });
    const res = await request(app).get(`${PREFIX}/buyer/stores`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((s: { mitra_id: number }) => s.mitra_id);
    expect(ids).toContain(approvedOpen.mitra_id);
    expect(ids).not.toContain(pending.mitra_id);
    expect(ids).not.toContain(closed.mitra_id);
  });
});

describe("Rate limiting", () => {
  it("OTP endpoint enforces 5 req/15min", async () => {
    // Hit 7 times in a row, expect at least one 429
    let saw429 = false;
    for (let i = 0; i < 7; i++) {
      const res = await request(app)
        .post(`${PREFIX}/auth/buyer/request-otp`)
        .send({ phoneNumber: "081999999999" });
      if (res.status === 429) {
        saw429 = true;
        expect(res.body.message).toContain("Terlalu banyak");
        break;
      }
    }
    expect(saw429).toBe(true);
  }, 30000);
});
