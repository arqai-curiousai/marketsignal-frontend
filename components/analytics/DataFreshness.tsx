'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface DataFreshnessProps {
  computedAt: string | null | undefined;
  /** Minutes after which data is considered stale (amber dot). */
  staleTTLMinutes?: number;
  className?: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Minimal data freshness indicator.
 *
 * Shows "Updated Xm ago" with an optional amber dot when stale.
 * Zen: small, muted, informative without shouting.
 */
export function DataFreshness({ computedAt, staleTTLMinutes = 10, className }: DataFreshnessProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const { label, isStale } = useMemo(() => {
    if (!computedAt) return { label: null, isStale: false };
    const diffMs = Date.now() - new Date(computedAt).getTime();
    return {
      label: timeAgo(computedAt),
      isStale: diffMs > staleTTLMinutes * 60_000,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedAt, staleTTLMinutes, tick]);

  if (!label) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[9px] tabular-nums text-muted-foreground select-none',
        className,
      )}
      title={computedAt ? new Date(computedAt).toLocaleString() : undefined}
    >
      {isStale && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400/80 animate-pulse" />
      )}
      {label}
    </span>
  );
}
