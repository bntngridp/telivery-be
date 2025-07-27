"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
let users = [];
let nextId = 1;
const getAllUsers = () => users;
exports.getAllUsers = getAllUsers;
const getUserById = (id) => users.find(user => user.id === id);
exports.getUserById = getUserById;
const createUser = (user) => {
    const newUser = { id: nextId++, ...user };
    users.push(newUser);
    return newUser;
};
exports.createUser = createUser;
const updateUser = (id, user) => {
    const index = users.findIndex(u => u.id === id);
    if (index === -1)
        return undefined;
    users[index] = { id, ...user };
    return users[index];
};
exports.updateUser = updateUser;
const deleteUser = (id) => {
    const index = users.findIndex(u => u.id === id);
    if (index === -1)
        return false;
    users.splice(index, 1);
    return true;
};
exports.deleteUser = deleteUser;
