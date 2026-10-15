import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
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
  Lock,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment states
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState(null);

  const loadOrder = async () => {
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
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  /**
   * Launch Razorpay Checkout in Test Mode
   */
  const handleRazorpayPayment = async () => {
    if (!order) return;
    setPaying(true);
    setPaymentError(null);
    setPaymentSuccessMessage(null);

    try {
      // 1. Request Razorpay order initialization from backend
      const paymentData = await paymentService.createRazorpayOrder(order._id);

      // 2. Check if official Razorpay checkout script is loaded in window
      if (!window.Razorpay) {
        throw new Error(
          'Razorpay Checkout SDK is not loaded. Please check your internet connection and refresh.'
        );
      }

      // 3. Configure Razorpay Checkout options
      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount, // in paise
        currency: paymentData.currency || 'INR',
        name: 'ShopSphere E-Commerce',
        description: `Payment for Order #${order._id.slice(-8)}`,
        image: '/vite.svg',
        order_id: paymentData.razorpayOrderId,
        prefill: {
          name: paymentData.customer?.name || '',
          email: paymentData.customer?.email || '',
          contact: paymentData.customer?.phone || '',
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async function (response) {
          try {
            // 4. Submit payment signature to backend for HMAC-SHA256 verification
            const verifyRes = await paymentService.verifyPayment({
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setPaymentSuccessMessage(
                'Payment verified successfully! Your order has been marked as PAID.'
              );
              await loadOrder();
            } else {
              setPaymentError(verifyRes.message || 'Payment verification failed.');
            }
          } catch (verifyErr) {
            setPaymentError(
              verifyErr.message ||
                'Payment was processed by Razorpay but signature verification failed on our server.'
            );
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            setPaymentError(
              'Checkout window was closed. Your order remains pending and can be paid anytime.'
            );
          },
        },
      };

      // 4. Open Razorpay Checkout modal
      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', function (response) {
        setPaying(false);
        setPaymentError(
          `Payment Failed: ${response.error.description} (Code: ${response.error.code})`
        );
      });

      rzpInstance.open();
    } catch (err) {
      setPaymentError(
        err.message ||
          'Failed to initialize Razorpay checkout. Check server/.env for RAZORPAY_KEY_ID.'
      );
      setPaying(false);
    }
  };

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

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center space-y-3">
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-inner ${
            isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          {isPaid ? <CheckCircle2 className="w-9 h-9" /> : <Package className="w-9 h-9" />}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isPaid ? 'Payment Confirmed & Order Paid!' : 'Order Placed — Payment Pending'}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {isPaid
            ? 'Your payment was cryptographically verified using HMAC-SHA256 signature verification. Your order is now processing.'
            : 'Your order items and inventory have been reserved. Complete payment using Razorpay Test Mode below.'}
        </p>

        {/* Status Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs">
          <span className="font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
            Order ID: <strong>{order._id}</strong>
          </span>
          <span
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 border ${
              isPaid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isPaid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
            Payment: {order.paymentStatus.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-semibold flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-indigo-600" /> Fulfillment: {order.orderStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Payment Success Alert */}
      {paymentSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{paymentSuccessMessage}</span>
        </div>
      )}

      {/* Payment Error Alert */}
      {paymentError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Checkout Notice</span>
            <span>{paymentError}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Line Items & Delivery Info (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Purchased Items */}
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

          {/* Shipping Address */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" /> Delivery Address
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

          {/* Verified Payment Audit Trail (When Paid) */}
          {isPaid && (
            <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Razorpay Payment Verification Receipt
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                  VERIFIED
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                <p>Payment ID : {order.razorpayPaymentId || 'N/A'}</p>
                <p>Order ID   : {order.razorpayOrderId || 'N/A'}</p>
                <p>Paid At    : {formatDate(order.paidAt)}</p>
                <p>Method     : Razorpay Test Mode (HMAC-SHA256 Validated)</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Payment Actions & Summary (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
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

            {/* Action Button: Pay with Razorpay if pending */}
            {!isPaid ? (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={paying}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{paying ? 'Connecting to Razorpay...' : `Pay ${formatCurrency(order.totalAmountPaise)} with Razorpay`}</span>
                </button>

                {/* Razorpay Test Credentials Helper */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Razorpay Test Credentials</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 font-mono">
                    <li>• Test Card: <strong className="text-slate-800">4111 1111 1111 1111</strong></li>
                    <li>• Expiry: <strong className="text-slate-800">12/30</strong> • CVV: <strong className="text-slate-800">123</strong></li>
                    <li>• OTP: <strong className="text-slate-800">123456</strong></li>
                    <li>• Test UPI: <strong className="text-slate-800">success@razorpay</strong></li>
                  </ul>
                  <p className="text-[10px] text-amber-700 pt-1 border-t border-slate-200/80">
                    Test Mode only: Do not enter real credit cards or bank details.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-emerald-900">Payment Successfully Completed</p>
                <p className="text-[11px] text-emerald-700">
                  This order has been verified and marked as paid in the database.
                </p>
              </div>
            )}

            <Link
              to="/products"
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-slate-500" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
