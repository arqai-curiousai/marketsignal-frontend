'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { getSectors } from '@/src/lib/api/analyticsApi';
import type { ISectorAggregate } from '@/types/analytics';
import { SECTOR_COLORS } from '@/types/analytics';
import { cn } from '@/lib/utils';

export function SectorHeatmap() {
  const [sectors, setSectors] = useState<ISectorAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getSectors();
      if (result.success && result.data?.items) {
        setSectors(result.data.items.sort((a, b) => (b.total_market_cap ?? 0) - (a.total_market_cap ?? 0)));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (sectors.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Sector data not yet available. Data is computed every 5 minutes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Treemap Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sectors.map((sector, idx) => (
          <motion.div
            key={sector.sector}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
              'rounded-xl border border-white/10 p-4 backdrop-blur-sm',
              'bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
              'hover:border-white/20 transition-all duration-200',
            )}
          >
            {/* Sector Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SECTOR_COLORS[sector.sector] || '#64748B' }}
                />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  {sector.sector}
                </span>
              </div>
              <span
                className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  sector.avg_change_pct >= 0
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400',
                )}
              >
                {sector.avg_change_pct >= 0 ? '+' : ''}
                {sector.avg_change_pct.toFixed(2)}%
              </span>
            </div>

            {/* Stocks Mini-Grid (Treemap-like) */}
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
                      'relative rounded-lg p-2 text-center transition-all duration-200 cursor-pointer',
                      'border border-transparent hover:border-white/20',
                    )}
                    style={{
                      backgroundColor: isPositive
                        ? `rgba(16, 185, 129, ${0.05 + intensity * 0.15})`
                        : `rgba(239, 68, 68, ${0.05 + intensity * 0.15})`,
                    }}
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

                    {/* Expanded tooltip on hover */}
                    {hoveredStock === stock.ticker && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute z-50 -translate-x-1/2 left-1/2 mt-1 px-3 py-2 rounded-lg bg-brand-slate/95 border border-white/10 shadow-xl"
                        style={{ pointerEvents: 'none' }}
                      >
                        <div className="text-xs font-semibold text-white">{stock.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {stock.last_price != null ? `₹${stock.last_price.toLocaleString()}` : '—'}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sector Stats */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
              <span className="text-[10px] text-muted-foreground">{sector.stock_count} stocks</span>
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
        ))}
      </div>
    </div>
  );
}
