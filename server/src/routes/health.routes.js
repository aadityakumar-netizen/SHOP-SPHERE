import express from 'express';
import mongoose from 'mongoose';
import env from '../config/env.js';

const router = express.Router();

const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * @route   GET /api/v1/health
 * @desc    API Health check and system status
 * @access  Public
 */
router.get('/', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const dbStatus = DB_STATES[readyState] || 'unknown';
  const isDbHealthy = readyState === 1;

  res.status(isDbHealthy ? 200 : 503).json({
    success: isDbHealthy,
    service: 'ShopSphere API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      readyState,
      isAtlas: (mongoose.connection.host || '').includes('mongodb.net'),
      host: mongoose.connection.host || 'none',
      name: mongoose.connection.name || 'none',
    },
    razorpayConfigured: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && !env.RAZORPAY_KEY_ID.includes('placeholder')),
  });
});

export default router;
