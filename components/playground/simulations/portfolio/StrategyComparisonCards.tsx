'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPortfolioStrategy } from '@/types/simulation';
import { T, S } from '@/components/playground/pyramid/tokens';
import {
  getStrategyColor,
  getStrategyLabel,
  fmtReturn,
  fmtWeight,
  fmtSharpe,
} from './portfolio-tokens';

interface Props {
  strategies: IPortfolioStrategy[];
  bestStrategy: string;
  className?: string;
}

// ─── Metric Row ──────────────────────────────────────────────────

function MetricRow({ label, value, isNegative }: { label: string; value: string; isNegative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-white/35">{label}</span>
      <span className={cn(
        'text-[10px] font-mono tabular-nums font-medium',
        isNegative ? 'text-rose-400' : 'text-white/70',
      )}>
        {value}
      </span>
    </div>
  );
}

// ─── Single Strategy Card ────────────────────────────────────────

function StrategyCard({
  strategy,
  isBest,
  index,
}: {
  strategy: IPortfolioStrategy;
  isBest: boolean;
  index: number;
}) {
  const color = getStrategyColor(strategy.mode);
  const label = getStrategyLabel(strategy.mode);

  // Normalize equity curve for sparkline
  const sparkData = strategy.equityCurve.map((p) => ({
    value: p.value,
  }));

  // Natural language annotation for the winner
  const annotation = isBest
    ? `Best risk-adjusted return with a Sharpe of ${fmtSharpe(strategy.metrics.sharpe)}`
    : null;

  return (
    <motion.div
      className={cn(
        'snap-center shrink-0 w-[200px] md:w-[220px]',
        S.card,
        'overflow-hidden relative',
        isBest && 'ring-1 ring-amber-500/20',
      )}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 + 0.1, type: 'spring', stiffness: 120, damping: 18 }}
    >
      {/* Color header bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: color }}
      />

      <div className="p-3 space-y-2">
        {/* Title + Winner badge */}
        <div className="flex items-center justify-between">
          <span className={cn(T.heading, 'text-white/80 text-xs')}>
            {label}
          </span>
          {isBest && (
            <motion.span
              className="flex items-center gap-0.5 text-[8px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: index * 0.08 + 0.3 }}
            >
              <Award className="h-2.5 w-2.5" />
              Winner
            </motion.span>
          )}
        </div>

        {/* Sparkline equity curve */}
        {sparkData.length > 2 && (
          <div className="h-[40px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Metrics */}
        <div className="space-y-1">
          <MetricRow label="Return" value={fmtReturn(strategy.metrics.annualReturn)} />
          <MetricRow label="Volatility" value={fmtWeight(strategy.metrics.annualVolatility)} />
          <MetricRow label="Sharpe" value={fmtSharpe(strategy.metrics.sharpe)} />
          <MetricRow
            label="Max DD"
            value={fmtReturn(strategy.metrics.maxDrawdown)}
            isNegative
          />
          <MetricRow label="Sortino" value={fmtSharpe(strategy.metrics.sortino)} />
        </div>

        {/* Annotation */}
        {annotation && (
          <p className="text-[9px] text-amber-400/60 leading-relaxed pt-1 border-t border-white/[0.04]">
            {annotation}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function StrategyComparisonCards({ strategies, bestStrategy, className }: Props) {
  if (strategies.length === 0) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-xs text-muted-foreground text-center py-4">
          No strategies to compare.
        </p>
      </div>
    );
  }

  // Sort so best is first
  const sorted = [...strategies].sort((a, b) => {
    if (a.mode === bestStrategy) return -1;
    if (b.mode === bestStrategy) return 1;
    return b.metrics.sharpe - a.metrics.sharpe;
  });

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h4 className={cn(T.heading, 'text-white/80')}>Strategy Comparison</h4>
        <span className={cn(T.badge, 'text-white/30')}>
          {strategies.length} Strategies
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {sorted.map((s, i) => (
          <StrategyCard
            key={s.mode}
            strategy={s}
            isBest={s.mode === bestStrategy}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
