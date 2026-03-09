'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Activity, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMarketCap, perfTextClass } from './constants';
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
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
          <div className={cn('text-xs', card.subClass ?? 'text-muted-foreground')}>
            {card.sub}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
