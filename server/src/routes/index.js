import express from 'express';
import healthRouter from './health.routes.js';
import productRouter from './product.routes.js';
import authRouter from './auth.routes.js';

const router = express.Router();

// Health check endpoint
router.use('/health', healthRouter);

// Products catalogue & admin endpoints
router.use('/products', productRouter);

// Authentication endpoints
router.use('/auth', authRouter);

// Base API route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ShopSphere API v1',
    endpoints: {
      health: '/api/v1/health',
      products: '/api/v1/products',
      categories: '/api/v1/products/categories',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me',
      },
    },
    phase: 'Phase 3: JWT Authentication & Role-Based Access Active',
  });
});

export default router;
