import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, ShoppingCart, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function ProductCard({ product }) {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image Container */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Stock Badge Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-rose-500 text-white rounded-full shadow-sm">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 text-white rounded-full shadow-sm animate-pulse">
              Only {product.stock} left
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600/90 text-white rounded-full shadow-sm backdrop-blur-sm">
              In Stock
            </span>
          )}
        </div>

        {/* Category Pill Overlay */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 text-[11px] font-medium bg-white/90 text-slate-700 rounded-full shadow-sm backdrop-blur-sm border border-slate-200/50">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-semibold text-slate-700">{product.rating?.toFixed(1) || '4.5'}</span>
            </div>
            <span>•</span>
            <span>({product.numReviews || 0} reviews)</span>
          </div>

          {/* Title */}
          <Link
            to={`/products/${product.slug || product._id}`}
            className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Description Excerpt */}
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Price</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(product.pricePaise)}
            </span>
          </div>

          <Link
            to={`/products/${product.slug || product._id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-900 text-white hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
