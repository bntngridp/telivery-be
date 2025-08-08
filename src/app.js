"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const product_routes_1 = __importDefault(require("./modules/product/product.routes"));
const store_routes_1 = __importDefault(require("./modules/store/store.routes"));
const order_routes_1 = __importDefault(require("./modules/order/order.routes"));
const app = (0, express_1.default)();
// Middleware setup
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/users', user_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.use('/api/product', product_routes_1.default);
app.use('/api/buyer/stores', store_routes_1.default);
app.use('/api/seller/orders', order_routes_1.default);
// Define routes
app.get('/', (req, res) => {
    res.send('Welcome to the Cheva Telivery API!');
});
// Export the app for use in server.ts
exports.default = app;
