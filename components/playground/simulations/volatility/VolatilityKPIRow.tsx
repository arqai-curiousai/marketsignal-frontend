'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IVolatilityAnalysis } from '@/types/simulation';
import { getRegimeConfig, fmtVol, fmtPctl } from './vol-tokens';
import { T } from '@/components/playground/pyramid/tokens';

interface Props {
  data: IVolatilityAnalysis;
  className?: string;
}

interface KPIBadgeProps {
  label: string;
  value: string;
  color?: 'default' | 'regime';
  regimeHex?: string;
  index: number;
}

function KPIBadge({ label, value, color = 'default', regimeHex, index }: KPIBadgeProps) {
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
          color === 'regime' ? '' : 'text-white/80',
        )}
        style={color === 'regime' && regimeHex ? { color: regimeHex } : undefined}
      >
        {value}
      </span>
    </motion.div>
  );
}

export function VolatilityKPIRow({ data, className }: Props) {
  const regimeConfig = getRegimeConfig(data.regime.regime);

  // Yang-Zhang current vol
  const yz = data.estimators.find((e) => e.name === 'yang_zhang');
  const currentVol = yz?.currentValue ?? data.regime.currentVol;

  // Vol change: compare current vs rolling series start
  const rolling21 = data.rollingSeries['21'];
  let volChange: number | null = null;
  if (rolling21 && rolling21.values.length >= 6) {
    const prev = rolling21.values[rolling21.values.length - 6];
    const curr = rolling21.values[rolling21.values.length - 1];
    if (prev > 0) {
      volChange = (curr - prev) / prev;
    }
  }

  const kpis = [
    {
      label: 'Yang-Zhang Vol',
      value: fmtVol(currentVol),
    },
    {
      label: 'Regime',
      value: regimeConfig.label,
      color: 'regime' as const,
      regimeHex: regimeConfig.hex,
    },
    {
      label: 'Percentile',
      value: fmtPctl(data.regime.percentile),
    },
    {
      label: 'GARCH 5d',
      value: data.garch
        ? fmtVol(data.garch.forecastSeries.length >= 5 ? data.garch.forecastSeries[4].meanVol : data.garch.currentVol)
        : 'N/A',
    },
    {
      label: 'Vol Change (5d)',
      value: volChange != null ? `${volChange >= 0 ? '+' : ''}${(volChange * 100).toFixed(1)}%` : 'N/A',
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
          color={kpi.color}
          regimeHex={kpi.regimeHex}
          index={i}
        />
      ))}
    </div>
  );
}
