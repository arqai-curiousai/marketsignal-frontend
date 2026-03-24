'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IMonteCarloAnalysis } from '@/types/simulation';
import { fmtPrice, fmtPct, fmtProb, HORIZON_LABELS } from './mc-tokens';
import { T } from '@/components/playground/pyramid/tokens';

interface Props {
  data: IMonteCarloAnalysis;
  className?: string;
}

interface KPIBadgeProps {
  label: string;
  value: string;
  color?: 'default' | 'green' | 'amber' | 'red';
  index: number;
}

function KPIBadge({ label, value, color = 'default', index }: KPIBadgeProps) {
  const colorClass =
    color === 'green'
      ? 'text-emerald-400'
      : color === 'amber'
        ? 'text-amber-400'
        : color === 'red'
          ? 'text-red-400'
          : 'text-white/80';

  return (
    <motion.div
      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 150, damping: 20 }}
    >
      <span className={cn(T.badge, 'text-white/35 uppercase tracking-wider')}>{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums font-mono', colorClass)}>
        {value}
      </span>
    </motion.div>
  );
}

export function MonteCarloKPIRow({ data, className }: Props) {
  const rm = data.regimeAware.riskMetrics;
  const probProfit = rm.probProfit;
  const probColor = probProfit >= 0.6 ? 'green' : probProfit >= 0.4 ? 'amber' : 'red';
  const horizonLabel = HORIZON_LABELS[data.horizon] ?? `${data.horizon}d`;

  const kpis: KPIBadgeProps[] = [
    {
      label: 'Prob of Profit',
      value: fmtProb(probProfit),
      color: probColor,
      index: 0,
    },
    {
      label: 'Expected Return',
      value: fmtPct(rm.expectedReturn),
      color: rm.expectedReturn >= 0 ? 'green' : 'red',
      index: 1,
    },
    {
      label: 'Median Price',
      value: fmtPrice(data.regimeAware.finalDistribution.stats.median),
      index: 2,
    },
    {
      label: 'VaR 5%',
      value: fmtPct(rm.var5),
      color: 'amber',
      index: 3,
    },
    {
      label: 'Horizon',
      value: horizonLabel,
      index: 4,
    },
    {
      label: 'Simulations',
      value: data.nPaths.toLocaleString('en-IN'),
      index: 5,
    },
  ];

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-6 gap-2', className)}>
      {kpis.map((kpi) => (
        <KPIBadge
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          color={kpi.color}
          index={kpi.index}
        />
      ))}
    </div>
  );
}
