'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getFnORVCone } from '@/src/lib/api/analyticsApi';
import { T, C, S } from './tokens';

interface RVConeData {
  rv_current: number | null;
  cone: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  } | null;
  history_days?: number;
}

interface Props {
  underlying: string;
  atmIv?: number | null;
}

function rvLabel(rv: number, cone: RVConeData['cone']): { text: string; color: string } {
  if (!cone) return { text: 'N/A', color: 'text-muted-foreground' };
  if (rv < cone.p10) return { text: 'Very Low', color: C.bullish.text };
  if (rv < cone.p25) return { text: 'Low', color: C.bullish.text };
  if (rv > cone.p90) return { text: 'Very High', color: C.bearish.text };
  if (rv > cone.p75) return { text: 'High', color: C.bearish.text };
  return { text: 'Normal', color: C.neutral.text };
}

export function RVConeChart({ underlying, atmIv }: Props) {
  const [data, setData] = useState<RVConeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ticker mapping (NIFTY → "NIFTY 50") now handled server-side in /fno/rv-cone
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const result = await getFnORVCone(underlying);
        if (!cancelled) {
          if (result.success && result.data) {
            setData(result.data as RVConeData);
          } else if (!result.success) {
            setError(result.error?.message ?? 'Failed to load RV data');
          }
        }
      } catch {
        if (!cancelled) setError('Failed to fetch realized volatility.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [underlying]);

  if (loading) {
    return (
      <div className={cn(S.inner, 'px-4 py-3')}>
        <div className="animate-pulse h-4 w-32 bg-white/[0.04] rounded mb-2" />
        <div className="animate-pulse h-24 w-full bg-white/[0.04] rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(S.inner, 'px-4 py-3 text-center')}>
        <div className={cn(T.caption, 'italic')}>{error}</div>
      </div>
    );
  }

  if (!data || data.rv_current == null || !data.cone) {
    return (
      <div className={cn(S.inner, 'px-4 py-3 text-center')}>
        <div className={cn(T.caption, 'italic')}>Insufficient data for RV cone</div>
      </div>
    );
  }

  const { rv_current, cone } = data;
  const context = rvLabel(rv_current, cone);
  const vrp = atmIv != null ? atmIv - rv_current : null;

  // Visual bar: show percentile bands with current RV marker
  const min = cone.p10 * 0.8;
  const max = cone.p90 * 1.2;
  const range = max - min;
  const pct = (v: number) => ((v - min) / range) * 100;

  return (
    <div className={cn(S.inner, 'px-4 py-3')}>
      <div className="flex items-center justify-between mb-3">
        <div className={T.heading}>Realized Volatility</div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={cn(T.label, 'text-muted-foreground')}>RV-20</div>
            <div className={cn('text-sm font-bold font-mono', context.color)}>
              {(rv_current * 100).toFixed(1)}%
            </div>
          </div>
          <div className={cn('px-2 py-0.5 rounded-full', T.badge, context.color,
            rv_current < cone.p25 ? C.bullish.bg : rv_current > cone.p75 ? C.bearish.bg : C.neutral.bg
          )}>
            {context.text}
          </div>
        </div>
      </div>

      {/* Cone bar visualization */}
      <div className="relative h-8 rounded-lg bg-white/[0.02] border border-white/[0.04] overflow-hidden">
        {/* P10-P90 outer band */}
        <div
          className="absolute top-0 bottom-0 bg-white/[0.03] rounded"
          style={{ left: `${pct(cone.p10)}%`, width: `${pct(cone.p90) - pct(cone.p10)}%` }}
        />
        {/* P25-P75 inner band */}
        <div
          className="absolute top-1 bottom-1 bg-white/[0.05] rounded"
          style={{ left: `${pct(cone.p25)}%`, width: `${pct(cone.p75) - pct(cone.p25)}%` }}
        />
        {/* Median line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/20"
          style={{ left: `${pct(cone.p50)}%` }}
        />
        {/* Current RV marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full"
          style={{ left: `${Math.min(Math.max(pct(rv_current), 1), 99)}%` }}
        />
        {/* ATM IV marker (if available) */}
        {atmIv != null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-violet-400 rounded-full opacity-60"
            style={{ left: `${Math.min(Math.max(pct(atmIv), 1), 99)}%` }}
          />
        )}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1">
        <span className={T.legend}>P10: {(cone.p10 * 100).toFixed(1)}%</span>
        <span className={T.legend}>P50: {(cone.p50 * 100).toFixed(1)}%</span>
        <span className={T.legend}>P90: {(cone.p90 * 100).toFixed(1)}%</span>
      </div>

      {/* VRP section */}
      {vrp != null && (
        <div className={cn('flex items-center gap-3 mt-3 pt-3', `border-t ${S.divider}`)}>
          <div className={cn(T.label, 'text-muted-foreground')}>VRP</div>
          <div className={cn('text-sm font-bold font-mono', vrp > 0 ? C.bullish.text : C.bearish.text)}>
            {vrp > 0 ? '+' : ''}{(vrp * 100).toFixed(1)}%
          </div>
          <div className={cn(T.badge, vrp > 0 ? C.bullish.text : C.bearish.text,
            vrp > 0 ? C.bullish.bg : C.bearish.bg, 'px-2 py-0.5 rounded-full'
          )}>
            {vrp > 0 ? 'Premium' : 'Discount'}
          </div>
          <div className={T.caption}>
            {vrp > 0 ? 'Options expensive vs realized' : 'Options cheap vs realized'}
          </div>
        </div>
      )}
    </div>
  );
}
