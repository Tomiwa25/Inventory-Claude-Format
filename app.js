// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./Config/DatabaseConfig');

// Load environment variables from .env file
dotenv.config();
connectDB(); // Connect to MongoDB

const app = express();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: 'Too many attempts, please try again later' }
});

const productRoutes = require('./Routes/ProductRoute');
const userRoutes = require('./Routes/UserRoutes');
const categoryRoutes = require('./Routes/CategoryRoute');
const supplierRoutes = require('./Routes/SupplierRoute');
const stockRoutes = require('./Routes/StockRoute');
const purchaseOrderRoutes = require('./Routes/PurchaseOrderRoute');
const salesOrderRoutes = require('./Routes/SalesOrderRoute');
const dashboardRoutes = require('./Routes/DashboardRoute');

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json()); // Middleware to parse JSON request bodies
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/users/login', authLimiter);

app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/stock', stockRoutes);
app.use('/purchase-orders', purchaseOrderRoutes);
app.use('/sales-orders', salesOrderRoutes);
app.use('/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Centralized error handler -- catches anything thrown outside a controller's own try/catch
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Serverless-friendly export: Vercel/Lambda import `app` directly instead of calling listen().
// Locally (npm run dev / npm start) we still call listen() so it behaves like a normal server.
if (require.main === module) {
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running on port ${process.env.PORT || 5000}`);
    });
}

module.exports = app;
