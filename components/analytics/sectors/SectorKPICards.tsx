'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Activity, DollarSign, Shuffle, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMarketCap, perfTextClass, flowColor } from './constants';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';

interface SectorKPICardsProps {
  sectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
}

export function SectorKPICards({ sectors, timeframe }: SectorKPICardsProps) {
  if (sectors.length === 0) return null;

  const totalMarketCap = sectors.reduce(
    (sum, s) => sum + (s.total_market_cap ?? 0),
    0,
  );

  const bestSector = sectors.reduce((best, s) =>
    (s.performance[timeframe] ?? 0) > (best.performance[timeframe] ?? 0) ? s : best,
  );
  const worstSector = sectors.reduce((worst, s) =>
    (s.performance[timeframe] ?? 0) < (worst.performance[timeframe] ?? 0) ? s : worst,
  );

  // Overall breadth: average of all sectors' above_50dma_pct
  const avgBreadth =
    sectors.reduce((sum, s) => sum + (s.breadth.above_50dma_pct ?? 0), 0) /
    sectors.length;

  // Avg momentum
  const avgMomentum =
    sectors.reduce((sum, s) => sum + s.momentum_score, 0) / sectors.length;

  // Cross-sector dispersion (std of sector performances)
  const sectorPerfs = sectors.map((s) => s.performance[timeframe] ?? 0);
  const meanPerf = sectorPerfs.reduce((a, b) => a + b, 0) / sectorPerfs.length;
  const dispersion = Math.sqrt(
    sectorPerfs.reduce((sum, p) => sum + (p - meanPerf) ** 2, 0) / sectorPerfs.length,
  );

  // Avg HHI label across sectors
  const hhiLabels = sectors
    .map((s) => s.dispersion?.hhi_label)
    .filter(Boolean) as string[];
  const hhiSummary = hhiLabels.length > 0
    ? hhiLabels.reduce((acc, l) => {
        acc[l] = (acc[l] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    : null;
  const dominantHhi = hhiSummary
    ? Object.entries(hhiSummary).sort((a, b) => b[1] - a[1])[0][0]
    : 'n/a';

  // Avg flow score
  const avgFlow =
    sectors.reduce((sum, s) => sum + (s.volume_flow_score ?? 0), 0) / sectors.length;
  const flowLabel = avgFlow > 15 ? 'Accumulation' : avgFlow < -15 ? 'Distribution' : 'Neutral';

  const cards = [
    {
      label: 'Total Market Cap',
      value: formatMarketCap(totalMarketCap),
      sub: `${sectors.reduce((s, x) => s + x.stock_count, 0)} stocks`,
      icon: DollarSign,
      color: 'text-blue-400',
    },
    {
      label: 'Top Sector',
      value: bestSector.sector,
      sub: `${(bestSector.performance[timeframe] ?? 0) >= 0 ? '+' : ''}${(bestSector.performance[timeframe] ?? 0).toFixed(2)}%`,
      subClass: perfTextClass(bestSector.performance[timeframe] ?? 0),
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      label: 'Market Breadth',
      value: `${avgBreadth.toFixed(0)}%`,
      sub: `above 50 DMA`,
      icon: BarChart3,
      color:
        avgBreadth > 70
          ? 'text-emerald-400'
          : avgBreadth > 40
            ? 'text-yellow-400'
            : 'text-red-400',
    },
    {
      label: 'Avg Momentum',
      value: avgMomentum.toFixed(0),
      sub: 'of 100',
      icon: Activity,
      color:
        avgMomentum > 65
          ? 'text-emerald-400'
          : avgMomentum > 40
            ? 'text-yellow-400'
            : 'text-red-400',
    },
    {
      label: 'Dispersion',
      value: `${dispersion.toFixed(2)}%`,
      sub: dominantHhi,
      icon: Shuffle,
      color:
        dispersion > 2
          ? 'text-yellow-400'
          : 'text-blue-400',
    },
    {
      label: 'Volume Flow',
      value: `${avgFlow > 0 ? '+' : ''}${avgFlow.toFixed(0)}`,
      sub: flowLabel,
      subStyle: { color: flowColor(avgFlow) },
      icon: Waves,
      color: avgFlow > 15 ? 'text-emerald-400' : avgFlow < -15 ? 'text-red-400' : 'text-slate-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={cn(
            'rounded-xl border border-white/10 p-4 backdrop-blur-sm',
            'bg-gradient-to-br from-white/[0.04] to-white/[0.01]',
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon className={cn('h-4 w-4', card.color)} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {card.label}
            </span>
          </div>
          <div className="text-lg font-bold text-white">{card.value}</div>
          <div
            className={cn('text-xs', card.subClass ?? 'text-muted-foreground')}
            style={'subStyle' in card ? (card as { subStyle?: React.CSSProperties }).subStyle : undefined}
          >
            {card.sub}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
