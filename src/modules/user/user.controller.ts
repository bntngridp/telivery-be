import { Request, Response } from 'express';
import * as userService from './user.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { success, created } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';

export const getRandomQuote = asyncHandler(async (_req: Request, res: Response) => {
    const quotes = [
        'The best way to get started is to quit talking and begin doing.',
        "Don't let yesterday take up too much of today.",
        "It's not whether you get knocked down, it's whether you get up.",
        'If you are working on something exciting, it will keep you motivated.',
        'Success is not in what you have, but who you are.',
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return res.json({ quote: quotes[randomIndex] });
});

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
    return success(res, 'Daftar user berhasil diambil', userService.getAllUsers());
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
    const user = userService.getUserById(Number(req.params.id));
    if (!user) throw new NotFoundError('User not found');
    return success(res, 'User berhasil diambil', user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body ?? {};
    const newUser = userService.createUser({ name, email });
    return created(res, 'User berhasil dibuat', newUser);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body ?? {};
    const updated = userService.updateUser(Number(req.params.id), { name, email });
    if (!updated) throw new NotFoundError('User not found');
    return success(res, 'User berhasil diperbarui', updated);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const deleted = userService.deleteUser(Number(req.params.id));
    if (!deleted) throw new NotFoundError('User not found');
    return res.status(204).send();
});
