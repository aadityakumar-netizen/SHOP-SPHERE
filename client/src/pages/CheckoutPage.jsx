import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import orderService from '../services/orderService';
import { formatCurrency } from '../utils/formatters';
import {
  MapPin,
  Phone,
  User,
  Building,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Truck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function CheckoutPage() {
  const { user } = useAuth();
  const {
    cartItems,
    totalItemsCount,
    subtotalPaise,
    shippingPaise,
    totalAmountPaise,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState('9876543210');
  const [street, setStreet] = useState('Flat 402, Green Valley Apartments, MG Road');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560001');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If cart is empty, redirect to cart page
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Please provide a valid 10-digit Indian mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(postalCode.trim())) {
      setError('Please provide a valid 6-digit Indian PIN code.');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          fullName,
          phone,
          street,
          city,
          state,
          postalCode,
        },
      };

      const res = await orderService.createOrder(orderPayload);

      if (res.success && res.order) {
        clearCart();
        navigate(`/orders/${res.order._id}`, { replace: true });
      } else {
        setError(res.message || 'Could not place order. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please verify your items.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Checkout & Shipping
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Provide your delivery details. Prices and stock will be verified authoritatively on the server.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Delivery Address Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h2 className="text-base font-bold text-slate-900">Delivery Address (India)</h2>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Recipient Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aadit Sharma"
                      className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">10-Digit Mobile Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Street Address / House / Flat No.</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. Flat 402, Green Valley Apartments"
                    className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* PIN Code */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">6-Digit PIN Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="560001"
                    maxLength={6}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Payment Method Notice */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Razorpay Test Mode Checkout (Phase 5 Gateway)</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upon placing this order, a secure order record is created in MongoDB with atomic stock reservation. You will be redirected to the order confirmation page. Razorpay Test Mode checkout handles card, UPI, and netbanking simulation without real money.
            </p>
          </div>
        </div>

        {/* Right Column: Order Items Review & Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Review ({totalItemsCount} items)
            </h2>

            {/* Compact items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.product._id} className="flex items-center gap-3 text-xs">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.product.name}</p>
                    <p className="text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(item.product.pricePaise * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">{formatCurrency(subtotalPaise)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-semibold text-slate-800">
                  {shippingPaise === 0 ? 'FREE' : formatCurrency(shippingPaise)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Total Due</span>
                  <span className="text-[10px] text-slate-400 font-mono">{totalAmountPaise} paise</span>
                </div>
                <span className="text-2xl font-black text-indigo-600">
                  {formatCurrency(totalAmountPaise)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Creating Order...' : 'Place Order Now'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            {/* Security note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Atomic stock update prevents overselling</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
