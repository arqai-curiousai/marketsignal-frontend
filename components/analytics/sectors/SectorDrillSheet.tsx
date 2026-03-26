'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  SECTOR_COLORS,
  RRG_QUADRANT_COLORS,
  RRG_QUADRANT_LABELS,
  perfTextClass,
  formatMarketCap,
  formatVolume,
} from './constants';
import { formatPrice } from '@/src/lib/exchange/formatting';
import type { ExchangeCode } from '@/src/lib/exchange/config';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';

interface SectorDrillSheetProps {
  sector: ISectorAnalytics | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeframe: SectorTimeframe;
  exchange?: ExchangeCode;
}

type StockSortKey = 'ticker' | 'change_pct' | 'volume' | 'volume_ratio' | 'pos_52w' | 'market_cap';

export function SectorDrillSheet({
  sector,
  open,
  onOpenChange,
  timeframe,
  exchange = 'NSE',
}: SectorDrillSheetProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<StockSortKey>('change_pct');
  const [sortAsc, setSortAsc] = useState(false);

  // Reset sort when switching sectors
  useEffect(() => {
    setSortKey('change_pct');
    setSortAsc(false);
  }, [sector?.sector]);

  const sortedStocks = useMemo(() => {
    if (!sector) return [];
    const copy = [...sector.stocks];
    copy.sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return copy;
  }, [sector, sortKey, sortAsc]);

  const toggleSort = (key: StockSortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  if (!sector) return null;

  const sectorColor = SECTOR_COLORS[sector.sector] ?? '#64748B';
  const rrg = sector.rrg;
  const perf = sector.performance;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[600px] bg-brand-slate border-white/10 overflow-y-auto"
      >
        <SheetHeader className="pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: sectorColor }}
            />
            <SheetTitle className="text-white text-lg">{sector.sector}</SheetTitle>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={cn(
                'text-sm font-bold px-2.5 py-1 rounded-full',
                sector.avg_change_pct >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400',
              )}
            >
              {sector.avg_change_pct >= 0 ? '+' : ''}
              {sector.avg_change_pct.toFixed(2)}%
            </span>
            <span className="text-xs text-muted-foreground">
              Momentum: {sector.momentum_score.toFixed(0)}/100
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${RRG_QUADRANT_COLORS[rrg.quadrant]}20`,
                color: RRG_QUADRANT_COLORS[rrg.quadrant],
              }}
            >
              {RRG_QUADRANT_LABELS[rrg.quadrant]}
            </span>
          </div>
        </SheetHeader>

        {/* Multi-timeframe performance */}
        <div className="py-4 border-b border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block">
            Performance
          </span>
          <div className="grid grid-cols-6 gap-1.5">
            {(['1d', '1w', '1m', '3m', '6m', 'ytd'] as const).map((tf) => {
              const val = perf[tf] ?? 0;
              return (
                <div
                  key={tf}
                  className={cn(
                    'rounded-lg p-2 text-center border',
                    tf === timeframe
                      ? 'border-brand-blue/30 bg-brand-blue/5'
                      : 'border-white/5 bg-white/[0.02]',
                  )}
                >
                  <div className="text-[9px] text-muted-foreground uppercase mb-0.5">{tf}</div>
                  <div className={cn('text-xs font-semibold tabular-nums', perfTextClass(val))}>
                    {val >= 0 ? '+' : ''}
                    {val.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breadth gauges */}
        <div className="py-4 border-b border-white/5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block">
            Breadth
          </span>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '> 200 DMA', val: sector.breadth.above_200dma_pct },
              { label: '> 50 DMA', val: sector.breadth.above_50dma_pct },
              { label: '> 20 DMA', val: sector.breadth.above_20dma_pct },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-[9px] text-muted-foreground mb-1">{label}</div>
                <div className="relative h-12 w-12 mx-auto">
                  <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={val > 70 ? '#10B981' : val > 40 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="4"
                      strokeDasharray={`${(val / 100) * 125.6} 125.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{val.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span>
              Adv: <span className="text-emerald-400">{sector.breadth.advancing}</span>
            </span>
            <span>
              Dec: <span className="text-red-400">{sector.breadth.declining}</span>
            </span>
            <span>
              A/D: <span className="text-white">{sector.breadth.ad_ratio.toFixed(2)}</span>
            </span>
            <span>
              52W H: <span className="text-emerald-400">{sector.breadth.new_52w_highs}</span>
            </span>
            <span>
              52W L: <span className="text-red-400">{sector.breadth.new_52w_lows}</span>
            </span>
          </div>
        </div>

        {/* Stocks table */}
        <div className="py-4">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block">
            Stocks ({sector.stock_count})
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    { key: 'ticker' as StockSortKey, label: 'Ticker', align: 'text-left' },
                    { key: 'change_pct' as StockSortKey, label: 'Chg %', align: 'text-right' },
                    { key: 'volume' as StockSortKey, label: 'Volume', align: 'text-right' },
                    { key: 'volume_ratio' as StockSortKey, label: 'Vol Ratio', align: 'text-right' },
                    { key: 'pos_52w' as StockSortKey, label: '52W Pos', align: 'text-right' },
                    { key: 'market_cap' as StockSortKey, label: 'Mkt Cap', align: 'text-right' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        'px-2 py-2 font-medium text-muted-foreground cursor-pointer hover:text-white transition-colors whitespace-nowrap',
                        col.align,
                      )}
                    >
                      <div className={cn('flex items-center gap-0.5', col.align !== 'text-left' && 'justify-end')}>
                        {col.label}
                        {sortKey === col.key ? (
                          sortAsc ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
                    7D
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => (
                  <motion.tr
                    key={stock.ticker}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => {
                      onOpenChange(false);
                      router.push(`/stocks/${stock.ticker}`);
                    }}
                    className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-2 py-2 text-left">
                      <div>
                        <span className="font-semibold text-white">{stock.ticker}</span>
                        <div className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                          {stock.last_price != null ? formatPrice(stock.last_price, exchange) : ''}
                        </div>
                      </div>
                    </td>
                    <td className={cn('px-2 py-2 text-right font-medium tabular-nums', perfTextClass(stock.change_pct))}>
                      {stock.change_pct >= 0 ? '+' : ''}
                      {stock.change_pct.toFixed(2)}%
                    </td>
                    <td className="px-2 py-2 text-right text-muted-foreground tabular-nums">
                      {formatVolume(stock.volume)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {stock.volume_ratio != null ? (
                        <span
                          className={cn(
                            stock.volume_ratio > 1.5
                              ? 'text-emerald-400'
                              : stock.volume_ratio < 0.5
                                ? 'text-red-400'
                                : 'text-muted-foreground',
                          )}
                        >
                          {stock.volume_ratio.toFixed(1)}x
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {stock.pos_52w != null ? (
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-10 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-400"
                              style={{ width: `${stock.pos_52w * 100}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-muted-foreground tabular-nums w-6 text-right">
                            {(stock.pos_52w * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-2 py-2 text-right text-muted-foreground tabular-nums">
                      {formatMarketCap(stock.market_cap)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {stock.sparkline_7d.length > 1 ? (
                        <MiniSparkline data={stock.sparkline_7d} />
                      ) : (
                        '—'
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Tiny inline SVG sparkline for 7-day price trend. */
function MiniSparkline({ data }: { data: number[] }) {
  const width = 40;
  const height = 16;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const isUp = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? '#10B981' : '#EF4444'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
