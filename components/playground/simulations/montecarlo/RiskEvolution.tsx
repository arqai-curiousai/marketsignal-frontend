'use client';

import React, { useId, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IRiskEvolutionPoint } from '@/types/simulation';
import { RISK_EVO_COLORS, fmtPct, fmtProb } from './mc-tokens';
import { T, S, TOOLTIP_STYLE, AXIS_STYLE } from '@/components/playground/pyramid/tokens';

interface Props {
  evolution: IRiskEvolutionPoint[];
  className?: string;
}

function EvoTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: IRiskEvolutionPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] font-semibold text-white/70 mb-1">Day {d.day}</p>
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between gap-4">
          <span style={{ color: RISK_EVO_COLORS.var }}>VaR 5%</span>
          <span className="font-mono text-white/60">{fmtPct(d.var5)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: RISK_EVO_COLORS.cvar }}>CVaR 5%</span>
          <span className="font-mono text-white/60">{fmtPct(d.cvar5)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: RISK_EVO_COLORS.probProfit }}>Prob Profit</span>
          <span className="font-mono text-white/60">{fmtProb(d.probProfit)}</span>
        </div>
      </div>
    </div>
  );
}

export function RiskEvolution({ evolution, className }: Props) {
  const gId = useId();

  const annotation = useMemo(() => {
    if (!evolution.length) return null;
    const maxVarPoint = evolution.reduce((worst, p) =>
      p.var5 < worst.var5 ? p : worst,
    );
    return `Risk peaks around day ${maxVarPoint.day} with VaR at ${fmtPct(maxVarPoint.var5)}.`;
  }, [evolution]);

  if (!evolution.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No risk evolution data available.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
        <h4 className={cn(T.heading, 'text-white/80')}>Risk Through Time</h4>
      </div>

      <div className="h-[200px] md:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={evolution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`${gId}-riskEvoBand`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB7185" stopOpacity={0.08} />
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
              yAxisId="risk"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              orientation="left"
            />
            <YAxis
              yAxisId="prob"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={35}
              domain={[0, 1]}
              tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              orientation="right"
            />
            <Tooltip content={<EvoTooltip />} />

            {/* VaR-CVaR shaded area */}
            <Area
              yAxisId="risk"
              type="monotone"
              dataKey="cvar5"
              stroke="none"
              fill={`url(#${gId}-riskEvoBand)`}
              fillOpacity={1}
              animationDuration={800}
            />

            <Line
              yAxisId="risk"
              type="monotone"
              dataKey="var5"
              stroke={RISK_EVO_COLORS.var}
              strokeWidth={2}
              dot={false}
              animationDuration={900}
            />
            <Line
              yAxisId="risk"
              type="monotone"
              dataKey="cvar5"
              stroke={RISK_EVO_COLORS.cvar}
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
              animationDuration={1000}
            />
            <Line
              yAxisId="prob"
              type="monotone"
              dataKey="probProfit"
              stroke={RISK_EVO_COLORS.probProfit}
              strokeWidth={2}
              dot={false}
              animationDuration={1100}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: RISK_EVO_COLORS.var }} />
          <span className={T.legend}>VaR 5%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: RISK_EVO_COLORS.cvar, opacity: 0.7 }} />
          <span className={T.legend}>CVaR 5%</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: RISK_EVO_COLORS.probProfit }} />
          <span className={T.legend}>Prob Profit</span>
        </span>
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
