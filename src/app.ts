import 'dotenv/config';
import express from 'express';
import userRoutes from './modules/user/user.routes';
import authRoutes from './modules/auth/auth.routes';
import productRoutes from './modules/product/product.routes';
import buyerStoreRoutes from './modules/store/store.routes';
import orderSellerRoutes from './modules/order/order.routes';


const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes);
app.use('/api/buyer/stores', buyerStoreRoutes);
app.use('/api/seller/orders', orderSellerRoutes);
// Define routes
app.get('/', (req, res) => {
    res.send('Welcome to the Cheva Telivery API!');
});

// Export the app for use in server.ts
export default app;