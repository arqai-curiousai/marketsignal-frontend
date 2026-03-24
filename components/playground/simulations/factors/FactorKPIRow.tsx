'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';

// ─── Types ──────────────────────────────────────────────────────────

interface FactorDef {
  id: string;
  label: string;
}

interface FactorAttributionItem {
  factorId: string;
  label: string;
  contribution: number;
  portfolioTilt: number;
  benchmarkTilt: number;
}

export interface FactorKPIRowProps {
  data: {
    factors: FactorDef[];
    portfolioTilts: Record<string, number>;
    benchmarkTilts: Record<string, number>;
    factorAttribution: FactorAttributionItem[];
    dataPoints: number;
  };
  className?: string;
}

// ─── KPI computation helpers ────────────────────────────────────────

interface KPIItem {
  label: string;
  value: string;
  sub?: string;
}

function computeKPIs(data: FactorKPIRowProps['data']): KPIItem[] {
  const { factors, portfolioTilts, benchmarkTilts, factorAttribution, dataPoints } = data;

  // 1. Dominant Factor: highest portfolio tilt
  let dominantLabel = '--';
  let dominantScore = 0;
  for (const f of factors) {
    const score = portfolioTilts[f.id] ?? 0;
    if (score > dominantScore) {
      dominantScore = score;
      dominantLabel = f.label;
    }
  }

  // 2. Biggest Tilt: largest absolute delta from benchmark
  let biggestTiltLabel = '--';
  let biggestTiltDelta = 0;
  for (const f of factors) {
    const delta = Math.abs((portfolioTilts[f.id] ?? 50) - (benchmarkTilts[f.id] ?? 50));
    if (delta > Math.abs(biggestTiltDelta)) {
      biggestTiltDelta = (portfolioTilts[f.id] ?? 50) - (benchmarkTilts[f.id] ?? 50);
      biggestTiltLabel = f.label;
    }
  }

  // 3. Alpha Contribution: sum of positive factor contributions
  const alphaContrib = factorAttribution.reduce(
    (sum, a) => sum + (a.contribution > 0 ? a.contribution : 0),
    0,
  );

  // 4. Drag: sum of negative factor contributions
  const drag = factorAttribution.reduce(
    (sum, a) => sum + (a.contribution < 0 ? a.contribution : 0),
    0,
  );

  // 5. Alignment: 100 - mean absolute tilt delta
  const n = factors.length || 1;
  const totalAbsDelta = factors.reduce((sum, f) => {
    const p = portfolioTilts[f.id] ?? 50;
    const b = benchmarkTilts[f.id] ?? 50;
    return sum + Math.abs(p - b);
  }, 0);
  const alignment = Math.round(Math.max(0, 100 - totalAbsDelta / n));

  // 6. Data Quality
  const dataQuality = dataPoints;

  const sign = biggestTiltDelta >= 0 ? '+' : '';

  return [
    {
      label: 'Dominant Factor',
      value: dominantLabel,
      sub: `${dominantScore.toFixed(0)}/100`,
    },
    {
      label: 'Biggest Tilt',
      value: biggestTiltLabel,
      sub: `${sign}${biggestTiltDelta.toFixed(0)} vs bench`,
    },
    {
      label: 'Alpha Contribution',
      value: `+${(alphaContrib * 100).toFixed(1)}%`,
    },
    {
      label: 'Drag',
      value: `${(drag * 100).toFixed(1)}%`,
    },
    {
      label: 'Alignment',
      value: `${alignment}`,
      sub: '/ 100',
    },
    {
      label: 'Data Quality',
      value: `${dataQuality.toLocaleString('en-IN')} days`,
    },
  ];
}

// ─── Main Component ─────────────────────────────────────────────────

export function FactorKPIRow({ data, className }: FactorKPIRowProps) {
  const kpis = useMemo(() => computeKPIs(data), [data]);

  return (
    <div className={cn('grid grid-cols-3 sm:grid-cols-6 gap-2', className)}>
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          className={cn(S.card, 'px-3 py-2')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <p className={cn(T.badge, 'text-white/30 mb-0.5')}>{kpi.label}</p>
          <p className={cn(T.mono, 'text-white/80')}>{kpi.value}</p>
          {kpi.sub && <p className={cn(T.badge, 'text-violet-400/60')}>{kpi.sub}</p>}
        </motion.div>
      ))}
    </div>
  );
}
