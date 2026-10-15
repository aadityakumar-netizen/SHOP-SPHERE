import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, User } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                ShopSphere
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                Test Mode
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-indigo-600 transition-colors'
              }
            >
              Storefront
            </NavLink>
            <NavLink
              to="/products"
              className={({ isActive }) =>
                isActive
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:text-indigo-600 transition-colors'
              }
            >
              Catalogue
            </NavLink>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Shopping Cart (Phase 4)"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full"></span>
            </Link>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Account (Phase 3)"
            >
              <User className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
