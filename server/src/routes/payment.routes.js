
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createRazorpayOrder,
  verifyPayment,
  logPaymentFailure,
  handleWebhook,
  completeDemoPayment,
} from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Strict rate limiter for sensitive payment endpoints
const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many payment requests from this IP. Please try again after 15 minutes.',
  },
});

// Authenticated payment lifecycle routes
router.post(
  '/create-order',
  paymentRateLimiter,
  requireAuth,
  createRazorpayOrder
);

router.post(
  '/verify',
  paymentRateLimiter,
  requireAuth,
  verifyPayment
);

router.post(
  '/log-failure',
  paymentRateLimiter,
  requireAuth,
  logPaymentFailure
);

// Demo payment simulation — does not charge money or mark an order as paid
router.post(
  '/demo/complete',
  paymentRateLimiter,
  requireAuth,
  completeDemoPayment
);

// Razorpay webhook — verified using the signature and raw request body
router.post('/webhook', paymentRateLimiter, handleWebhook);

export default router;
