import { Request, Response } from 'express';
import { cartService } from './cart.service';
import {
    addCartItemSchema,
    updateCartItemSchema,
    cartItemIdParamSchema,
} from './cart.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { success, created } from '../../utils/response';
import { UnauthorizedError } from '../../utils/errors';

function requireUserId(req: Request): number {
    const id = req.user?.id;
    if (!id) throw new UnauthorizedError('Unauthorized, silakan login sebagai pembeli');
    return id;
}

export const cartController = {
    add: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const data = addCartItemSchema.parse(req.body);
        const item = await cartService.addItem(userId, data);
        return created(res, 'Item berhasil ditambahkan ke cart', item);
    }),

    list: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const cart = await cartService.getCart(userId);
        return success(res, 'Cart berhasil diambil', cart);
    }),

    update: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const { id } = cartItemIdParamSchema.parse(req.params);
        const data = updateCartItemSchema.parse(req.body);
        const item = await cartService.updateItemQuantity(Number(id), userId, data);
        return success(res, 'Jumlah item berhasil diupdate', item);
    }),

    remove: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const { id } = cartItemIdParamSchema.parse(req.params);
        const result = await cartService.removeItem(Number(id), userId);
        return success(res, result.message);
    }),

    clear: asyncHandler(async (req: Request, res: Response) => {
        const userId = requireUserId(req);
        const result = await cartService.clearCart(userId);
        return success(res, result.message);
    }),
};
