import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  ShoppingBag,
  Package,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Your Account
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal details, order history, and preferences
        </p>
      </div>

      {/* Account Shortcuts Grid (Amazon style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Your Orders */}
        <Link
          to="/orders"
          className="p-5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex items-start gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
              Your Orders
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track packages, view past purchases, and check receipts
            </p>
          </div>
        </Link>

        {/* Storefront Products */}
        <Link
          to="/products"
          className="p-5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex items-start gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
              Continue Shopping
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore featured electronics, audio essentials, and tech gear
            </p>
          </div>
        </Link>

        {/* Admin Dashboard if Admin */}
        {isAdmin && (
          <Link
            to="/admin"
            className="p-5 bg-white rounded-lg border border-amber-300 hover:border-amber-400 hover:shadow-sm transition-all flex items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                Admin Dashboard
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage inventory stock, add products, and update orders
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Profile Details Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" /> Full Name
            </span>
            <p className="text-sm font-bold text-slate-900">{user.name}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
            </span>
            <p className="text-sm font-bold text-slate-900">{user.email}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Account Type
            </span>
            <p className="text-sm font-bold text-slate-900 capitalize">
              {isAdmin ? 'Administrator' : 'Customer Account'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member Since
            </span>
            <p className="text-sm font-bold text-slate-900">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
