'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECTOR_COLORS, perfTextClass } from './constants';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';

interface SectorPerformanceBarsProps {
  sectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
}

export function SectorPerformanceBars({ sectors, timeframe }: SectorPerformanceBarsProps) {
  // Sort by performance for bar chart
  const sorted = [...sectors].sort(
    (a, b) => (b.performance[timeframe] ?? 0) - (a.performance[timeframe] ?? 0),
  );

  const maxAbs = Math.max(
    ...sorted.map((s) => Math.abs(s.performance[timeframe] ?? 0)),
    0.1,
  );

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white uppercase tracking-wider">
          Sector Performance
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">
          {timeframe}
        </span>
      </div>

      <div className="space-y-1.5">
        {sorted.map((sector, idx) => {
          const perf = sector.performance[timeframe] ?? 0;
          const barWidth = (Math.abs(perf) / maxAbs) * 50; // max 50% of container width
          const isPositive = perf >= 0;
          const sectorColor = SECTOR_COLORS[sector.sector] ?? '#64748B';

          // Momentum direction
          const mom1w = sector.performance['1w'] ?? 0;
          const mom1m = sector.performance['1m'] ?? 0;
          const accelerating = Math.abs(mom1w) > Math.abs(mom1m) && Math.sign(mom1w) === Math.sign(perf);

          return (
            <motion.div
              key={sector.sector}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="flex items-center gap-2 group"
            >
              {/* Sector label */}
              <div className="w-28 flex items-center gap-1.5 flex-shrink-0">
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sectorColor }}
                />
                <span className="text-[11px] text-white font-medium truncate">
                  {sector.sector}
                </span>
              </div>

              {/* Bar area: left half is negative, right half is positive */}
              <div className="flex-1 flex items-center h-5">
                <div className="w-1/2 flex justify-end">
                  {!isPositive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.03 }}
                      className="h-4 rounded-l bg-red-500/30 border-r border-white/10"
                    />
                  )}
                </div>
                {/* Center line */}
                <div className="w-px h-5 bg-white/10 flex-shrink-0" />
                <div className="w-1/2 flex justify-start">
                  {isPositive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.03 }}
                      className="h-4 rounded-r bg-emerald-500/30 border-l border-white/10"
                    />
                  )}
                </div>
              </div>

              {/* Value + momentum indicator */}
              <div className="w-20 flex items-center justify-end gap-1 flex-shrink-0">
                <span
                  className={cn(
                    'text-[11px] font-medium tabular-nums',
                    perfTextClass(perf),
                  )}
                >
                  {perf >= 0 ? '+' : ''}
                  {perf.toFixed(2)}%
                </span>
                {accelerating ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400 opacity-60" />
                ) : perf < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-400 opacity-60" />
                ) : (
                  <Minus className="h-3 w-3 text-muted-foreground opacity-40" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
