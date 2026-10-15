import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowLeft,
  Check,
  ShoppingCart,
  AlertCircle,
  Plus,
  Minus,
  CreditCard,
} from 'lucide-react';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const data = await productService.getProductById(id);
        if (data.product) {
          setProduct(data.product);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (delta) => {
    if (!product) return;
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= product.stock) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="py-12 max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-200 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2"></div>
            <div className="h-24 bg-slate-200 rounded"></div>
            <div className="h-12 bg-slate-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Product Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'This product does not exist or has been removed.'}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalogue
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap py-1">
          <Link to="/" className="hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-indigo-600 transition-colors">
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-slate-400">{product.category}</span>
          <span>/</span>
          <span className="font-medium text-slate-800 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Product Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
          {/* Left Column: Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200/60 shadow-inner">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />

              {/* Status Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="px-3 py-1 text-xs font-semibold bg-white/95 text-slate-800 rounded-full shadow-sm backdrop-blur-sm border border-slate-200/60">
                  {product.category}
                </span>
                {isOutOfStock ? (
                  <span className="px-3 py-1 text-xs font-semibold bg-rose-500 text-white rounded-full shadow-sm">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="px-3 py-1 text-xs font-semibold bg-amber-500 text-white rounded-full shadow-sm animate-pulse">
                    Only {product.stock} left in stock
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-full shadow-sm">
                    In Stock
                  </span>
                )}
              </div>
            </div>

            {/* Quality & Return Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-[11px] text-slate-500">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">100% Authentic</span>
                <span>Verified Quality</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-700">Express Delivery</span>
                <span>Fast Dispatch</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-slate-700">7 Days Return</span>
                <span>Hassle-Free</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Purchase Actions */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 4.5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1.5 font-bold text-slate-800 text-sm">
                    {product.rating?.toFixed(1) || '4.5'}
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {product.numReviews || 0} Customer Reviews
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-indigo-700 font-semibold uppercase tracking-wider block">
                    Special Offer Price
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-indigo-950">
                      {formatCurrency(product.pricePaise)}
                    </span>
                    <span className="text-xs text-indigo-600 font-medium">
                      (Inclusive of all taxes)
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-indigo-500 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                  {product.pricePaise} paise
                </span>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  About this item
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Stock Indicator */}
              <div className="pt-2 text-xs">
                {isOutOfStock ? (
                  <p className="text-rose-600 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> This item is currently out of stock.
                  </p>
                ) : (
                  <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    In stock and ready to ship ({product.stock} units available)
                  </p>
                )}
              </div>
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-4">
                {/* Quantity Control */}
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : addedToast
                      ? 'bg-emerald-600 text-white shadow-emerald-200'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 hover:shadow-lg'
                  }`}
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 animate-bounce" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart ({formatCurrency(product.pricePaise * quantity)})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Razorpay Test Mode Assurance */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-500">
                <CreditCard className="w-4 h-4 text-violet-600 shrink-0" />
                <span>
                  Payments verified in <strong>Razorpay Test Mode</strong> with HMAC-SHA256 signature verification.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
