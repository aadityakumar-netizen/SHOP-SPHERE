import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Database, Server, CreditCard, Shield } from 'lucide-react';
import api from '../services/api';

export default function HealthStatusBadge() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Diagnostics & Connectivity
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time verification of Express API, MongoDB Atlas, and environment configuration
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          {loading ? 'Testing...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Backend Unreachable</p>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <p className="text-xs text-rose-600 mt-2">
              Tip: Make sure the backend server is running on <code className="bg-rose-100 px-1 py-0.5 rounded">http://localhost:5000</code>.
            </p>
          </div>
        </div>
      ) : health ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Server Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-indigo-600" /> Express Server
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                Online
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-2">{health.service}</p>
            <p className="text-xs text-slate-500 mt-0.5">Port 5000 • v{health.version}</p>
          </div>

          {/* Database Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-emerald-600" /> Database
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                  health.database?.status === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {health.database?.status || 'Unknown'}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-2">
              {health.database?.isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate" title={health.database?.host}>
              Host: {health.database?.host} ({health.database?.name})
            </p>
          </div>

          {/* Razorpay Setup Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-violet-600" /> Razorpay Test
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                  health.razorpayConfigured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {health.razorpayConfigured ? 'Keys Configured' : 'Placeholder Ready'}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-2">Test Mode SDK</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {health.razorpayConfigured ? 'API Key Active' : 'Enter rzp_test keys in .env'}
            </p>
          </div>

          {/* Security & Uptime */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> Security
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                Active
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-2">Helmet + RateLimit</p>
            <p className="text-xs text-slate-500 mt-0.5">Uptime: {health.uptimeSeconds}s</p>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-slate-500">Checking system diagnostics...</div>
      )}
    </div>
  );
}
