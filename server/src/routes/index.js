import express from 'express';
import healthRouter from './health.routes.js';
import productRouter from './product.routes.js';
import authRouter from './auth.routes.js';
import orderRouter from './order.routes.js';

const router = express.Router();

// Health check endpoint
router.use('/health', healthRouter);

// Products catalogue & admin endpoints
router.use('/products', productRouter);

// Authentication endpoints
router.use('/auth', authRouter);

// Order management endpoints
router.use('/orders', orderRouter);

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
    },
    phase: 'Phase 4: Shopping Cart & Order Creation with Stock Validation Active',
  });
});

export default router;
