import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import productService from '../services/productService';
import {
  ShoppingBag,
  ShoppingCart,
  User,
  LogOut,
  Shield,
  ChevronDown,
  Search,
  Package,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalItemsCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountRef = useRef(null);

  // Fetch categories for search bar dropdown and subnav
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const res = await productService.getCategories();
        if (isMounted && res.categories) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('Failed to load categories in navbar:', err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync navbar search input with URL params if on /products
  useEffect(() => {
    if (location.pathname === '/products') {
      const params = new URLSearchParams(location.search);
      setSearchQuery(params.get('search') || '');
      setSelectedCategory(params.get('category') || 'all');
    }
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (selectedCategory && selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    }
    navigate(`/products?${params.toString()}`);
  };

  const handleLogout = () => {
    logout();
    setAccountMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#131921] text-white shadow-md">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4 h-16">
          {/* Left: Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-1.5 p-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white shrink-0 group transition-all"
            title="ShopSphere Home"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-black shadow-sm">
              <ShoppingBag className="w-4 h-4 text-slate-950" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tight text-white flex items-center">
                ShopSphere
                <span className="text-amber-400 text-xs ml-0.5 font-bold">.in</span>
              </span>
            </div>
          </Link>

          {/* Center: Prominent Search Bar (Desktop & Tablet) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-3xl items-center h-10 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-400"
          >
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 border-r border-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ShopSphere for products, electronics, audio..."
              className="flex-1 h-full px-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
            />

            {/* Search Button */}
            <button
              type="submit"
              className="h-full px-5 bg-amber-400 hover:bg-amber-500 text-slate-900 flex items-center justify-center transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          {/* Right Navigation Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Account & Lists */}
            <div className="relative" ref={accountRef}>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="p-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white text-left flex items-center gap-1 text-xs"
                >
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] text-slate-300">
                      Hello, {user?.name ? user.name.split(' ')[0] : 'User'}
                    </span>
                    <span className="font-bold text-white flex items-center gap-0.5">
                      Account & Lists
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </span>
                  </div>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="p-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white text-left flex flex-col leading-tight text-xs"
                >
                  <span className="text-[11px] text-slate-300">Hello, sign in</span>
                  <span className="font-bold text-white">Account & Lists</span>
                </Link>
              )}

              {/* Account Dropdown Menu */}
              {isAuthenticated && accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-lg shadow-2xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 rounded">
                        Administrator
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setAccountMenuOpen(false)}
                    className="w-full px-4 py-2.5 text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors font-medium"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    Your Account
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setAccountMenuOpen(false)}
                    className="w-full px-4 py-2.5 text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors font-medium"
                  >
                    <Package className="w-4 h-4 text-slate-500" />
                    Your Orders
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setAccountMenuOpen(false)}
                      className="w-full px-4 py-2.5 text-slate-900 hover:bg-amber-50 flex items-center gap-2 transition-colors font-semibold border-t border-slate-100"
                    >
                      <Shield className="w-4 h-4 text-amber-600" />
                      Admin Dashboard
                    </Link>
                  )}

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-semibold text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Orders Link */}
            <Link
              to="/orders"
              className="p-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white flex flex-col leading-tight text-xs shrink-0"
            >
              <span className="text-[11px] text-slate-300">Returns</span>
              <span className="font-bold text-white">& Orders</span>
            </Link>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="p-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white flex items-end gap-1 shrink-0"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-7 h-7 text-white" />
                <span className="absolute -top-1 left-3.5 bg-amber-400 text-slate-950 font-black text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center leading-none">
                  {totalItemsCount}
                </span>
              </div>
              <span className="font-bold text-sm text-white hidden sm:inline pb-0.5">
                Cart
              </span>
            </Link>

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-sm hover:outline hover:outline-1 hover:outline-white text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden pb-2.5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center h-9 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-400"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ShopSphere..."
              className="flex-1 h-full px-3 text-xs text-slate-900 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="h-full px-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 flex items-center justify-center"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Sub-navigation: Category Navigation Bar */}
      <div className="bg-[#232f3e] text-slate-200 text-xs font-medium border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1.5 scrollbar-none">
            <Link
              to="/products"
              className="px-2.5 py-1 rounded-sm hover:outline hover:outline-1 hover:outline-white whitespace-nowrap flex items-center gap-1 font-semibold text-white"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>All Products</span>
            </Link>

            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/products?category=${encodeURIComponent(cat)}`}
                className="px-2.5 py-1 rounded-sm hover:outline hover:outline-1 hover:outline-white whitespace-nowrap hover:text-white transition-colors"
              >
                {cat}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                className="ml-auto px-2.5 py-1 rounded-sm text-amber-300 hover:text-amber-200 hover:outline hover:outline-1 hover:outline-white whitespace-nowrap font-bold flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#232f3e] border-t border-slate-700 px-4 py-3 space-y-2 text-sm">
          <div className="font-bold text-amber-400 text-xs uppercase tracking-wider pb-1 border-b border-slate-700">
            Shop By Category
          </div>
          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-1.5 text-slate-200 hover:text-white"
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${encodeURIComponent(cat)}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-200 hover:text-white"
            >
              {cat}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-700 font-bold text-amber-400 text-xs uppercase tracking-wider">
            Your Account
          </div>
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-slate-200 hover:text-white"
              >
                Profile & Settings
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-slate-200 hover:text-white"
              >
                Your Orders
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 text-amber-300 font-bold"
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="block py-1.5 text-rose-400 font-medium text-left w-full"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-slate-200 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 text-slate-200 hover:text-white"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
