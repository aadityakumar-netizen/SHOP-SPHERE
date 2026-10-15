import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Valid fulfillment status transitions
const VALID_TRANSITIONS = {
  placed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get dashboard metrics (Revenue, Orders, Products, Users)
 * @access  Private/Admin
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalOrders,
      paidOrdersRevenue,
      ordersByStatus,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalUsers,
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(),

      // Total revenue from paid orders in paise
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenuePaise: { $sum: '$totalAmountPaise' } } },
      ]),

      // Orders grouped by orderStatus
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      ]),

      // Total products
      Product.countDocuments({ isActive: true }),

      // Low stock products (1 to 5 units)
      Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 5 } }),

      // Out of stock products (0 units)
      Product.countDocuments({ isActive: true, stock: 0 }),

      // Total registered customers
      User.countDocuments({ role: 'customer' }),
    ]);

    const revenuePaise = paidOrdersRevenue[0]?.totalRevenuePaise || 0;

    const statusCounts = {
      placed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    ordersByStatus.forEach((item) => {
      if (item._id && statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        revenuePaise,
        revenueRupees: revenuePaise / 100,
        totalOrders,
        statusCounts,
        inventory: {
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
        },
        totalCustomers: totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/orders
 * @desc    Get all orders with customer details and filters
 * @access  Private/Admin
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, page = 1, limit = 20 } = req.query;

    const query = {};
    if (orderStatus && orderStatus !== 'all') {
      query.orderStatus = orderStatus;
    }
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limitNum) || 1,
      currentPage: pageNum,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/admin/orders/:id/status
 * @desc    Update order fulfillment status with state machine transition validation
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format.',
      });
    }

    const validStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const currentStatus = order.orderStatus;

    // Disallow transition if already in requested state
    if (currentStatus === status) {
      return res.status(200).json({
        success: true,
        message: `Order is already in '${status}' state.`,
        order,
      });
    }

    // State transition rule enforcement
    const allowedNextStates = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStates.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: Cannot transition order from '${currentStatus}' to '${status}'. Allowed transitions: [${allowedNextStates.join(', ')}]`,
      });
    }

    // If order was cancelled, restore inventory
    if (status === 'cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.orderStatus = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      order,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAdminStats,
  getAllOrders,
  updateOrderStatus,
};
