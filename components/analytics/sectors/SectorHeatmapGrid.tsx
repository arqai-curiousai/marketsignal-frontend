'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECTOR_COLORS, perfColor, formatMarketCap } from './constants';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';

interface SectorHeatmapGridProps {
  sectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
  onSectorClick: (sector: ISectorAnalytics) => void;
}

export function SectorHeatmapGrid({
  sectors,
  timeframe,
  onSectorClick,
}: SectorHeatmapGridProps) {
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {sectors.map((sector, idx) => {
        const perf = sector.performance[timeframe] ?? 0;
        return (
          <motion.div
            key={sector.sector}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onSectorClick(sector)}
            className={cn(
              'rounded-xl border border-white/10 p-4 backdrop-blur-sm cursor-pointer',
              'bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
              'hover:border-white/20 transition-all duration-200',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SECTOR_COLORS[sector.sector] ?? '#64748B' }}
                />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  {sector.sector}
                </span>
              </div>
              <span
                className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  perf >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
                )}
              >
                {perf >= 0 ? '+' : ''}
                {perf.toFixed(2)}%
              </span>
            </div>

            {/* Momentum + Breadth bar */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${sector.momentum_score}%`,
                    backgroundColor:
                      sector.momentum_score > 65
                        ? '#10B981'
                        : sector.momentum_score > 40
                          ? '#F59E0B'
                          : '#EF4444',
                  }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground w-6 text-right">
                {sector.momentum_score.toFixed(0)}
              </span>
            </div>

            {/* Stocks Mini-Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {sector.stocks.slice(0, 6).map((stock) => {
                const changePct = stock.change_pct ?? 0;
                const isPositive = changePct >= 0;
                const intensity = Math.min(Math.abs(changePct) / 3, 1);

                return (
                  <div
                    key={stock.ticker}
                    onMouseEnter={() => setHoveredStock(stock.ticker)}
                    onMouseLeave={() => setHoveredStock(null)}
                    className={cn(
                      'relative rounded-lg p-2 text-center transition-all duration-200',
                      'border border-transparent hover:border-white/20',
                    )}
                    style={{
                      backgroundColor: isPositive
                        ? `rgba(16, 185, 129, ${0.05 + intensity * 0.15})`
                        : `rgba(239, 68, 68, ${0.05 + intensity * 0.15})`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[10px] font-bold text-white truncate">
                      {stock.ticker}
                    </div>
                    <div
                      className={cn(
                        'text-[10px] font-medium',
                        isPositive ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {isPositive ? '+' : ''}
                      {changePct.toFixed(1)}%
                    </div>

                    {hoveredStock === stock.ticker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute z-50 -translate-x-1/2 left-1/2 mt-1 px-3 py-2 rounded-lg bg-brand-slate/95 border border-white/10 shadow-xl"
                        style={{ pointerEvents: 'none' }}
                      >
                        <div className="text-xs font-semibold text-white whitespace-nowrap">
                          {stock.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {stock.last_price != null
                            ? `₹${stock.last_price.toLocaleString()}`
                            : '—'}
                        </div>
                        {stock.pos_52w != null && (
                          <div className="mt-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-400 rounded-full"
                              style={{ width: `${stock.pos_52w * 100}%` }}
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
              <span className="text-[10px] text-muted-foreground">
                {sector.stock_count} stocks | {formatMarketCap(sector.total_market_cap)}
              </span>
              <div className="flex items-center gap-2">
                {sector.top_gainer.ticker && (
                  <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    {sector.top_gainer.ticker}
                  </span>
                )}
                {sector.top_loser.ticker && (
                  <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                    <TrendingDown className="h-3 w-3" />
                    {sector.top_loser.ticker}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
