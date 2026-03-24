'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';
import type { IPyramidKPI } from '../pyramid/constants';
import { perfTextClass, flowColor } from './constants';
import { DataFreshness } from '../DataFreshness';

interface UnifiedKPICardsProps {
  sectors: ISectorAnalytics[];
  kpi: IPyramidKPI;
  timeframe: SectorTimeframe;
  computedAt: string | null;
}

export function UnifiedKPICards({ sectors, kpi, timeframe, computedAt }: UnifiedKPICardsProps) {
  // Compute timeframe-aware top/bottom sectors
  const tfKpi = useMemo(() => {
    if (sectors.length === 0 || timeframe === '1d') return kpi;
    const sorted = [...sectors].sort(
      (a, b) => (a.performance[timeframe] ?? 0) - (b.performance[timeframe] ?? 0),
    );
    const top = sorted[sorted.length - 1];
    const bottom = sorted[0];
    return {
      ...kpi,
      top_sector: { name: top.sector, change_pct: top.performance[timeframe] ?? 0 },
      bottom_sector: { name: bottom.sector, change_pct: bottom.performance[timeframe] ?? 0 },
    };
  }, [sectors, kpi, timeframe]);

  if (sectors.length === 0) return null;

  const totalStocks = tfKpi.advancing + tfKpi.declining + tfKpi.unchanged;

  const avgFlow =
    sectors.reduce((sum, s) => sum + (s.volume_flow_score ?? 0), 0) / sectors.length;
  const flowLabel = avgFlow > 15 ? 'Acc.' : avgFlow < -15 ? 'Dist.' : 'Neutral';

  // Freshness is handled by <DataFreshness /> below

  const breadthPct = totalStocks > 0 ? (tfKpi.advancing / totalStocks) * 100 : 50;
  const tfLabel = timeframe !== '1d' ? ` (${timeframe.toUpperCase()})` : '';

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
        {/* NIFTY */}
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">NIFTY</span>
          <span className={cn('font-semibold', perfTextClass(tfKpi.nifty_change_pct))}>
            {tfKpi.nifty_change_pct >= 0 ? '+' : ''}
            {tfKpi.nifty_change_pct.toFixed(2)}%
          </span>
        </span>

        <span className="text-white/10">|</span>

        {/* Breadth */}
        <span className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-medium">{tfKpi.advancing}↑</span>
          <span className="text-red-400 font-medium">{tfKpi.declining}↓</span>
        </span>

        <span className="text-white/10">|</span>

        {/* VIX */}
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">VIX</span>
          <span
            className={cn(
              'font-medium',
              tfKpi.india_vix != null && tfKpi.india_vix > 20 ? 'text-red-400' : 'text-white',
            )}
          >
            {tfKpi.india_vix != null ? tfKpi.india_vix.toFixed(1) : '\u2014'}
          </span>
        </span>

        <span className="text-white/10">|</span>

        {/* Top sector */}
        {tfKpi.top_sector && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Top{tfLabel}:</span>
              <span className="text-white font-medium">{tfKpi.top_sector.name}</span>
              <span className="text-emerald-400 font-medium">
                +{tfKpi.top_sector.change_pct.toFixed(1)}%
              </span>
            </span>
            <span className="text-white/10">|</span>
          </>
        )}

        {/* Bottom sector */}
        {tfKpi.bottom_sector && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Bot{tfLabel}:</span>
              <span className="text-white font-medium">{tfKpi.bottom_sector.name}</span>
              <span className="text-red-400 font-medium">
                {tfKpi.bottom_sector.change_pct >= 0 ? '+' : ''}
                {tfKpi.bottom_sector.change_pct.toFixed(1)}%
              </span>
            </span>
            <span className="text-white/10">|</span>
          </>
        )}

        {/* Flow */}
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Flow:</span>
          <span style={{ color: flowColor(avgFlow) }} className="font-medium">
            {flowLabel}
          </span>
        </span>

        <span className="text-white/10">|</span>

        {/* Freshness */}
        <span className="ml-auto">
          <DataFreshness computedAt={computedAt} staleTTLMinutes={10} />
        </span>
      </div>

      {/* Thin breadth bar */}
      <div className="mt-1.5 h-0.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400/40 transition-all duration-500"
          style={{ width: `${breadthPct}%` }}
        />
      </div>
    </div>
  );
}
