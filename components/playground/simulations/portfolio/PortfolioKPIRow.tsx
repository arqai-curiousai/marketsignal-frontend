'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IPortfolioOptimization } from '@/types/simulation';
import { T } from '@/components/playground/pyramid/tokens';
import { fmtReturn, fmtWeight, fmtSharpe, getStrategyColor } from './portfolio-tokens';

interface Props {
  data: IPortfolioOptimization;
  className?: string;
}

interface KPIBadgeProps {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: string;
  index: number;
}

function KPIBadge({ label, value, highlight = false, highlightColor, index }: KPIBadgeProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 150, damping: 20 }}
    >
      <span className={cn(T.badge, 'text-white/35 uppercase tracking-wider')}>{label}</span>
      <span
        className={cn(
          'text-sm font-semibold tabular-nums font-mono',
          highlight ? '' : 'text-white/80',
        )}
        style={highlight && highlightColor ? { color: highlightColor } : undefined}
      >
        {value}
      </span>
    </motion.div>
  );
}

export function PortfolioKPIRow({ data, className }: Props) {
  const best = data.strategies.find((s) => s.mode === data.bestStrategy);
  if (!best) return null;

  const bestColor = getStrategyColor(data.bestStrategy);

  // Diversification ratio: sum of individual vols / portfolio vol
  // Approximate from risk contributions
  const diversificationRatio = best.riskContribution.length > 0
    ? best.riskContribution.reduce((sum, r) => sum + r.weight, 0) /
      Math.max(best.metrics.annualVolatility, 0.001)
    : null;

  const kpis = [
    {
      label: 'Expected Return',
      value: fmtReturn(best.metrics.annualReturn),
      highlight: true,
      highlightColor: best.metrics.annualReturn >= 0 ? '#4ADE80' : '#FB7185',
    },
    {
      label: 'Volatility',
      value: fmtWeight(best.metrics.annualVolatility),
    },
    {
      label: 'Sharpe Ratio',
      value: fmtSharpe(best.metrics.sharpe),
      highlight: true,
      highlightColor: bestColor,
    },
    {
      label: 'Max Drawdown',
      value: fmtReturn(best.metrics.maxDrawdown),
      highlight: true,
      highlightColor: '#FB7185',
    },
    {
      label: 'Div. Ratio',
      value: diversificationRatio != null ? diversificationRatio.toFixed(2) : 'N/A',
    },
    {
      label: 'Data Points',
      value: data.dataPoints.toLocaleString('en-IN'),
    },
  ];

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-6 gap-2', className)}>
      {kpis.map((kpi, i) => (
        <KPIBadge
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          highlight={kpi.highlight}
          highlightColor={kpi.highlightColor}
          index={i}
        />
      ))}
    </div>
  );
}
