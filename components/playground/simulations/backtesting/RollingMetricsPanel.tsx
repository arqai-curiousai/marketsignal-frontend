'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
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
import type { IBacktestStrategy } from '@/types/simulation';
import { strategyHex, fmtSharpe } from './backtest-tokens';
import { T, S, TOOLTIP_STYLE } from '@/components/playground/pyramid/tokens';

interface Props {
  strategies: IBacktestStrategy[];
  activeStrategy: string;
  className?: string;
}

// ─── Tooltips ───────────────────────────────────────────────────

function SharpeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] text-white/60">{label}</p>
      <p className="text-[10px]">
        Rolling Sharpe:{' '}
        <span className="font-semibold text-indigo-400 font-mono">
          {fmtSharpe(payload[0].value)}
        </span>
      </p>
    </div>
  );
}

function DDTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] text-white/60">{label}</p>
      <p className="text-[10px]">
        Drawdown:{' '}
        <span className="font-semibold text-rose-400 font-mono">
          {(payload[0].value * 100).toFixed(1)}%
        </span>
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function RollingMetricsPanel({ strategies, activeStrategy, className }: Props) {
  const strat = strategies.find((s) => s.name === activeStrategy) ?? strategies[0];

  const rollingSharpe = useMemo(() => {
    if (!strat?.backtest.rollingSharpe?.length) return [];
    return strat.backtest.rollingSharpe.map((pt) => ({
      date: pt.date,
      sharpe: pt.value,
    }));
  }, [strat]);

  const drawdownData = useMemo(() => {
    if (!strat?.backtest.drawdownSeries?.length) return [];
    return strat.backtest.drawdownSeries.map((pt) => ({
      date: pt.date,
      dd: pt.value,
    }));
  }, [strat]);

  // Compute Sharpe range
  const sharpeRange = useMemo(() => {
    if (!rollingSharpe.length) return { min: 0, max: 0 };
    const vals = rollingSharpe.map((p) => p.sharpe);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [rollingSharpe]);

  const color = strategyHex(strat?.name ?? '');

  if (!strat) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No strategy data available.
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Rolling Metrics</h4>
        <span
          className="text-[9px] font-semibold px-2 py-0.5 rounded-full border"
          style={{
            backgroundColor: `${color}15`,
            color: color,
            borderColor: `${color}30`,
          }}
        >
          {strat.label}
        </span>
      </div>

      {/* Rolling Sharpe chart */}
      {rollingSharpe.length > 0 && (
        <div className="mb-4">
          <p className={cn(T.label, 'text-white/40 mb-1.5')}>Rolling 1Y Sharpe</p>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={rollingSharpe} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                width={35}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip content={<SharpeTooltip />} />
              <ReferenceLine
                y={0}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="3 3"
                label={{
                  value: '0',
                  position: 'right',
                  fill: 'rgba(255,255,255,0.2)',
                  fontSize: 9,
                }}
              />
              <Line
                type="monotone"
                dataKey="sharpe"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: color, stroke: 'rgba(0,0,0,0.5)', strokeWidth: 2 }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rolling Drawdown chart */}
      {drawdownData.length > 0 && (
        <div>
          <p className={cn(T.label, 'text-white/40 mb-1.5')}>Rolling Drawdown</p>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={drawdownData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`rolling-dd-${strat.name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={60}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                width={35}
                domain={['auto', 0]}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip content={<DDTooltip />} />
              <ReferenceLine
                y={-0.20}
                stroke="rgba(251,113,133,0.2)"
                strokeDasharray="3 3"
              />
              <Area
                type="monotone"
                dataKey="dd"
                stroke={color}
                strokeWidth={1}
                fill={`url(#rolling-dd-${strat.name})`}
                dot={false}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Annotation */}
      {rollingSharpe.length > 0 && (
        <div className={cn(S.inner, 'p-2.5 mt-2')}>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {strat.label}&apos;s Sharpe varied between{' '}
            <span className="font-mono text-white/60">{sharpeRange.min.toFixed(2)}</span>
            {' '}and{' '}
            <span className="font-mono text-white/60">{sharpeRange.max.toFixed(2)}</span>
            {' '}over the backtest period.
          </p>
        </div>
      )}
    </motion.div>
  );
}
