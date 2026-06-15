import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { swaggerSpec } from "../../src/config/swagger";

describe("Swagger", () => {
  it("GET /api/docs.json return valid OpenAPI 3", async () => {
    const res = await request(app).get("/api/docs.json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toBe("Cheva-Telivery API");
  });

  it("swagger spec include path Auth login", () => {
    expect(swaggerSpec.paths["/api/auth/buyer/login"]).toBeDefined();
    expect(swaggerSpec.paths["/api/auth/refresh-token"]).toBeDefined();
  });

  it("swagger spec include schema Pesanan dengan ongkir", () => {
    const pesanan = swaggerSpec.components?.schemas?.Pesanan;
    expect(pesanan).toBeDefined();
    const props = pesanan.properties as Record<string, { type?: string }>;
    expect(props.ongkir).toBeDefined();
    expect(props.total_harga).toBeDefined();
  });

  it("swagger spec include path Order buyer", () => {
    expect(swaggerSpec.paths["/api/buyer/orders"]).toBeDefined();
    expect(swaggerSpec.paths["/api/buyer/alamat"]).toBeDefined();
  });
});
