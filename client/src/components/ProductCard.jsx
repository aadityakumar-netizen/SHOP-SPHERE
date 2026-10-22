import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between p-4 h-full">
      {/* Top: Product Image */}
      <Link
        to={`/products/${product.slug || product._id}`}
        className="block group"
      >
        <div className="aspect-square w-full bg-slate-50 rounded-md overflow-hidden flex items-center justify-center p-3 mb-3 border border-slate-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Category Tag */}
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
          {product.category}
        </span>

        {/* Product Title */}
        <h3
          className="text-sm font-medium text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug mb-2"
          title={product.name}
        >
          {product.name}
        </h3>
      </Link>

      {/* Middle: Rating & Price */}
      <div className="mt-auto pt-2 space-y-2">
        {/* Real Rating (from database) */}
        {typeof product.rating === 'number' && product.rating > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-semibold text-slate-800">
                {product.rating.toFixed(1)}
              </span>
            </div>
            {Boolean(product.numReviews) && (
              <span className="text-slate-500">({product.numReviews})</span>
            )}
          </div>
        )}

        {/* Price Display */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-slate-900">
            {formatCurrency(product.pricePaise)}
          </span>
        </div>

        {/* Stock Status */}
        <div className="text-xs">
          {isOutOfStock ? (
            <span className="font-semibold text-rose-600">Currently unavailable</span>
          ) : isLowStock ? (
            <span className="font-semibold text-amber-700">
              Only {product.stock} left in stock
            </span>
          ) : (
            <span className="font-medium text-emerald-700">In stock</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
              : added
              ? 'bg-emerald-600 text-white shadow-emerald-200'
              : 'bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/60 hover:border-amber-600'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Added to Cart</span>
            </>
          ) : isOutOfStock ? (
            <span>Out of Stock</span>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5 text-slate-950" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
