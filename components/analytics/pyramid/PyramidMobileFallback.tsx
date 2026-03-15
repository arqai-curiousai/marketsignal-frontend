'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPyramidSector } from './constants';
import { SECTOR_COLORS, formatPct } from './constants';

interface PyramidMobileFallbackProps {
  sectors: IPyramidSector[];
  onStockClick: (ticker: string, sector: string) => void;
}

export function PyramidMobileFallback({
  sectors,
  onStockClick,
}: PyramidMobileFallbackProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      {sectors.map((sector) => {
        const isOpen = expanded === sector.sector;
        return (
          <div
            key={sector.sector}
            className="rounded-lg border border-white/[0.06] overflow-hidden"
          >
            {/* Sector row */}
            <button
              onClick={() => setExpanded(isOpen ? null : sector.sector)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SECTOR_COLORS[sector.sector] || '#94A3B8' }}
                />
                <span className="text-xs font-medium text-foreground">
                  {sector.sector}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({sector.stock_count})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'text-xs font-medium tabular-nums',
                    sector.avg_change_pct >= 0 ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  {formatPct(sector.avg_change_pct, 1)}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded stock list */}
            {isOpen && (
              <div className="border-t border-white/[0.04] px-3 py-2 space-y-0.5">
                {sector.stocks
                  .sort((a, b) => b.market_cap - a.market_cap)
                  .map((stock) => (
                    <button
                      key={stock.ticker}
                      onClick={() => onStockClick(stock.ticker, sector.sector)}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-white/[0.04] transition-colors"
                    >
                      <div>
                        <span className="text-xs font-medium text-foreground">
                          {stock.ticker}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          {stock.name.length > 20 ? stock.name.slice(0, 18) + '…' : stock.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          ₹{stock.last_price.toLocaleString()}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-medium tabular-nums',
                            stock.change_pct >= 0 ? 'text-emerald-400' : 'text-red-400',
                          )}
                        >
                          {formatPct(stock.change_pct, 1)}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
