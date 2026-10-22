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
  CheckCircle2,
  Truck,
  ShieldCheck,
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

  // Free shipping threshold: ₹999 (99900 paise)
  const freeShippingThresholdPaise = 99900;
  const qualifiesForFreeShipping = subtotalPaise >= freeShippingThresholdPaise;
  const amountNeededForFreeShipping = Math.max(
    0,
    freeShippingThresholdPaise - subtotalPaise
  );

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-white rounded-lg border border-slate-200 p-8 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Your ShopSphere Cart is empty</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Your shopping cart is currently waiting for items. Check out today's top picks across electronics, audio, and wearables.
        </p>
        <div className="pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-sm transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Cart Items List (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Shopping Cart
              </h1>
              <p className="text-xs text-slate-500">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-amber-800 hover:text-amber-900 font-medium hover:underline"
            >
              Deselect / Clear all items
            </button>
          </div>

          {/* Cart Items Table / List */}
          <div className="divide-y divide-slate-200">
            {cartItems.map((item) => (
              <div
                key={item.product._id}
                className="py-4 sm:py-5 flex flex-col sm:flex-row items-start gap-4"
              >
                {/* Product Image */}
                <Link
                  to={`/products/${item.product.slug || item.product._id}`}
                  className="w-24 h-24 rounded-md bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-2"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </Link>

                {/* Details & Actions */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/products/${item.product.slug || item.product._id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-amber-700 transition-colors line-clamp-2 leading-snug"
                      >
                        {item.product.name}
                      </Link>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Category: {item.product.category}
                      </span>
                    </div>

                    <div className="text-right sm:ml-4 shrink-0">
                      <span className="text-base font-bold text-slate-900 block">
                        {formatCurrency(item.product.pricePaise * item.quantity)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[11px] text-slate-500">
                          ({formatCurrency(item.product.pricePaise)} each)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock status indicator */}
                  <span className="text-xs font-medium text-emerald-700 block">
                    In Stock
                  </span>

                  {/* Controls: Quantity & Delete */}
                  <div className="flex items-center gap-4 pt-1 text-xs">
                    <div className="flex items-center border border-slate-300 rounded-md bg-slate-50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l-md transition-colors"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-r-md transition-colors"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-slate-300">|</span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product._id)}
                      className="text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal line below cart */}
          <div className="pt-4 border-t border-slate-200 text-right">
            <span className="text-sm sm:text-base text-slate-800">
              Subtotal ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}):{' '}
              <strong className="text-lg font-bold text-slate-950">
                {formatCurrency(subtotalPaise)}
              </strong>
            </span>
          </div>
        </div>

        {/* Right Column: Order Summary / Checkout Box (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          {/* Free Delivery Banner */}
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Your order qualifies for FREE Delivery.</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Test pricing active: ₹1.00 per product with zero additional charges.
            </p>
          </div>

          {/* Subtotal & Calculations */}
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span>Items Total ({totalItemsCount} items):</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotalPaise)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Delivery Charges:</span>
              <span className="font-semibold text-slate-900">
                {shippingPaise === 0 ? (
                  <span className="text-emerald-700 font-bold">FREE</span>
                ) : (
                  formatCurrency(shippingPaise)
                )}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-sm">
              <span className="font-bold text-slate-900">Order Total:</span>
              <span className="text-xl font-black text-slate-900">
                {formatCurrency(totalAmountPaise)}
              </span>
            </div>
          </div>

          {/* Proceed to Buy Button */}
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/80 shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
          >
            <span>Proceed to Buy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Trust Guarantee */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Safe and Secure Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
