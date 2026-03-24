'use client';

import React, { useState, useMemo } from 'react';
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
import type { IBacktestStrategy } from '@/types/simulation';
import { strategyHex } from './backtest-tokens';
import { T, S, TOOLTIP_STYLE } from '@/components/playground/pyramid/tokens';

interface Props {
  strategies: IBacktestStrategy[];
  activeStrategy?: string;
  onStrategyChange?: (name: string) => void;
  className?: string;
}

// ─── Tooltip ────────────────────────────────────────────────────

function DDTooltip({
  active,
  payload,
  label,
  activeStrat,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
  activeStrat: string;
}) {
  if (!active || !payload?.length) return null;
  const activePt = payload.find((p) => p.dataKey === activeStrat);

  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] font-semibold text-white/70 mb-1">{label}</p>
      {activePt && (
        <p className="text-[10px]">
          Drawdown:{' '}
          <span className="font-semibold text-rose-400 font-mono">
            {(activePt.value * 100).toFixed(1)}%
          </span>
        </p>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function DrawdownChart({
  strategies,
  activeStrategy: controlledActive,
  onStrategyChange,
  className,
}: Props) {
  const [localActive, setLocalActive] = useState(strategies[0]?.label ?? '');
  const activeLabel = controlledActive
    ? (strategies.find((s) => s.name === controlledActive)?.label ?? localActive)
    : localActive;

  const handleSelect = (label: string) => {
    setLocalActive(label);
    const strat = strategies.find((s) => s.label === label);
    if (strat && onStrategyChange) {
      onStrategyChange(strat.name);
    }
  };

  // Merge drawdown series
  const chartData = useMemo(() => {
    if (!strategies.length) return [];
    const dateMap = new Map<string, Record<string, number | string>>();

    for (const strat of strategies) {
      for (const pt of strat.backtest.drawdownSeries) {
        if (!dateMap.has(pt.date)) {
          dateMap.set(pt.date, { date: pt.date });
        }
        const row = dateMap.get(pt.date);
        if (row) {
          row[strat.label] = pt.value;
        }
      }
    }

    return Array.from(dateMap.values()).sort(
      (a, b) => String(a.date).localeCompare(String(b.date)),
    );
  }, [strategies]);

  // Find worst drawdown point for active strategy
  const worstDD = useMemo(() => {
    const strat = strategies.find((s) => s.label === activeLabel);
    if (!strat) return null;
    let worst = { date: '', value: 0 };
    for (const pt of strat.backtest.drawdownSeries) {
      if (pt.value < worst.value) {
        worst = pt;
      }
    }
    return worst.value < 0 ? worst : null;
  }, [strategies, activeLabel]);

  // Compute worst drawdown duration (approximate)
  const worstDDDuration = useMemo(() => {
    const strat = strategies.find((s) => s.label === activeLabel);
    if (!strat || !worstDD) return null;
    const series = strat.backtest.drawdownSeries;
    const worstIdx = series.findIndex((p) => p.date === worstDD.date);
    if (worstIdx < 0) return null;
    // Count consecutive negative drawdown points around worst
    let start = worstIdx;
    while (start > 0 && series[start - 1].value < 0) start--;
    let end = worstIdx;
    while (end < series.length - 1 && series[end + 1].value < 0) end++;
    return end - start + 1;
  }, [strategies, activeLabel, worstDD]);

  if (!strategies.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No drawdown data available.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Header + strategy selector */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Underwater Drawdown</h4>
        <div className="flex items-center gap-1">
          {strategies.map((s) => (
            <button
              key={s.name}
              type="button"
              className={cn(
                'px-2 py-0.5 rounded-full text-[9px] font-medium transition-all',
                s.label === activeLabel
                  ? 'border'
                  : 'text-white/30 hover:text-white/50',
              )}
              style={
                s.label === activeLabel
                  ? {
                      backgroundColor: `${strategyHex(s.name)}15`,
                      color: strategyHex(s.name),
                      borderColor: `${strategyHex(s.name)}30`,
                    }
                  : undefined
              }
              onClick={() => handleSelect(s.label)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            {strategies.map((s) => (
              <linearGradient key={`dd-grad-${s.name}`} id={`dd-grad-${s.name}`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FB7185" stopOpacity={0.3} />
                <stop offset="40%" stopColor="#FB923C" stopOpacity={0.15} />
                <stop offset="100%" stopColor={strategyHex(s.name)} stopOpacity={0.02} />
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
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={50}
            domain={['auto', 0]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip content={<DDTooltip activeStrat={activeLabel} />} />

          <ReferenceLine
            y={-0.20}
            stroke="rgba(251,113,133,0.25)"
            strokeDasharray="4 4"
            label={{
              value: '-20%',
              position: 'right',
              fill: 'rgba(251,113,133,0.4)',
              fontSize: 9,
            }}
          />
          <ReferenceLine
            y={-0.10}
            stroke="rgba(251,191,36,0.15)"
            strokeDasharray="4 4"
            label={{
              value: '-10%',
              position: 'right',
              fill: 'rgba(251,191,36,0.3)',
              fontSize: 9,
            }}
          />
          <ReferenceLine
            y={-0.30}
            stroke="rgba(248,113,113,0.3)"
            strokeDasharray="4 4"
            label={{
              value: '-30%',
              position: 'right',
              fill: 'rgba(248,113,113,0.4)',
              fontSize: 9,
            }}
          />

          {strategies.map((s) => {
            const isActive = s.label === activeLabel;
            return (
              <Area
                key={s.name}
                type="monotone"
                dataKey={s.label}
                stroke={strategyHex(s.name)}
                strokeWidth={isActive ? 1.5 : 0.5}
                fill={isActive ? `url(#dd-grad-${s.name})` : 'transparent'}
                fillOpacity={isActive ? 1 : 0}
                strokeOpacity={isActive ? 1 : 0.15}
                dot={false}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>

      {/* Worst drawdown annotation */}
      {worstDD && (
        <div className={cn(S.inner, 'p-2.5 mt-2 flex items-center gap-3')}>
          <div className="shrink-0 w-1 h-8 rounded-full bg-rose-500/30" />
          <div>
            <p className="text-[10px] text-muted-foreground">
              Worst drawdown:{' '}
              <span className="font-semibold text-rose-400 font-mono">
                {(worstDD.value * 100).toFixed(1)}%
              </span>
              <span className="text-white/30"> on {worstDD.date}</span>
            </p>
            {worstDDDuration != null && (
              <p className="text-[9px] text-white/30 mt-0.5">
                Recovery period: <span className="font-mono text-amber-400/70">{worstDDDuration} trading days</span>
                {' '}(~{Math.round(worstDDDuration / 21)} months)
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
