import React from 'react';

export default function RouteLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-150">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden shadow-xs border border-[#E7E6F0] dark:border-[#262438] bg-white dark:bg-[#151324] p-1.5 animate-pulse">
        <img src="/logo.png" alt="MONVEX" className="h-full w-full object-contain" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#6865E8] animate-ping" />
        <span className="text-xs text-[#71708A] font-mono tracking-wider uppercase">Loading workspace...</span>
      </div>
    </div>
  );
}
