'use client';

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IRegimeTimelinePoint, RegimeLabel } from '@/types/simulation';
import { REGIME_COLORS, getRegimeColor } from './regime-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  timeline: IRegimeTimelinePoint[];
  className?: string;
}

const TIME_RANGES = [
  { label: '3M', days: 63 },
  { label: '6M', days: 126 },
  { label: '1Y', days: 252 },
  { label: 'All', days: 9999 },
] as const;

const REGIME_KEYS: RegimeLabel[] = ['growth', 'neutral', 'contraction'];

// ─── Tooltip ──────────────────────────────────────────────────────

function TimelineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const regime = d.regime as RegimeLabel;
  const config = getRegimeColor(regime);
  const prob = d.probability as number;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/90 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-[10px] text-white/60 mb-0.5">{d.date as string}</p>
      <p className={cn('text-[11px] font-semibold', config.text)}>
        {config.label}
      </p>
      <p className="text-[10px] text-white/40">
        Probability: {(prob * 100).toFixed(1)}%
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function RegimeTimeline({ timeline, className }: Props) {
  const [range, setRange] = useState<number>(252);

  const chartData = useMemo(() => {
    if (!timeline || timeline.length < 5) return [];
    const n = timeline.length;
    const sliceStart = range >= n ? 0 : n - range;
    const sliced = timeline.slice(sliceStart);

    // For stacked area at 100%: each data point has a "1" for its regime
    // and "0" for others. We use probability-weighted assignment.
    return sliced.map((pt) => {
      const row: Record<string, unknown> = {
        date: pt.date,
        regime: pt.regime,
        probability: pt.probability,
      };
      // Binary regime assignment for stacked area river
      for (const key of REGIME_KEYS) {
        row[key] = pt.regime === key ? 1 : 0;
      }
      return row;
    });
  }, [timeline, range]);

  if (!timeline || timeline.length < 5) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          Insufficient regime timeline data.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      {/* Header with time range pills */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Regime Timeline</h4>
        <div className="flex items-center gap-1">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.label}
              type="button"
              className={cn(
                'px-2 py-0.5 rounded-full text-[9px] font-medium transition-all',
                range === tr.days
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-white/30 hover:text-white/50',
              )}
              onClick={() => setRange(tr.days)}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          stackOffset="expand"
        >
          <defs>
            {REGIME_KEYS.map((key) => (
              <linearGradient key={key} id={`regimeArea-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={REGIME_COLORS[key].hex} stopOpacity={0.6} />
                <stop offset="100%" stopColor={REGIME_COLORS[key].hex} stopOpacity={0.25} />
              </linearGradient>
            ))}
          </defs>

          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis hide domain={[0, 1]} />
          <Tooltip content={<TimelineTooltip />} />

          {REGIME_KEYS.map((key) => (
            <Area
              key={key}
              type="stepAfter"
              dataKey={key}
              stackId="regime"
              stroke={REGIME_COLORS[key].hex}
              strokeWidth={0}
              fill={`url(#regimeArea-${key})`}
              fillOpacity={1}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1">
        {REGIME_KEYS.map((key) => (
          <span key={key} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: REGIME_COLORS[key].hex, opacity: 0.7 }}
            />
            <span className="text-[8px] text-white/25">{REGIME_COLORS[key].label}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
