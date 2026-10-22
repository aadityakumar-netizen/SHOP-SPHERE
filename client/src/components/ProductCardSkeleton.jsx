import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 animate-pulse">
      <div className="aspect-square bg-slate-100 rounded-md w-full"></div>
      <div className="h-3 bg-slate-100 rounded w-1/4"></div>
      <div className="h-4 bg-slate-100 rounded w-5/6"></div>
      <div className="h-4 bg-slate-100 rounded w-1/3"></div>
      <div className="h-6 bg-slate-100 rounded w-1/2"></div>
      <div className="h-8 bg-slate-100 rounded-lg w-full mt-2"></div>
    </div>
  );
}
