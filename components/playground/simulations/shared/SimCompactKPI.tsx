'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { DENSITY } from './sim-tokens';

export interface CompactKPI {
  label: string;
  value: string;
  colorHex?: string;
  onClick?: () => void;
}

interface Props {
  kpis: CompactKPI[];
  className?: string;
}

export function SimCompactKPI({ kpis, className }: Props) {
  return (
    <div className={cn('flex items-center gap-1.5 overflow-x-auto', className)}>
      {kpis.map((kpi) => (
        <button
          key={kpi.label}
          type="button"
          onClick={kpi.onClick}
          disabled={!kpi.onClick}
          className={cn(
            DENSITY.kpiBadgeH,
            'inline-flex items-center gap-1.5 px-2 rounded-md',
            'bg-white/[0.03] border border-white/[0.04]',
            'text-[10px] whitespace-nowrap transition-colors',
            kpi.onClick && 'hover:bg-white/[0.06] cursor-pointer',
            !kpi.onClick && 'cursor-default',
          )}
        >
          <span className="text-white/35 uppercase tracking-wider font-medium">{kpi.label}</span>
          <span
            className="font-semibold tabular-nums font-mono text-white/80"
            style={kpi.colorHex ? { color: kpi.colorHex } : undefined}
          >
            {kpi.value}
          </span>
        </button>
      ))}
    </div>
  );
}
