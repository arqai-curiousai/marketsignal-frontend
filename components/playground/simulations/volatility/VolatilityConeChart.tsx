'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IVolatilityConePoint } from '@/types/simulation';
import { CONE_COLORS, fmtVol } from './vol-tokens';
import { T, S } from '@/components/playground/pyramid/tokens';

interface Props {
  cone: IVolatilityConePoint[];
  className?: string;
}

// ─── Tooltip ──────────────────────────────────────────────────────

function ConeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: IVolatilityConePoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const isOutside = d.current < d.p25 || d.current > d.p75;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/90 backdrop-blur-sm px-3 py-2 shadow-xl">
      <p className="text-[10px] font-semibold text-white/70 mb-1">{d.windowLabel} Window</p>
      <div className="space-y-0.5 text-[10px]">
        <p>
          Current:{' '}
          <span className={cn('font-semibold', isOutside ? 'text-amber-400' : 'text-indigo-400')}>
            {fmtVol(d.current)}
          </span>
        </p>
        <p className="text-white/40">
          P10: {fmtVol(d.p10)} | P25: {fmtVol(d.p25)} | P50: {fmtVol(d.p50)} | P75: {fmtVol(d.p75)} | P90: {fmtVol(d.p90)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function VolatilityConeChart({ cone, className }: Props) {
  if (!cone.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          Insufficient data for volatility cone.
        </p>
      </div>
    );
  }

  // Build chart data with band values
  const chartData = cone.map((c) => ({
    ...c,
    // For stacked area bands, compute band widths
    bandOuter_low: c.p10,
    bandOuter_high: c.p90,
    bandInner_low: c.p25,
    bandInner_high: c.p75,
  }));

  // Domain
  const allVals = cone.flatMap((c) => [c.p10, c.p90, c.current]);
  const yMin = Math.max(0, Math.min(...allVals) * 0.85);
  const yMax = Math.max(...allVals) * 1.15;

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Volatility Cone</h4>
        <span className={cn(T.badge, 'text-white/30')}>
          Term Structure
        </span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="volConeOuter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="volConeInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.06} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="windowLabel"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={50}
            domain={[yMin, yMax]}
            tickFormatter={(v: number) => fmtVol(v)}
          />

          <Tooltip content={<ConeTooltip />} />

          {/* P10-P90 outer band */}
          <Area
            type="monotone"
            dataKey="p90"
            stroke="none"
            fill="url(#volConeOuter)"
            fillOpacity={1}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="p10"
            stroke="rgba(99,102,241,0.08)"
            strokeDasharray="3 3"
            fill="transparent"
            animationDuration={800}
          />

          {/* P25-P75 inner band */}
          <Area
            type="monotone"
            dataKey="p75"
            stroke="none"
            fill="url(#volConeInner)"
            fillOpacity={1}
            animationDuration={900}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="p25"
            stroke="rgba(99,102,241,0.15)"
            strokeDasharray="3 3"
            fill="transparent"
            animationDuration={900}
          />

          {/* P50 median */}
          <Line
            type="monotone"
            dataKey="p50"
            stroke="rgba(148,163,184,0.4)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={false}
            animationDuration={700}
          />

          {/* Current vol line */}
          <Line
            type="monotone"
            dataKey="current"
            stroke={CONE_COLORS.current}
            strokeWidth={2}
            dot={{
              fill: CONE_COLORS.current,
              r: 4,
              strokeWidth: 2,
              stroke: 'rgba(0,0,0,0.5)',
            }}
            activeDot={{
              r: 6,
              fill: CONE_COLORS.current,
              stroke: 'rgba(129,140,248,0.4)',
              strokeWidth: 3,
            }}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full bg-indigo-400" />
          <span className="text-[9px] text-white/30">Current</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full bg-slate-500 opacity-40" style={{ borderTop: '1px dashed' }} />
          <span className="text-[9px] text-white/30">Median</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-indigo-500/15" />
          <span className="text-[9px] text-white/30">P25-P75</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-indigo-500/06" />
          <span className="text-[9px] text-white/30">P10-P90</span>
        </span>
      </div>
    </motion.div>
  );
}
