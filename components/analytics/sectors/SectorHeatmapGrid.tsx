'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECTOR_COLORS, formatMarketCap } from './constants';
import { formatPrice } from '@/src/lib/exchange/formatting';
import type { ExchangeCode } from '@/src/lib/exchange/config';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';

interface SectorHeatmapGridProps {
  sectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
  selectedSector?: string | null;
  onSectorClick: (sector: ISectorAnalytics) => void;
  exchange?: ExchangeCode;
}

export function SectorHeatmapGrid({
  sectors,
  timeframe,
  selectedSector,
  onSectorClick,
  exchange = 'NSE',
}: SectorHeatmapGridProps) {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoveredStock, setHoveredStock] = useState<{
    ticker: string;
    name: string;
    price: number | null;
    pos52w: number | null;
  } | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  return (
    <div ref={gridRef} className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {sectors.map((sector) => {
        const perf = sector.performance[timeframe] ?? 0;
        const isSelected = selectedSector === sector.sector;
        const sectorColor = SECTOR_COLORS[sector.sector] ?? '#64748B';
        return (
          <motion.div
            key={sector.sector}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            role="button"
            tabIndex={0}
            aria-label={`Sector: ${sector.sector}, performance ${perf >= 0 ? '+' : ''}${perf.toFixed(2)}%`}
            onClick={() => onSectorClick(sector)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSectorClick(sector); } }}
            className={cn(
              'rounded-xl border p-4 backdrop-blur-sm cursor-pointer',
              'bg-gradient-to-br from-white/[0.03] to-white/[0.01]',
              'hover:border-white/20 transition-all duration-200',
              isSelected ? 'ring-1 ring-offset-0' : 'border-white/10',
            )}
            style={isSelected ? {
              borderColor: sectorColor,
              ['--tw-ring-color' as string]: `${sectorColor}40`,
            } as React.CSSProperties : undefined}
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

            {/* Momentum bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] text-muted-foreground">Mom</span>
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
                    role="button"
                    tabIndex={0}
                    aria-label={`${stock.ticker} — ${stock.name}, ${isPositive ? '+' : ''}${changePct.toFixed(1)}%`}
                    onMouseEnter={(e) => {
                      setHoveredStock({
                        ticker: stock.ticker,
                        name: stock.name,
                        price: stock.last_price ?? null,
                        pos52w: stock.pos_52w ?? null,
                      });
                      const rect = gridRef.current?.getBoundingClientRect();
                      if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseMove={(e) => {
                      const rect = gridRef.current?.getBoundingClientRect();
                      if (rect) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseLeave={() => setHoveredStock(null)}
                    onFocus={() => {
                      setHoveredStock({
                        ticker: stock.ticker,
                        name: stock.name,
                        price: stock.last_price ?? null,
                        pos52w: stock.pos_52w ?? null,
                      });
                    }}
                    onBlur={() => setHoveredStock(null)}
                    className={cn(
                      'rounded-lg p-2 text-center transition-all duration-200 cursor-pointer',
                      'border border-transparent hover:border-white/20 focus-visible:border-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-blue/50',
                    )}
                    style={{
                      backgroundColor: isPositive
                        ? `rgba(16, 185, 129, ${0.05 + intensity * 0.15})`
                        : `rgba(239, 68, 68, ${0.05 + intensity * 0.15})`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/stocks/${stock.ticker}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/stocks/${stock.ticker}`);
                      }
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
                  </div>
                );
              })}
            </div>
            {/* +N more indicator */}
            {sector.stock_count > 6 && (
              <div className="text-[9px] text-muted-foreground text-center mt-1">
                +{sector.stock_count - 6} more
              </div>
            )}

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

      {/* Portal tooltip for stock hover */}
      {hoveredStock && (
        <div
          className="absolute z-50 rounded-lg bg-brand-slate/95 backdrop-blur-sm px-3 py-2 border border-white/10 shadow-xl pointer-events-none"
          style={{
            left: Math.min(tooltipPos.x + 12, (gridRef.current?.offsetWidth ?? 999) - 160),
            top: Math.max(tooltipPos.y - 50, 0),
          }}
        >
          <div className="text-xs font-semibold text-white whitespace-nowrap">
            {hoveredStock.name}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {hoveredStock.price != null ? formatPrice(hoveredStock.price, exchange) : '—'}
          </div>
          {hoveredStock.pos52w != null && (
            <div className="mt-1 h-1 w-16 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{ width: `${hoveredStock.pos52w * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
