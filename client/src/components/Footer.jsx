import React from 'react';
import { ShieldCheck, Lock, Terminal, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                SS
              </div>
              <span className="font-bold text-white text-base">ShopSphere</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Placement-ready MERN e-commerce application with cryptographically verified Razorpay Test Mode checkout, integer paise math, and role-based access control.
            </p>
          </div>

          {/* Security & Payment Architecture */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Security Architecture
            </h4>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li>• Server-side price & stock verification</li>
              <li>• HMAC-SHA256 Razorpay signature validation</li>
              <li>• Idempotent webhook processing with raw body</li>
              <li>• Bcrypt password hashing & JWT auth</li>
            </ul>
          </div>

          {/* Stack & Environment */}
          <div>
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Tech Stack
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">React 18</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Vite</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Tailwind CSS</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Node.js</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Express</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">MongoDB Atlas</span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">Razorpay SDK</span>
            </div>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="flex items-center gap-1.5 text-amber-300/90">
            <Lock className="w-3.5 h-3.5" />
            <span>Razorpay Test Mode Notice: Do not enter real credit card or bank credentials.</span>
          </p>
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} ShopSphere. Built for placement demonstration.
          </p>
        </div>
      </div>
    </footer>
  );
}
