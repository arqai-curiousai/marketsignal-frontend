'use client';

import React, { useEffect, useState } from 'react';
import { getSectorValuation } from '@/src/lib/api/analyticsApi';
import type { ISectorValuation, ISectorValuationMetric } from '@/types/analytics';

interface SectorValuationPanelProps {
  sector: string;
}

interface MetricCardProps {
  label: string;
  metric: ISectorValuationMetric;
  format: (v: number) => string;
}

function MetricCard({ label, metric, format }: MetricCardProps) {
  const range = metric.max - metric.min;
  const position = range > 0 ? ((metric.weighted_avg - metric.min) / range) * 100 : 50;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </div>
      <div className="text-white font-mono tabular-nums text-lg leading-tight">
        {format(metric.weighted_avg)}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">
        Median: <span className="text-white/70 font-mono tabular-nums">{format(metric.median)}</span>
      </div>

      {/* Range bar */}
      <div className="mt-2.5 relative">
        <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono tabular-nums mb-1">
          <span>{format(metric.min)}</span>
          <span>{format(metric.max)}</span>
        </div>
        <div className="relative h-1 w-full rounded-full bg-white/[0.06]">
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-blue-400 border border-blue-300/50 shadow-sm shadow-blue-400/30"
            style={{ left: `${Math.max(2, Math.min(98, position))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 animate-pulse">
      <div className="h-2.5 w-12 bg-white/[0.06] rounded mb-2" />
      <div className="h-6 w-16 bg-white/[0.06] rounded mb-1" />
      <div className="h-2 w-20 bg-white/[0.06] rounded mt-2" />
      <div className="h-1 w-full bg-white/[0.06] rounded mt-4" />
    </div>
  );
}

export function SectorValuationPanel({ sector }: SectorValuationPanelProps) {
  const [data, setData] = useState<ISectorValuation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sector) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSectorValuation(sector)
      .then((r) => {
        if (cancelled) return;
        if (r.success && r.data) {
          setData(r.data);
        } else {
          setError('Valuation data unavailable');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load valuation data');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sector]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-[10px] text-muted-foreground text-center py-3">
        {error ?? 'No valuation data'}
      </div>
    );
  }

  const { metrics, stocks } = data;
  const fmtX = (v: number) => v.toFixed(1);
  const fmtPct = (v: number) => `${v.toFixed(2)}%`;

  const coverageCount = stocks.filter(
    (s) => s.pe != null || s.pb != null || s.dy != null,
  ).length;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <MetricCard label="PE Ratio" metric={metrics.pe_ratio} format={fmtX} />
      <MetricCard label="Price / Book" metric={metrics.price_to_book} format={fmtX} />
      <MetricCard label="Dividend Yield" metric={metrics.dividend_yield} format={fmtPct} />
      <MetricCard label="EV / EBITDA" metric={metrics.ev_to_ebitda} format={fmtX} />
      <MetricCard label="ROE" metric={metrics.return_on_equity} format={fmtPct} />

      {/* Coverage card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col justify-between">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Coverage
        </div>
        <div className="text-white font-mono tabular-nums text-lg leading-tight">
          {coverageCount}<span className="text-muted-foreground text-sm">/{stocks.length}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          Stocks with data
        </div>
      </div>
    </div>
  );
}
