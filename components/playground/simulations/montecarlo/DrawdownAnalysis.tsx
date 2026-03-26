'use client';

import React, { useId, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IDrawdownAnalysis, IUnderwaterPoint } from '@/types/simulation';
import { DRAWDOWN_COLORS, fmtPct } from './mc-tokens';
import { T, S, TOOLTIP_STYLE, AXIS_STYLE } from '@/components/playground/pyramid/tokens';

interface Props {
  drawdown: IDrawdownAnalysis;
  className?: string;
}

function DDTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: IUnderwaterPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] font-semibold text-white/70 mb-1">Day {d.day}</p>
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between gap-4">
          <span className="text-white/40">P25</span>
          <span className="font-mono text-white/60">{fmtPct(d.p25)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: DRAWDOWN_COLORS.median }}>Median</span>
          <span className="font-mono text-white/60">{fmtPct(d.p50)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/40">P75</span>
          <span className="font-mono text-white/60">{fmtPct(d.p75)}</span>
        </div>
      </div>
    </div>
  );
}

export function DrawdownAnalysis({ drawdown, className }: Props) {
  const gId = useId();
  const { underwaterChart, maxDrawdownDistribution, recoveryStats } = drawdown;

  const annotation = useMemo(() => {
    if (!underwaterChart.length) return null;
    const worst = underwaterChart.reduce((w, p) => (p.p50 < w.p50 ? p : w));
    return `Median drawdown bottoms around day ${worst.day} at ${fmtPct(worst.p50)}.`;
  }, [underwaterChart]);

  if (!underwaterChart.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No drawdown data available.
        </p>
      </div>
    );
  }

  const ddStats = maxDrawdownDistribution.stats;

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
        <h4 className={cn(T.heading, 'text-white/80')}>Drawdown Analysis</h4>
      </div>

      {/* Underwater Chart */}
      <div className="h-[200px] md:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={underwaterChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`${gId}-ddBandGrad`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB7185" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#FB7185" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="day"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `D${v}`}
            />
            <YAxis
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            />
            <Tooltip content={<DDTooltip />} />

            {/* P25-P75 band */}
            <Area
              type="monotone"
              dataKey="p25"
              stroke="none"
              fill={`url(#${gId}-ddBandGrad)`}
              fillOpacity={1}
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="p75"
              stroke="none"
              fill="transparent"
              animationDuration={800}
            />

            {/* P50 median line */}
            <Area
              type="monotone"
              dataKey="p50"
              stroke={DRAWDOWN_COLORS.median}
              strokeWidth={2}
              fill="none"
              dot={false}
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 rounded-full"
            style={{ backgroundColor: DRAWDOWN_COLORS.median }}
          />
          <span className={T.legend}>Median DD</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-rose-400/15" />
          <span className={T.legend}>P25-P75 Band</span>
        </span>
      </div>

      {/* Recovery Stats + Max DD Stats */}
      <div className={cn(S.inner, 'p-3 mt-3 grid grid-cols-2 md:grid-cols-4 gap-3')}>
        <div>
          <span className="text-[9px] text-white/30 block mb-0.5">Max DD (Median)</span>
          <span className="text-[10px] font-mono font-semibold text-rose-400">
            {fmtPct(ddStats.median)}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-white/30 block mb-0.5">Max DD (P5-P95)</span>
          <span className="text-[10px] font-mono text-white/60">
            {fmtPct(ddStats.p5)} to {fmtPct(ddStats.p95)}
          </span>
        </div>
        <div>
          <span className="text-[9px] text-white/30 block mb-0.5">Recovery (Median)</span>
          <span className="text-[10px] font-mono font-semibold text-white/60">
            {recoveryStats.medianRecoveryDays != null
              ? `${recoveryStats.medianRecoveryDays} days`
              : 'N/A'}
          </span>
          {recoveryStats.p25RecoveryDays != null && recoveryStats.p75RecoveryDays != null && (
            <span className="text-[8px] text-white/20 block">
              P25-P75: {recoveryStats.p25RecoveryDays}-{recoveryStats.p75RecoveryDays}d
            </span>
          )}
        </div>
        <div>
          <span className="text-[9px] text-white/30 block mb-0.5">Avg Episodes</span>
          <span className="text-[10px] font-mono font-semibold text-white/60">
            {recoveryStats.avgEpisodesPerPath.toFixed(1)} per path
          </span>
        </div>
      </div>

      {/* Annotation */}
      {annotation && (
        <div className={cn(S.inner, 'p-2.5 mt-2')}>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{annotation}</p>
        </div>
      )}
    </motion.div>
  );
}
