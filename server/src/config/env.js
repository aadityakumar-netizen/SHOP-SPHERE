import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file relative to server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validate and export environment variables.
 * Enforces security requirements:
 * 1. JWT_SECRET must be explicitly configured and non-empty.
 * 2. Known development fallbacks and placeholder values are strictly rejected at startup.
 * 3. Never logs or prints the secret value.
 */
const INSECURE_JWT_FALLBACKS = [
  'shopsphere_dev_jwt_secret_key_change_me_in_production',
  'your_jwt_secret_key_change_in_production',
  'replace_with_a_secure_random_jwt_secret_key',
];

const rawJwtSecret = (process.env.JWT_SECRET || '').trim();

if (!rawJwtSecret) {
  throw new Error(
    '[FATAL CONFIG ERROR] JWT_SECRET environment variable is missing or empty. A secure secret key must be explicitly configured in server/.env.'
  );
}

if (INSECURE_JWT_FALLBACKS.includes(rawJwtSecret)) {
  throw new Error(
    '[FATAL CONFIG ERROR] Insecure fallback or placeholder JWT_SECRET detected. You must configure a unique, secure secret key in server/.env.'
  );
}

if (!process.env.MONGODB_URI) {
  console.warn('[WARN] Missing MONGODB_URI environment variable. Using fallback for development.');
}

export const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsphere',
  JWT_SECRET: rawJwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  RAZORPAY_KEY_ID: (process.env.RAZORPAY_KEY_ID || '').trim(),
  RAZORPAY_KEY_SECRET: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
  RAZORPAY_WEBHOOK_SECRET: (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim(),
};

export default env;
