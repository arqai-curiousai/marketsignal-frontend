'use client';

import React, { useId } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IGARCHForecast } from '@/types/simulation';
import { GARCH_COLORS, fmtVol } from './vol-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  garch: IGARCHForecast;
  className?: string;
}

// ─── Tooltip ──────────────────────────────────────────────────────

function ForecastTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { day: number; meanVol: number; lower68: number; upper68: number; lower95: number; upper95: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/90 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-[10px] font-semibold text-white/70 mb-1">Day {d.day}</p>
      <div className="space-y-0.5 text-[10px]">
        <p>
          Forecast: <span className="font-semibold text-indigo-400">{fmtVol(d.meanVol)}</span>
        </p>
        <p className="text-white/40">
          68% CI: {fmtVol(d.lower68)} – {fmtVol(d.upper68)}
        </p>
        <p className="text-white/30">
          95% CI: {fmtVol(d.lower95)} – {fmtVol(d.upper95)}
        </p>
      </div>
    </div>
  );
}

// ─── Half-life sparkline ──────────────────────────────────────────

function HalfLifeSparkline({ halfLife, persistence }: { halfLife: number | null; persistence: number }) {
  if (halfLife == null || halfLife <= 0) return null;

  const points = Array.from({ length: 20 }, (_, i) => {
    const t = i;
    const decay = Math.pow(persistence, t);
    return { x: (i / 19) * 60, y: 14 - decay * 12 };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox="0 0 60 16" className="w-[60px] h-[16px] inline-block ml-1 align-middle">
      <path d={pathD} fill="none" stroke="rgba(129,140,248,0.4)" strokeWidth="1.5" />
      {/* Half-life marker */}
      <circle
        cx={(Math.min(halfLife, 19) / 19) * 60}
        cy={14 - Math.pow(persistence, Math.min(halfLife, 19)) * 12}
        r="2"
        fill="#818CF8"
      />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function GARCHForecastChart({ garch, className }: Props) {
  const gId = useId();
  const { forecastSeries, persistence, halfLifeDays, currentVol, longRunVol } = garch;

  // Prepend current vol as day 0
  const chartData = [
    {
      day: 0,
      meanVol: currentVol,
      lower68: currentVol,
      upper68: currentVol,
      lower95: currentVol,
      upper95: currentVol,
    },
    ...forecastSeries,
  ];

  // Natural language summary
  const direction = forecastSeries.length > 5 &&
    forecastSeries[5].meanVol < currentVol * 0.95
    ? 'decrease'
    : forecastSeries.length > 5 && forecastSeries[5].meanVol > currentVol * 1.05
    ? 'increase'
    : 'remain stable';

  const summary = `Volatility is expected to ${direction} over the next ${forecastSeries.length} trading days. ${
    halfLifeDays != null
      ? `Shocks take ~${halfLifeDays.toFixed(0)} days to halve (persistence: ${persistence.toFixed(2)}).`
      : `Persistence: ${persistence.toFixed(2)}.`
  }${longRunVol != null ? ` Long-run equilibrium: ${fmtVol(longRunVol)}.` : ''}`;

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
          <h4 className={cn(T.heading, 'text-white/80')}>GARCH Forecast</h4>
        </div>
        <span className={cn(T.badge, 'text-white/30')}>
          {forecastSeries.length}-Day Ahead
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`${gId}-garchBand95`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.07} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={`${gId}-garchBand68`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.06} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="day"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => v === 0 ? 'Now' : `D${v}`}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={50}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => fmtVol(v)}
          />
          <Tooltip content={<ForecastTooltip />} />

          {/* 95% band */}
          <Area
            type="monotone"
            dataKey="upper95"
            stroke="none"
            fill={`url(#${gId}-garchBand95)`}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="lower95"
            stroke="none"
            fill="transparent"
            animationDuration={1000}
          />

          {/* 68% band */}
          <Area
            type="monotone"
            dataKey="upper68"
            stroke="none"
            fill={`url(#${gId}-garchBand68)`}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="lower68"
            stroke="none"
            fill="transparent"
            animationDuration={800}
          />

          {/* Mean forecast line */}
          <Line
            type="monotone"
            dataKey="meanVol"
            stroke={GARCH_COLORS.meanLine}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#818CF8', stroke: 'rgba(0,0,0,0.5)', strokeWidth: 2 }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary card */}
      <div className={cn(S.inner, 'p-3 mt-3')}>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {summary}
        </p>
        {halfLifeDays != null && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] text-white/30">Shock decay:</span>
            <HalfLifeSparkline halfLife={halfLifeDays} persistence={persistence} />
            <span className="text-[9px] text-white/40 font-mono">
              ~{halfLifeDays.toFixed(0)}d half-life
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
