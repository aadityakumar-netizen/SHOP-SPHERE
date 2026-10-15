import express from 'express';
import {
  getAdminStats,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Enforce both authentication and administrator authorization for all routes
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', getAdminStats);

// Customer orders & fulfillment management
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
