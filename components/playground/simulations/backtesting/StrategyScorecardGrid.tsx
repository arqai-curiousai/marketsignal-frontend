'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IBacktestStrategy } from '@/types/simulation';
import { T, S } from '@/components/playground/pyramid/tokens';
import {
  fmtReturn,
  fmtSharpe,
  fmtPct,
  strategyHex,
  getTrafficConfig,
} from './backtest-tokens';

interface Props {
  strategies: IBacktestStrategy[];
  bestStrategy: string;
  className?: string;
}

// ─── Column definitions ──────────────────────────────────────────

interface ColumnDef {
  key: string;
  label: string;
  tooltip: string;
  getValue: (s: IBacktestStrategy) => number | null;
  format: (v: number | null) => string;
  higherIsBetter: boolean;
}

const COLUMNS: ColumnDef[] = [
  {
    key: 'return',
    label: 'Return (Net)',
    tooltip: 'Total net return after transaction costs',
    getValue: (s) => s.backtest.aggregate.totalReturnNet,
    format: fmtReturn,
    higherIsBetter: true,
  },
  {
    key: 'sharpe',
    label: 'Sharpe',
    tooltip: 'Risk-adjusted return (annualized Sharpe ratio)',
    getValue: (s) => s.backtest.aggregate.sharpe,
    format: fmtSharpe,
    higherIsBetter: true,
  },
  {
    key: 'deflatedSR',
    label: 'Deflated SR',
    tooltip: 'Sharpe ratio adjusted for multiple-testing bias (Bailey & de Prado)',
    getValue: (s) => s.deflatedSharpe.deflatedSharpe,
    format: fmtSharpe,
    higherIsBetter: true,
  },
  {
    key: 'maxDD',
    label: 'Max DD',
    tooltip: 'Maximum peak-to-trough drawdown during the backtest period',
    getValue: (s) => s.backtest.aggregate.maxDrawdown,
    format: (v) => (v != null ? `${(v * 100).toFixed(1)}%` : '\u2014'),
    higherIsBetter: false, // lower (less negative) is better, but values are negative
  },
  {
    key: 'winRate',
    label: 'Win Rate',
    tooltip: 'Percentage of rebalancing periods with positive returns',
    getValue: (s) => s.backtest.aggregate.winRate,
    format: fmtPct,
    higherIsBetter: true,
  },
  {
    key: 'overfit',
    label: 'Overfit Risk',
    tooltip: 'Probability of Backtest Overfitting (CPCV method)',
    getValue: (s) => {
      const rank: Record<string, number> = { green: 0, yellow: 1, red: 2 };
      return rank[s.overfitting.trafficLight] ?? 1;
    },
    format: () => '',
    higherIsBetter: false,
  },
];

// ─── Mini Sparkline ─────────────────────────────────────────────

function MiniSparkline({ curve, color }: { curve: Array<{value: number}>; color: string }) {
  if (curve.length < 2) return null;
  const values = curve.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 48;
  const h = 12;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="shrink-0 opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1} />
    </svg>
  );
}

// ─── Rank Computation ───────────────────────────────────────────

/** Compute overall rank for each strategy based on composite of return, sharpe, and deflated SR ranks. */
function computeRanks(strategies: IBacktestStrategy[]): number[] {
  if (strategies.length <= 1) return strategies.map(() => 0);

  // Helper: rank values descending (higher is better → rank 0 for highest)
  function rankDescending(values: (number | null)[]): number[] {
    const indexed = values.map((v, i) => ({ v, i }));
    indexed.sort((a, b) => {
      if (a.v == null && b.v == null) return 0;
      if (a.v == null) return 1;
      if (b.v == null) return -1;
      return b.v - a.v;
    });
    const ranks = new Array<number>(values.length);
    indexed.forEach((item, rank) => { ranks[item.i] = rank; });
    return ranks;
  }

  const returnVals = strategies.map(s => s.backtest.aggregate.totalReturnNet);
  const sharpeVals = strategies.map(s => s.backtest.aggregate.sharpe);
  const deflatedVals = strategies.map(s => s.deflatedSharpe.deflatedSharpe);

  const returnRanks = rankDescending(returnVals);
  const sharpeRanks = rankDescending(sharpeVals);
  const deflatedRanks = rankDescending(deflatedVals);

  const composites = strategies.map((_, i) =>
    (returnRanks[i] + sharpeRanks[i] + deflatedRanks[i]) / 3,
  );

  // Sort by composite (lowest average rank wins) → assign overall rank
  const indexed = composites.map((c, i) => ({ c, i }));
  indexed.sort((a, b) => a.c - b.c);
  const overallRanks = new Array<number>(strategies.length);
  indexed.forEach((item, rank) => { overallRanks[item.i] = rank; });
  return overallRanks;
}

// ─── Helpers ─────────────────────────────────────────────────────

function getBestWorst(strategies: IBacktestStrategy[], col: ColumnDef) {
  const vals = strategies.map((s) => col.getValue(s)).filter((v): v is number => v != null);
  if (!vals.length) return { best: null, worst: null };
  if (col.higherIsBetter) {
    return { best: Math.max(...vals), worst: Math.min(...vals) };
  }
  // For maxDD (negative values), "best" is closest to 0
  if (col.key === 'maxDD') {
    return { best: Math.max(...vals), worst: Math.min(...vals) };
  }
  return { best: Math.min(...vals), worst: Math.max(...vals) };
}

// ─── Tooltip trigger ─────────────────────────────────────────────

function HeaderCell({ col }: { col: ColumnDef }) {
  return (
    <th className="px-3 py-2 text-right group relative">
      <span className={cn(T.badge, 'text-white/40 uppercase tracking-wider cursor-help')}>
        {col.label}
        <Info className="h-2.5 w-2.5 inline-block ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      <div className="absolute z-20 right-0 top-full mt-1 hidden group-hover:block">
        <div className="rounded-lg border border-white/[0.08] bg-black/95 backdrop-blur-sm px-3 py-2 shadow-xl max-w-[200px]">
          <p className="text-[10px] text-white/60 whitespace-normal">{col.tooltip}</p>
        </div>
      </div>
    </th>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function StrategyScorecardGrid({ strategies, bestStrategy, className }: Props) {
  if (!strategies.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No strategies to compare.
        </p>
      </div>
    );
  }

  // Pre-compute best/worst per column
  const colStats = COLUMNS.map((col) => ({
    col,
    ...getBestWorst(strategies, col),
  }));

  // Compute overall composite ranks
  const overallRanks = computeRanks(strategies);

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Strategy Scorecard</h4>
        <span className={cn(T.badge, 'text-white/30')}>Comparison Grid</span>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="px-3 py-2 text-left">
                <span className={cn(T.badge, 'text-white/40 uppercase tracking-wider')}>
                  Strategy
                </span>
              </th>
              {COLUMNS.map((col) => (
                <HeaderCell key={col.key} col={col} />
              ))}
            </tr>
          </thead>
          <tbody>
            {strategies.map((strat, rowIdx) => {
              const isBest = strat.name === bestStrategy;
              return (
                <motion.tr
                  key={strat.name}
                  className={cn(
                    'border-b border-white/[0.02] transition-colors',
                    isBest && 'bg-emerald-500/[0.03]',
                  )}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.04 + 0.2 }}
                >
                  {/* Strategy name */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[8px] font-bold font-mono w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: overallRanks[rowIdx] === 0 ? '#4ADE8020' : 'rgba(255,255,255,0.04)',
                          color: overallRanks[rowIdx] === 0 ? '#4ADE80' : 'rgba(255,255,255,0.3)',
                        }}
                      >
                        #{overallRanks[rowIdx] + 1}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: strategyHex(strat.name) }}
                      />
                      <span className={cn(T.mono, 'text-white/80')}>{strat.label}</span>
                      <MiniSparkline
                        curve={strat.backtest.equityCurve}
                        color={strategyHex(strat.name)}
                      />
                      {isBest && (
                        <span className="flex items-center gap-0.5 text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          <Award className="h-2.5 w-2.5" />
                          Best
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Metric cells */}
                  {colStats.map(({ col, best, worst }) => {
                    const raw = col.getValue(strat);

                    // Special rendering for overfit risk
                    if (col.key === 'overfit') {
                      const config = getTrafficConfig(strat.overfitting.trafficLight);
                      return (
                        <td key={col.key} className="px-3 py-2.5 text-right">
                          <span
                            className={cn(
                              'text-[9px] font-semibold px-2 py-0.5 rounded-full',
                              config.bg,
                              config.text,
                              config.border,
                              'border',
                            )}
                          >
                            {config.label}
                          </span>
                        </td>
                      );
                    }

                    const isBestVal = raw != null && best != null && raw === best;
                    const isWorstVal = raw != null && worst != null && raw === worst && strategies.length > 1;

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'px-3 py-2.5 text-right',
                          isBestVal && 'bg-emerald-500/[0.06]',
                          isWorstVal && 'bg-amber-500/[0.04]',
                        )}
                      >
                        <span
                          className={cn(
                            T.mono,
                            isBestVal ? 'text-emerald-400' : isWorstVal ? 'text-amber-400' : 'text-white/70',
                          )}
                        >
                          {col.format(raw)}
                        </span>
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
