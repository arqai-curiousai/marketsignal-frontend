'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IPortfolioStrategy } from '@/types/simulation';
import { T, S } from '@/components/playground/pyramid/tokens';
import { getSectorColor, fmtWeight, getStrategyLabel } from './portfolio-tokens';

interface Props {
  strategy: IPortfolioStrategy;
  sectors: Record<string, string>;
  className?: string;
}

type SortKey = 'ticker' | 'sector' | 'weight' | 'riskContribution';
type SortDir = 'asc' | 'desc';

interface WeightRow {
  ticker: string;
  sector: string;
  weight: number;
  riskContribution: number;
}

// ─── Sort header ─────────────────────────────────────────────────

function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const isActive = currentSort === sortKey;

  return (
    <button
      type="button"
      className={cn(
        'flex items-center gap-0.5 group',
        align === 'right' && 'ml-auto',
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className={cn(
        T.badge,
        'uppercase tracking-wider',
        isActive ? 'text-white/60' : 'text-white/30 group-hover:text-white/45',
      )}>
        {label}
      </span>
      <ArrowUpDown className={cn(
        'h-2.5 w-2.5 transition-colors',
        isActive ? 'text-white/40' : 'text-white/15 group-hover:text-white/30',
        isActive && currentDir === 'desc' && 'rotate-180',
      )} />
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function WeightTable({ strategy, sectors, className }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('weight');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Build rows: merge weights with risk contributions
  const rows = useMemo(() => {
    const rcMap = new Map(
      strategy.riskContribution.map((r) => [r.ticker, r.riskContribution]),
    );

    const result: WeightRow[] = [];
    for (const [ticker, weight] of Object.entries(strategy.weights)) {
      if (weight < 0.001) continue; // Skip <0.1% allocations
      result.push({
        ticker,
        sector: sectors[ticker] ?? 'Other',
        weight,
        riskContribution: rcMap.get(ticker) ?? 0,
      });
    }
    return result;
  }, [strategy.weights, strategy.riskContribution, sectors]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'ticker':
          cmp = a.ticker.localeCompare(b.ticker);
          break;
        case 'sector':
          cmp = a.sector.localeCompare(b.sector);
          break;
        case 'weight':
          cmp = a.weight - b.weight;
          break;
        case 'riskContribution':
          cmp = a.riskContribution - b.riskContribution;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // Max weight for bar scaling
  const maxWeight = Math.max(...rows.map((r) => r.weight), 0.01);

  if (rows.length === 0) {
    return (
      <div className={cn(S.card, 'p-4', className)}>
        <p className="text-xs text-muted-foreground text-center py-4">
          No allocations above 0.1%.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>
          Weights — {getStrategyLabel(strategy.mode)}
        </h4>
        <span className={cn(T.badge, 'text-white/30')}>
          {rows.length} Stocks
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left pb-2 pr-3 sticky left-0 bg-transparent">
                <SortableHeader
                  label="Ticker"
                  sortKey="ticker"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
              </th>
              <th className="text-left pb-2 pr-3">
                <SortableHeader
                  label="Sector"
                  sortKey="sector"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
              </th>
              <th className="text-left pb-2 pr-3 min-w-[140px]">
                <SortableHeader
                  label="Weight"
                  sortKey="weight"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                />
              </th>
              <th className="text-right pb-2">
                <SortableHeader
                  label="Risk Contrib."
                  sortKey="riskContribution"
                  currentSort={sortKey}
                  currentDir={sortDir}
                  onSort={handleSort}
                  align="right"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const barWidth = (row.weight / maxWeight) * 100;
              const sectorColor = getSectorColor(row.sector);

              return (
                <motion.tr
                  key={row.ticker}
                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 + 0.2, type: 'spring', stiffness: 150, damping: 20 }}
                >
                  {/* Ticker */}
                  <td className="py-1.5 pr-3 sticky left-0">
                    <span className={cn(T.mono, 'text-white/80 font-medium')}>
                      {row.ticker}
                    </span>
                  </td>

                  {/* Sector with color dot */}
                  <td className="py-1.5 pr-3">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: sectorColor, opacity: 0.7 }}
                      />
                      <span className="text-[10px] text-white/50">{row.sector}</span>
                    </span>
                  </td>

                  {/* Weight with bar */}
                  <td className="py-1.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(T.monoSm, 'text-white/70 w-[42px] shrink-0')}>
                        {fmtWeight(row.weight)}
                      </span>
                      <div className="flex-1 h-3 rounded-full bg-white/[0.03] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: sectorColor, opacity: 0.5 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{
                            delay: i * 0.03 + 0.3,
                            type: 'spring',
                            stiffness: 80,
                            damping: 15,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Risk contribution */}
                  <td className="py-1.5 text-right">
                    <span className={cn(
                      T.monoSm,
                      row.riskContribution > row.weight * 1.3
                        ? 'text-rose-400/80'
                        : row.riskContribution < row.weight * 0.7
                        ? 'text-emerald-400/80'
                        : 'text-white/50',
                    )}>
                      {fmtWeight(row.riskContribution)}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
