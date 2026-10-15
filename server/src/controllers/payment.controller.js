import mongoose from 'mongoose';
import Order from '../models/Order.js';
import WebhookEvent from '../models/WebhookEvent.js';
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

    let razorpayOrderId;
    const hasLiveKeys = isRazorpayConfigured();

    if (hasLiveKeys) {
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
    } else {
      // Fallback deterministic test order identifier for offline development testing
      razorpayOrderId = `order_test_${order._id.toString().slice(-14)}`;
    }

    // Save razorpayOrderId on MongoDB order
    order.razorpayOrderId = razorpayOrderId;
    await order.save();

    res.status(200).json({
      success: true,
      keyId: env.RAZORPAY_KEY_ID,
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
        message:
          'Missing payment verification parameters: orderId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid orderId format.',
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

    // Idempotency: If already paid, return success without duplicate updates
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Order is already marked as paid (idempotent request).',
        order,
      });
    }

    // Cryptographic HMAC-SHA256 Signature Verification with timing-safe comparison
    const isSignatureValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      secret: env.RAZORPAY_KEY_SECRET,
    });

    if (!isSignatureValid) {
      console.warn(
        `[SECURITY ALERT] Invalid payment signature attempt for order ${orderId}`
      );
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.',
      });
    }

    // Ensure the order matches the Razorpay Order ID
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID mismatch between local record and Razorpay response.',
      });
    }

    // Update order status to paid (keeping paymentStatus separate from orderStatus)
    order.paymentStatus = 'paid';
    order.orderStatus = 'processing'; // Valid next state after payment confirmation
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paidAt = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Order is now paid.',
      order,
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
      const rzpOrderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
      const rzpPaymentId = paymentEntity?.id;

      if (rzpOrderId) {
        targetOrder = await Order.findOne({ razorpayOrderId: rzpOrderId });
        if (targetOrder && targetOrder.paymentStatus !== 'paid') {
          targetOrder.paymentStatus = 'paid';
          targetOrder.orderStatus = 'processing';
          targetOrder.razorpayPaymentId = rzpPaymentId || targetOrder.razorpayPaymentId;
          targetOrder.paidAt = new Date();
          await targetOrder.save();
          processingNotes = `Order ${targetOrder._id} marked as paid via webhook`;
        }
      }
    }

    // Handle payment.failed
    if (eventType === 'payment.failed') {
      const rzpOrderId = event.payload?.payment?.entity?.order_id;
      if (rzpOrderId) {
        targetOrder = await Order.findOne({ razorpayOrderId: rzpOrderId });
        if (targetOrder && targetOrder.paymentStatus === 'pending') {
          targetOrder.paymentStatus = 'failed';
          await targetOrder.save();
          processingNotes = `Order ${targetOrder._id} marked as payment failed via webhook`;
        }
      }
    }

    // Record webhook event in database for audit trail and deduplication
    await WebhookEvent.create({
      eventId,
      eventType,
      order: targetOrder?._id,
      razorpayOrderId: targetOrder?.razorpayOrderId,
      razorpayPaymentId: targetOrder?.razorpayPaymentId,
      status: 'processed',
      processingNotes,
      payload: {
        event: event.event,
        createdAt: event.created_at,
      },
    });

    res.status(200).json({
      success: true,
      received: true,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
};
