'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECTOR_COLORS, formatMarketCap, perfTextClass } from './constants';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';

interface SectorPerformanceTableProps {
  sectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
  selectedSector?: string | null;
  onSectorClick: (sector: ISectorAnalytics) => void;
}

type SortKey =
  | 'sector'
  | '1d'
  | '1w'
  | '1m'
  | '3m'
  | '6m'
  | 'ytd'
  | 'momentum'
  | 'breadth'
  | 'pe'
  | 'pb'
  | 'dy'
  | 'market_cap';

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'sector', label: 'Sector', className: 'text-left' },
  { key: '1d', label: '1D' },
  { key: '1w', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: 'ytd', label: 'YTD' },
  { key: 'momentum', label: 'Mom.' },
  { key: 'breadth', label: 'Breadth' },
  { key: 'pe', label: 'PE' },
  { key: 'pb', label: 'PB' },
  { key: 'dy', label: 'DY' },
  { key: 'market_cap', label: 'Mkt Cap' },
];

function getCellValue(sector: ISectorAnalytics, key: SortKey): number | string {
  switch (key) {
    case 'sector':
      return sector.sector;
    case '1d':
    case '1w':
    case '1m':
    case '3m':
    case '6m':
    case 'ytd':
      return sector.performance[key] ?? 0;
    case 'momentum':
      return sector.momentum_score;
    case 'breadth':
      return sector.breadth.above_50dma_pct ?? 0;
    case 'pe':
      return sector.valuation?.metrics?.pe_ratio?.weighted_avg ?? 0;
    case 'pb':
      return sector.valuation?.metrics?.price_to_book?.weighted_avg ?? 0;
    case 'dy':
      return sector.valuation?.metrics?.dividend_yield?.weighted_avg ?? 0;
    case 'market_cap':
      return sector.total_market_cap ?? 0;
    default:
      return 0;
  }
}

export function SectorPerformanceTable({
  sectors,
  timeframe,
  selectedSector,
  onSectorClick,
}: SectorPerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>(timeframe as SortKey);
  const [sortAsc, setSortAsc] = useState(false);

  // Sync sort key when timeframe prop changes
  useEffect(() => {
    setSortKey(timeframe as SortKey);
  }, [timeframe]);

  const sorted = useMemo(() => {
    const copy = [...sectors];
    copy.sort((a, b) => {
      const va = getCellValue(a, sortKey);
      const vb = getCellValue(b, sortKey);
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return copy;
  }, [sectors, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-white/[0.02] backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={cn(
                    'px-3 py-2.5 font-medium text-muted-foreground cursor-pointer hover:text-white transition-colors whitespace-nowrap',
                    col.className ?? 'text-right',
                    col.key === 'sector' && 'sticky left-0 z-10 bg-[#0B0F19]',
                  )}
                >
                  <div className={cn('flex items-center gap-1', col.className !== 'text-left' && 'justify-end')}>
                    {col.label}
                    {sortKey === col.key ? (
                      sortAsc ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((sector) => {
              const isSelected = selectedSector === sector.sector;
              const sectorColor = SECTOR_COLORS[sector.sector] ?? '#64748B';
              return (
              <motion.tr
                key={sector.sector}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSectorClick(sector)}
                className={cn(
                  'border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors',
                  isSelected && 'bg-white/[0.04]',
                )}
                style={isSelected ? { boxShadow: `inset 3px 0 0 0 ${sectorColor}` } : undefined}
              >
                {/* Sector name */}
                <td className={cn(
                  'px-3 py-2.5 text-left sticky left-0 z-10',
                  isSelected ? 'bg-[#0F1320]' : 'bg-[#0B0F19]',
                )}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: SECTOR_COLORS[sector.sector] ?? '#64748B' }}
                    />
                    <span className="font-semibold text-white whitespace-nowrap">{sector.sector}</span>
                  </div>
                </td>

                {/* Timeframe performance cells */}
                {(['1d', '1w', '1m', '3m', '6m', 'ytd'] as const).map((tf) => {
                  const val = sector.performance[tf] ?? 0;
                  return (
                    <td
                      key={tf}
                      className={cn(
                        'px-3 py-2.5 text-right font-medium tabular-nums',
                        perfTextClass(val),
                        tf === timeframe && 'bg-white/[0.03]',
                      )}
                    >
                      {val >= 0 ? '+' : ''}
                      {val.toFixed(2)}%
                    </td>
                  );
                })}

                {/* Momentum */}
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-10 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
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
                    <span className="text-white tabular-nums w-5 text-right">
                      {sector.momentum_score.toFixed(0)}
                    </span>
                  </div>
                </td>

                {/* Breadth */}
                <td className="px-3 py-2.5 text-right">
                  <span
                    className={cn(
                      'tabular-nums',
                      sector.breadth.above_50dma_pct > 70
                        ? 'text-emerald-400'
                        : sector.breadth.above_50dma_pct > 40
                          ? 'text-yellow-400'
                          : 'text-red-400',
                    )}
                  >
                    {sector.breadth.above_50dma_pct.toFixed(0)}%
                  </span>
                </td>

                {/* PE */}
                <td className="px-3 py-2.5 text-right text-white/70 font-mono tabular-nums">
                  {sector.valuation?.metrics?.pe_ratio?.weighted_avg != null
                    ? sector.valuation.metrics.pe_ratio.weighted_avg.toFixed(1)
                    : '\u2014'}
                </td>

                {/* PB */}
                <td className="px-3 py-2.5 text-right text-white/70 font-mono tabular-nums">
                  {sector.valuation?.metrics?.price_to_book?.weighted_avg != null
                    ? sector.valuation.metrics.price_to_book.weighted_avg.toFixed(1)
                    : '\u2014'}
                </td>

                {/* DY */}
                <td className="px-3 py-2.5 text-right text-white/70 font-mono tabular-nums">
                  {sector.valuation?.metrics?.dividend_yield?.weighted_avg != null
                    ? `${sector.valuation.metrics.dividend_yield.weighted_avg.toFixed(2)}%`
                    : '\u2014'}
                </td>

                {/* Market Cap */}
                <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">
                  {formatMarketCap(sector.total_market_cap)}
                </td>
              </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
