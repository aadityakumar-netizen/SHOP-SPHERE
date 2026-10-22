import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';

/**
 * Safe test order cancellation and inventory restoration script.
 * Usage: node scripts/cancelTestOrder.js [orderId]
 */
async function cancelTestOrder() {
  const targetOrderId = process.argv[2] || '6ad3bc8319da0e094abcb98a';

  try {
    console.log('[ORDER CANCEL] Connecting to MongoDB...');
    await connectDB();

    console.log(`[ORDER CANCEL] Looking up order: ${targetOrderId}...`);
    const order = await Order.findById(targetOrderId);

    if (!order) {
      console.error(`[ORDER CANCEL ERROR] Order ${targetOrderId} not found.`);
      process.exit(1);
    }

    console.log(`Found order #${order._id}:`);
    console.log(` - Subtotal: ${order.subtotalPaise} paise (₹${(order.subtotalPaise / 100).toFixed(2)})`);
    console.log(` - Payment Status: ${order.paymentStatus}`);
    console.log(` - Order Status: ${order.orderStatus}`);
    console.log(` - Items: ${order.orderItems.map((i) => `${i.name} (qty: ${i.quantity})`).join(', ')}`);

    if (order.paymentStatus === 'paid') {
      console.warn('[ORDER CANCEL WARNING] This order is already PAID. Refusing to cancel paid order.');
      process.exit(1);
    }

    if (order.orderStatus === 'cancelled') {
      console.log('[ORDER CANCEL] Order is already cancelled. No action needed.');
      process.exit(0);
    }

    // 1. Restore reserved inventory stock
    console.log('[ORDER CANCEL] Restoring reserved product inventory...');
    for (const item of order.orderItems) {
      const updatedProduct = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { new: true }
      );
      if (updatedProduct) {
        console.log(` ✓ Restored +${item.quantity} stock for "${updatedProduct.name}" (New stock: ${updatedProduct.stock})`);
      }
    }

    // 2. Mark order status as cancelled
    order.orderStatus = 'cancelled';
    await order.save();

    console.log(`\n[ORDER CANCEL SUCCESS] Order #${order._id} has been safely marked as CANCELLED.`);
    console.log('Historical price snapshot preserved for audit trail; inventory returned to catalog.');
    process.exit(0);
  } catch (error) {
    console.error('[ORDER CANCEL ERROR] Failed to cancel order:', error);
    process.exit(1);
  }
}

cancelTestOrder();
