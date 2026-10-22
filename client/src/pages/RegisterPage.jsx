import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Passwords must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

      {/* Main Register Card */}
      <div className="bg-white rounded-lg border border-slate-300 p-6 sm:p-7 space-y-4 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Create Account</h1>

        {error && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Your Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Your name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last name"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500">
              Passwords must be at least 6 characters.
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Re-enter password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500/80 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creating account...' : 'Create your ShopSphere account'}
          </button>
        </form>

        <p className="text-[11px] text-slate-500 leading-normal pt-1">
          By creating an account, you agree to ShopSphere's Conditions of Use and Privacy Notice.
        </p>

        <div className="pt-3 border-t border-slate-200 text-xs text-slate-700">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-800 hover:text-amber-900 hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
