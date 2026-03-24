'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IScenarioResult } from '@/types/simulation';

interface Props {
  data: IScenarioResult;
  className?: string;
}

interface MetricRow {
  name: string;
  baseline: number;
  stressed: number;
  /** For VaR/Vol/MaxDD, higher stressed is worse */
  worseMeansHigher: boolean;
}

function fmtVal(v: number): string {
  return `${v >= 0 ? '' : ''}${v.toFixed(1)}%`;
}

function deltaColor(baseline: number, stressed: number, worseMeansHigher: boolean): string {
  const diff = stressed - baseline;
  if (worseMeansHigher) {
    return diff > 0 ? 'text-red-400' : 'text-emerald-400';
  }
  return diff < 0 ? 'text-red-400' : 'text-emerald-400';
}

export function ScenarioComparisonChart({ data, className }: Props) {
  const metrics: MetricRow[] = [
    {
      name: 'Annual Return',
      baseline: data.baselineMetrics.annualReturn * 100,
      stressed: data.stressedMetrics.annualReturn * 100,
      worseMeansHigher: false,
    },
    {
      name: 'Volatility',
      baseline: data.baselineMetrics.annualVol * 100,
      stressed: data.stressedMetrics.annualVol * 100,
      worseMeansHigher: true,
    },
    {
      name: 'VaR 95%',
      baseline: data.baselineMetrics.var95 * 100,
      stressed: data.stressedMetrics.var95 * 100,
      worseMeansHigher: true,
    },
    {
      name: 'CVaR 95%',
      baseline: data.baselineMetrics.cvar95 * 100,
      stressed: data.stressedMetrics.cvar95 * 100,
      worseMeansHigher: true,
    },
    {
      name: 'Max Drawdown',
      baseline: data.baselineMetrics.maxDrawdown * 100,
      stressed: data.stressedMetrics.maxDrawdown * 100,
      worseMeansHigher: true,
    },
  ];

  // Find max absolute value for scaling
  const maxAbs = Math.max(
    ...metrics.flatMap((m) => [Math.abs(m.baseline), Math.abs(m.stressed)]),
    1,
  );

  const barScale = (v: number) => Math.min(100, (Math.abs(v) / maxAbs) * 100);

  return (
    <div className={cn(S.card, 'p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn(T.heading, 'text-white/70')}>Baseline vs Stressed</h3>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-blue-400/60" />
            <span className={cn(T.badge, 'text-white/30')}>Baseline</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-orange-400/70" />
            <span className={cn(T.badge, 'text-white/30')}>Stressed</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {metrics.map((m, i) => {
          const delta = m.stressed - m.baseline;
          const sign = delta >= 0 ? '+' : '';

          return (
            <motion.div
              key={m.name}
              className="group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 + 0.1 }}
            >
              {/* Metric label + delta */}
              <div className="flex items-center justify-between mb-1">
                <span className={cn(T.label, 'text-white/50')}>{m.name}</span>
                <span className={cn(T.monoSm, deltaColor(m.baseline, m.stressed, m.worseMeansHigher))}>
                  {sign}{delta.toFixed(1)}pp
                </span>
              </div>

              {/* Butterfly bar */}
              <div className="flex items-center gap-0">
                {/* Left: Baseline (grows right-to-left) */}
                <div className="flex-1 flex justify-end">
                  <div className="flex items-center gap-1.5 w-full justify-end">
                    <span className={cn(T.monoSm, 'text-blue-400/70 shrink-0')}>
                      {fmtVal(m.baseline)}
                    </span>
                    <div className="flex-1 flex justify-end">
                      <motion.div
                        className="h-5 rounded-l-md bg-blue-500/30 border-r-0"
                        style={{
                          background: 'linear-gradient(to left, rgba(96,165,250,0.35), rgba(96,165,250,0.1))',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barScale(m.baseline)}%` }}
                        transition={{ delay: i * 0.06 + 0.15, duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Center divider */}
                <div className="w-px h-5 bg-white/10 shrink-0" />

                {/* Right: Stressed (grows left-to-right) */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 w-full">
                    <div className="flex-1">
                      <motion.div
                        className="h-5 rounded-r-md"
                        style={{
                          background: 'linear-gradient(to right, rgba(251,146,60,0.4), rgba(239,68,68,0.25))',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barScale(m.stressed)}%` }}
                        transition={{ delay: i * 0.06 + 0.25, duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <span className={cn(T.monoSm, 'text-orange-400/70 shrink-0')}>
                      {fmtVal(m.stressed)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
