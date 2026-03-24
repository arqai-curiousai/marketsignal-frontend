'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IScenarioResult } from '@/types/simulation';
import { fmtPct, deltaColor } from './scenario-tokens';

interface Props {
  data: IScenarioResult;
}

interface KPI {
  label: string;
  baseline: string;
  stressed: string;
  delta: number;
}

export function ScenarioKPIRow({ data }: Props) {
  const kpis: KPI[] = [
    {
      label: 'Return',
      baseline: fmtPct(data.baselineMetrics.annualReturn),
      stressed: fmtPct(data.stressedMetrics.annualReturn),
      delta: data.deltaMetrics.annualReturn,
    },
    {
      label: 'Volatility',
      baseline: `${(data.baselineMetrics.annualVol * 100).toFixed(1)}%`,
      stressed: `${(data.stressedMetrics.annualVol * 100).toFixed(1)}%`,
      delta: data.deltaMetrics.annualVol,
    },
    {
      label: 'VaR 95%',
      baseline: `${(data.baselineMetrics.var95 * 100).toFixed(2)}%`,
      stressed: `${(data.stressedMetrics.var95 * 100).toFixed(2)}%`,
      delta: data.deltaMetrics.var95,
    },
    {
      label: 'CVaR 95%',
      baseline: `${(data.baselineMetrics.cvar95 * 100).toFixed(2)}%`,
      stressed: `${(data.stressedMetrics.cvar95 * 100).toFixed(2)}%`,
      delta: data.deltaMetrics.cvar95,
    },
    {
      label: 'Sharpe',
      baseline: data.baselineMetrics.sharpe.toFixed(2),
      stressed: data.stressedMetrics.sharpe.toFixed(2),
      delta: data.deltaMetrics.sharpe,
    },
    {
      label: 'Max DD',
      baseline: `${(data.baselineMetrics.maxDrawdown * 100).toFixed(1)}%`,
      stressed: `${(data.stressedMetrics.maxDrawdown * 100).toFixed(1)}%`,
      delta: data.deltaMetrics.maxDrawdown,
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className={cn(S.card, 'px-3 py-2')}
        >
          <div className={cn(T.label, 'text-white/35 mb-1')}>{kpi.label}</div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn(T.mono, 'text-white/40 line-through text-[9px]')}>
              {kpi.baseline}
            </span>
            <span className={cn(T.mono, 'text-white/80')}>
              {kpi.stressed}
            </span>
          </div>
          <div className={cn(T.monoSm, deltaColor(kpi.delta))}>
            {kpi.delta >= 0 ? '+' : ''}{(kpi.delta * 100).toFixed(1)}pp
          </div>
        </motion.div>
      ))}
    </div>
  );
}
