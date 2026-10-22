import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import ProductFilters from '../components/ProductFilters';
import Pagination from '../components/Pagination';
import { PackageSearch, AlertCircle, RefreshCw } from 'lucide-react';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || 'all';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Pagination States
  const [search, setSearch] = useState(urlSearch);
  const [category, setCategory] = useState(urlCategory);
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Sync state if URL changes (e.g. from navbar search or category link)
  useEffect(() => {
    setSearch(urlSearch);
    setCategory(urlCategory);
    setPage(1);
  }, [urlSearch, urlCategory]);

  // Load distinct categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await productService.getCategories();
        if (res.categories) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch products whenever filters or page changes
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProducts({
        search,
        category: category === 'all' ? undefined : category,
        sort,
        inStockOnly,
        page,
        limit: 12,
      });

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.totalProducts || 0);
    } catch (err) {
      setError(err.message || 'Failed to load products from server');
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, inStockOnly, page]);

  // Debounced search / filter fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('all');
    setSort('newest');
    setInStockOnly(false);
    setPage(1);
    setSearchParams({});
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (newCategory === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', newCategory);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (newSearch) => {
    setSearch(newSearch);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (!newSearch) {
      newParams.delete('search');
    } else {
      newParams.set('search', newSearch);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {search
              ? `Results for "${search}"`
              : category !== 'all'
              ? `${category} Department`
              : 'All Products'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Check each product page for other buying options and live stock status.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <ProductFilters
        search={search}
        setSearch={handleSearchChange}
        category={category}
        setCategory={handleCategoryChange}
        categories={categories}
        sort={sort}
        setSort={(val) => {
          setSort(val);
          setPage(1);
        }}
        inStockOnly={inStockOnly}
        setInStockOnly={(val) => {
          setInStockOnly(val);
          setPage(1);
        }}
        onReset={handleResetFilters}
        totalProducts={totalProducts}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Product Grid / Loading / Empty States */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          <div className="pt-4 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="py-16 text-center bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <PackageSearch className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No results found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Try checking your spelling or use more general terms.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-amber-400 hover:bg-amber-500 text-slate-950 transition-colors shadow-sm"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

