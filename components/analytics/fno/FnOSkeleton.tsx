'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const shimmer = 'animate-pulse rounded';
const bar = `${shimmer} bg-white/[0.04]`;

/** Skeleton for the MarketPulse HUD strip */
function PulseSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.04] p-4">
      <div className="flex items-center gap-4 overflow-hidden">
        {/* Hero price */}
        <div className="shrink-0 space-y-1.5">
          <div className={cn(bar, 'h-3 w-12')} />
          <div className={cn(bar, 'h-6 w-24')} />
        </div>
        <div className="h-6 w-px bg-white/[0.04]" />
        {/* Metric pills */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shrink-0 space-y-1.5">
            <div className={cn(bar, 'h-3 w-10')} />
            <div className={cn(bar, 'h-5 w-16')} />
          </div>
        ))}
        <div className="ml-auto shrink-0">
          <div className={cn(bar, 'h-8 w-20 rounded-full')} />
        </div>
      </div>
      {/* Regime strip */}
      <div className={cn(bar, 'h-6 w-full mt-3')} />
    </div>
  );
}

/** Skeleton for the Arena butterfly chart */
function ArenaSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.04] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.03]">
        <div className={cn(bar, 'h-4 w-28')} />
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn(bar, 'h-6 w-16 rounded-full')} />
          ))}
        </div>
      </div>
      {/* Pressure gauge */}
      <div className="px-4 py-3">
        <div className={cn(bar, 'h-[5px] w-full rounded-full')} />
      </div>
      {/* Chain rows - butterfly shape */}
      <div className="px-4 space-y-[2px]">
        {Array.from({ length: 18 }).map((_, i) => {
          const distFromCenter = Math.abs(i - 9);
          const ceWidth = Math.max(15, 85 - distFromCenter * 8);
          const peWidth = Math.max(15, 85 - distFromCenter * 8);
          const isCenter = i === 9;
          return (
            <div key={i} className={cn('flex items-center gap-1', isCenter ? 'h-10' : 'h-7')}>
              <div className="flex-1 flex justify-end">
                <div
                  className={cn(bar, 'h-4')}
                  style={{ width: `${ceWidth}%` }}
                />
              </div>
              <div className={cn(bar, isCenter ? 'h-5 w-16' : 'h-4 w-14', 'shrink-0')} />
              <div className="flex-1">
                <div
                  className={cn(bar, 'h-4')}
                  style={{ width: `${peWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-4" />
    </div>
  );
}

/** Reusable chart skeleton */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-white/[0.04] p-4', className)}>
      <div className={cn(bar, 'h-4 w-32 mb-4')} />
      <div className={cn(bar, 'h-[200px] md:h-[240px] w-full rounded-lg')} />
    </div>
  );
}

/** Full dashboard skeleton (initial load) */
export function FnOSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading F&O dashboard">
      {/* Selector bar */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={cn(bar, 'h-8 w-20 rounded-lg')} />
          ))}
        </div>
        <div className={cn(bar, 'h-8 w-32 rounded-lg')} />
        <div className="ml-auto flex items-center gap-2">
          <div className={cn(bar, 'h-6 w-6 rounded')} />
          <div className={cn(bar, 'h-4 w-14')} />
        </div>
      </div>

      {/* Market Pulse */}
      <PulseSkeleton />

      {/* Tab bar */}
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn(bar, 'h-7 w-24 rounded-lg')} />
        ))}
      </div>

      {/* Arena */}
      <ArenaSkeleton />
    </div>
  );
}
