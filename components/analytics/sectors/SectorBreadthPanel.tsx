'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SECTOR_COLORS } from './constants';
import type { ISectorAnalytics } from '@/types/analytics';

interface SectorBreadthPanelProps {
  sectors: ISectorAnalytics[];
}

function breadthHealth(pct: number): { label: string; color: string } {
  if (pct > 70) return { label: 'Strong', color: 'text-emerald-400' };
  if (pct > 40) return { label: 'Moderate', color: 'text-yellow-400' };
  return { label: 'Weak', color: 'text-red-400' };
}

export function SectorBreadthPanel({ sectors }: SectorBreadthPanelProps) {
  // Overall market breadth
  const totalStocks = sectors.reduce((s, x) => s + x.stock_count, 0);
  const allAbove50 =
    totalStocks > 0
      ? sectors.reduce((s, x) => {
          const pct = x.breadth.above_50dma_pct ?? 0;
          return s + (pct / 100) * x.stock_count;
        }, 0) / totalStocks
      : 0;
  const overallPct = allAbove50 * 100;
  const health = breadthHealth(overallPct);

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white uppercase tracking-wider">
          Market Breadth
        </span>
        <span className={cn('text-[10px] font-bold', health.color)}>
          {health.label}
        </span>
      </div>

      {/* Overall breadth gauge */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Overall &gt; 50 DMA</span>
          <span className="text-xs font-semibold text-white">{overallPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 0.6 }}
            className="h-full rounded-full"
            style={{
              background:
                overallPct > 70
                  ? 'linear-gradient(90deg, #10B981, #34D399)'
                  : overallPct > 40
                    ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                    : 'linear-gradient(90deg, #EF4444, #FCA5A5)',
            }}
          />
        </div>
      </div>

      {/* Per-sector breadth stacked bars */}
      <div className="space-y-2">
        {[...sectors]
          .sort((a, b) => (b.breadth.above_50dma_pct ?? 0) - (a.breadth.above_50dma_pct ?? 0))
          .map((sector) => {
            const b = sector.breadth;
            const sectorColor = SECTOR_COLORS[sector.sector] ?? '#64748B';

            return (
              <div key={sector.sector}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: sectorColor }}
                    />
                    <span className="text-[10px] text-white font-medium">
                      {sector.sector}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    <span className="text-emerald-400/70">
                      {b.advancing}A
                    </span>
                    <span className="text-red-400/70">
                      {b.declining}D
                    </span>
                  </div>
                </div>

                {/* Stacked breadth bar: 200DMA (dark) | 50DMA (medium) | 20DMA (light) */}
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
                  <div
                    className="h-full"
                    style={{
                      width: `${b.above_200dma_pct}%`,
                      backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.max(0, b.above_50dma_pct - b.above_200dma_pct)}%`,
                      backgroundColor: 'rgba(16, 185, 129, 0.35)',
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.max(0, b.above_20dma_pct - b.above_50dma_pct)}%`,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.6)' }} />
          <span className="text-[9px] text-muted-foreground">200 DMA</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.35)' }} />
          <span className="text-[9px] text-muted-foreground">50 DMA</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }} />
          <span className="text-[9px] text-muted-foreground">20 DMA</span>
        </div>
      </div>
    </div>
  );
}
