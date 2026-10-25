import mongoose from 'mongoose';
import Order from '../models/Order.js';
import WebhookEvent from '../models/WebhookEvent.js';
import User from '../models/User.js';
import { sendOrderConfirmationEmail } from '../services/email.service.js';
import env from '../config/env.js';
import {
  isRazorpayConfigured,
  getRazorpayInstance,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../config/razorpay.js';

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Create a Razorpay order for an existing pending MongoDB order
 * @access  Private (Customer/Admin)
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid orderId is required.',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }


    // Check ownership
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this order.',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order is already paid.',
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot process payment for a cancelled order.',
      });
    }

    // Guard: Prevent accidental switch to Live Mode
    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
      console.error('[SECURITY ERROR] Live Mode Key detected! Rejecting payment initiation.');
      return res.status(400).json({
        success: false,
        message: 'Live Mode keys are strictly disabled. ShopSphere must operate in Razorpay Test Mode.',
      });
    }

    let razorpayOrderId;
    const hasLiveKeys = isRazorpayConfigured();

    if (hasLiveKeys) {
      try {
        // Use official Razorpay SDK instance
        const razorpay = getRazorpayInstance();
        const rzpOrder = await razorpay.orders.create({
          amount: order.totalAmountPaise, // Integer paise
          currency: 'INR',
          receipt: `receipt_${order._id.toString().slice(-8)}`,
          notes: {
            mongoOrderId: order._id.toString(),
            userEmail: req.user.email,
          },
        });
        razorpayOrderId = rzpOrder.id;
        console.log(`[RAZORPAY SUCCESS] Real Test Order created on Razorpay API: ${razorpayOrderId} (${order.totalAmountPaise} paise)`);
      } catch (sdkError) {
        console.error('[RAZORPAY SDK ERROR] Failed to create order via Razorpay API:', sdkError.message);
        return res.status(502).json({
          success: false,
          message: `Razorpay API rejected order creation: ${sdkError.message}`,
        });
      }
    } else {
      // Deterministic test order identifier for local simulation when using placeholder credentials
      razorpayOrderId = `order_test_${order._id.toString().slice(-14)}`;
      console.log(`[RAZORPAY TEST] Using local Test Mode order identifier: ${razorpayOrderId} (${order.totalAmountPaise} paise)`);
    }

    // Save razorpayOrderId on MongoDB order
    order.razorpayOrderId = razorpayOrderId;
    await order.save();

    res.status(200).json({
      success: true,
      keyId: env.RAZORPAY_KEY_ID ? env.RAZORPAY_KEY_ID.trim() : '',
      razorpayOrderId,
      amount: order.totalAmountPaise,
      currency: 'INR',
      orderId: order._id,
      isConfigured: hasLiveKeys,
      customer: {
        name: req.user.name,
        email: req.user.email,
        phone: order.shippingAddress.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify Razorpay checkout HMAC-SHA256 signature and mark order paid
 * @access  Private (Customer/Admin)
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        verificationStatus: 'failed',
        message:
          'Missing payment verification parameters: orderId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        verificationStatus: 'failed',
        message: 'Invalid orderId format.',
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        verificationStatus: 'failed',
        message: 'Order not found.',
      });
    }

    // Check ownership
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        verificationStatus: 'failed',
        message: 'Access denied. You do not own this order.',
      });
    }

    // Idempotency: If already paid, return success without duplicate updates
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        verificationStatus: 'already_paid',
        message: 'Order is already marked as paid (idempotent request).',
        order,
      });
    }

    // 1. Order ID Matching Check (Must match the recorded Razorpay order ID)
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      console.warn(
        `[SECURITY WARNING] Order ID mismatch. Expected: ${order.razorpayOrderId}, Received: ${razorpayOrderId}`
      );
      return res.status(400).json({
        success: false,
        verificationStatus: 'order_mismatch',
        message: 'Order ID mismatch between local record and Razorpay response.',
      });
    }

    // 2. Cryptographic HMAC-SHA256 Signature Verification with timing-safe comparison
    const isSignatureValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      secret: env.RAZORPAY_KEY_SECRET,
    });

    if (!isSignatureValid) {
      console.warn(
        `[SECURITY ALERT] Invalid payment signature for order ${orderId} (Razorpay Order: ${razorpayOrderId})`
      );
      return res.status(400).json({
        success: false,
        verificationStatus: 'signature_invalid',
        message: 'Invalid payment signature. Payment verification failed on server.',
      });
    }

    // 3. Amount and Currency Verification (If live SDK configured)
    if (isRazorpayConfigured()) {
      try {
        const razorpay = getRazorpayInstance();
        const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);

        if (paymentDetails.amount !== order.totalAmountPaise) {
          console.warn(
            `[SECURITY ALERT] Amount mismatch for order ${orderId}: Expected ${order.totalAmountPaise} paise, Gateway reported ${paymentDetails.amount} paise.`
          );
          return res.status(400).json({
            success: false,
            verificationStatus: 'amount_mismatch',
            message: `Amount mismatch: Gateway reported ₹${(paymentDetails.amount / 100).toFixed(2)}, expected ₹${(order.totalAmountPaise / 100).toFixed(2)}.`,
          });
        }

        if (paymentDetails.currency !== 'INR') {
          return res.status(400).json({
            success: false,
            verificationStatus: 'currency_mismatch',
            message: `Currency mismatch: Expected INR, received ${paymentDetails.currency}.`,
          });
        }
      } catch (fetchErr) {
        console.warn(`[RAZORPAY API WARN] Could not fetch payment record from Razorpay API: ${fetchErr.message}`);
      }
    }

    // 4. Update order status to paid (Atomic and explicit)
    order.paymentStatus = 'paid';
    order.orderStatus = 'processing'; // Valid next state after payment confirmation
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paidAt = new Date();
    await order.save();

    console.log(`[PAYMENT VERIFIED SUCCESS] Order #${order._id} verified and marked as PAID (Payment ID: ${razorpayPaymentId})`);
    // Send confirmation email after successful payment verification.
    // Email failures must not interrupt checkout.
    try {
      const customer = await User.findById(order.user).select('name email');

      if (customer?.email) {
        const emailResult = await sendOrderConfirmationEmail({
          to: customer.email,
          customerName: customer.name,
          orderId: order._id.toString(),
          orderItems: order.orderItems,
          totalAmountPaise: order.totalAmountPaise,
          paymentMethod: 'Razorpay',
          paymentStatus: 'paid',
          shippingAddress: order.shippingAddress,
        });

        if (!emailResult.sent) {
          console.warn('[EMAIL] Confirmation email was not sent:', emailResult.reason);
        }
      } else {
        console.warn('[EMAIL] Customer email not found for order:', order._id);
      }
    } catch (emailError) {
      console.error('[EMAIL] Confirmation email failed:', emailError.message);
    }

    res.status(200).json({
      success: true,
      verificationStatus: 'verified',
      message: 'Payment verified successfully. Order is now paid.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/payments/log-failure
 * @desc    Record client-side Razorpay payment failure in safe server diagnostics
 * @access  Private (Customer/Admin)
 */
export const logPaymentFailure = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      errorCode,
      errorDescription,
      errorSource,
      errorStep,
      errorReason,
      razorpayPaymentId,
    } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid orderId is required for logging payment failure.',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }
    // Security: only the order owner or an administrator may log its failure.
    const isOrderOwner = String(order.user) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOrderOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to log failure for this order.',
      });
    }


    // Security: Sanitize all inputs to strip out any potential card numbers, CVVs, OTPs, or secrets
    const sanitize = (val) => {
      if (typeof val !== 'string') return '';
      return val
        .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED_CARD]')
        .replace(/\b\d{3,4}\b/g, '[REDACTED_CODE]')
        .slice(0, 500);
    };

    const sanitizedCode = sanitize(errorCode) || 'PAYMENT_FAILED';
    const sanitizedDesc = sanitize(errorDescription) || 'Payment was declined or failed in the checkout gateway.';
    const sanitizedSource = sanitize(errorSource) || 'gateway';
    const sanitizedStep = sanitize(errorStep) || 'payment_execution';
    const sanitizedReason = sanitize(errorReason) || 'transaction_declined';

    // Safe server-side diagnostic log (No secrets, no card numbers, no CVVs)
    console.warn('===============================================================');
    console.warn('  [RAZORPAY PAYMENT FAILURE DIAGNOSTIC LOG]');
    console.warn(`  Timestamp       : ${new Date().toISOString()}`);
    console.warn(`  Order ID (Mongo): ${order._id}`);
    console.warn(`  Order Amount    : ${order.totalAmountPaise} paise (₹${(order.totalAmountPaise / 100).toFixed(2)})`);
    console.warn(`  User ID         : ${req.user._id} (${req.user.email})`);
    console.warn(`  Razorpay Order  : ${razorpayOrderId || order.razorpayOrderId || 'N/A'}`);
    console.warn(`  Razorpay Payment: ${razorpayPaymentId || 'N/A'}`);
    console.warn(`  Error Code      : ${sanitizedCode}`);
    console.warn(`  Error Reason    : ${sanitizedReason}`);
    console.warn(`  Error Source    : ${sanitizedSource}`);
    console.warn(`  Error Step      : ${sanitizedStep}`);
    console.warn(`  Description     : ${sanitizedDesc}`);
    console.warn('===============================================================');

    // Generate sanitized, user-friendly error message based on code and reason
    let userMessage = 'Your payment could not be processed. Please check your card or UPI details and try again.';
    if (sanitizedCode === 'BAD_REQUEST_ERROR') {
      userMessage = `Payment request rejected by gateway: ${sanitizedDesc}`;
    } else if (sanitizedCode === 'GATEWAY_ERROR') {
      userMessage = 'Payment processing failed at the bank/gateway. Please retry with another payment method.';
    } else if (sanitizedReason === 'payment_cancelled') {
      userMessage = 'Payment was cancelled. You can retry payment whenever you are ready.';
    }

    res.status(200).json({
      success: true,
      diagnosticLogged: true,
      sanitizedMessage: userMessage,
      code: sanitizedCode,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Ingest Razorpay webhooks with raw body verification and deduplication
 * @access  Public (Webhook endpoint verified via HMAC)
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const eventId =
      req.headers['x-razorpay-event-id'] ||
      req.body?.id ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing x-razorpay-signature header.',
      });
    }

    // Verify webhook signature against raw request body
    const isWebhookValid = verifyWebhookSignature({
      rawBody: req.rawBody,
      signature,
      secret: env.RAZORPAY_WEBHOOK_SECRET,
    });

    if (!isWebhookValid) {
      console.warn('[SECURITY ALERT] Unauthorized webhook delivery attempt.');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature.',
      });
    }

    // Deduplication check: Has this event already been processed?
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      return res.status(200).json({
        success: true,
        message: 'Event already processed (idempotent duplicate ignored).',
      });
    }

    const event = req.body;
    const eventType = event.event || 'unknown';
    let targetOrder = null;
    let processingNotes = 'Processed successfully';

    // Handle payment.captured or order.paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        targetOrder = await Order.findOne({ razorpayOrderId });

        if (targetOrder && targetOrder.paymentStatus !== 'paid') {
          targetOrder.paymentStatus = 'paid';
          targetOrder.orderStatus = 'processing';
          targetOrder.razorpayPaymentId = razorpayPaymentId || targetOrder.razorpayPaymentId;
          targetOrder.paidAt = new Date();
          await targetOrder.save();
          console.log(`[WEBHOOK SUCCESS] Order #${targetOrder._id} marked as PAID via webhook event: ${eventType}`);
        }
      }
    }

    // Save record to WebhookEvent collection for audit trail and deduplication
    await WebhookEvent.create({
      eventId,
      eventType,
      entityId: event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || 'unknown',
      order: targetOrder?._id || null,
      processed: true,
      notes: processingNotes,
    });

    res.status(200).json({
      success: true,
      received: true,
      message: 'Webhook processed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/payments/demo/complete
 * @desc    Complete a demo payment simulation only
 * @access  Private (Customer/Admin)
 */
export const completeDemoPayment = async (req, res, next) => {
  try {
    const { orderId, demoPaymentMethod } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid orderId is required.',
      });
    }

    if (!['card', 'netbanking', 'wallet'].includes(demoPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid demo payment method.',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const isOwner = String(order.user) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this order.',
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a demo payment for a cancelled order.',
      });
    }

    if (
      order.paymentMethod !== 'demo' ||
      order.demoPaymentMethod !== demoPaymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message: 'The selected demo payment method does not match this order.',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid through a verified payment.',
      });
    }

    if (order.demoPaymentStatus !== 'completed') {
      order.demoPaymentStatus = 'completed';
      await order.save();
    }

    return res.status(200).json({
      success: true,
      demo: true,
      message:
        'Demo simulation completed. No money was charged, and the order is not marked as paid.',
      order,
    });
  } catch (error) {
    next(error);
  }
};
