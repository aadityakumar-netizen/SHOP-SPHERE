import React from 'react';
import { Search, X, SlidersHorizontal, Check } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Top Row: Search Input & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, feature, or keyword..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Controls: In-Stock Toggle & Sort */}
        <div className="flex items-center gap-2.5">
          {/* In-Stock Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-colors">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span>In Stock Only</span>
          </label>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Category Pills & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-1 hidden sm:inline">Category:</span>
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              category === 'all'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                category.toLowerCase() === cat.toLowerCase()
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Reset & Product Count */}
        <div className="flex items-center gap-3 text-xs text-slate-500 ml-auto">
          <span>
            Found <strong className="text-slate-800">{totalProducts}</strong> products
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
