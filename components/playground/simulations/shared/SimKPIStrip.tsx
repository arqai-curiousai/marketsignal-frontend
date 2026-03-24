'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { T } from '@/components/playground/pyramid/tokens';

export interface SimKPI {
  label: string;
  value: string;
  colorHex?: string;
}

interface Props {
  kpis: SimKPI[];
  className?: string;
}

function KPIBadge({
  label,
  value,
  colorHex,
  index,
}: {
  label: string;
  value: string;
  colorHex?: string;
  index: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 150, damping: 20 }}
    >
      <span className={cn(T.badge, 'text-white/35 uppercase tracking-wider')}>{label}</span>
      <span
        className="text-sm font-semibold tabular-nums font-mono text-white/80"
        style={colorHex ? { color: colorHex } : undefined}
      >
        {value}
      </span>
    </motion.div>
  );
}

export function SimKPIStrip({ kpis, className }: Props) {
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
