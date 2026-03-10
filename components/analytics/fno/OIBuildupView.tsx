'use client';

import React, { useMemo } from 'react';
import { Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IOptionStrike } from '@/types/analytics';

interface Props {
  chain: IOptionStrike[];
  underlyingPrice: number;
  atmStrike: number;
}

type BuildupType = 'long_buildup' | 'short_buildup' | 'short_covering' | 'long_unwinding' | 'neutral';

const BUILDUP_CONFIG: Record<BuildupType, { label: string; short: string; color: string; bg: string; barColor: string }> = {
  long_buildup: {
    label: 'Long Buildup',
    short: 'LB',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/20',
    barColor: 'bg-emerald-400/40',
  },
  short_buildup: {
    label: 'Short Buildup',
    short: 'SB',
    color: 'text-red-400',
    bg: 'bg-red-500/15 border-red-500/20',
    barColor: 'bg-red-400/40',
  },
  short_covering: {
    label: 'Short Covering',
    short: 'SC',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/20',
    barColor: 'bg-emerald-400/30',
  },
  long_unwinding: {
    label: 'Long Unwinding',
    short: 'LU',
    color: 'text-orange-400',
    bg: 'bg-orange-500/15 border-orange-500/20',
    barColor: 'bg-red-400/30',
  },
  neutral: {
    label: 'Neutral',
    short: '—',
    color: 'text-white/20',
    bg: 'bg-white/[0.02] border-white/[0.04]',
    barColor: 'bg-white/[0.04]',
  },
};

// ─── Classification ───────────────────────────────────────────────────

function classifyBuildup(oiChange: number | null, ltpChange: number | null): BuildupType {
  if (oiChange == null || ltpChange == null) return 'neutral';
  if (oiChange === 0 && ltpChange === 0) return 'neutral';
  const oiUp = oiChange > 0;
  const priceUp = ltpChange > 0;
  if (oiUp && priceUp) return 'long_buildup';
  if (oiUp && !priceUp) return 'short_buildup';
  if (!oiUp && priceUp && oiChange < 0) return 'short_covering';
  if (!oiUp && !priceUp && oiChange < 0) return 'long_unwinding';
  return 'neutral';
}

// ─── Formatters ───────────────────────────────────────────────────────

function formatOIChange(val: number | null): string {
  if (val == null) return '—';
  const abs = Math.abs(val);
  const sign = val >= 0 ? '+' : '';
  if (abs >= 10000000) return `${sign}${(val / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `${sign}${(val / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${sign}${(val / 1000).toFixed(1)}K`;
  return `${sign}${val}`;
}

function formatLTPChange(val: number | null): string {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}`;
}

function formatOI(val: number): string {
  if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toString();
}

// ─── Component ────────────────────────────────────────────────────────

export function OIBuildupView({ chain, underlyingPrice, atmStrike }: Props) {
  // Check if data is available (requires at least 2 snapshots for OI changes)
  const hasOIData = useMemo(
    () => chain.some((s) => s.ce_oi_change != null || s.pe_oi_change != null),
    [chain],
  );

  // Classify each strike
  const buildupData = useMemo(() => {
    return chain.map((s) => ({
      strike: s.strike,
      ce_oi: s.ce_oi,
      pe_oi: s.pe_oi,
      ce_oi_change: s.ce_oi_change,
      pe_oi_change: s.pe_oi_change,
      ce_ltp_change: s.ce_ltp_change,
      pe_ltp_change: s.pe_ltp_change,
      ce_volume: s.ce_volume,
      pe_volume: s.pe_volume,
      ce_buildup: classifyBuildup(s.ce_oi_change, s.ce_ltp_change),
      pe_buildup: classifyBuildup(s.pe_oi_change, s.pe_ltp_change),
    }));
  }, [chain]);

  // Summary counts
  const summary = useMemo(() => {
    const counts: Record<string, number> = {
      long_buildup: 0, short_buildup: 0, short_covering: 0, long_unwinding: 0,
    };
    for (const d of buildupData) {
      if (d.ce_buildup !== 'neutral') counts[d.ce_buildup]++;
      if (d.pe_buildup !== 'neutral') counts[d.pe_buildup]++;
    }
    const bullish = counts.long_buildup + counts.short_covering;
    const bearish = counts.short_buildup + counts.long_unwinding;
    const total = bullish + bearish;
    const bullishPct = total > 0 ? Math.round((bullish / total) * 100) : 50;
    return { counts, bullish, bearish, total, bullishPct };
  }, [buildupData]);

  // PCR analysis (works without OI changes)
  const pcr = useMemo(() => {
    let totalCeOI = 0;
    let totalPeOI = 0;
    for (const s of chain) {
      totalCeOI += s.ce_oi;
      totalPeOI += s.pe_oi;
    }
    const ratio = totalCeOI > 0 ? totalPeOI / totalCeOI : null;
    let classification: string;
    let classColor: string;
    if (ratio == null) { classification = 'N/A'; classColor = 'text-white/30'; }
    else if (ratio > 1.3) { classification = 'Put Writing Heavy'; classColor = 'text-emerald-400'; }
    else if (ratio > 1.0) { classification = 'Mildly Bullish'; classColor = 'text-emerald-400/70'; }
    else if (ratio < 0.7) { classification = 'Call Writing Heavy'; classColor = 'text-red-400'; }
    else if (ratio < 1.0) { classification = 'Mildly Bearish'; classColor = 'text-red-400/70'; }
    else { classification = 'Neutral'; classColor = 'text-white/40'; }
    return { ratio, classification, classColor, totalCeOI, totalPeOI };
  }, [chain]);

  // OI concentration: top 3 by |oi_change| for each side
  const oiConcentration = useMemo(() => {
    if (!hasOIData) return null;
    const ceTop = [...buildupData]
      .filter((d) => d.ce_oi_change != null && d.ce_oi_change !== 0)
      .sort((a, b) => Math.abs(b.ce_oi_change!) - Math.abs(a.ce_oi_change!))
      .slice(0, 3);
    const peTop = [...buildupData]
      .filter((d) => d.pe_oi_change != null && d.pe_oi_change !== 0)
      .sort((a, b) => Math.abs(b.pe_oi_change!) - Math.abs(a.pe_oi_change!))
      .slice(0, 3);
    return { ceTop, peTop };
  }, [buildupData, hasOIData]);

  // Cumulative OI delta
  const cumDelta = useMemo(() => {
    if (!hasOIData) return null;
    let totalCeChange = 0;
    let totalPeChange = 0;
    for (const d of buildupData) {
      totalCeChange += d.ce_oi_change ?? 0;
      totalPeChange += d.pe_oi_change ?? 0;
    }
    return { totalCeChange, totalPeChange };
  }, [buildupData, hasOIData]);

  // Max abs OI change for bar scaling
  const maxAbsChange = useMemo(() => {
    let max = 1;
    for (const d of buildupData) {
      if (d.ce_oi_change != null) max = Math.max(max, Math.abs(d.ce_oi_change));
      if (d.pe_oi_change != null) max = Math.max(max, Math.abs(d.pe_oi_change));
    }
    return max;
  }, [buildupData]);

  // ─── Awaiting Data state ────────────────────────────────────────────
  if (!hasOIData) {
    return (
      <div className="space-y-3">
        {/* PCR still works without OI changes */}
        <PCRPanel pcr={pcr} />

        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <Clock className="h-6 w-6 mx-auto mb-2 text-white/20" />
          <p className="text-[11px] font-medium text-white/40">Awaiting baseline data</p>
          <p className="text-[9px] text-white/20 mt-1 max-w-xs mx-auto">
            OI buildup requires at least two snapshots to compute changes.
            Data will appear after the next refresh cycle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ─── Market Structure Summary ─── */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] uppercase tracking-[0.15em] text-white/25 font-semibold">
            Market Structure
          </span>
          {summary.total > 0 && (
            <span className={cn(
              'text-[10px] font-semibold',
              summary.bullishPct >= 55 ? 'text-emerald-400' :
              summary.bullishPct <= 45 ? 'text-red-400' : 'text-white/40',
            )}>
              {summary.bullishPct >= 55 ? (
                <><TrendingUp className="h-3 w-3 inline mr-0.5" />{summary.bullishPct}% Bullish</>
              ) : summary.bullishPct <= 45 ? (
                <><TrendingDown className="h-3 w-3 inline mr-0.5" />{100 - summary.bullishPct}% Bearish</>
              ) : (
                <><Activity className="h-3 w-3 inline mr-0.5" />Balanced</>
              )}
            </span>
          )}
        </div>

        {/* Buildup badges */}
        <div className="flex items-center gap-2">
          {(['long_buildup', 'short_buildup', 'short_covering', 'long_unwinding'] as BuildupType[]).map((type) => {
            const cfg = BUILDUP_CONFIG[type];
            const count = summary.counts[type] || 0;
            return (
              <span
                key={type}
                className={cn(
                  'px-2 py-0.5 text-[9px] font-semibold rounded-full border',
                  cfg.bg, cfg.color,
                  count === 0 && 'opacity-30',
                )}
              >
                {cfg.short}: {count}
              </span>
            );
          })}
        </div>

        {/* Direction gauge */}
        {summary.total > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[8px] text-emerald-400/50 font-mono">{summary.bullish}</span>
            <div className="flex-1 h-[4px] rounded-full bg-white/[0.04] overflow-hidden flex">
              <div
                className="h-full bg-emerald-400/40 rounded-l-full transition-all"
                style={{ width: `${summary.bullishPct}%` }}
              />
              <div
                className="h-full bg-red-400/40 rounded-r-full transition-all"
                style={{ width: `${100 - summary.bullishPct}%` }}
              />
            </div>
            <span className="text-[8px] text-red-400/50 font-mono">{summary.bearish}</span>
          </div>
        )}
      </div>

      {/* ─── PCR Analysis ─── */}
      <PCRPanel pcr={pcr} />

      {/* ─── OI Concentration ─── */}
      {oiConcentration && (oiConcentration.ceTop.length > 0 || oiConcentration.peTop.length > 0) && (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <span className="text-[8px] uppercase tracking-[0.15em] text-white/25 font-semibold">
            OI Concentration
          </span>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* CE top changes */}
            <div>
              <span className="text-[7px] uppercase tracking-wider text-blue-400/40 font-semibold">Calls</span>
              <div className="mt-1 space-y-1">
                {oiConcentration.ceTop.map((d) => {
                  const cfg = BUILDUP_CONFIG[d.ce_buildup];
                  return (
                    <div key={d.strike} className="flex items-center gap-1.5 text-[9px]">
                      <span className={cn('font-bold w-5', cfg.color)}>{cfg.short}</span>
                      <span className="font-mono text-white/50 w-10">
                        {d.strike >= 1000 ? `${(d.strike / 1000).toFixed(1)}K` : d.strike}
                      </span>
                      <span className={cn(
                        'font-mono',
                        d.ce_oi_change != null && d.ce_oi_change > 0 ? 'text-emerald-400/60' : 'text-red-400/60',
                      )}>
                        {formatOIChange(d.ce_oi_change)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* PE top changes */}
            <div>
              <span className="text-[7px] uppercase tracking-wider text-emerald-400/40 font-semibold">Puts</span>
              <div className="mt-1 space-y-1">
                {oiConcentration.peTop.map((d) => {
                  const cfg = BUILDUP_CONFIG[d.pe_buildup];
                  return (
                    <div key={d.strike} className="flex items-center gap-1.5 text-[9px]">
                      <span className={cn('font-bold w-5', cfg.color)}>{cfg.short}</span>
                      <span className="font-mono text-white/50 w-10">
                        {d.strike >= 1000 ? `${(d.strike / 1000).toFixed(1)}K` : d.strike}
                      </span>
                      <span className={cn(
                        'font-mono',
                        d.pe_oi_change != null && d.pe_oi_change > 0 ? 'text-emerald-400/60' : 'text-red-400/60',
                      )}>
                        {formatOIChange(d.pe_oi_change)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cumulative OI Delta ─── */}
      {cumDelta && (cumDelta.totalCeChange !== 0 || cumDelta.totalPeChange !== 0) && (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <span className="text-[8px] uppercase tracking-[0.15em] text-white/25 font-semibold">
            Cumulative OI Delta
          </span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between text-[9px] mb-1">
                <span className="text-white/30">Call OI Change</span>
                <span className={cn(
                  'font-mono font-semibold',
                  cumDelta.totalCeChange > 0 ? 'text-red-400/70' : 'text-emerald-400/70',
                )}>
                  {formatOIChange(cumDelta.totalCeChange)}
                </span>
              </div>
              <div className="text-[7px] text-white/15">
                {cumDelta.totalCeChange > 0 ? 'Resistance building' : 'Resistance weakening'}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[9px] mb-1">
                <span className="text-white/30">Put OI Change</span>
                <span className={cn(
                  'font-mono font-semibold',
                  cumDelta.totalPeChange > 0 ? 'text-emerald-400/70' : 'text-red-400/70',
                )}>
                  {formatOIChange(cumDelta.totalPeChange)}
                </span>
              </div>
              <div className="text-[7px] text-white/15">
                {cumDelta.totalPeChange > 0 ? 'Support building' : 'Support weakening'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Per-strike buildup table ─── */}
      <div className="overflow-x-auto">
        <table className="w-full text-[9px]">
          <thead>
            <tr className="text-white/25 border-b border-white/[0.04]">
              <th className="py-1.5 px-1.5 text-left font-medium">CE</th>
              <th className="py-1.5 px-1 text-right font-medium">LTP Chg</th>
              <th className="py-1.5 px-1 text-right font-medium">OI Chg</th>
              <th className="py-1.5 px-1 text-right font-medium w-[50px]" />
              <th className="py-1.5 px-2 text-center font-semibold text-white/40">Strike</th>
              <th className="py-1.5 px-1 text-left font-medium w-[50px]" />
              <th className="py-1.5 px-1 text-left font-medium">OI Chg</th>
              <th className="py-1.5 px-1 text-left font-medium">LTP Chg</th>
              <th className="py-1.5 px-1.5 text-right font-medium">PE</th>
            </tr>
          </thead>
          <tbody>
            {buildupData.map((d) => {
              const isATM = d.strike === atmStrike;
              const ceCfg = BUILDUP_CONFIG[d.ce_buildup];
              const peCfg = BUILDUP_CONFIG[d.pe_buildup];

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
                  <td className="py-1 px-1.5">
                    <span className={cn('font-semibold', ceCfg.color)}>{ceCfg.short}</span>
                  </td>

                  {/* CE LTP Change */}
                  <td className={cn(
                    'py-1 px-1 text-right font-mono',
                    d.ce_ltp_change != null && d.ce_ltp_change > 0 ? 'text-emerald-400/60' :
                    d.ce_ltp_change != null && d.ce_ltp_change < 0 ? 'text-red-400/60' : 'text-white/15',
                  )}>
                    {formatLTPChange(d.ce_ltp_change)}
                  </td>

                  {/* CE OI Change */}
                  <td className={cn(
                    'py-1 px-1 text-right font-mono',
                    d.ce_oi_change != null && d.ce_oi_change > 0 ? 'text-emerald-400/60' :
                    d.ce_oi_change != null && d.ce_oi_change < 0 ? 'text-red-400/60' : 'text-white/15',
                  )}>
                    {formatOIChange(d.ce_oi_change)}
                  </td>

                  {/* CE Bar (grows left, color follows buildup) */}
                  <td className="py-1 px-1">
                    <div className="flex justify-end">
                      <div
                        className={cn('h-1.5 rounded-full transition-all', ceCfg.barColor)}
                        style={{ width: `${ceBarWidth}%` }}
                      />
                    </div>
                  </td>

                  {/* Strike */}
                  <td className={cn(
                    'py-1 px-2 text-center font-mono font-semibold',
                    isATM ? 'text-violet-400' : 'text-white/40',
                  )}>
                    {d.strike >= 1000 ? `${(d.strike / 1000).toFixed(1)}K` : d.strike}
                    {isATM && <span className="ml-1 text-[7px] text-violet-400/60">ATM</span>}
                  </td>

                  {/* PE Bar (grows right, color follows buildup) */}
                  <td className="py-1 px-1">
                    <div className="flex justify-start">
                      <div
                        className={cn('h-1.5 rounded-full transition-all', peCfg.barColor)}
                        style={{ width: `${peBarWidth}%` }}
                      />
                    </div>
                  </td>

                  {/* PE OI Change */}
                  <td className={cn(
                    'py-1 px-1 text-left font-mono',
                    d.pe_oi_change != null && d.pe_oi_change > 0 ? 'text-emerald-400/60' :
                    d.pe_oi_change != null && d.pe_oi_change < 0 ? 'text-red-400/60' : 'text-white/15',
                  )}>
                    {formatOIChange(d.pe_oi_change)}
                  </td>

                  {/* PE LTP Change */}
                  <td className={cn(
                    'py-1 px-1 text-left font-mono',
                    d.pe_ltp_change != null && d.pe_ltp_change > 0 ? 'text-emerald-400/60' :
                    d.pe_ltp_change != null && d.pe_ltp_change < 0 ? 'text-red-400/60' : 'text-white/15',
                  )}>
                    {formatLTPChange(d.pe_ltp_change)}
                  </td>

                  {/* PE Buildup badge */}
                  <td className="py-1 px-1.5 text-right">
                    <span className={cn('font-semibold', peCfg.color)}>{peCfg.short}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Legend ─── */}
      <div className="flex items-center gap-3 px-1 text-[8px] text-white/20">
        {(['long_buildup', 'short_buildup', 'short_covering', 'long_unwinding'] as BuildupType[]).map((type) => {
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

// ─── PCR Panel (extracted — works even on first snapshot) ──────────────

function PCRPanel({ pcr }: { pcr: { ratio: number | null; classification: string; classColor: string; totalCeOI: number; totalPeOI: number } }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[8px] uppercase tracking-[0.15em] text-white/25 font-semibold">
            Put-Call Ratio
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-mono font-bold text-white/80">
              {pcr.ratio != null ? pcr.ratio.toFixed(2) : '—'}
            </span>
            <span className={cn('text-[10px] font-semibold', pcr.classColor)}>
              {pcr.classification}
            </span>
          </div>
        </div>
        <div className="text-right text-[9px]">
          <div className="text-blue-400/50">CE OI: <span className="font-mono text-blue-400/70">{formatOI(pcr.totalCeOI)}</span></div>
          <div className="text-emerald-400/50">PE OI: <span className="font-mono text-emerald-400/70">{formatOI(pcr.totalPeOI)}</span></div>
        </div>
      </div>
    </div>
  );
}
