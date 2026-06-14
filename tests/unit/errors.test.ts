import { describe, it, expect } from 'vitest';
import {
    HttpError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
} from '../../src/utils/errors';

describe('HttpError hierarchy', () => {
    it('HttpError carries statusCode + message + details', () => {
        const err = new HttpError(418, 'teapot', { hint: 'coffee' });
        expect(err).toBeInstanceOf(Error);
        expect(err.statusCode).toBe(418);
        expect(err.message).toBe('teapot');
        expect(err.details).toEqual({ hint: 'coffee' });
        expect(err.name).toBe('HttpError');
    });

    it('BadRequestError → 400', () => {
        const err = new BadRequestError('invalid input');
        expect(err.statusCode).toBe(400);
        expect(err.name).toBe('BadRequestError');
        expect(err.message).toBe('invalid input');
    });

    it('UnauthorizedError → 401 with default msg', () => {
        const err = new UnauthorizedError();
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Unauthorized');
        expect(err.name).toBe('UnauthorizedError');
    });

    it('ForbiddenError → 403', () => {
        const err = new ForbiddenError('not allowed');
        expect(err.statusCode).toBe(403);
        expect(err.message).toBe('not allowed');
    });

    it('NotFoundError → 404 with default msg', () => {
        const err = new NotFoundError();
        expect(err.statusCode).toBe(404);
        expect(err.message).toBe('Resource not found');
    });

    it('ConflictError → 409', () => {
        const err = new ConflictError('duplicate');
        expect(err.statusCode).toBe(409);
        expect(err.message).toBe('duplicate');
    });

    it('ValidationError → 422 with details', () => {
        const err = new ValidationError('failed', { field: ['required'] });
        expect(err.statusCode).toBe(422);
        expect(err.details).toEqual({ field: ['required'] });
    });

    it('stack trace is captured', () => {
        const err = new NotFoundError('x');
        expect(err.stack).toBeDefined();
        expect(err.stack).toContain('NotFoundError');
    });
});
