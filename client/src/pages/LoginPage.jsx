import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCustomerDemo = () => {
    setEmail('customer@shopsphere.dev');
    setPassword('Customer@12345');
    setError(null);
  };

  const fillAdminDemo = () => {
    setEmail('admin@shopsphere.dev');
    setPassword('Admin@12345');
    setError(null);
  };

  return (
    <div className="max-w-sm mx-auto py-8 space-y-4">
      {/* Brand Header */}
      <div className="text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 group">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-950 font-black shadow-sm">
            <ShoppingBag className="w-4 h-4 text-slate-950" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            ShopSphere<span className="text-amber-500 text-sm">.in</span>
          </span>
        </Link>
      </div>

      {/* Main Sign-In Card */}
      <div className="bg-white rounded-lg border border-slate-300 p-6 sm:p-7 space-y-4 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Sign in</h1>

        {error && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Email */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@shopsphere.dev"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 block">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-3 pr-9 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/80 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 leading-normal pt-1">
          By continuing, you agree to ShopSphere's Conditions of Use and Privacy Notice.
        </p>

        {/* Discreet Quick-fill Demo Accounts Helper */}
        <div className="pt-3 border-t border-slate-200 space-y-1.5 text-[11px] text-slate-500">
          <span className="font-medium text-slate-600 block">Quick login for testing:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillCustomerDemo}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
            >
              Customer Account
            </button>
            <button
              type="button"
              onClick={fillAdminDemo}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
            >
              Admin Account
            </button>
          </div>
        </div>
      </div>

      {/* New to ShopSphere Divider */}
      <div className="relative text-center my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300"></div>
        </div>
        <span className="relative px-3 bg-[#f8fafc] text-[11px] text-slate-500">
          New to ShopSphere?
        </span>
      </div>

      {/* Create Account Link */}
      <Link
        to="/register"
        className="w-full py-2 px-4 rounded-md text-xs font-medium text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 text-center block shadow-sm transition-colors"
      >
        Create your ShopSphere account
      </Link>
    </div>
  );
}
