import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../services/orderService';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  CreditCard,
  ShoppingBag,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getMyOrders();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Order History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your order statuses, fulfillment progress, and Razorpay payment confirmations
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No Orders Placed Yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't placed any orders yet. Discover our curated collection of electronics, audio gear, and accessories!
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all"
            >
              <ShoppingBag className="w-4 h-4" /> Start Shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPaid = order.paymentStatus === 'paid';

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-400 font-mono uppercase">
                      Order ID: {order._id}
                    </span>
                    <p className="text-xs font-medium text-slate-700">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-2">
                    {/* Payment Status */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {isPaid ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-600" />
                      )}
                      <span>{order.paymentStatus.toUpperCase()}</span>
                    </span>

                    {/* Order Fulfillment Status */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        order.orderStatus === 'delivered'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : order.orderStatus === 'shipped'
                          ? 'bg-violet-50 text-violet-800 border-violet-200'
                          : order.orderStatus === 'processing'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : order.orderStatus === 'cancelled'
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {order.orderStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Items Preview */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {order.orderItems?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-100"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          />
                          <div className="text-[11px] max-w-[160px] truncate pr-2">
                            <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                            <p className="text-slate-400">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Ship to: <strong>{order.shippingAddress?.fullName}</strong> —{' '}
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} (
                      {order.shippingAddress?.postalCode})
                    </p>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-0 border-slate-100 shrink-0">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-slate-400 block">Total Amount</span>
                      <span className="text-base font-bold text-slate-900">
                        {formatCurrency(order.totalAmountPaise)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isPaid && order.orderStatus !== 'cancelled' && (
                        <Link
                          to={`/orders/${order._id}`}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Now</span>
                        </Link>
                      )}

                      <Link
                        to={`/orders/${order._id}`}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
