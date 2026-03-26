'use client';

import React, { useId, useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IRollingVolSeries } from '@/types/simulation';
import { VOL_REGIME, fmtVol, getRegimeConfig } from './vol-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  rollingSeries: Record<string, IRollingVolSeries>;
  className?: string;
}

const TIME_RANGES = [
  { label: '3M', days: 63 },
  { label: '6M', days: 126 },
  { label: '1Y', days: 252 },
  { label: '2Y', days: 504 },
  { label: 'All', days: 9999 },
] as const;

// ─── Regime classifier for individual data points ─────────────────

function classifyRegime(vol: number, median: number, p75: number, p85: number): string {
  if (vol >= p85) return 'hurricane';
  if (vol >= p75) return 'storm';
  if (vol >= median * 0.7) return 'moderate';
  return 'calm';
}

// ─── Tooltip ──────────────────────────────────────────────────────

function TimelineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { date: string; vol: number; regime: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const config = getRegimeConfig(d.regime);

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/90 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-[10px] text-white/60 mb-0.5">{d.date}</p>
      <p className="text-[11px]">
        Vol: <span className="font-semibold text-indigo-400">{fmtVol(d.vol)}</span>
      </p>
      <p className={cn('text-[9px] mt-0.5', config.text)}>
        {config.label}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function VolatilityTimeline({ rollingSeries, className }: Props) {
  const gradientId = useId();
  const [range, setRange] = useState<number>(252);

  // Use 21-day rolling series
  const series21 = rollingSeries['21'];
  const hasData = !!series21 && series21.values.length >= 10;

  const chartData = useMemo(() => {
    if (!series21 || series21.values.length < 10) {
      return null;
    }

    const n = series21.dates.length;
    const sliceStart = range >= n ? 0 : n - range;

    const dates = series21.dates.slice(sliceStart);
    const values = series21.values.slice(sliceStart);

    // Compute percentiles for regime classification
    const arr = [...values].sort((a, b) => a - b);
    const median = arr[Math.floor(arr.length * 0.5)];
    const p75 = arr[Math.floor(arr.length * 0.75)];
    const p85 = arr[Math.floor(arr.length * 0.85)];

    return {
      points: dates.map((date, i) => ({
        date,
        vol: values[i],
        regime: classifyRegime(values[i], median, p75, p85),
      })),
      median,
      p75,
      p25: arr[Math.floor(arr.length * 0.25)],
    };
  }, [series21, range]);

  if (!hasData || !chartData) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          Insufficient rolling volatility data.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Header with time range pills */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Volatility Timeline</h4>
        <div className="flex items-center gap-1">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.label}
              type="button"
              aria-pressed={range === tr.days}
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
        <AreaChart data={chartData.points} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#818CF8" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={50}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => fmtVol(v)}
          />
          <Tooltip content={<TimelineTooltip />} />

          {/* Reference lines */}
          <ReferenceLine
            y={chartData.median}
            stroke="rgba(148,163,184,0.3)"
            strokeDasharray="4 4"
            label={{
              value: 'Median',
              position: 'right',
              fill: 'rgba(255,255,255,0.2)',
              fontSize: 9,
            }}
          />
          <ReferenceLine
            y={chartData.p75}
            stroke="rgba(249,115,22,0.2)"
            strokeDasharray="3 3"
          />
          <ReferenceLine
            y={chartData.p25}
            stroke="rgba(74,222,128,0.2)"
            strokeDasharray="3 3"
          />

          {/* Vol area */}
          <Area
            type="monotone"
            dataKey="vol"
            stroke="#818CF8"
            strokeWidth={1.5}
            fill={`url(#${gradientId}-fill)`}
            dot={false}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1">
        {Object.entries(VOL_REGIME).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: val.hex, opacity: 0.6 }}
            />
            <span className="text-[8px] text-white/25">{val.label}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
