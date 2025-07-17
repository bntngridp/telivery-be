import express from 'express';

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define routes
app.get('/', (req, res) => {
    res.send('Welcome to the Cheva Telivery API!');
});

// Export the app for use in server.ts
export default app;