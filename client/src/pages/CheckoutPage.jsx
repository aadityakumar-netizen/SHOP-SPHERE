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
  CreditCard,
  ShieldCheck,
  Lock,
  AlertCircle,
  Truck,
  CheckCircle2,
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
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Checkout
          </h1>
          <p className="text-xs text-slate-500">
            Review your order and select your delivery details
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-slate-700">256-Bit Secure SSL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Delivery Details & Payment Method (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-bold text-slate-900">Delivery address</h2>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aadit Customer"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Mobile Number (10 digits)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Street Address */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Flat, House no., Building, Company, Apartment</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. Flat 402, Green Valley Apartments, MG Road"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* City */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Town / City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* State */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* PIN Code */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">6-Digit PIN Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="560001"
                    maxLength={6}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-base font-bold text-slate-900">Payment method</h2>
            </div>

            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-900">
                  <input
                    type="radio"
                    name="paymentMethod"
                    defaultChecked
                    className="w-4 h-4 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Razorpay Test Mode (Cards, UPI, Netbanking)</span>
                </label>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded border border-amber-200">
                  Test Checkout
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                Orders are processed using Razorpay Test Mode. You can test complete payment simulation using test cards or dummy UPI without real monetary transactions.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review & Submit (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <button
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/80 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{loading ? 'Placing order...' : 'Use this address & Place order'}</span>
          </button>

          <p className="text-[11px] text-slate-500 text-center leading-tight">
            By placing your order, you agree to ShopSphere's privacy notice and conditions of use.
          </p>

          <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
            <h3 className="font-bold text-slate-900">Order Summary</h3>

            <div className="flex items-center justify-between text-slate-600">
              <span>Items ({totalItemsCount}):</span>
              <span className="font-medium text-slate-900">{formatCurrency(subtotalPaise)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Postage & Packing:</span>
              <span className="font-medium text-slate-900">
                {shippingPaise === 0 ? (
                  <span className="text-emerald-700 font-bold">FREE</span>
                ) : (
                  formatCurrency(shippingPaise)
                )}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-sm">
              <span className="font-bold text-slate-900">Order Total:</span>
              <span className="text-xl font-black text-amber-700">
                {formatCurrency(totalAmountPaise)}
              </span>
            </div>
          </div>

          {/* Compact Cart Items Review */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">Reviewing Items</h4>
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.product._id} className="flex items-center gap-2.5 text-xs">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-10 h-10 rounded object-contain border border-slate-200 shrink-0 p-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{item.product.name}</p>
                    <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {formatCurrency(item.product.pricePaise * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Real-time stock reservation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
