'use client';

import React, { useEffect, useState } from 'react';
import { getFactorExposures } from '@/lib/api/analyticsApi';
import type { IFactorExposures } from '@/types/analytics';
import { Skeleton } from '@/components/ui/skeleton';

const FACTOR_LABELS: Record<string, string> = {
  MKT: 'Market',
  SMB: 'Size (Small-Big)',
  HML: 'Value (High-Low)',
  WML: 'Momentum',
};

const FACTOR_COLORS: Record<string, string> = {
  MKT: '#3b82f6',
  SMB: '#10b981',
  HML: '#f59e0b',
  WML: '#8b5cf6',
};

interface Props {
  ticker: string;
  exchange?: string;
}

export function FactorExposureChart({ ticker, exchange = 'NSE' }: Props) {
  const [data, setData] = useState<IFactorExposures | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFactorExposures(ticker, exchange).then((res) => {
      if (!cancelled && res.success) setData(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [ticker, exchange]);

  if (loading) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm text-muted-foreground">
        Factor data unavailable for {ticker}
      </div>
    );
  }

  const factors = Object.entries(data.betas);
  const maxBeta = Math.max(...factors.map(([, v]) => Math.abs(v)), 0.5);

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Factor Exposures</h3>
        <span className="text-xs text-muted-foreground">
          R² = {(data.r_squared * 100).toFixed(1)}% | {data.window_days}d window
        </span>
      </div>

      {/* Horizontal bar chart */}
      <div className="space-y-3">
        {factors.map(([factor, beta]) => {
          const pct = (Math.abs(beta) / maxBeta) * 100;
          const isPositive = beta >= 0;
          const color = FACTOR_COLORS[factor] || '#6b7280';
          return (
            <div key={factor} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{FACTOR_LABELS[factor] || factor}</span>
                <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                  {beta > 0 ? '+' : ''}{beta.toFixed(3)}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-white/5">
                <div
                  className="absolute top-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: color,
                    left: isPositive ? '50%' : undefined,
                    right: isPositive ? undefined : '50%',
                    maxWidth: '50%',
                  }}
                />
                <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Alpha */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-xs text-muted-foreground">Jensen&apos;s Alpha (ann.)</span>
        <span className={`text-sm font-semibold ${data.alpha_annualized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {data.alpha_annualized >= 0 ? '+' : ''}{(data.alpha_annualized * 100).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
