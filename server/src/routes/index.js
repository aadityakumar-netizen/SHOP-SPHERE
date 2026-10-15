import express from 'express';
import healthRouter from './health.routes.js';
import productRouter from './product.routes.js';

const router = express.Router();

// Health check endpoint
router.use('/health', healthRouter);

// Products catalogue & admin endpoints
router.use('/products', productRouter);

// Base API route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ShopSphere API v1',
    endpoints: {
      health: '/api/v1/health',
      products: '/api/v1/products',
      categories: '/api/v1/products/categories',
    },
    phase: 'Phase 2: Product Catalogue, Schemas & Seeding Active',
  });
});

export default router;
