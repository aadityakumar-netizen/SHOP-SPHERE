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
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (!user) return null;

  // Extract initials
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Account & Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your credentials, session status, and authenticated permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card (Left) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md shadow-indigo-200">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            {isAdmin ? (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Administrator
              </span>
            ) : (
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Customer Account
              </span>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Account Details & Session Info (Right) */}
        <div className="md:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              Account Credentials & Metadata
            </h3>

            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" /> Full Name
                </span>
                <span className="font-semibold text-slate-800">{user.name}</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Email Address
                </span>
                <span className="font-mono text-xs font-semibold text-slate-800">{user.email}</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Role & Access
                </span>
                <span className="font-semibold text-slate-800 capitalize">{user.role}</span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" /> Member Since
                </span>
                <span className="text-xs font-medium text-slate-700">
                  {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Token Info */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Active JWT Bearer Session
              </span>
              <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                Valid
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your session is cryptographically signed with HMAC-SHA256 JWT tokens. Password credentials are protected with standard bcrypt salt rounds.
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
