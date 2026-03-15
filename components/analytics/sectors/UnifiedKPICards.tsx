'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';
import type { IPyramidKPI } from '../pyramid/constants';
import { perfTextClass, flowColor } from './constants';

interface UnifiedKPICardsProps {
  sectors: ISectorAnalytics[];
  kpi: IPyramidKPI;
  timeframe: SectorTimeframe;
  computedAt: string | null;
}

export function UnifiedKPICards({ sectors, kpi, computedAt }: UnifiedKPICardsProps) {
  if (sectors.length === 0) return null;

  const totalStocks = kpi.advancing + kpi.declining + kpi.unchanged;

  const avgFlow =
    sectors.reduce((sum, s) => sum + (s.volume_flow_score ?? 0), 0) / sectors.length;
  const flowLabel = avgFlow > 15 ? 'Acc.' : avgFlow < -15 ? 'Dist.' : 'Neutral';

  const freshness = computedAt
    ? Math.round((Date.now() - new Date(computedAt).getTime()) / 60000)
    : null;
  const freshnessColor =
    freshness == null
      ? 'bg-slate-500'
      : freshness < 5
        ? 'bg-emerald-400'
        : freshness < 15
          ? 'bg-amber-400'
          : 'bg-red-400';

  const breadthPct = totalStocks > 0 ? (kpi.advancing / totalStocks) * 100 : 50;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
        {/* NIFTY */}
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">NIFTY</span>
          <span className={cn('font-semibold', perfTextClass(kpi.nifty_change_pct))}>
            {kpi.nifty_change_pct >= 0 ? '+' : ''}
            {kpi.nifty_change_pct.toFixed(2)}%
          </span>
        </span>

        <span className="text-white/10">|</span>

        {/* Breadth */}
        <span className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-medium">{kpi.advancing}↑</span>
          <span className="text-red-400 font-medium">{kpi.declining}↓</span>
        </span>

        <span className="text-white/10">|</span>

        {/* VIX */}
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">VIX</span>
          <span
            className={cn(
              'font-medium',
              kpi.india_vix != null && kpi.india_vix > 20 ? 'text-red-400' : 'text-white',
            )}
          >
            {kpi.india_vix != null ? kpi.india_vix.toFixed(1) : '\u2014'}
          </span>
        </span>

        <span className="text-white/10">|</span>

        {/* Top sector */}
        {kpi.top_sector && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Top:</span>
              <span className="text-white font-medium">{kpi.top_sector.name}</span>
              <span className="text-emerald-400 font-medium">
                +{kpi.top_sector.change_pct.toFixed(1)}%
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
        <span className="flex items-center gap-1.5 ml-auto">
          <span className={cn('h-1.5 w-1.5 rounded-full', freshnessColor)} />
          <span className="text-muted-foreground">
            {freshness != null ? `${freshness}m ago` : 'Loading'}
          </span>
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
