import { User } from './user.schema';

let users: User[] = [];
let nextId = 1;

export const getAllUsers = (): User[] => users;

export const getUserById = (id: number): User | undefined =>
  users.find(user => user.id === id);

export const createUser = (user: Omit<User, 'id'>): User => {
  const newUser = { id: nextId++, ...user };
  users.push(newUser);
  return newUser;
};

export const updateUser = (id: number, user: Omit<User, 'id'>): User | undefined => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return undefined;
  users[index] = { id, ...user };
  return users[index];
};

export const deleteUser = (id: number): boolean => {
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
};