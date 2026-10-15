import express from 'express';
import healthRouter from './health.routes.js';

const router = express.Router();

// Health check endpoint
router.use('/health', healthRouter);

// Placeholders for subsequent phases
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ShopSphere API v1',
    documentation: '/api/v1/health',
    phase: 'Phase 1 Complete — Project Scaffolding, DB & Health Check Ready',
  });
});

export default router;
