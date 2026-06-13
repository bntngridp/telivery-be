import { Response } from 'express';

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface FieldError {
    field: string;
    message: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    pagination?: PaginationMeta;
    error?: string;
    errors?: FieldError[] | Record<string, string[] | undefined>;
}

export function success<T>(res: Response, message: string, data?: T, statusCode = 200): Response {
    const body: ApiResponse<T> = { success: true, message };
    if (data !== undefined) body.data = data;
    return res.status(statusCode).json(body);
}

export function created<T>(res: Response, message: string, data?: T): Response {
    return success(res, message, data, 201);
}

export function paginated<T>(
    res: Response,
    message: string,
    data: T,
    page: number,
    limit: number,
    total: number,
): Response {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const body: ApiResponse<T> = {
        success: true,
        message,
        data,
        pagination: { page, limit, total, totalPages },
    };
    return res.status(200).json(body);
}

export function fail(
    res: Response,
    message: string,
    statusCode = 400,
    error?: string,
    errors?: FieldError[] | Record<string, string[] | undefined>,
): Response {
    const body: ApiResponse<null> = { success: false, message };
    if (error) body.error = error;
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
}
