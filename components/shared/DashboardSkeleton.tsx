'use client';

import { cn } from '@/lib/utils';

type AccentColor = 'sky' | 'emerald' | 'violet';

interface DashboardSkeletonProps {
  /** Layout variant */
  variant?: 'full-dashboard' | 'kpi-row' | 'chart';
  /** Accent color for shimmer */
  accent?: AccentColor;
  className?: string;
}

function ShimmerBar({ className }: { className?: string }) {
  return <div className={cn('sim-skeleton rounded-lg', className)} />;
}

export function DashboardSkeleton({
  variant = 'full-dashboard',
  accent: _accent = 'emerald',
  className,
}: DashboardSkeletonProps) {
  if (variant === 'kpi-row') {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3', className)}>
        {Array.from({ length: 4 }, (_, i) => (
          <ShimmerBar key={i} className="h-[72px]" />
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div className={cn('space-y-3', className)}>
        <ShimmerBar className="h-8 w-48" />
        <ShimmerBar className="h-[320px]" />
      </div>
    );
  }

  // full-dashboard
  return (
    <div className={cn('space-y-4', className)}>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <ShimmerBar key={i} className="h-[72px]" />
        ))}
      </div>
      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ShimmerBar className="md:col-span-2 h-[360px] rounded-xl" />
        <ShimmerBar className="h-[360px] rounded-xl" />
      </div>
      {/* Secondary row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ShimmerBar className="h-[240px] rounded-xl" />
        <ShimmerBar className="h-[240px] rounded-xl" />
      </div>
    </div>
  );
}

/** Inline loading fallback for dynamic imports */
export function TabLoadingFallback({ accent = 'emerald' }: { accent?: AccentColor }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-7 w-7">
          <div className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-20',
            accent === 'sky' ? 'bg-sky-400' : accent === 'violet' ? 'bg-violet-400' : 'bg-emerald-400',
          )} />
          <div className={cn(
            'relative h-7 w-7 rounded-full border-2 border-t-transparent animate-spin',
            accent === 'sky' ? 'border-sky-400/40' : accent === 'violet' ? 'border-violet-400/40' : 'border-emerald-400/40',
          )} />
        </div>
        <span className="text-xs text-white/30 tracking-wide">Loading module</span>
      </div>
    </div>
  );
}
