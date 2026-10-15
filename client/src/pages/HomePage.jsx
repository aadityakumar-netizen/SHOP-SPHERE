import React from 'react';
import HealthStatusBadge from '../components/HealthStatusBadge';
import { ShoppingBag, ArrowRight, CheckCircle2, ShieldCheck, Zap, Lock, Database, Code2 } from 'lucide-react';

export default function HomePage() {
  const phases = [
    {
      phase: 'Phase 1',
      title: 'Project Scaffolding & Health Check',
      desc: 'Modular MERN structure, Express server, MongoDB Atlas connectivity, Tailwind CSS, and system diagnostics.',
      status: 'active',
    },
    {
      phase: 'Phase 2',
      title: 'Catalogue, Seeding & Filters',
      desc: 'Mongoose Product model, realistic seed script, categories, search, filtering, and product details.',
      status: 'upcoming',
    },
    {
      phase: 'Phase 3',
      title: 'Secure JWT Auth & Roles',
      desc: 'User registration, login, bcrypt password hashing, auth middleware, and role-based permissions.',
      status: 'upcoming',
    },
    {
      phase: 'Phase 4',
      title: 'Cart & Server Price Validation',
      desc: 'Shopping cart with state management, integer paise subtotal calculations, and stock availability checks.',
      status: 'upcoming',
    },
    {
      phase: 'Phase 5',
      title: 'Razorpay Test Checkout & Webhooks',
      desc: 'Order creation, official SDK checkout, HMAC-SHA256 signature verification, and idempotent webhooks.',
      status: 'upcoming',
    },
    {
      phase: 'Phase 6',
      title: 'Order History & Admin Dashboard',
      desc: 'Customer order tracking, admin inventory management, and fulfillment status state machine.',
      status: 'upcoming',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-12 shadow-xl border border-indigo-800/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Phase 1 Scaffolding Complete & Verified
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            ShopSphere <br />
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              MERN E-Commerce with Razorpay
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            A production-grade, placement-ready e-commerce platform built with Node.js, Express, MongoDB Atlas, React, and Razorpay Test Mode. Engineered with strict server-side price validation in integer paise, HMAC-SHA256 signature checks, and role-based authorization.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <Database className="w-4 h-4 text-emerald-400" /> MongoDB Atlas / Mongoose
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> HMAC-SHA256 Payments
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <Code2 className="w-4 h-4 text-amber-400" /> REST API v1
            </span>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Live Health Check & Connectivity Diagnostics */}
      <section>
        <HealthStatusBadge />
      </section>

      {/* Development Roadmap */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Application Architecture & Roadmap</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured step-by-step implementation plan adhering to high-standard placement criteria
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {phases.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all ${
                item.status === 'active'
                  ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                    item.status === 'active'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.phase}
                </span>
                {item.status === 'active' ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400">Queued</span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
