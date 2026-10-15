import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import {
  validateRegisterInput,
  validateLoginInput,
} from '../validators/auth.validator.js';

const router = express.Router();

// Strict rate limiter for authentication endpoints to prevent brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login or registration attempts. Please try again after 15 minutes.',
  },
});

// Authentication routes
router.post('/register', authRateLimiter, validateRegisterInput, register);
router.post('/login', authRateLimiter, validateLoginInput, login);
router.get('/me', requireAuth, getMe);

export default router;
