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
  AlertTriangle,
  Info,
  XCircle,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Distinct payment flow states: 'idle' | 'processing' | 'cancelled' | 'failed' | 'verification_failed' | 'success'
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentNotice, setPaymentNotice] = useState(null);
  const [paymentFailure, setPaymentFailure] = useState(null);
  const [paymentVerificationError, setPaymentVerificationError] = useState(null);
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
    setPaymentStatus('processing');
    setPaymentNotice(null);
    setPaymentFailure(null);
    setPaymentVerificationError(null);
    setPaymentSuccessMessage(null);

    try {
      // 1. Request Razorpay order initialization from backend
      const paymentData = await paymentService.createRazorpayOrder(order._id);

      // Guard: Ensure live mode keys are never accepted
      if (paymentData.keyId && paymentData.keyId.startsWith('rzp_live_')) {
        throw new Error('Live mode keys are prohibited. Must run in Razorpay Test Mode.');
      }

      // Guard: Ensure backend has valid Razorpay Test Mode configuration
      if (!paymentData.isConfigured || !paymentData.keyId || paymentData.keyId.includes('placeholder')) {
        throw new Error(
          'Razorpay Test Mode credentials are not configured on the backend. Please ensure valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are configured in server/.env.'
        );
      }

      // Guard: Ensure order is an actual Razorpay order ID, not a synthetic local simulation ID
      if (
        !paymentData.razorpayOrderId ||
        !paymentData.razorpayOrderId.startsWith('order_') ||
        paymentData.razorpayOrderId.startsWith('order_test_')
      ) {
        throw new Error(
          'A real Razorpay order ID (order_...) was not received from the server. Razorpay Checkout requires an order created on the Razorpay API.'
        );
      }

      // 2. Check if official Razorpay checkout script is loaded in window
      if (!window.Razorpay) {
        throw new Error(
          'Razorpay Checkout SDK is not loaded. Please check your internet connection and refresh the page.'
        );
      }

      // 3. Configure Razorpay Checkout options with matching orderId, keyId, and amount
      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount, // in paise
        currency: paymentData.currency || 'INR',
        name: 'ShopSphere',
        description: `Order #${order._id.slice(-8)}`,
        image: '/vite.svg',
        order_id: paymentData.razorpayOrderId,
        prefill: {
          name: paymentData.customer?.name || '',
          email: paymentData.customer?.email || '',
          contact: paymentData.customer?.phone || '',
        },
        theme: {
          color: '#f59e0b',
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
              setPaymentStatus('success');
              setPaymentSuccessMessage(
                'Payment verified successfully! Your order has been marked as PAID.'
              );
              await loadOrder();
            } else {
              setPaymentStatus('verification_failed');
              setPaymentVerificationError({
                status: verifyRes.verificationStatus || 'unverified',
                message:
                  verifyRes.message ||
                  'Payment signature could not be verified by the server. Your order remains pending.',
              });
            }
          } catch (verifyErr) {
            setPaymentStatus('verification_failed');
            setPaymentVerificationError({
              status: verifyErr.data?.verificationStatus || 'signature_invalid',
              message:
                verifyErr.data?.message ||
                verifyErr.message ||
                'Payment signature verification failed on the server. Your order has NOT been marked as paid.',
            });
          }
        },
        modal: {
          ondismiss: function () {
            // Distinct cancellation state: Informative notice, not a fatal failure
            setPaymentStatus('cancelled');
            setPaymentNotice(
              'Checkout window was closed before completing payment. Your order remains pending and no money was charged. You can click "Pay Now" whenever you are ready.'
            );
          },
        },
      };

      // 4. Open Razorpay Checkout modal
      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', async function (response) {
        const errObj = response.error || {};
        let displayMessage =
          errObj.description || 'Payment was declined or failed in the checkout gateway.';

        // Report payment failure diagnostics safely to backend
        try {
          const logRes = await paymentService.logPaymentFailure({
            orderId: order._id,
            razorpayOrderId: paymentData.razorpayOrderId,
            errorCode: errObj.code,
            errorDescription: errObj.description,
            errorSource: errObj.source,
            errorStep: errObj.step,
            errorReason: errObj.reason,
            razorpayPaymentId: errObj.metadata?.payment_id,
          });
          if (logRes?.sanitizedMessage) {
            displayMessage = logRes.sanitizedMessage;
          }
        } catch (logErr) {
          console.warn('Failed to report payment failure diagnostics to server:', logErr);
        }

        setPaymentStatus('failed');
        setPaymentFailure({
          code: errObj.code || 'PAYMENT_FAILED',
          reason: errObj.reason || 'gateway_rejection',
          message: displayMessage,
        });
      });

      rzpInstance.open();
    } catch (err) {
      setPaymentStatus('failed');
      setPaymentFailure({
        code: 'INITIALIZATION_ERROR',
        reason: 'client_initialization',
        message:
          err.message ||
          'Failed to initialize Razorpay checkout. Please check server configuration and try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading your order confirmation...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to Load Order</h2>
        <p className="text-xs text-slate-500">{error || 'Order could not be found.'}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-sm"
        >
          <ArrowRight className="w-3.5 h-3.5" /> Return to Storefront
        </Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isPaid ? <CheckCircle2 className="w-7 h-7" /> : <Package className="w-7 h-7" />}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isPaid ? 'Thank you, your order is confirmed!' : 'Order Placed — Complete Payment to Dispatch'}
            </h1>
            <p className="text-xs text-slate-600">
              {isPaid
                ? 'We have received your payment. An email confirmation has been queued.'
                : 'Your order has been registered and inventory reserved. Please complete payment with Razorpay below.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 font-semibold">
                Order #{order._id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded font-semibold flex items-center gap-1 border ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isPaid ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                Payment: {order.paymentStatus.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold flex items-center gap-1">
                Fulfillment: {order.orderStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Payment Success Alert */}
      {paymentSuccessMessage && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{paymentSuccessMessage}</span>
        </div>
      )}

      {/* 2. Distinct Cancellation Alert (Informative notice when user dismisses modal) */}
      {paymentStatus === 'cancelled' && paymentNotice && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-sm">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-amber-950">Checkout Window Dismissed</span>
            <p className="text-amber-800 leading-relaxed">{paymentNotice}</p>
          </div>
        </div>
      )}

      {/* 3. Distinct Gateway Payment Failure Alert (Declines, invalid order, gateway timeout) */}
      {paymentStatus === 'failed' && paymentFailure && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 shadow-sm">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-950">Payment Failed at Gateway</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-100 font-mono text-[10px] text-rose-800 font-semibold uppercase">
                {paymentFailure.code}
              </span>
            </div>
            <p className="text-rose-800 leading-relaxed">{paymentFailure.message}</p>
            <p className="text-[11px] text-rose-600 pt-1">
              Your order remains in pending status. You can retry paying with another card or UPI option below.
            </p>
          </div>
        </div>
      )}

      {/* 4. Distinct Cryptographic Verification Failure Alert (Never marks order as paid!) */}
      {paymentStatus === 'verification_failed' && paymentVerificationError && (
        <div className="p-4 rounded-md bg-red-100 border-2 border-red-400 text-red-950 text-xs flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-red-900 uppercase tracking-wide">
                Security Warning: Payment Verification Failed
              </span>
              <span className="px-2 py-0.5 rounded bg-red-200 text-red-900 font-mono text-[10px] font-bold">
                {paymentVerificationError.status}
              </span>
            </div>
            <p className="text-red-900 font-medium leading-relaxed">
              {paymentVerificationError.message}
            </p>
            <p className="text-[11px] text-red-800 pt-1">
              Order status has <strong className="underline">NOT</strong> been changed to paid because the server rejected the signature or order parameters.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Purchased Items & Delivery (2 Cols) */}
        <div className="md:col-span-2 space-y-5">
          {/* Purchased Items */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Items Ordered ({order.orderItems?.length || 0})
            </h2>

            <div className="divide-y divide-slate-100">
              {order.orderItems?.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded object-contain border border-slate-200 shrink-0 p-1"
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
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-2 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" /> Delivery Address
            </h2>
            <div className="text-xs text-slate-700 space-y-0.5">
              <p className="font-semibold text-slate-900">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.postalCode}
              </p>
              <p className="text-slate-500">Phone: {order.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Payment Receipt details if Paid */}
          {isPaid && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Razorpay Payment Receipt
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                  VERIFIED
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-700 bg-white p-3 rounded border border-slate-200">
                <p>Payment ID : {order.razorpayPaymentId || 'N/A'}</p>
                <p>Order ID   : {order.razorpayOrderId || 'N/A'}</p>
                <p>Paid Date  : {formatDate(order.paidAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Payment Actions & Summary (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Order Summary
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Items Subtotal:</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(order.subtotalPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping:</span>
                <span className="font-medium text-slate-900">
                  {order.shippingPaise === 0 ? 'FREE' : formatCurrency(order.shippingPaise)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-sm">
                <span className="font-bold text-slate-900">Grand Total:</span>
                <span className="text-lg font-black text-slate-900">
                  {formatCurrency(order.totalAmountPaise)}
                </span>
              </div>
            </div>

            {/* Razorpay Action Button if Pending */}
            {!isPaid ? (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={paymentStatus === 'processing'}
                  className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/80 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {paymentStatus === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Connecting to Razorpay...</span>
                    </>
                  ) : paymentStatus === 'failed' || paymentStatus === 'cancelled' || paymentStatus === 'verification_failed' ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Retry Payment ({formatCurrency(order.totalAmountPaise)})</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay {formatCurrency(order.totalAmountPaise)} Now</span>
                    </>
                  )}
                </button>

                {/* Razorpay Test Simulation Info */}
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-left space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    Razorpay Test Mode Helper
                  </span>
                  <ul className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                    <li>Card: 4111 1111 1111 1111</li>
                    <li>Expiry: 12/30 • CVV: 123</li>
                    <li>OTP: 123456</li>
                    <li>UPI: success@razorpay</li>
                  </ul>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    Test Mode: Simulated payment without real monetary deduction.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <p className="text-xs font-bold text-emerald-900">Payment Complete</p>
                <p className="text-[11px] text-emerald-700">
                  Order is verified and marked as paid.
                </p>
              </div>
            )}

            <Link
              to="/products"
              className="w-full py-2 px-3 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-slate-500" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
