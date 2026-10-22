import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Looking for something?</h1>
      <p className="text-xs text-slate-500 max-w-md mb-6">
        We're sorry. The Web address you entered is not a functioning page on our site.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-full transition-colors shadow-sm"
      >
        <Home className="w-4 h-4" />
        Return to ShopSphere Home
      </Link>
    </div>
  );
}
