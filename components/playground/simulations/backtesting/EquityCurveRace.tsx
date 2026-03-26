'use client';

import React, { useId, useState, useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Label,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RotateCcw, Trophy, Flag } from 'lucide-react';
import type { IBacktestStrategy } from '@/types/simulation';
import { strategyHex, strategyDashed, fmtReturn } from './backtest-tokens';
import { T, S, TOOLTIP_STYLE } from '@/components/playground/pyramid/tokens';

interface Props {
  strategies: IBacktestStrategy[];
  className?: string;
}

// ─── Tooltip ────────────────────────────────────────────────────

function RaceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] font-semibold text-white/70 mb-1">{label}</p>
      <div className="space-y-0.5">
        {payload
          .filter((p) => p.value != null)
          .sort((a, b) => b.value - a.value)
          .map((p) => (
            <p key={p.dataKey} className="text-[10px] flex items-center gap-1.5">
              <span
                className="w-2 h-0.5 rounded-full inline-block"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-white/50">{p.dataKey}:</span>
              <span className="font-semibold font-mono" style={{ color: p.color }}>
                {p.value.toFixed(2)}
              </span>
            </p>
          ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function EquityCurveRace({ strategies, className }: Props) {
  const gId = useId();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [animKey, setAnimKey] = useState(0);
  const [raceComplete, setRaceComplete] = useState(false);

  // Replay animation
  const handleReplay = useCallback(() => {
    setRaceComplete(false);
    setAnimKey((k) => k + 1);
    setTimeout(() => setRaceComplete(true), 2800);
  }, []);

  // Mark race complete after initial animation
  React.useEffect(() => {
    const timer = setTimeout(() => setRaceComplete(true), 2800);
    return () => clearTimeout(timer);
  }, [animKey]);

  // Merge all equity curves into shared date rows
  const chartData = useMemo(() => {
    if (!strategies.length) return [];

    // Build date → {date, strat1: val, strat2: val, ...} map
    const dateMap = new Map<string, Record<string, number | string>>();

    for (const strat of strategies) {
      for (const pt of strat.backtest.equityCurve) {
        if (!dateMap.has(pt.date)) {
          dateMap.set(pt.date, { date: pt.date });
        }
        const row = dateMap.get(pt.date);
        if (row) {
          row[strat.label] = pt.value;
        }
      }
    }

    // Sort by date
    return Array.from(dateMap.values()).sort(
      (a, b) => String(a.date).localeCompare(String(b.date)),
    );
  }, [strategies]);

  // Determine winner (highest final value)
  const winner = useMemo(() => {
    if (!strategies.length) return null;
    let best: IBacktestStrategy | null = null;
    let bestVal = -Infinity;
    for (const s of strategies) {
      const last = s.backtest.equityCurve[s.backtest.equityCurve.length - 1];
      if (last && last.value > bestVal) {
        bestVal = last.value;
        best = s;
      }
    }
    return best;
  }, [strategies]);

  // Final rankings for endpoint annotations
  const finalRankings = useMemo(() => {
    return strategies
      .map((s) => {
        const last = s.backtest.equityCurve[s.backtest.equityCurve.length - 1];
        return { name: s.name, label: s.label, value: last?.value ?? 0 };
      })
      .sort((a, b) => b.value - a.value);
  }, [strategies]);

  // Last date for finish line
  const lastDate = useMemo(() => {
    if (!chartData.length) return '';
    return String(chartData[chartData.length - 1]?.date ?? '');
  }, [chartData]);

  const handleLegendClick = (entry: { value: string }) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(entry.value)) {
        next.delete(entry.value);
      } else {
        next.add(entry.value);
      }
      return next;
    });
  };

  if (!strategies.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No strategies to display.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className={cn(T.heading, 'text-white/80')}>Equity Curve Race</h4>
          <AnimatePresence>
            {winner && raceComplete && (
              <motion.span
                className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <Trophy className="h-3 w-3" />
                {winner.label} ({fmtReturn(winner.backtest.aggregate.totalReturnNet)})
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReplay}
            className="text-[9px] text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
            title="Replay animation"
          >
            <RotateCcw className="h-3 w-3" />
            Replay
          </button>
          <span className={cn(T.badge, 'text-white/30')}>
            Normalized to 1.0
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] md:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            key={animKey}
            data={chartData}
            margin={{ top: 10, right: 60, left: 0, bottom: 5 }}
          >
            <defs>
              {strategies.map((s) => (
                <React.Fragment key={`defs-${s.name}`}>
                  <filter id={`${gId}-glow-${s.name}`}>
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Gradient fill for winner */}
                  <linearGradient id={`${gId}-fill-${s.name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strategyHex(s.name)} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={strategyHex(s.name)} stopOpacity={0.0} />
                  </linearGradient>
                </React.Fragment>
              ))}
              {/* Finish line gradient */}
              <linearGradient id={`${gId}-finishGrad`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
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
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip content={<RaceTooltip />} />
            <Legend
              onClick={handleLegendClick}
              wrapperStyle={{ fontSize: 10, cursor: 'pointer' }}
              formatter={(value: string) => (
                <button
                  type="button"
                  className={cn(
                    'text-[10px] font-mono bg-transparent border-none p-0 cursor-pointer',
                    hidden.has(value) ? 'text-white/20 line-through' : 'text-white/60',
                  )}
                  aria-pressed={!hidden.has(value)}
                  aria-label={`Toggle ${value} visibility`}
                >
                  {value}
                </button>
              )}
            />

            {/* Finish line */}
            {lastDate && (
              <ReferenceLine
                x={lastDate}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="3 3"
                strokeWidth={1}
              >
                <Label
                  value="FINISH"
                  position="top"
                  fill="rgba(255,255,255,0.25)"
                  fontSize={8}
                  fontFamily="monospace"
                />
              </ReferenceLine>
            )}

            {/* Start line */}
            {chartData.length > 0 && (
              <ReferenceLine
                y={1.0}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="4 4"
                strokeWidth={0.5}
              />
            )}

            {/* Gradient fill under winner */}
            {winner && !hidden.has(winner.label) && (
              <Area
                type="monotone"
                dataKey={winner.label}
                fill={`url(#${gId}-fill-${winner.name})`}
                stroke="none"
                animationDuration={2500}
                animationEasing="ease-out"
                isAnimationActive={true}
              />
            )}

            {/* Strategy lines */}
            {strategies.map((s) => {
              const isWinner = s.name === winner?.name;
              return (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.label}
                  stroke={strategyHex(s.name)}
                  strokeWidth={isWinner ? 2.5 : 1.5}
                  strokeDasharray={strategyDashed(s.name) ? '6 3' : undefined}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: strategyHex(s.name),
                    stroke: 'rgba(0,0,0,0.5)',
                    strokeWidth: 2,
                  }}
                  hide={hidden.has(s.label)}
                  animationDuration={2500}
                  animationEasing="ease-out"
                  filter={isWinner ? `url(#${gId}-glow-${s.name})` : undefined}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Endpoint rankings */}
      <AnimatePresence>
        {raceComplete && finalRankings.length > 0 && (
          <motion.div
            className="flex flex-wrap items-center gap-2 mt-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Flag className="h-3 w-3 text-white/20" />
            {finalRankings.map((r, i) => (
              <span
                key={r.name}
                className={cn(
                  'text-[9px] font-mono px-1.5 py-0.5 rounded',
                  i === 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                    : 'bg-white/[0.03] text-white/40 border border-white/[0.06]',
                )}
              >
                #{i + 1} {r.label} ({r.value.toFixed(2)}x)
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
