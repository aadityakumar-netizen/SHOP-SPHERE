import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-slate-200 w-full"></div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6"></div>
        </div>
        <div className="h-5 bg-slate-200 rounded w-4/5"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        <div className="pt-2 flex items-center justify-between">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        </div>
      </div>
    </div>
  );
}
