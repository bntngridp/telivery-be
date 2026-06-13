import './config/env';
import express from 'express';
import cors from 'cors';
import path from 'path';
import userRoutes from './modules/user/user.routes';
import authRoutes from './modules/auth/auth.routes';
import productRoutes from './modules/product/product.routes';
import buyerStoreRoutes from './modules/store/store.routes';
import orderSellerRoutes from './modules/order/order.routes';
import buyerOrderRoutes from './modules/order/buyer.order.routes';
import buyerProductRoutes from './modules/product/buyer.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const documentsDir = path.join(__dirname, '..', 'documents');
app.use(
    '/documents',
    express.static(documentsDir, {
        maxAge: '7d',
        etag: true,
        index: false,
    }),
);

app.get('/', (_req, res) => {
    res.send('Welcome to the Cheva Telivery API!');
});

app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes);
app.use('/api/buyer/products', buyerProductRoutes);
app.use('/api/buyer/stores', buyerStoreRoutes);
app.use('/api/buyer/orders', buyerOrderRoutes);
app.use('/api/seller/orders', orderSellerRoutes);

app.use(notFoundHandler);
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    errorHandler(err, req, res, next);
});

export default app;
