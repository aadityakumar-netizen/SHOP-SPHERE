import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function CartPage() {
  const {
    cartItems,
    totalItemsCount,
    subtotalPaise,
    shippingPaise,
    totalAmountPaise,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  // Threshold for free shipping: ₹999 (99900 paise)
  const freeShippingThresholdPaise = 99900;
  const qualifiesForFreeShipping = subtotalPaise >= freeShippingThresholdPaise;
  const amountNeededForFreeShipping = Math.max(
    0,
    freeShippingThresholdPaise - subtotalPaise
  );
  const freeShippingPercent = Math.min(
    100,
    Math.round((subtotalPaise / freeShippingThresholdPaise) * 100)
  );

  if (cartItems.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Your Shopping Cart is Empty</h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Looks like you haven't added anything to your cart yet. Explore our curated catalogue of consumer electronics and audio gear!
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your selected items ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}) before checkout
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Free Shipping Progress Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-600" />
                {qualifiesForFreeShipping
                  ? 'Congratulations! You unlocked Free Shipping!'
                  : `Add ${formatCurrency(amountNeededForFreeShipping)} more to get Free Delivery!`}
              </span>
              <span className="font-bold text-indigo-600">{freeShippingPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-indigo-200/60 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${freeShippingPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {cartItems.map((item) => (
              <div
                key={item.product._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Product Thumbnail & Details */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {item.product.category}
                    </span>
                    <Link
                      to={`/products/${item.product.slug || item.product._id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors block line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      Unit Price: {formatCurrency(item.product.pricePaise)}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  {/* Quantity */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-sm font-bold text-slate-900 block">
                      {formatCurrency(item.product.pricePaise * item.quantity)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({item.product.pricePaise * item.quantity} paise)
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Items Subtotal ({totalItemsCount} items)</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(subtotalPaise)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <span>Shipping Fee</span>
                  {qualifiesForFreeShipping && (
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      FREE
                    </span>
                  )}
                </span>
                <span className="font-semibold text-slate-900">
                  {shippingPaise === 0 ? '₹0.00' : formatCurrency(shippingPaise)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Total Amount</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {totalAmountPaise} integer paise
                  </span>
                </div>
                <span className="text-2xl font-black text-indigo-600">
                  {formatCurrency(totalAmountPaise)}
                </span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-200 hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Placement & Security Highlights */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero floating-point arithmetic errors (Paise Math)</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                <span>Razorpay Test Mode checkout supported</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
