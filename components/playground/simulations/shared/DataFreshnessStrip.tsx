'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api/apiClient';
import { EXCHANGES } from '@/lib/exchange/config';
import type { ExchangeCode } from '@/lib/exchange/config';

interface FreshnessData {
  latest_bar: string | null;
  staleness_hours: number;
  status: 'fresh' | 'weekend' | 'stale' | 'no_data';
}

const STATUS_CONFIG = {
  fresh: { dot: 'bg-emerald-400', text: 'text-emerald-400/70' },
  weekend: { dot: 'bg-amber-400', text: 'text-amber-400/70' },
  stale: { dot: 'bg-red-400', text: 'text-red-400/70' },
  no_data: { dot: 'bg-zinc-500', text: 'text-zinc-400/70' },
} as const;

interface DataFreshnessStripProps {
  exchanges?: ExchangeCode[];
  className?: string;
}

export function DataFreshnessStrip({
  exchanges = ['NSE', 'FX', 'NASDAQ', 'NYSE', 'LSE', 'HKSE'],
  className,
}: DataFreshnessStripProps) {
  const [freshness, setFreshness] = useState<Record<string, FreshnessData>>({});

  useEffect(() => {
    let cancelled = false;
    apiClient.get<Record<string, FreshnessData>>('/api/stocks/data/freshness')
      .then((result) => {
        if (!cancelled && result.success) {
          setFreshness(result.data);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (Object.keys(freshness).length === 0) return null;

  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      <span className="text-[9px] uppercase tracking-wider text-white/20 font-medium">Data</span>
      {exchanges.map((ex) => {
        const data = freshness[ex];
        if (!data) return null;
        const cfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.no_data;
        const label = EXCHANGES[ex]?.name ?? ex;
        const barDate = data.latest_bar ? new Date(data.latest_bar).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';

        return (
          <div
            key={ex}
            className="flex items-center gap-1.5"
            title={`${label}: Last bar ${barDate} (${data.staleness_hours}h ago)`}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
            <span className={cn('text-[9px] font-mono', cfg.text)}>
              {label}
            </span>
            <span className="text-[8px] text-white/15 font-mono">
              {barDate}
            </span>
          </div>
        );
      })}
    </div>
  );
}
