import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto">
      {/* Back to top button */}
      <button
        type="button"
        onClick={scrollToTop}
        className="w-full bg-[#37475a] hover:bg-[#485769] text-white text-xs font-semibold py-3 text-center transition-colors block cursor-pointer"
      >
        Back to top
      </button>

      {/* Main Footer Links */}
      <div className="bg-[#232f3e] text-slate-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Column 1 */}
            <div className="space-y-2.5">
              <h4 className="text-white font-bold text-sm">Get to Know Us</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link to="/" className="hover:underline">About ShopSphere</Link>
                </li>
                <li>
                  <Link to="/products" className="hover:underline">All Products</Link>
                </li>
                <li>
                  <span className="text-slate-400">Careers</span>
                </li>
                <li>
                  <span className="text-slate-400">Press Releases</span>
                </li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="space-y-2.5">
              <h4 className="text-white font-bold text-sm">Connect with Us</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <span className="text-slate-400">Facebook</span>
                </li>
                <li>
                  <span className="text-slate-400">Twitter / X</span>
                </li>
                <li>
                  <span className="text-slate-400">Instagram</span>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="space-y-2.5">
              <h4 className="text-white font-bold text-sm">Make Money with Us</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <span className="text-slate-400">Sell on ShopSphere</span>
                </li>
                <li>
                  <span className="text-slate-400">Become an Affiliate</span>
                </li>
                <li>
                  <span className="text-slate-400">Fulfilment by ShopSphere</span>
                </li>
                <li>
                  <span className="text-slate-400">Advertise Your Products</span>
                </li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="space-y-2.5">
              <h4 className="text-white font-bold text-sm">Let Us Help You</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link to="/profile" className="hover:underline">Your Account</Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:underline">Returns Centre & Orders</Link>
                </li>
                <li>
                  <span className="text-slate-400">100% Purchase Protection</span>
                </li>
                <li>
                  <span className="text-slate-400">Help & Support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer bottom bar */}
      <div className="bg-[#131921] text-slate-400 text-xs border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <Link to="/" className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded bg-amber-400 flex items-center justify-center text-slate-950 font-black">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
              </div>
              <span className="font-bold text-white text-base">
                ShopSphere<span className="text-amber-400 text-xs">.in</span>
              </span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
            <span className="hover:underline cursor-pointer">Conditions of Use & Sale</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Privacy Notice</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Interest-Based Ads</span>
          </div>

          <p className="text-center text-[11px] text-slate-500">
            &copy; {new Date().getFullYear()}, ShopSphere.in, Inc. or its affiliates. All rights reserved. • Razorpay Test Mode enabled.
          </p>
        </div>
      </div>
    </footer>
  );
}
