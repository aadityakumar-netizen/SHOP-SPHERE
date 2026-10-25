
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  Wallet,
  Landmark,
  Truck,
} from 'lucide-react';

export default function OrderConfirmationPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentNotice, setPaymentNotice] = useState(null);
  const [paymentFailure, setPaymentFailure] = useState(null);
  const [paymentVerificationError, setPaymentVerificationError] =
    useState(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState(null);

  const loadOrder = async () => {
    try {
      const data = await orderService.getOrderById(id);

      if (data.order) {
        setOrder(data.order);
        setError(null);
      } else {
        setError('Order not found.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load order confirmation.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleDemoPayment = async () => {
    if (!order || order.paymentMethod !== 'demo') return;

    setPaymentStatus('processing');
    setPaymentNotice(null);
    setPaymentFailure(null);
    setPaymentVerificationError(null);
    setPaymentSuccessMessage(null);

    try {
      const result = await paymentService.completeDemoPayment(
        order._id,
        order.demoPaymentMethod
      );

      if (!result.success || !result.demo) {
        throw new Error(
          result.message || 'Unable to complete the demo simulation.'
        );
      }

      setPaymentStatus('success');
      setPaymentSuccessMessage(
        'Demo simulation completed. No money was charged. This order is NOT marked as paid.'
      );

      await loadOrder();
    } catch (err) {
      setPaymentStatus('failed');
      setPaymentFailure({
        code: 'DEMO_SIMULATION_ERROR',
        message:
          err.response?.data?.message ||
          err.message ||
          'Could not complete the demo simulation. Please retry.',
      });
    }
  };

  const handleRazorpayPayment = async () => {
    if (!order || order.paymentMethod !== 'razorpay') return;

    setPaymentStatus('processing');
    setPaymentNotice(null);
    setPaymentFailure(null);
    setPaymentVerificationError(null);
    setPaymentSuccessMessage(null);

    try {
      const paymentData = await paymentService.createRazorpayOrder(order._id);

      if (paymentData.keyId?.startsWith('rzp_live_')) {
        throw new Error(
          'Live mode keys are prohibited. ShopSphere must use Razorpay Test Mode.'
        );
      }

      if (
        !paymentData.isConfigured ||
        !paymentData.keyId ||
        paymentData.keyId.includes('placeholder')
      ) {
        throw new Error(
          'Razorpay Test Mode credentials are not configured on the backend. Check server/.env without sharing your keys.'
        );
      }

      if (
        !paymentData.razorpayOrderId ||
        !paymentData.razorpayOrderId.startsWith('order_') ||
        paymentData.razorpayOrderId.startsWith('order_test_')
      ) {
        throw new Error(
          'A real Razorpay Test Mode order ID was not received. The hosted checkout cannot be opened.'
        );
      }

      if (!window.Razorpay) {
        throw new Error(
          'Razorpay Checkout SDK is not loaded. Check your connection and refresh the page.'
        );
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        name: 'ShopSphere',
        description: `Order #${order._id.slice(-8)}`,
        order_id: paymentData.razorpayOrderId,
        config: {
          display: {
            hide: [{ method: 'upi' }],
            preferences: {
              show_default_blocks: false,
            },
            blocks: {
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ],
              },
            },
            sequence: ['block.other'],
          },
        },
        prefill: {
          name: paymentData.customer?.name || '',
          email: paymentData.customer?.email || '',
          contact: paymentData.customer?.phone || '',
        },
        theme: {
          color: '#f59e0b',
        },
        handler: async (response) => {
          try {
            const verifyRes = await paymentService.verifyPayment({
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setPaymentStatus('success');
              setPaymentSuccessMessage(
                'The server accepted the Razorpay payment verification.'
              );
              await loadOrder();
            } else {
              setPaymentStatus('verification_failed');
              setPaymentVerificationError({
                status: verifyRes.verificationStatus || 'unverified',
                message:
                  verifyRes.message ||
                  'Payment verification failed. The order remains pending.',
              });
            }
          } catch (verifyErr) {
            setPaymentStatus('verification_failed');
            setPaymentVerificationError({
              status: 'verification_failed',
              message:
                verifyErr.response?.data?.message ||
                verifyErr.message ||
                'Server payment verification failed. Check the order status before retrying.',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('cancelled');
            setPaymentNotice(
              'Checkout was closed. Your order remains pending unless the gateway subsequently confirms payment. Check your order status before retrying.'
            );
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', async (response) => {
        const errObj = response.error || {};
        let message =
          errObj.description || 'Payment failed at the gateway.';

        try {
          const logResult = await paymentService.logPaymentFailure({
            orderId: order._id,
            razorpayOrderId: paymentData.razorpayOrderId,
            errorCode: errObj.code,
            errorDescription: errObj.description,
            errorSource: errObj.source,
            errorStep: errObj.step,
            errorReason: errObj.reason,
            razorpayPaymentId: errObj.metadata?.payment_id,
          });

          if (logResult?.sanitizedMessage) {
            message = logResult.sanitizedMessage;
          }
        } catch (logErr) {
          console.warn('Unable to log payment diagnostics:', logErr);
        }

        setPaymentStatus('failed');
        setPaymentFailure({
          code: errObj.code || 'PAYMENT_FAILED',
          message,
        });
      });

      rzpInstance.open();
    } catch (err) {
      setPaymentStatus('failed');
      setPaymentFailure({
        code: 'CHECKOUT_INITIALIZATION_ERROR',
        message:
          err.response?.data?.message ||
          err.message ||
          'Unable to initialize Razorpay checkout.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-slate-500">
          Loading your order confirmation...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">
          Unable to Load Order
        </h2>
        <p className="text-xs text-slate-500">
          {error || 'Order could not be found.'}
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-amber-400 text-slate-950"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Return to Storefront
        </Link>
      </div>
    );
  }

  const isDemo = order.paymentMethod === 'demo';
  const isDemoCompleted = isDemo && order.demoPaymentStatus === 'completed';
  const isPaid = !isDemo && order.paymentStatus === 'paid';
  const isCOD = order.paymentMethod === 'cod';
  const isRazorpay = order.paymentMethod === 'razorpay';

  const demoMethodLabels = {
    card: 'Card Demo',
    netbanking: 'Netbanking Demo',
    wallet: 'Wallet Demo',
  };

  const selectedDemoLabel =
    demoMethodLabels[order.demoPaymentMethod] || 'Demo Payment';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Order status */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isPaid || isDemoCompleted || isCOD
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isPaid || isDemoCompleted || isCOD ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <Package className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isDemo
                ? isDemoCompleted
                  ? 'Demo Simulation Completed'
                  : 'Order Created — Demo Payment'
                : isCOD
                  ? 'Order Placed Successfully — Cash on Delivery'
                  : isPaid
                    ? 'Payment Verified — Order Confirmed'
                    : 'Order Placed — Payment Pending'}
            </h1>

            <p className="text-xs text-slate-600">
              {isDemo
                ? 'This is a portfolio demonstration. No money was transferred, and the order is not marked as paid.'
                : isCOD
                  ? 'Your order is placed. Pay in cash when it is delivered.'
                  : isPaid
                    ? 'The order has a verified payment status.'
                    : 'Complete payment through Razorpay Test Checkout to update the payment status.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 font-semibold break-all">
                Order #{order._id}
              </span>

              <span
                className={`px-2.5 py-0.5 rounded font-semibold flex items-center gap-1 border ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isPaid ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                Payment: {order.paymentStatus?.toUpperCase() || 'PENDING'}
              </span>

              {isDemo && (
                <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-semibold">
                  SIMULATION ONLY
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                Order: {order.orderStatus?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isDemo && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Info className="w-5 h-5 shrink-0" />
            Demo payment — no real transaction
          </div>
          <p>
            Selected method: <strong>{selectedDemoLabel}</strong>
          </p>
          <p>
            Completing this simulation does not debit a bank account, transfer
            funds, verify a real payment, or mark this order as paid.
          </p>
        </div>
      )}

      {paymentSuccessMessage && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{paymentSuccessMessage}</span>
        </div>
      )}

      {paymentStatus === 'cancelled' && paymentNotice && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{paymentNotice}</p>
        </div>
      )}

      {paymentStatus === 'failed' && paymentFailure && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
          <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Payment Action Failed</p>
            <p>{paymentFailure.message}</p>
            <p className="text-[11px]">Code: {paymentFailure.code}</p>
          </div>
        </div>
      )}

      {paymentStatus === 'verification_failed' &&
        paymentVerificationError && (
          <div className="p-4 rounded-md bg-red-50 border border-red-300 text-red-950 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                Payment Verification Failed
              </p>
              <p>{paymentVerificationError.message}</p>
              <p className="text-[11px]">
                Check the current order status before trying again.
              </p>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Items and delivery */}
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Items Ordered ({order.orderItems?.length || 0})
            </h2>

            <div className="divide-y divide-slate-100">
              {order.orderItems?.map((item, index) => (
                <div
                  key={item.product || index}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded object-contain border border-slate-200 shrink-0 p-1"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity} ×{' '}
                        {formatCurrency(item.pricePaise)}
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

          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-2 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Delivery Address
            </h2>

            <div className="text-xs text-slate-700 space-y-0.5">
              <p className="font-semibold text-slate-900">
                {order.shippingAddress?.fullName}
              </p>
              <p>{order.shippingAddress?.street}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                — {order.shippingAddress?.postalCode}
              </p>
              <p className="text-slate-500">
                Phone: {order.shippingAddress?.phone}
              </p>
            </div>
          </div>

          {/* Receipt only for verified non-demo payments */}
          {isPaid && (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Payment Record
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                  PAID
                </span>
              </div>

              <div className="space-y-1 font-mono text-[11px] text-slate-700 bg-white p-3 rounded border border-slate-200">
                <p>Payment ID: {order.razorpayPaymentId || 'N/A'}</p>
                <p>Gateway Order ID: {order.razorpayOrderId || 'N/A'}</p>
                <p>Paid Date: {order.paidAt ? formatDate(order.paidAt) : 'N/A'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Summary and payment actions */}
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
                  {order.shippingPaise === 0
                    ? 'FREE'
                    : formatCurrency(order.shippingPaise)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-sm">
                <span className="font-bold text-slate-900">Grand Total:</span>
                <span className="text-lg font-black text-slate-900">
                  {formatCurrency(order.totalAmountPaise)}
                </span>
              </div>
            </div>

            {isDemo ? (
              <div className="space-y-3 pt-2">
                {isDemoCompleted ? (
                  <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      Demo Completed
                    </div>
                    <p className="text-xs text-emerald-800">
                      This is a simulated result only. Payment status remains{' '}
                      <strong>{order.paymentStatus?.toUpperCase()}</strong>;
                      no money was charged.
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleDemoPayment}
                      disabled={paymentStatus === 'processing'}
                      className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/80 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paymentStatus === 'processing' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Running Demo...</span>
                        </>
                      ) : (
                        <>
                          {order.demoPaymentMethod === 'wallet' ? (
                            <Wallet className="w-4 h-4" />
                          ) : order.demoPaymentMethod === 'netbanking' ? (
                            <Landmark className="w-4 h-4" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                          <span>Complete Demo Simulation</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-500">
                      This button simulates the selected method. It does not
                      contact a payment gateway or transfer money.
                    </p>
                  </>
                )}
              </div>
            ) : isRazorpay && !isPaid ? (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={paymentStatus === 'processing'}
                  className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/80 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {paymentStatus === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {paymentStatus === 'failed' ||
                        paymentStatus === 'cancelled' ||
                        paymentStatus === 'verification_failed'
                          ? 'Retry Payment'
                          : 'Pay'}{' '}
                        {formatCurrency(order.totalAmountPaise)}
                      </span>
                    </>
                  )}
                </button>

                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    Razorpay Test Mode
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Only use official Razorpay test credentials and test
                    payment details. Test checkout availability depends on
                    your gateway configuration.
                  </p>
                  <p className="text-[10px] text-slate-500">
                    A successful checkout must still be verified by the
                    server.
                  </p>
                </div>
              </div>
            ) : isCOD ? (
              <div className="p-4 rounded-md bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900">
                  <Truck className="w-5 h-5" />
                  <p className="text-sm font-bold">Cash on Delivery</p>
                </div>
                <p className="text-xs text-amber-800">
                  Pay {formatCurrency(order.totalAmountPaise)} in cash when
                  your order is delivered.
                </p>
                <p className="text-[11px] text-amber-700">
                  No online payment is required now.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <p className="text-xs font-bold text-emerald-900">
                  Payment Complete
                </p>
                <p className="text-[11px] text-emerald-700">
                  The server reports this order as paid.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={loadOrder}
              className="w-full py-2 px-3 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Order Status
            </button>

            <Link
              to="/products"
              className="w-full py-2 px-3 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
