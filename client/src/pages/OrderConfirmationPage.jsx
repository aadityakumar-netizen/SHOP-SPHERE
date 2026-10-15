import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      setError(null);
      try {
        const data = await orderService.getOrderById(id);
        if (data.order) {
          setOrder(data.order);
        } else {
          setError('Order not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load order confirmation.');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Unable to Load Order</h2>
        <p className="text-xs text-slate-600">{error || 'Order could not be found.'}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4" /> Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Thank you for your order. Your items have been reserved in our inventory, and an order record has been established in MongoDB.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
          <span className="font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
            Order ID: <strong>{order._id}</strong>
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Payment: {order.paymentStatus.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-indigo-600" /> Fulfillment: {order.orderStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Items (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Items Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              Purchased Line Items ({order.orderItems?.length || 0})
            </h2>

            <div className="divide-y divide-slate-100">
              {order.orderItems?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity} × {formatCurrency(item.pricePaise)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 shrink-0">
                    {formatCurrency(item.lineTotalPaise)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" /> Shipping Destination
            </h2>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-900">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.postalCode}
              </p>
              <p className="text-slate-500">Phone: {order.shippingAddress?.phone}</p>
            </div>
          </div>
        </div>

        {/* Pricing Summary (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Payment Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(order.subtotalPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-semibold text-slate-800">
                  {order.shippingPaise === 0 ? 'FREE' : formatCurrency(order.shippingPaise)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-900">Total Amount</span>
                <span className="text-xl font-black text-indigo-600">
                  {formatCurrency(order.totalAmountPaise)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono text-right">
                ({order.totalAmountPaise} integer paise)
              </p>
            </div>

            {/* Payment Pending Notice */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-700" />
                <span>Razorpay Gateway (Phase 5)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Order record is saved with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">paymentStatus: "pending"</code>. Full Razorpay SDK Test Mode checkout modal and HMAC signature verification will be wired in Phase 5.
              </p>
            </div>

            <Link
              to="/products"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
