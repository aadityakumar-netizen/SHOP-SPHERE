import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, 'Event ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      index: true,
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    razorpayOrderId: {
      type: String,
      index: true,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['received', 'processed', 'ignored', 'failed'],
      default: 'received',
      index: true,
    },
    processingNotes: {
      type: String,
      trim: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed, // Sanitized event payload
    },
  },
  {
    timestamps: true,
  }
);

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

export default WebhookEvent;
