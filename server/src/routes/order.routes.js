import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  validateCart,
  cancelOrder,
} from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Cart validation (verifies live prices and stock before checkout)
router.post('/validate-cart', validateCart);

// Protected customer order routes
router.post('/', requireAuth, createOrder);
router.get('/my', requireAuth, getMyOrders);
router.get('/:id', requireAuth, getOrderById);
router.patch('/:id/cancel', requireAuth, cancelOrder);

export default router;
