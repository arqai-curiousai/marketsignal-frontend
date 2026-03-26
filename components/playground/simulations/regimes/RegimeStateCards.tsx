'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/src/lib/exchange/formatting';
import type { IRegimeStatistic, IRegimeState, RegimeLabel } from '@/types/simulation';
import { getRegimeColor, fmtReturn, fmtDays } from './regime-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  statistics: IRegimeStatistic[];
  states: IRegimeState[];
  currentLabel: RegimeLabel;
  className?: string;
}

// ─── Metric row inside a card ────────────────────────────────────

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-b-0">
      <span className="text-[10px] text-white/40">{label}</span>
      <span className={cn(T.monoSm, 'text-white/70')}>{value}</span>
    </div>
  );
}

// ─── Single state card ───────────────────────────────────────────

function StateCard({
  stat,
  state,
  isCurrent,
  index,
}: {
  stat: IRegimeStatistic;
  state: IRegimeState | undefined;
  isCurrent: boolean;
  index: number;
}) {
  const color = getRegimeColor(stat.label);
  const volatilityPct = stat.avgVolatility != null ? `${(stat.avgVolatility * 100).toFixed(1)}%` : '\u2014';
  const sharpe = stat.sharpeProxy != null ? stat.sharpeProxy.toFixed(2) : '\u2014';
  const frequency = stat.frequency != null ? `${(stat.frequency * 100).toFixed(0)}%` : '\u2014';

  return (
    <motion.div
      className={cn(
        S.card,
        'min-w-[220px] snap-center overflow-hidden relative',
        isCurrent && 'ring-1',
      )}
      style={isCurrent ? { '--tw-ring-color': color.hex, borderColor: `rgba(${color.rgb}, 0.3)` } as React.CSSProperties : undefined}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08 + 0.15,
        type: 'spring',
        stiffness: 130,
        damping: 18,
      }}
    >
      {/* Animated border pulse for current state */}
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1px rgba(${color.rgb}, 0.2)` }}
          animate={{ boxShadow: [
            `inset 0 0 0 1px rgba(${color.rgb}, 0.1)`,
            `inset 0 0 0 1px rgba(${color.rgb}, 0.35)`,
            `inset 0 0 0 1px rgba(${color.rgb}, 0.1)`,
          ]}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Color header bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: color.hex, opacity: isCurrent ? 0.8 : 0.4 }}
      />

      <div className="p-4">
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color.hex }}
            />
            <span className={cn(T.heading, 'text-white/80')}>
              {state?.displayName ?? color.label}
            </span>
          </div>
          {isCurrent && (
            <span className={cn(
              'text-[8px] font-semibold px-2 py-0.5 rounded-full',
              color.bg, color.text, color.border, 'border',
            )}>
              ACTIVE
            </span>
          )}
        </div>

        {/* Metrics */}
        <div className="space-y-0">
          <MetricRow label="Avg Return" value={fmtReturn(stat.avgDailyReturn)} />
          <MetricRow label="Volatility" value={volatilityPct} />
          <MetricRow label="Sharpe Proxy" value={sharpe} />
          <MetricRow label="Typical Duration" value={fmtDays(stat.typicalDurationDays)} />
          <MetricRow label="Max Duration" value={fmtDays(stat.maxDurationDays)} />
          <MetricRow label="Frequency" value={frequency} />
          <MetricRow label="Total Days" value={formatNumber(stat.totalDays)} />
        </div>

        {/* Sample periods */}
        {stat.samplePeriods.length > 0 && (
          <div className="mt-3 pt-2 border-t border-white/[0.04]">
            <span className={cn(T.badge, 'text-white/25 mb-1 block')}>Sample Periods</span>
            <div className="space-y-0.5">
              {stat.samplePeriods.slice(0, 3).map((sp, i) => (
                <p key={i} className="text-[9px] text-white/30 font-mono">
                  {sp.start} — {sp.end}
                </p>
              ))}
              {stat.samplePeriods.length > 3 && (
                <p className="text-[8px] text-white/20">
                  +{stat.samplePeriods.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function RegimeStateCards({ statistics, states, currentLabel, className }: Props) {
  if (!statistics.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No state statistics available.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2',
        // On desktop, center cards in a grid
        'md:grid md:overflow-visible md:snap-none',
        statistics.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3',
        className,
      )}
    >
      {statistics.map((stat, i) => {
        const state = states.find((s) => s.label === stat.label);
        return (
          <StateCard
            key={stat.label}
            stat={stat}
            state={state}
            isCurrent={stat.label === currentLabel}
            index={i}
          />
        );
      })}
    </div>
  );
}
