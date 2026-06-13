import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

export type Role = 'pembeli' | 'penjual';

export interface AuthUser {
    id?: number;
    sellerId?: number;
    role: Role;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export interface JwtPayloadDecoded extends JwtPayload {
    id?: number;
    sellerId?: number;
    role?: Role;
}

export function jwtMiddleware(req: Request, _res: Response, next: NextFunction): void {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid Authorization header');
        }

        const token = header.split(' ')[1];
        if (!token) {
            throw new UnauthorizedError('Missing token');
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayloadDecoded;

        if (!decoded.role) {
            throw new UnauthorizedError('Invalid token payload');
        }

        if (decoded.role === 'pembeli' && typeof decoded.id !== 'number') {
            throw new UnauthorizedError('Invalid buyer token payload');
        }
        if (decoded.role === 'penjual' && typeof decoded.sellerId !== 'number') {
            throw new UnauthorizedError('Invalid seller token payload');
        }

        req.user = {
            role: decoded.role,
            id: decoded.id,
            sellerId: decoded.sellerId,
        };

        next();
    } catch (err) {
        if (err instanceof UnauthorizedError) {
            next(err);
            return;
        }
        next(new UnauthorizedError('Invalid or expired token'));
    }
}

export function requireRole(...roles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(new UnauthorizedError('Authentication required'));
            return;
        }
        if (!roles.includes(req.user.role)) {
            next(new UnauthorizedError(`Role '${req.user.role}' is not allowed`));
            return;
        }
        next();
    };
}
