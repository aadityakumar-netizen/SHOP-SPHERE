import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  createRazorpayOrder,
  verifyPayment,
  logPaymentFailure,
  handleWebhook,
} from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Strict rate limiter for sensitive payment endpoints
const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 payment actions per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment requests from this IP. Please try again after 15 minutes.',
  },
});

// Authenticated payment lifecycle routes
router.post('/create-order', paymentRateLimiter, requireAuth, createRazorpayOrder);
router.post('/verify', paymentRateLimiter, requireAuth, verifyPayment);
router.post('/log-failure', paymentRateLimiter, requireAuth, logPaymentFailure);

// Razorpay webhook endpoint (cryptographically authenticated via x-razorpay-signature on req.rawBody)
router.post('/webhook', paymentRateLimiter, handleWebhook);

export default router;
