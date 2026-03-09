'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { IOptionStrike } from '@/types/analytics';

interface Props {
  chain: IOptionStrike[];
  underlyingPrice: number;
  atmStrike: number;
}

type BuildupType = 'long_buildup' | 'short_buildup' | 'short_covering' | 'long_unwinding' | 'neutral';

const BUILDUP_CONFIG: Record<BuildupType, { label: string; short: string; color: string; bg: string }> = {
  long_buildup: {
    label: 'Long Buildup',
    short: 'LB',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/20',
  },
  short_buildup: {
    label: 'Short Buildup',
    short: 'SB',
    color: 'text-red-400',
    bg: 'bg-red-500/15 border-red-500/20',
  },
  short_covering: {
    label: 'Short Covering',
    short: 'SC',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/20',
  },
  long_unwinding: {
    label: 'Long Unwinding',
    short: 'LU',
    color: 'text-orange-400',
    bg: 'bg-orange-500/15 border-orange-500/20',
  },
  neutral: {
    label: 'Neutral',
    short: '—',
    color: 'text-white/20',
    bg: 'bg-white/[0.02] border-white/[0.04]',
  },
};

function classifyBuildup(oiChange: number | null, priceChange: number | null): BuildupType {
  if (oiChange == null || priceChange == null) return 'neutral';
  if (oiChange === 0 && priceChange === 0) return 'neutral';
  const oiUp = oiChange > 0;
  const priceUp = priceChange > 0;
  if (oiUp && priceUp) return 'long_buildup';
  if (oiUp && !priceUp) return 'short_buildup';
  if (!oiUp && priceUp && oiChange < 0) return 'short_covering';
  if (!oiUp && !priceUp && oiChange < 0) return 'long_unwinding';
  return 'neutral';
}

function formatOIChange(val: number | null): string {
  if (val == null) return '—';
  const abs = Math.abs(val);
  const sign = val >= 0 ? '+' : '';
  if (abs >= 10000000) return `${sign}${(val / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}${(val / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}${(val / 1000).toFixed(1)}K`;
  return `${sign}${val}`;
}

export function OIBuildupView({ chain, underlyingPrice, atmStrike }: Props) {
  // Compute buildup data from OI changes in the chain
  // OI change is already computed by backend; we need price changes from previous snapshot
  // For now, classify using ce_oi_change field (available when backend tracks OI deltas)
  const buildupData = useMemo(() => {
    return chain.map((s) => {
      // We classify CE and PE sides based on OI change
      // Since we don't have previous LTP in the chain data for price change,
      // we use the OI change direction combined with moneyness as a heuristic
      const ceBuildup = s.ce_oi_change != null && s.ce_oi_change !== 0
        ? (s.ce_oi_change > 0
            ? (s.strike > underlyingPrice ? 'short_buildup' : 'long_buildup')
            : (s.strike > underlyingPrice ? 'short_covering' : 'long_unwinding'))
        : 'neutral';
      const peBuildup = s.pe_oi_change != null && s.pe_oi_change !== 0
        ? (s.pe_oi_change > 0
            ? (s.strike < underlyingPrice ? 'short_buildup' : 'long_buildup')
            : (s.strike < underlyingPrice ? 'short_covering' : 'long_unwinding'))
        : 'neutral';

      return {
        strike: s.strike,
        ce_oi_change: s.ce_oi_change,
        pe_oi_change: s.pe_oi_change,
        ce_buildup: ceBuildup as BuildupType,
        pe_buildup: peBuildup as BuildupType,
      };
    });
  }, [chain, underlyingPrice]);

  // Summary counts
  const summary = useMemo(() => {
    const counts: Record<string, number> = {
      long_buildup: 0, short_buildup: 0, short_covering: 0, long_unwinding: 0,
    };
    for (const d of buildupData) {
      if (d.ce_buildup !== 'neutral') counts[d.ce_buildup]++;
      if (d.pe_buildup !== 'neutral') counts[d.pe_buildup]++;
    }
    return counts;
  }, [buildupData]);

  const maxAbsChange = useMemo(() => {
    let max = 1;
    for (const d of buildupData) {
      if (d.ce_oi_change != null) max = Math.max(max, Math.abs(d.ce_oi_change));
      if (d.pe_oi_change != null) max = Math.max(max, Math.abs(d.pe_oi_change));
    }
    return max;
  }, [buildupData]);

  return (
    <div className="space-y-3">
      {/* Summary badges */}
      <div className="flex items-center gap-2 px-1">
        {(Object.keys(BUILDUP_CONFIG) as BuildupType[]).filter(k => k !== 'neutral').map((type) => {
          const cfg = BUILDUP_CONFIG[type];
          const count = summary[type] || 0;
          return (
            <span
              key={type}
              className={cn('px-2 py-0.5 text-[9px] font-semibold rounded-full border', cfg.bg, cfg.color)}
            >
              {cfg.label}: {count}
            </span>
          );
        })}
      </div>

      {/* Buildup grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-[9px]">
          <thead>
            <tr className="text-white/25 border-b border-white/[0.04]">
              <th className="py-1.5 px-2 text-left font-medium">CE Buildup</th>
              <th className="py-1.5 px-1 text-right font-medium">CE OI Chg</th>
              <th className="py-1.5 px-2 text-center font-semibold text-white/40">Strike</th>
              <th className="py-1.5 px-1 text-left font-medium">PE OI Chg</th>
              <th className="py-1.5 px-2 text-right font-medium">PE Buildup</th>
            </tr>
          </thead>
          <tbody>
            {buildupData.map((d) => {
              const isATM = d.strike === atmStrike;
              const ceCfg = BUILDUP_CONFIG[d.ce_buildup];
              const peCfg = BUILDUP_CONFIG[d.pe_buildup];

              // Bar width based on OI change magnitude
              const ceBarWidth = d.ce_oi_change != null
                ? Math.min(100, (Math.abs(d.ce_oi_change) / maxAbsChange) * 100)
                : 0;
              const peBarWidth = d.pe_oi_change != null
                ? Math.min(100, (Math.abs(d.pe_oi_change) / maxAbsChange) * 100)
                : 0;

              return (
                <tr
                  key={d.strike}
                  className={cn(
                    'border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors',
                    isATM && 'bg-violet-500/[0.04] border-violet-500/10',
                  )}
                >
                  {/* CE Buildup badge */}
                  <td className="py-1 px-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('font-semibold', ceCfg.color)}>{ceCfg.short}</span>
                      {/* OI change bar (grows left) */}
                      <div className="flex-1 flex justify-end">
                        <div
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            d.ce_oi_change != null && d.ce_oi_change > 0
                              ? 'bg-blue-400/40'
                              : 'bg-blue-400/20',
                          )}
                          style={{ width: `${ceBarWidth}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* CE OI Change */}
                  <td className={cn(
                    'py-1 px-1 text-right font-mono',
                    d.ce_oi_change != null && d.ce_oi_change > 0 ? 'text-emerald-400/60' :
                    d.ce_oi_change != null && d.ce_oi_change < 0 ? 'text-red-400/60' : 'text-white/15',
                  )}>
                    {formatOIChange(d.ce_oi_change)}
                  </td>

                  {/* Strike */}
                  <td className={cn(
                    'py-1 px-2 text-center font-mono font-semibold',
                    isATM ? 'text-violet-400' : 'text-white/40',
                  )}>
                    {d.strike >= 1000 ? `${(d.strike / 1000).toFixed(1)}K` : d.strike}
                    {isATM && <span className="ml-1 text-[7px] text-violet-400/60">ATM</span>}
                  </td>

                  {/* PE OI Change */}
                  <td className={cn(
                    'py-1 px-1 text-left font-mono',
                    d.pe_oi_change != null && d.pe_oi_change > 0 ? 'text-emerald-400/60' :
                    d.pe_oi_change != null && d.pe_oi_change < 0 ? 'text-red-400/60' : 'text-white/15',
                  )}>
                    {formatOIChange(d.pe_oi_change)}
                  </td>

                  {/* PE Buildup badge */}
                  <td className="py-1 px-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1">
                        <div
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            d.pe_oi_change != null && d.pe_oi_change > 0
                              ? 'bg-emerald-400/40'
                              : 'bg-emerald-400/20',
                          )}
                          style={{ width: `${peBarWidth}%` }}
                        />
                      </div>
                      <span className={cn('font-semibold', peCfg.color)}>{peCfg.short}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-1 text-[8px] text-white/20">
        {(Object.keys(BUILDUP_CONFIG) as BuildupType[]).filter(k => k !== 'neutral').map((type) => {
          const cfg = BUILDUP_CONFIG[type];
          return (
            <span key={type} className="flex items-center gap-1">
              <span className={cn('font-bold', cfg.color)}>{cfg.short}</span>
              <span>{cfg.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
