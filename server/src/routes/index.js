import express from 'express';
import healthRouter from './health.routes.js';
import productRouter from './product.routes.js';
import authRouter from './auth.routes.js';
import orderRouter from './order.routes.js';
import paymentRouter from './payment.routes.js';

const router = express.Router();

// Health check endpoint
router.use('/health', healthRouter);

// Products catalogue & admin endpoints
router.use('/products', productRouter);

// Authentication endpoints
router.use('/auth', authRouter);

// Order management endpoints
router.use('/orders', orderRouter);

// Razorpay Test Mode payments & webhooks
router.use('/payments', paymentRouter);

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
      payments: {
        createOrder: 'POST /api/v1/payments/create-order',
        verify: 'POST /api/v1/payments/verify',
        webhook: 'POST /api/v1/payments/webhook',
      },
    },
    phase: 'Phase 5: Secure Razorpay Test Mode & Webhooks Active',
  });
});

export default router;
