import { Request, Response } from 'express';
import * as userService from './user.service';

export const getRandomQuote = (req: Request, res: Response) => {
  const quotes = [
    "The best way to get started is to quit talking and begin doing.",
    "Don't let yesterday take up too much of today.",
    "It's not whether you get knocked down, it's whether you get up.",
    "If you are working on something exciting, it will keep you motivated.",
    "Success is not in what you have, but who you are."
  ];
  const randomIndex = Math.floor(Math.random() * quotes.length);
  res.json({ quote: quotes[randomIndex] });
};

export const getUsers = (req: Request, res: Response) => {
  res.json(userService.getAllUsers());
};

export const getUser = (req: Request, res: Response) => {
  const user = userService.getUserById(Number(req.params.id));
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const createUser = (req: Request, res: Response) => {
  const { name, email } = req.body;
  const newUser = userService.createUser({ name, email });
  res.status(201).json(newUser);
};

export const updateUser = (req: Request, res: Response) => {
  const { name, email } = req.body;
  const updated = userService.updateUser(Number(req.params.id), { name, email });
  if (!updated) return res.status(404).json({ message: 'User not found' });
  res.json(updated);
};

export const deleteUser = (req: Request, res: Response) => {
  const deleted = userService.deleteUser(Number(req.params.id));
  if (!deleted) return res.status(404).json({ message: 'User not found' });
  res.status(204).send();
};