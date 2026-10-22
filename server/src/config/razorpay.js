import Razorpay from 'razorpay';
import crypto from 'crypto';
import env from './env.js';

/**
 * Checks if Razorpay credentials are valid and not placeholders
 */
export const isRazorpayConfigured = () => {
  return Boolean(
    env.RAZORPAY_KEY_ID &&
      env.RAZORPAY_KEY_SECRET &&
      !env.RAZORPAY_KEY_ID.includes('placeholder') &&
      !env.RAZORPAY_KEY_SECRET.includes('placeholder')
  );
};

// Initialize Razorpay SDK instance
let razorpayInstance = null;
let initializedKeyId = null;
let initializedKeySecret = null;

export const getRazorpayInstance = () => {
  if (isRazorpayConfigured()) {
    const currentKeyId = env.RAZORPAY_KEY_ID ? env.RAZORPAY_KEY_ID.trim() : '';
    const currentKeySecret = env.RAZORPAY_KEY_SECRET ? env.RAZORPAY_KEY_SECRET.trim() : '';

    if (
      !razorpayInstance ||
      initializedKeyId !== currentKeyId ||
      initializedKeySecret !== currentKeySecret
    ) {
      razorpayInstance = new Razorpay({
        key_id: currentKeyId,
        key_secret: currentKeySecret,
      });
      initializedKeyId = currentKeyId;
      initializedKeySecret = currentKeySecret;
    }
  } else {
    razorpayInstance = null;
  }
  return razorpayInstance;
};

if (isRazorpayConfigured()) {
  getRazorpayInstance();
} else {
  console.warn(
    '[RAZORPAY NOTICE] Placeholder credentials detected in server/.env. Enter valid rzp_test keys to create live Razorpay test orders.'
  );
}

/**
 * Verifies Razorpay Checkout signature using HMAC-SHA256 and timing-safe comparison
 * @param {Object} params
 * @param {string} params.razorpayOrderId
 * @param {string} params.razorpayPaymentId
 * @param {string} params.razorpaySignature
 * @param {string} [params.secret]
 * @returns {boolean}
 */
export const verifyPaymentSignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  secret = env.RAZORPAY_KEY_SECRET,
}) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !secret) {
    return false;
  }

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Convert to buffers for timing-safe comparison
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const actualBuffer = Buffer.from(razorpaySignature, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

/**
 * Verifies Razorpay Webhook signature using raw request body
 * @param {Object} params
 * @param {Buffer|string} params.rawBody
 * @param {string} params.signature
 * @param {string} [params.secret]
 * @returns {boolean}
 */
export const verifyWebhookSignature = ({
  rawBody,
  signature,
  secret = env.RAZORPAY_WEBHOOK_SECRET,
}) => {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const actualBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

export default {
  isRazorpayConfigured,
  getRazorpayInstance,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
