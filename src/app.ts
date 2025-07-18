import express from 'express';
import userRoutes from './modules/user/user.routes';

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/users', userRoutes);

// Define routes
app.get('/', (req, res) => {
    res.send('Welcome to the Cheva Telivery API!');
});

// Export the app for use in server.ts
export default app;