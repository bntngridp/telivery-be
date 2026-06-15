import { describe, it, expect } from "vitest";
import type { Response } from "express";
import { success, created, paginated, fail } from "../../src/utils/response";

function mockRes(): Response {
  const res: Partial<Response> = {
    statusCode: 200,
    body: undefined,
  };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  }) as Response["status"];
  res.json = vi.fn((payload: unknown) => {
    res.body = payload;
    return res as Response;
  }) as Response["json"];
  return res as Response;
}

import { vi } from "vitest";

describe("response helpers", () => {
  it("success returns 200 by default with success=true", () => {
    const res = mockRes();
    const out = success(res, "OK", { id: 1 });
    expect(out).toBe(res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "OK",
      data: { id: 1 },
    });
  });

  it("success with custom status code", () => {
    const res = mockRes();
    success(res, "OK", null, 202);
    expect(res.statusCode).toBe(202);
  });

  it("created returns 201", () => {
    const res = mockRes();
    created(res, "Created", { id: 5 });
    expect(res.statusCode).toBe(201);
    expect((res.body as { data: unknown }).data).toEqual({ id: 5 });
  });

  it("fail returns 400 by default", () => {
    const res = mockRes();
    fail(res, "Bad");
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Bad" });
  });

  it("fail with error + errors", () => {
    const res = mockRes();
    fail(res, "Validation", 400, "CODE", { field: ["msg"] });
    expect(res.body).toEqual({
      success: false,
      message: "Validation",
      error: "CODE",
      errors: { field: ["msg"] },
    });
  });

  it("paginated always has totalPages >= 1", () => {
    const res = mockRes();
    paginated(res, "List", [{ id: 1 }], 1, 10, 0);
    expect(res.statusCode).toBe(200);
    expect(
      (res.body as { pagination: { totalPages: number } }).pagination
        .totalPages,
    ).toBe(1);
  });

  it("paginated computes totalPages correctly", () => {
    const res = mockRes();
    paginated(res, "List", [], 1, 10, 25);
    const body = res.body as {
      pagination: { totalPages: number; total: number };
    };
    expect(body.pagination.totalPages).toBe(3);
    expect(body.pagination.total).toBe(25);
  });

  it("paginated without data (undefined data omitted)", () => {
    const res = mockRes();
    success(res, "OK");
    expect(res.body).toEqual({ success: true, message: "OK" });
  });
});
