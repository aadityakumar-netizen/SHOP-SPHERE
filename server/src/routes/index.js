import express from 'express';
import healthRouter from './health.routes.js';
import productRouter from './product.routes.js';
import authRouter from './auth.routes.js';
import orderRouter from './order.routes.js';
import paymentRouter from './payment.routes.js';
import adminRouter from './admin.routes.js';

const router = express.Router();

// Health check endpoint
router.use('/health', healthRouter);

// Products catalogue & admin product operations
router.use('/products', productRouter);

// Authentication endpoints
router.use('/auth', authRouter);

// Customer order endpoints
router.use('/orders', orderRouter);

// Razorpay Test Mode payments & webhooks
router.use('/payments', paymentRouter);

// Admin dashboard & order fulfillment management
router.use('/admin', adminRouter);

// Base API route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ShopSphere API v1',
    endpoints: {
      health: '/api/v1/health',
      products: '/api/v1/products',
      categories: '/api/v1/products/categories',
      auth: '/api/v1/auth',
      orders: '/api/v1/orders',
      payments: '/api/v1/payments',
      admin: '/api/v1/admin',
    },
    phase: 'Phase 6: Order History, Admin Dashboard & Order Management Active',
  });
});

export default router;
