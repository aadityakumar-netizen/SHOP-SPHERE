import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

/**
 * Helper to calculate shipping fee in paise
 * Free shipping for orders >= ₹999 (99900 paise), otherwise ₹99 (9900 paise)
 */
const calculateShippingPaise = (subtotalPaise) => {
  return subtotalPaise >= 99900 ? 0 : 9900;
};

/**
 * @route   POST /api/v1/orders/validate-cart
 * @desc    Validate cart items against live MongoDB prices and stock without creating an order
 * @access  Public
 */
export const validateCart = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart must contain at least one item.',
      });
    }

    let subtotalPaise = 0;
    const validatedItems = [];
    const stockErrors = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID format: ${item.productId}`,
        });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive integer.',
        });
      }

      const product = await Product.findById(item.productId).lean();
      if (!product || !product.isActive) {
        stockErrors.push({
          productId: item.productId,
          message: 'Product is no longer available.',
        });
        continue;
      }

      const isStockSufficient = product.stock >= qty;
      if (!isStockSufficient) {
        stockErrors.push({
          productId: item.productId,
          name: product.name,
          availableStock: product.stock,
          requestedQty: qty,
          message: `Only ${product.stock} units available in stock.`,
        });
      }

      const lineTotalPaise = product.pricePaise * qty;
      subtotalPaise += lineTotalPaise;

      validatedItems.push({
        product: {
          id: product._id,
          name: product.name,
          imageUrl: product.imageUrl,
          pricePaise: product.pricePaise,
          stock: product.stock,
        },
        quantity: qty,
        lineTotalPaise,
        isStockSufficient,
      });
    }

    const shippingPaise = calculateShippingPaise(subtotalPaise);
    const totalAmountPaise = subtotalPaise + shippingPaise;

    res.status(200).json({
      success: stockErrors.length === 0,
      isValid: stockErrors.length === 0,
      subtotalPaise,
      shippingPaise,
      totalAmountPaise,
      items: validatedItems,
      stockErrors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new pending order with atomic stock reservation
 * @access  Private (Customer)
 */
export const createOrder = async (req, res, next) => {
  const decrementedItems = []; // Tracking for safe rollback on failure

  try {
    const { items, shippingAddress } = req.body;

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.',
      });
    }

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.postalCode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required shipping address fields.',
      });
    }

    // Sanitize shipping address
    const cleanAddress = {
      fullName: shippingAddress.fullName.trim(),
      phone: shippingAddress.phone.trim(),
      street: shippingAddress.street.trim(),
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      postalCode: shippingAddress.postalCode.trim(),
      country: 'India',
    };

    const orderItems = [];
    let subtotalPaise = 0;

    // 1. First pass: Validate products and prices from MongoDB
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID format: ${item.productId}`,
        });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item quantities must be whole positive integers.',
        });
      }

      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product is unavailable or no longer exists: ${item.productId}`,
        });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${qty}.`,
        });
      }

      const lineTotalPaise = product.pricePaise * qty;
      subtotalPaise += lineTotalPaise;

      orderItems.push({
        product: product._id,
        name: product.name,
        imageUrl: product.imageUrl,
        quantity: qty,
        pricePaise: product.pricePaise, // Authoritative price snapshot from DB
        lineTotalPaise,
      });
    }

    // 2. Second pass: Atomic Stock Reservation
    // Decrement stock atomically. If stock changed concurrently, rollback previous decrements.
    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          stock: { $gte: item.quantity },
          isActive: true,
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Concurrency conflict: Rollback previously reserved items
        for (const rolledBackItem of decrementedItems) {
          await Product.findByIdAndUpdate(rolledBackItem.productId, {
            $inc: { stock: rolledBackItem.quantity },
          });
        }

        return res.status(409).json({
          success: false,
          message: `Stock conflict: "${item.name}" was just reserved by another customer. Please refresh your cart.`,
        });
      }

      // Record for rollback tracking
      decrementedItems.push({
        productId: item.product,
        quantity: item.quantity,
      });
    }

    // 3. Final calculations
    const shippingPaise = calculateShippingPaise(subtotalPaise);
    const totalAmountPaise = subtotalPaise + shippingPaise;

    // 4. Create Order document in MongoDB
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress: cleanAddress,
      subtotalPaise,
      shippingPaise,
      totalAmountPaise,
      currency: 'INR',
      orderStatus: 'placed',
      paymentStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully and stock reserved.',
      order,
    });
  } catch (error) {
    // If order creation errors out after stock was reserved, restore stock safely
    if (decrementedItems.length > 0) {
      for (const item of decrementedItems) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        }).catch((err) => console.error('Failed to restore stock:', err));
      }
    }
    next(error);
  }
};

/**
 * @route   GET /api/v1/orders/my
 * @desc    Get order history for currently logged in customer
 * @access  Private (Customer)
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get single order details by ID (enforcing ownership or admin privilege)
 * @access  Private (Owner or Admin)
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.',
      });
    }

    const order = await Order.findById(id).populate('user', 'name email').lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Authorization check: User must own the order, or be an admin
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this order.',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/orders/:id/cancel
 * @desc    Cancel an unpaid order and restore stock
 * @access  Private (Owner or Admin)
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.',
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Check ownership
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot cancel this order.',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Paid orders cannot be cancelled directly. Please contact support.',
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This order is already cancelled.',
      });
    }

    // Restore stock atomically
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled and stock restored successfully.',
      order,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  validateCart,
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
