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
  Zap,
  AlertCircle,
  Lock,
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

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
    }, 2000);
  };

  const handleBuyNow = () => {
    if (!product || product.stock === 0) return;
    addToCart(product, quantity);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="py-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="aspect-square bg-slate-200 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="h-20 bg-slate-200 rounded"></div>
          </div>
          <div className="h-64 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-16 text-center max-w-md mx-auto bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Product Not Found</h2>
        <p className="text-xs text-slate-500 mb-5">{error || 'This product does not exist or is currently unavailable.'}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
        <nav className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-amber-700 transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link to="/products" className="hover:text-amber-700 transition-colors">
            Catalogue
          </Link>
          <span>›</span>
          <Link
            to={`/products?category=${encodeURIComponent(product.category)}`}
            className="hover:text-amber-700 transition-colors"
          >
            {product.category}
          </Link>
          <span>›</span>
          <span className="text-slate-800 font-medium truncate max-w-[240px]">{product.name}</span>
        </nav>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Main Grid: Image, Details, Buy Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start pt-2">
        {/* Left Column: Product Image (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-6 flex items-center justify-center shadow-sm">
          <div className="aspect-square w-full max-w-md flex items-center justify-center overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        {/* Middle Column: Details & Description (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {product.category}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Rating */}
          {typeof product.rating === 'number' && product.rating > 0 && (
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 text-xs">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="ml-1 font-bold text-slate-800 text-sm">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-amber-700 font-medium">
                {product.numReviews || 0} ratings
              </span>
            </div>
          )}

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {formatCurrency(product.pricePaise)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Inclusive of all taxes. Free delivery on all orders during testing.
            </p>
          </div>

          {/* Description / About */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              About this item
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Key Value Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-slate-600">
            <div className="p-2 rounded-md bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-slate-700" />
              <span className="font-semibold text-slate-800">Fast Dispatch</span>
            </div>
            <div className="p-2 rounded-md bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-800">100% Genuine</span>
            </div>
            <div className="p-2 rounded-md bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
              <RotateCcw className="w-4 h-4 text-slate-700" />
              <span className="font-semibold text-slate-800">7 Days Return</span>
            </div>
          </div>
        </div>

        {/* Right Column: Amazon-style Buy Box (3 cols on lg) */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 p-5 space-y-4 shadow-sm">
          {/* Price Header */}
          <div className="space-y-1">
            <span className="text-2xl font-black text-slate-900 block">
              {formatCurrency(product.pricePaise)}
            </span>
            <p className="text-[11px] text-slate-500">
              <span className="text-emerald-700 font-semibold">FREE Delivery</span> (Test Mode active)
            </p>
          </div>

          {/* Availability */}
          <div className="text-sm">
            {isOutOfStock ? (
              <span className="font-bold text-rose-600">Currently unavailable.</span>
            ) : isLowStock ? (
              <span className="font-bold text-amber-700">
                Only {product.stock} left in stock - order soon.
              </span>
            ) : (
              <span className="font-bold text-emerald-700">In stock.</span>
            )}
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="qty-select" className="font-medium text-slate-700">
                Quantity:
              </label>
              <select
                id="qty-select"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 text-xs font-semibold rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map(
                  (n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {/* Action Buttons: Add to Cart & Buy Now */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-2.5 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : addedToast
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/80 active:scale-[0.99]'
              }`}
            >
              {addedToast ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 text-slate-950" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600 shadow-sm active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Buy Now</span>
            </button>
          </div>

          {/* Secure Transaction Guarantee */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Secure transaction</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Dispatched from</span>
              <span className="font-medium text-slate-700">ShopSphere</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sold by</span>
              <span className="font-medium text-slate-700">ShopSphere Retail</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
