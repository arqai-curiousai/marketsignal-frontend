'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IRegimeAnalysis } from '@/types/simulation';
import { getRegimeColor, fmtProb, fmtDays } from './regime-tokens';
import { T } from '@/components/playground/pyramid/tokens';

interface Props {
  data: IRegimeAnalysis;
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

export function RegimeKPIRow({ data, className }: Props) {
  const currentColor = getRegimeColor(data.currentState.label);

  // Find highest self-transition probability (persistence)
  let maxPersistence = 0;
  for (const row of data.transitionMatrix) {
    for (const cell of row) {
      if (cell.fromLabel === cell.toLabel && cell.probability > maxPersistence) {
        maxPersistence = cell.probability;
      }
    }
  }

  const kpis = [
    {
      label: 'Current Regime',
      value: currentColor.label,
      color: 'regime' as const,
      regimeHex: currentColor.hex,
    },
    {
      label: 'Confidence',
      value: fmtProb(data.currentState.probability),
    },
    {
      label: 'Duration',
      value: fmtDays(data.currentState.durationDays),
    },
    {
      label: 'States',
      value: `${data.nStates}`,
    },
    {
      label: 'Persistence',
      value: fmtProb(maxPersistence),
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
