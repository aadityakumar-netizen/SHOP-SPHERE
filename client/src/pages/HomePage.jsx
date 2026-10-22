import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import productService from '../services/productService';
import {
  Headphones,
  Watch,
  Laptop,
  Camera,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
} from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Category visual icons mapping
  const categoryIcons = {
    Audio: Headphones,
    Wearables: Watch,
    Electronics: Laptop,
    Photography: Camera,
    Accessories: ShoppingBag,
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prodData, catData] = await Promise.all([
          productService.getProducts({
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            limit: 12,
            sort: 'rating',
          }),
          productService.getCategories(),
        ]);

        if (prodData.products) {
          setProducts(prodData.products);
        }
        if (catData.categories) {
          setCategories(catData.categories);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Promotional Hero Banner */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-[#1e293b] to-slate-900 text-white shadow-sm border border-slate-800">
        <div className="p-6 sm:p-10 md:p-12 max-w-2xl space-y-4">
          <span className="inline-block px-3 py-1 bg-amber-400 text-slate-950 text-xs font-bold rounded-sm tracking-wide uppercase">
            Top Picks
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Electronics, Audio & Everyday Tech
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Discover precision wireless audio, smart wearables, and desktop essentials. Real-time inventory with secure checkout.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-amber-400 hover:bg-amber-500 text-slate-950 text-sm font-bold shadow transition-colors"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative subtle pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none hidden md:block"></div>
      </section>

      {/* Category Quick Browse Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Shop by Category</h2>
          <Link
            to="/products"
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat] || ShoppingBag;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`p-4 rounded-lg border text-left transition-all flex flex-col justify-between h-28 ${
                  isSelected
                    ? 'bg-amber-50 border-amber-400 shadow-sm ring-1 ring-amber-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-md flex items-center justify-center ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {cat}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isSelected ? 'Viewing selected' : 'Browse items'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {selectedCategory === 'all'
                ? 'Featured Products & Deals'
                : `${selectedCategory} Products`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Available for immediate dispatch with live stock verification
            </p>
          </div>

          {/* Quick Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.length > 0
            ? products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            : (
              <div className="col-span-full py-12 text-center bg-white rounded-lg border border-slate-200 p-6">
                <p className="text-sm text-slate-600">No products found in this category.</p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="mt-3 px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800"
                >
                  View All Products
                </button>
              </div>
            )}
        </div>
      </section>

      {/* Customer Shopping Commitments / Trust Bar */}
      <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Free Delivery</h4>
              <p className="text-[11px] text-slate-500">On eligible orders over ₹999</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Genuine Products</h4>
              <p className="text-[11px] text-slate-500">Verified manufacturer stock</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Secure Payments</h4>
              <p className="text-[11px] text-slate-500">Encrypted checkout gateway</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Hassle-Free Returns</h4>
              <p className="text-[11px] text-slate-500">Easy returns within 7 days</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
