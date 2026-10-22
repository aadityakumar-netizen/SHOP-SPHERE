import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export default function ProductFilters({
  search,
  setSearch,
  category,
  setCategory,
  categories,
  sort,
  setSort,
  inStockOnly,
  setInStockOnly,
  onReset,
  totalProducts,
}) {
  const hasActiveFilters = Boolean(
    (search && search.trim() !== '') ||
      (category && category !== 'all') ||
      inStockOnly ||
      sort !== 'newest'
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-sm">
      {/* Top Row: Search Input & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by keyword..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Controls: In-Stock Toggle & Sort */}
        <div className="flex items-center gap-2">
          {/* In-Stock Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none bg-slate-50 hover:bg-slate-100 border border-slate-300 px-3 py-2 rounded-md transition-colors">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
            />
            <span>In Stock Only</span>
          </label>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 rounded-md px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 cursor-pointer"
            >
              <option value="newest">Sort by: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Avg. Customer Review</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400">
              <SlidersHorizontal className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills & Results Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-slate-500 mr-1">Category:</span>
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              category === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                category.toLowerCase() === cat.toLowerCase()
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-slate-600">
          <span>
            <strong className="text-slate-900">{totalProducts}</strong> products found
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="font-medium text-amber-700 hover:text-amber-800 underline flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
