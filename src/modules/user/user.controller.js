"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUser = exports.getUsers = exports.getRandomQuote = void 0;
const userService = __importStar(require("./user.service"));
// Test API: Get a random quote
const getRandomQuote = (req, res) => {
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
exports.getRandomQuote = getRandomQuote;
const getUsers = (req, res) => {
    res.json(userService.getAllUsers());
};
exports.getUsers = getUsers;
const getUser = (req, res) => {
    const user = userService.getUserById(Number(req.params.id));
    if (!user)
        return res.status(404).json({ message: 'User not found' });
    res.json(user);
};
exports.getUser = getUser;
const createUser = (req, res) => {
    const { name, email } = req.body;
    const newUser = userService.createUser({ name, email });
    res.status(201).json(newUser);
};
exports.createUser = createUser;
const updateUser = (req, res) => {
    const { name, email } = req.body;
    const updated = userService.updateUser(Number(req.params.id), { name, email });
    if (!updated)
        return res.status(404).json({ message: 'User not found' });
    res.json(updated);
};
exports.updateUser = updateUser;
const deleteUser = (req, res) => {
    const deleted = userService.deleteUser(Number(req.params.id));
    if (!deleted)
        return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
};
exports.deleteUser = deleteUser;
