import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { isDevelopment } from "../config/env";
import { HttpError } from "../utils/errors";
import { fail, FieldError } from "../utils/response";

export function notFoundHandler(req: Request, res: Response): void {
  fail(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
}

function flattenZodErrors(err: ZodError): {
  errors: Record<string, string[]>;
  fieldList: FieldError[];
} {
  const errors: Record<string, string[]> = {};
  const fieldList: FieldError[] = [];

  for (const issue of err.issues) {
    const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!errors[fieldPath]) errors[fieldPath] = [];
    errors[fieldPath].push(issue.message);
    fieldList.push({ field: fieldPath, message: issue.message });
  }

  return { errors, fieldList };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const { errors, fieldList } = flattenZodErrors(err);
    fail(res, "Validation failed", 400, JSON.stringify(fieldList), errors);
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large"
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Unexpected file field"
          : err.message;
    fail(res, message, 400, err.code);
    return;
  }

  if (err instanceof HttpError) {
    fail(
      res,
      err.message,
      err.statusCode,
      isDevelopment ? String(err.details ?? "") : undefined,
    );
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      fail(
        res,
        "Duplicate entry — resource already exists",
        409,
        err.meta ? String(err.meta) : undefined,
      );
      return;
    }
    if (err.code === "P2025") {
      fail(res, "Resource not found", 404);
      return;
    }
    fail(res, "Database error", 500, isDevelopment ? err.message : undefined);
    return;
  }

  if (err instanceof Error) {
    console.error("[ERROR]", err);
    fail(res, isDevelopment ? err.message : "Internal server error", 500);
    return;
  }

  console.error("[UNKNOWN ERROR]", err);
  fail(res, "Internal server error", 500);
}
