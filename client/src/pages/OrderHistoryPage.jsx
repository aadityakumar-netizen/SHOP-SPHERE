import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../services/orderService';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
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
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Your Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track packages, view receipts, and review past purchases
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900">You have no orders yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore consumer electronics, audio gear, and wearables to place your first order.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-sm transition-colors"
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
                className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Amazon-style Order Meta Top Bar */}
                <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-slate-600">
                    <div>
                      <span className="text-[11px] uppercase text-slate-500 block">
                        Order Placed
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase text-slate-500 block">
                        Total
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(order.totalAmountPaise)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] uppercase text-slate-500 block">
                        Ship To
                      </span>
                      <span className="font-medium text-slate-800">
                        {order.shippingAddress?.fullName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] uppercase text-slate-500 block">
                        Order # {order._id.slice(-8)}
                      </span>
                      <Link
                        to={`/orders/${order._id}`}
                        className="text-amber-800 hover:text-amber-900 hover:underline font-medium text-xs"
                      >
                        View order details
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Items Preview */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${
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
                        <span>Payment: {order.paymentStatus.toUpperCase()}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Status: {order.orderStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {order.orderItems?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-md border border-slate-200"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded object-contain border border-slate-200 p-0.5 bg-white"
                          />
                          <div className="text-[11px] max-w-[160px] truncate pr-2">
                            <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                            <p className="text-slate-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Delivery to {order.shippingAddress?.street}, {order.shippingAddress?.city} (
                      {order.shippingAddress?.postalCode})
                    </p>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-0 border-slate-100 shrink-0">
                    {!isPaid && order.orderStatus !== 'cancelled' && (
                      <Link
                        to={`/orders/${order._id}`}
                        className="px-4 py-2 text-xs font-bold rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors flex items-center gap-1 shadow-sm border border-amber-500/80"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Now</span>
                      </Link>
                    )}

                    <Link
                      to={`/orders/${order._id}`}
                      className="px-4 py-2 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1 border border-slate-300"
                    >
                      <span>Track Package</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
