'use client';

import React, { useId, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IMonteCarloResult, IPercentileBandPoint } from '@/types/simulation';
import { MC_COLORS, fmtPrice } from './mc-tokens';
import { T, S, TOOLTIP_STYLE, AXIS_STYLE } from '@/components/playground/pyramid/tokens';
import { formatNumber } from '@/src/lib/exchange/formatting';

interface Props {
  data: IMonteCarloResult;
  currentPrice: number;
  target?: number;
  samplePaths?: number[][];
  className?: string;
}

// ─── Tooltip ──────────────────────────────────────────────────────

function ConeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: IPercentileBandPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] font-semibold text-white/70 mb-1">Day {d.day}</p>
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between gap-4">
          <span className="text-white/40">P95</span>
          <span className="font-mono text-white/60">{fmtPrice(d.p95)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/40">P75</span>
          <span className="font-mono text-white/60">{fmtPrice(d.p75)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-indigo-400 font-medium">P50</span>
          <span className="font-mono text-indigo-400 font-semibold">{fmtPrice(d.p50)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/40">P25</span>
          <span className="font-mono text-white/60">{fmtPrice(d.p25)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/40">P5</span>
          <span className="font-mono text-white/60">{fmtPrice(d.p5)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function ProbabilityCone({ data, currentPrice, target, samplePaths, className }: Props) {
  const gId = useId();
  const bands = data.percentileBands;

  // Compute Y-axis domain
  const { yMin, yMax } = useMemo(() => {
    if (!bands.length) return { yMin: 0, yMax: 100 };
    const allVals = bands.flatMap((b) => [b.p5, b.p95]);
    if (target != null) allVals.push(target);
    allVals.push(currentPrice);
    const lo = Math.min(...allVals);
    const hi = Math.max(...allVals);
    const pad = (hi - lo) * 0.08;
    return { yMin: Math.max(0, lo - pad), yMax: hi + pad };
  }, [bands, currentPrice, target]);

  // Subsample ghost paths for rendering (max 50 paths, subsampled to ~40 points each)
  const ghostLines = useMemo(() => {
    if (!samplePaths?.length) return [];
    const maxPaths = Math.min(samplePaths.length, 50);
    const step = Math.max(1, Math.floor(samplePaths.length / maxPaths));
    const paths: number[][] = [];
    for (let i = 0; i < samplePaths.length && paths.length < maxPaths; i += step) {
      const path = samplePaths[i];
      // Subsample long paths to ~40 points for perf
      if (path.length > 40) {
        const sampleStep = Math.floor(path.length / 40);
        const sampled: number[] = [];
        for (let j = 0; j < path.length; j += sampleStep) {
          sampled.push(path[j]);
        }
        if (sampled[sampled.length - 1] !== path[path.length - 1]) {
          sampled.push(path[path.length - 1]);
        }
        paths.push(sampled);
      } else {
        paths.push(path);
      }
    }
    return paths;
  }, [samplePaths]);

  // Build SVG ghost path elements
  const ghostPathElements = useMemo(() => {
    if (!ghostLines.length || !bands.length) return null;
    const totalDays = bands[bands.length - 1].day;

    return ghostLines.map((path, idx) => {
      const points = path.map((price, i) => {
        const day = totalDays * (i / (path.length - 1));
        return { day, price };
      });

      return (
        <Line
          key={`ghost-${idx}`}
          data={points}
          dataKey="price"
          xAxisId="day"
          yAxisId="price"
          type="monotone"
          stroke={MC_COLORS.ghostPath}
          strokeWidth={0.5}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      );
    });
  }, [ghostLines, bands]);

  // Subsample bands for X-axis tick clarity
  const xTicks = useMemo(() => {
    if (!bands.length) return [];
    const totalDays = bands[bands.length - 1].day;
    const tickCount = 6;
    const step = Math.floor(totalDays / tickCount);
    return Array.from({ length: tickCount + 1 }, (_, i) => Math.min(i * step, totalDays));
  }, [bands]);

  if (!bands.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No simulation data available.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Probability Cone</h4>
        <span className={cn(T.badge, 'text-white/30')}>
          {data.percentileBands.length > 0
            ? `${bands[bands.length - 1].day}-Day Simulation`
            : 'Monte Carlo'}
        </span>
      </div>

      <div className="h-[280px] md:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={bands} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`${gId}-mcBand90`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`${gId}-mcBand75`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id={`${gId}-mcBand50`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0.08} />
              </linearGradient>
            </defs>

            <XAxis
              xAxisId="day"
              dataKey="day"
              ticks={xTicks}
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => (v === 0 ? 'Now' : `D${v}`)}
            />
            <YAxis
              yAxisId="price"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={70}
              domain={[yMin, yMax]}
              tickFormatter={(v: number) =>
                formatNumber(v, 'NSE', { maximumFractionDigits: 0 })
              }
            />
            <Tooltip content={<ConeTooltip />} />

            {/* P5-P95 outermost band */}
            <Area
              type="monotone"
              dataKey="p95"
              xAxisId="day"
              yAxisId="price"
              stroke="none"
              fill={`url(#${gId}-mcBand90)`}
              fillOpacity={1}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="p5"
              xAxisId="day"
              yAxisId="price"
              stroke="none"
              fill="transparent"
              animationDuration={1200}
            />

            {/* P10-P90 mid band */}
            <Area
              type="monotone"
              dataKey="p90"
              xAxisId="day"
              yAxisId="price"
              stroke="none"
              fill={`url(#${gId}-mcBand75)`}
              fillOpacity={1}
              animationDuration={1100}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="p10"
              xAxisId="day"
              yAxisId="price"
              stroke="none"
              fill="transparent"
              animationDuration={1100}
            />

            {/* P25-P75 inner band */}
            <Area
              type="monotone"
              dataKey="p75"
              xAxisId="day"
              yAxisId="price"
              stroke="none"
              fill={`url(#${gId}-mcBand50)`}
              fillOpacity={1}
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="p25"
              xAxisId="day"
              yAxisId="price"
              stroke="none"
              fill="transparent"
              animationDuration={1000}
            />

            {/* Ghost sample paths */}
            {ghostPathElements}

            {/* P50 median line */}
            <Line
              type="monotone"
              dataKey="p50"
              xAxisId="day"
              yAxisId="price"
              stroke={MC_COLORS.median}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: MC_COLORS.median,
                stroke: 'rgba(0,0,0,0.5)',
                strokeWidth: 2,
              }}
              animationDuration={1200}
              animationEasing="ease-out"
            />

            {/* Current price reference line */}
            <ReferenceLine
              y={currentPrice}
              xAxisId="day"
              yAxisId="price"
              stroke={MC_COLORS.currentPrice}
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Current ${fmtPrice(currentPrice)}`,
                position: 'right',
                fill: MC_COLORS.currentPrice,
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            />

            {/* Target price reference line */}
            {target != null && (
              <ReferenceLine
                y={target}
                xAxisId="day"
                yAxisId="price"
                stroke={MC_COLORS.target}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Target ${fmtPrice(target)}`,
                  position: 'right',
                  fill: MC_COLORS.target,
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: MC_COLORS.median }} />
          <span className={T.legend}>Median (P50)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 rounded-full"
            style={{ backgroundColor: MC_COLORS.currentPrice, opacity: 0.8 }}
          />
          <span className={T.legend}>Current Price</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-indigo-500/20" />
          <span className={T.legend}>P25-P75</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-indigo-500/10" />
          <span className={T.legend}>P10-P90</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-indigo-500/[0.05]" />
          <span className={T.legend}>P5-P95</span>
        </span>
        {target != null && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded-full"
              style={{ backgroundColor: MC_COLORS.target, opacity: 0.8 }}
            />
            <span className={T.legend}>Target</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
