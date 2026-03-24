'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IBacktestStrategy } from '@/types/simulation';
import { strategyHex, fmtReturn, fmtCurrency } from './backtest-tokens';
import { T, S, TOOLTIP_STYLE } from '@/components/playground/pyramid/tokens';

interface Props {
  strategies: IBacktestStrategy[];
  className?: string;
}

// ─── Tooltip ────────────────────────────────────────────────────

function CostTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; fill: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] font-semibold text-white/70 mb-1">{label}</p>
      <div className="space-y-0.5">
        {payload.map((p) => (
          <p key={p.dataKey} className="text-[10px]">
            <span className="text-white/50">{p.dataKey}:</span>{' '}
            <span className="font-semibold font-mono" style={{ color: p.fill }}>
              {fmtReturn(p.value)}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function TransactionCostPanel({ strategies, className }: Props) {
  if (!strategies.length) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-center text-muted-foreground text-xs py-8">
          No transaction cost data.
        </p>
      </div>
    );
  }

  const chartData = strategies.map((s) => ({
    name: s.label,
    strategyName: s.name,
    'Gross Return': s.transactionImpact.grossReturn,
    'Net Return': s.transactionImpact.netReturn,
    costGap: (s.transactionImpact.grossReturn ?? 0) - (s.transactionImpact.netReturn ?? 0),
  }));

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Transaction Cost Impact</h4>
        <span className={cn(T.badge, 'text-white/30')}>Gross vs Net</span>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip content={<CostTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            formatter={(value: string) => (
              <span className="text-[10px] text-white/50">{value}</span>
            )}
          />
          <Bar
            dataKey="Gross Return"
            radius={[0, 4, 4, 0]}
            barSize={14}
            animationDuration={1000}
          >
            {chartData.map((entry) => (
              <Cell
                key={`gross-${entry.name}`}
                fill={strategyHex(entry.strategyName)}
                opacity={0.45}
              />
            ))}
          </Bar>
          <Bar
            dataKey="Net Return"
            radius={[0, 4, 4, 0]}
            barSize={14}
            animationDuration={1200}
          >
            {chartData.map((entry) => (
              <Cell
                key={`net-${entry.name}`}
                fill={strategyHex(entry.strategyName)}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Cost waterfall per strategy */}
      <div className="space-y-2 mt-3">
        {strategies.map((s) => {
          const ti = s.transactionImpact;
          const gross = ti.grossReturn ?? 0;
          const net = ti.netReturn ?? 0;
          const cost = gross - net;
          const color = strategyHex(s.name);

          return (
            <div key={s.name} className={cn(S.inner, 'px-3 py-2.5')}>
              <p className="text-[9px] text-white/40 mb-1.5 font-medium">{s.label}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Gross */}
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${color}15`, color }}>
                  {fmtReturn(gross)}
                </span>
                {/* Arrow + Cost */}
                <span className="text-[9px] text-white/20">&rarr;</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/15">
                  &minus;{(cost * 100).toFixed(2)}%
                </span>
                <span className="text-[9px] text-white/20">&rarr;</span>
                {/* Net */}
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }}>
                  {fmtReturn(net)}
                </span>
                {/* Cost per lakh */}
                <span className="text-[9px] text-white/25 ml-auto">
                  {fmtCurrency(ti.costPerLakh)}/lakh
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
