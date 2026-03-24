'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IBacktestAnalysis } from '@/types/simulation';
import { T } from '@/components/playground/pyramid/tokens';
import {
  fmtReturn,
  fmtSharpe,
  getTrafficConfig,
} from './backtest-tokens';

interface Props {
  data: IBacktestAnalysis;
  className?: string;
}

interface KPIBadgeProps {
  label: string;
  value: string;
  colorHex?: string;
  index: number;
}

function KPIBadge({ label, value, colorHex, index }: KPIBadgeProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 150, damping: 20 }}
    >
      <span className={cn(T.badge, 'text-white/35 uppercase tracking-wider')}>{label}</span>
      <span
        className="text-sm font-semibold tabular-nums font-mono"
        style={colorHex ? { color: colorHex } : { color: 'rgba(255,255,255,0.8)' }}
      >
        {value}
      </span>
    </motion.div>
  );
}

export function BacktestKPIRow({ data, className }: Props) {
  const best = data.strategies.find((s) => s.name === data.bestStrategy);
  const bestReturn = best?.backtest.aggregate.totalReturnNet ?? null;
  const bestDeflatedSharpe = best?.deflatedSharpe.deflatedSharpe ?? null;

  // Find strategy with lowest overfit risk (green > yellow > red)
  const overfitRank: Record<string, number> = { green: 0, yellow: 1, red: 2 };
  const lowestOverfit = [...data.strategies].sort(
    (a, b) => (overfitRank[a.overfitting.trafficLight] ?? 2) - (overfitRank[b.overfitting.trafficLight] ?? 2),
  )[0];
  const lowestOverfitConfig = lowestOverfit ? getTrafficConfig(lowestOverfit.overfitting.trafficLight) : null;

  const kpis = [
    {
      label: 'Best Strategy',
      value: best?.label ?? '\u2014',
    },
    {
      label: 'Best Return (Net)',
      value: fmtReturn(bestReturn),
      colorHex: bestReturn != null && bestReturn >= 0 ? '#4ADE80' : '#FB7185',
    },
    {
      label: 'Best Sharpe (Defl.)',
      value: fmtSharpe(bestDeflatedSharpe),
      colorHex: bestDeflatedSharpe != null && bestDeflatedSharpe > 1 ? '#4ADE80' : undefined,
    },
    {
      label: 'Lowest Overfit Risk',
      value: lowestOverfitConfig?.label ?? '\u2014',
      colorHex: lowestOverfitConfig?.hex,
    },
    {
      label: 'Period',
      value: `${data.period.start} \u2013 ${data.period.end}`,
    },
    {
      label: 'Strategies Tested',
      value: String(data.strategies.length),
    },
  ];

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-6 gap-2', className)}>
      {kpis.map((kpi, i) => (
        <KPIBadge
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          colorHex={kpi.colorHex}
          index={i}
        />
      ))}
    </div>
  );
}
