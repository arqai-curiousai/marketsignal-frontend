'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { IStrategyPerformance, IStrategySignal } from '@/types/strategy';
import {
  S,
  T,
  SIGNAL,
  LAYER,
  TOOLTIP_STYLE,
  AXIS_STYLE,
  fmtPct,
  fmtNum,
  gradientId,
} from './tokens';
import { LAYERS } from './constants';

interface AccuracyDashboardProps {
  performance: IStrategyPerformance[];
  signals: IStrategySignal[];
  className?: string;
}

type PeriodFilter = '1d' | '7d' | '30d';

// ─── KPI Card ──────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  valueColor,
  periodToggle,
  period,
  onPeriodChange,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor?: string;
  periodToggle?: boolean;
  period?: PeriodFilter;
  onPeriodChange?: (p: PeriodFilter) => void;
}) {
  const periods: PeriodFilter[] = ['1d', '7d', '30d'];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(S.glass, 'p-3 space-y-1.5')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={T.label}>{label}</span>
        </div>
        {periodToggle && onPeriodChange && (
          <div className="flex gap-0.5">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[8px] font-medium transition-colors',
                  period === p
                    ? 'bg-white/10 text-white'
                    : 'text-white/30 hover:text-white/50'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className={cn(T.kpi, valueColor ?? 'text-white')}>{value}</p>
    </motion.div>
  );
}

// ─── Confusion Matrix ──────────────────────────────────────────────────

function ConfusionMatrix({ signals }: { signals: IStrategySignal[] }) {
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, number>> = {
      buy: { up: 0, down: 0, flat: 0 },
      sell: { up: 0, down: 0, flat: 0 },
      hold: { up: 0, down: 0, flat: 0 },
    };
    for (const sig of signals) {
      if (sig.pnlPercent == null || sig.priceAtSignal == null) continue;
      const predicted = sig.signal;
      const pnl = sig.pnlPercent;
      const actual = pnl > 0.5 ? 'up' : pnl < -0.5 ? 'down' : 'flat';
      if (m[predicted]) {
        m[predicted][actual] += 1;
      }
    }
    return m;
  }, [signals]);

  const maxVal = useMemo(() => {
    let max = 1;
    for (const row of Object.values(matrix)) {
      for (const v of Object.values(row)) {
        if (v > max) max = v;
      }
    }
    return max;
  }, [matrix]);

  const rows = ['buy', 'sell', 'hold'] as const;
  const cols = ['up', 'down', 'flat'] as const;
  const colLabels = ['Up', 'Down', 'Flat'];
  const rowColors = {
    buy: SIGNAL.buy.hex,
    sell: SIGNAL.sell.hex,
    hold: SIGNAL.hold.hex,
  };

  return (
    <div className="space-y-2">
      <h4 className={T.heading}>Confusion Matrix</h4>
      <div className="grid grid-cols-4 gap-px">
        {/* Header row */}
        <div />
        {colLabels.map((c) => (
          <div key={c} className={cn(T.label, 'text-center py-1')}>
            {c}
          </div>
        ))}
        {/* Data rows */}
        {rows.map((row) => (
          <React.Fragment key={row}>
            <div
              className={cn(T.label, 'flex items-center justify-end pr-2 py-1')}
              style={{ color: rowColors[row] }}
            >
              {row.toUpperCase()}
            </div>
            {cols.map((col) => {
              const count = matrix[row][col];
              const opacity = maxVal > 0 ? 0.1 + (count / maxVal) * 0.6 : 0.1;
              return (
                <div
                  key={col}
                  className={cn(
                    'flex items-center justify-center rounded-md py-2',
                    T.mono
                  )}
                  style={{
                    backgroundColor: `rgba(255, 255, 255, ${opacity})`,
                  }}
                >
                  {count}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="flex gap-4">
        <span className={T.caption}>Rows: Predicted</span>
        <span className={T.caption}>Columns: Actual move</span>
      </div>
    </div>
  );
}

// ─── Layer Contribution ────────────────────────────────────────────────

function LayerContribution({
  layerAccuracy,
}: {
  layerAccuracy: Record<string, number>;
}) {
  const data = useMemo(() => {
    return LAYERS.map((layer) => ({
      name: layer.shortName,
      id: layer.id,
      accuracy: (layerAccuracy[layer.id] ?? 0) * 100,
    }));
  }, [layerAccuracy]);

  const layerHex: Record<string, string> = {
    technical: LAYER.technical.hex,
    fundamental: LAYER.fundamental.hex,
    sentiment: LAYER.sentiment.hex,
    ensemble: LAYER.ensemble.hex,
    risk: LAYER.risk.hex,
  };

  return (
    <div className="space-y-2">
      <h4 className={T.heading}>Layer Contribution</h4>
      <div className="h-[200px] md:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
            />
            <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} barSize={18}>
              {data.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={layerHex[entry.id] ?? LAYER.ensemble.hex}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

export function AccuracyDashboard({
  performance,
  signals,
  className,
}: AccuracyDashboardProps) {
  const [period, setPeriod] = useState<PeriodFilter>('7d');

  const perf = useMemo(() => {
    if (performance.length === 0) return null;
    const match = performance.find((p) => p.period === period);
    return match ?? performance[0];
  }, [performance, period]);

  // Build cumulative PnL curve from signals
  const pnlCurve = useMemo(() => {
    const evaluated = signals
      .filter((s) => s.pnlPercent != null)
      .sort(
        (a, b) =>
          new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime()
      );
    let cumulative = 0;
    return evaluated.map((s) => {
      cumulative += s.pnlPercent ?? 0;
      const d = new Date(s.generatedAt);
      return {
        time: `${d.getDate()}/${d.getMonth() + 1}`,
        pnl: parseFloat(cumulative.toFixed(2)),
      };
    });
  }, [signals]);

  const pnlGradId = useMemo(() => gradientId('accuracy', 'pnl'), []);

  if (!perf) {
    return (
      <div className={cn(S.glass, 'p-6 text-center', className)}>
        <p className={T.caption}>No performance data available</p>
      </div>
    );
  }

  const totalPnlColor =
    perf.totalPnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className={cn('space-y-4', className)}>
      {/* A. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <KpiCard
          icon={Target}
          label="Accuracy"
          value={fmtPct(perf.accuracy)}
          periodToggle
          period={period}
          onPeriodChange={setPeriod}
        />
        <KpiCard
          icon={TrendingUp}
          label="Win Rate"
          value={fmtPct(perf.winRate)}
          valueColor={
            perf.winRate >= 0.5 ? 'text-emerald-400' : 'text-red-400'
          }
        />
        <KpiCard
          icon={perf.totalPnlPercent >= 0 ? TrendingUp : TrendingDown}
          label="Total PnL"
          value={`${perf.totalPnlPercent >= 0 ? '+' : ''}${perf.totalPnlPercent.toFixed(2)}%`}
          valueColor={totalPnlColor}
        />
        <KpiCard
          icon={BarChart3}
          label="Profit Factor"
          value={fmtNum(perf.profitFactor)}
        />
        <KpiCard
          icon={Activity}
          label="Sharpe"
          value={fmtNum(perf.sharpeEstimate)}
          valueColor={
            perf.sharpeEstimate >= 1
              ? 'text-emerald-400'
              : perf.sharpeEstimate >= 0
                ? 'text-amber-400'
                : 'text-red-400'
          }
        />
        <KpiCard
          icon={AlertTriangle}
          label="Calibration Err"
          value={fmtPct(perf.calibrationError)}
          valueColor={
            perf.calibrationError <= 0.05
              ? 'text-emerald-400'
              : perf.calibrationError <= 0.1
                ? 'text-amber-400'
                : 'text-red-400'
          }
        />
      </div>

      {/* B. PnL Curve */}
      {pnlCurve.length > 1 && (
        <div className={cn(S.glass, 'p-4 space-y-2')}>
          <h4 className={T.heading}>Cumulative PnL</h4>
          <div className="h-[200px] md:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlCurve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={pnlGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={SIGNAL.buy.hex}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="50%"
                      stopColor={SIGNAL.buy.hex}
                      stopOpacity={0.05}
                    />
                    <stop
                      offset="50%"
                      stopColor={SIGNAL.sell.hex}
                      stopOpacity={0.05}
                    />
                    <stop
                      offset="100%"
                      stopColor={SIGNAL.sell.hex}
                      stopOpacity={0.3}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                />
                <XAxis
                  dataKey="time"
                  tick={AXIS_STYLE}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={AXIS_STYLE}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number) => [
                    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`,
                    'Cumulative PnL',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={SIGNAL.buy.hex}
                  fill={`url(#${pnlGradId})`}
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* C & D: Confusion Matrix + Layer Contribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={cn(S.glass, 'p-4')}>
          <ConfusionMatrix signals={signals} />
        </div>
        <div className={cn(S.glass, 'p-4')}>
          <LayerContribution layerAccuracy={perf.layerAccuracy} />
        </div>
      </div>
    </div>
  );
}
