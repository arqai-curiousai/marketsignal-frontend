'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IConvergencePoint, IQualityScore } from '@/types/simulation';
import { fmtPrice, fmtQuality, qualityColor } from './mc-tokens';
import { T, S, TOOLTIP_STYLE, AXIS_STYLE } from '@/components/playground/pyramid/tokens';

interface Props {
  convergence: IConvergencePoint[];
  qualityScore: IQualityScore | null;
  className?: string;
}

function ConvTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: IConvergencePoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] font-semibold text-white/70 mb-1">
        {d.nPaths.toLocaleString()} paths
      </p>
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between gap-4">
          <span className="text-indigo-400">Mean</span>
          <span className="font-mono text-white/60">{fmtPrice(d.mean)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/40">Std Dev</span>
          <span className="font-mono text-white/60">{fmtPrice(d.std)}</span>
        </div>
      </div>
    </div>
  );
}

export function ConvergencePlot({ convergence, qualityScore, className }: Props) {
  const isStabilized = useMemo(() => {
    if (convergence.length < 3) return false;
    const last3 = convergence.slice(-3);
    const avgMean = last3.reduce((s, p) => s + p.mean, 0) / 3;
    return last3.every((p) => Math.abs(p.mean - avgMean) / avgMean < 0.01);
  }, [convergence]);

  if (!convergence.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-6">
          No convergence data available.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-3.5 w-3.5 text-indigo-400" />
        <h4 className={cn(T.heading, 'text-white/80')}>Convergence</h4>
        {isStabilized && (
          <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full ml-auto">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Stabilized
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={convergence} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="nPaths"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
              }
            />
            <YAxis
              yAxisId="mean"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v: number) => fmtPrice(v).replace(/₹\s*/, '₹')}
              orientation="left"
            />
            <YAxis
              yAxisId="std"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={35}
              tickFormatter={() => ''}
              orientation="right"
            />
            <Tooltip content={<ConvTooltip />} />

            <Line
              yAxisId="mean"
              type="monotone"
              dataKey="mean"
              stroke="#818CF8"
              strokeWidth={2}
              dot={false}
              animationDuration={800}
            />
            <Line
              yAxisId="std"
              type="monotone"
              dataKey="std"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full bg-indigo-400" />
          <span className={T.legend}>Mean Price</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full bg-white/25" />
          <span className={T.legend}>Std Dev</span>
        </span>
      </div>

      {/* Quality Score Components */}
      {qualityScore && (
        <div className={cn(S.inner, 'p-2.5 mt-2')}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] text-white/30">Quality</span>
            <span
              className={cn(
                'text-[9px] font-semibold px-1.5 py-0.5 rounded-full border',
                qualityScore.compositeScore >= 80
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : qualityScore.compositeScore >= 60
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    : qualityScore.compositeScore >= 40
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400',
              )}
            >
              {fmtQuality(qualityScore.compositeScore)} ({qualityScore.compositeScore}/100)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(qualityScore.components).map(([key, comp]) => (
              <span
                key={key}
                className="text-[8px] text-white/25"
                title={comp.description}
              >
                {key}: <span className={qualityColor(comp.score * 100)}>{(comp.score * 100).toFixed(0)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
