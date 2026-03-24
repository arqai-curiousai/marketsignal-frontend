'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/src/lib/exchange/formatting';
import type { ExchangeCode } from '@/src/lib/exchange/config';
import type {
  ISectorAnalytics,
  SectorTimeframe,
} from '@/types/analytics';
import {
  SECTOR_COLORS,
  RRG_QUADRANT_COLORS,
  RRG_QUADRANT_LABELS,
  perfTextClass,
} from './constants';
import { SectorRRG } from './SectorRRG';
import { SectorBreadthPanel } from './SectorBreadthPanel';
import { SectorDetailTabs } from './SectorDetailTabs';

interface SectorDetailPanelProps {
  selectedSector: ISectorAnalytics | null;
  allSectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
  exchange: string;
  onSectorSelect: (sector: ISectorAnalytics | null) => void;
  onDrillOpen: (sector: ISectorAnalytics) => void;
}


/** Map global timeframe to trading-days for detail section API calls. */
function timeframeToDays(tf: SectorTimeframe): number {
  switch (tf) {
    case '1d': return 20;    // show at least 1 month context
    case '1w': return 30;
    case '1m': return 60;
    case '3m': return 90;
    case '6m': return 126;
    case 'ytd': return 252;
    default: return 252;
  }
}


// ─── Main Component ──────────────────────────────────────────

export function SectorDetailPanel({
  selectedSector,
  allSectors,
  timeframe,
  exchange,
  onSectorSelect,
  onDrillOpen,
}: SectorDetailPanelProps) {
  const router = useRouter();

  const handleStockClick = useCallback(
    (ticker: string) => {
      router.push(`/stocks/${ticker}`);
    },
    [router],
  );

  // Sort sectors for top/bottom lists
  const sortedByPerf = [...allSectors].sort(
    (a, b) => (b.performance[timeframe] ?? 0) - (a.performance[timeframe] ?? 0),
  );

  const timeframeDays = timeframeToDays(timeframe);

  // ─── OVERVIEW MODE ─── (no sector selected)
  if (!selectedSector) {
    // Compute rotation summary from RRG data
    const quadrantCounts: Record<string, number> = { leading: 0, improving: 0, weakening: 0, lagging: 0 };
    allSectors.forEach((s) => {
      const q = s.rrg?.quadrant;
      if (q && q in quadrantCounts) quadrantCounts[q]++;
    });
    const totalQ = Object.values(quadrantCounts).reduce((a, b) => a + b, 0);
    const bullish = quadrantCounts.leading + quadrantCounts.improving;
    const bearish = quadrantCounts.weakening + quadrantCounts.lagging;
    const regime = bullish > bearish * 1.5 ? 'Risk-On' : bearish > bullish * 1.5 ? 'Risk-Off' : bullish === bearish ? 'Consolidation' : 'Rotation';
    const regimeColor = regime === 'Risk-On' ? 'text-emerald-400' : regime === 'Risk-Off' ? 'text-red-400' : regime === 'Rotation' ? 'text-amber-400' : 'text-slate-400';

    // Compute sector pulse narrative
    const topSector = sortedByPerf[0];
    const bottomSector = sortedByPerf[sortedByPerf.length - 1];
    const avgBreadth = allSectors.reduce((sum, s) => sum + (s.breadth?.above_50dma_pct ?? 0), 0) / (allSectors.length || 1);
    const accumulating = allSectors.filter((s) => (s.volume_flow_score ?? 0) > 20).length;
    const distributing = allSectors.filter((s) => (s.volume_flow_score ?? 0) < -20).length;

    const pulseFragments: string[] = [];
    if (topSector) {
      const topPerf = topSector.performance[timeframe] ?? 0;
      pulseFragments.push(`${topSector.sector} leads (${topPerf >= 0 ? '+' : ''}${topPerf.toFixed(1)}%)`);
    }
    if (bottomSector && bottomSector.sector !== topSector?.sector) {
      const botPerf = bottomSector.performance[timeframe] ?? 0;
      pulseFragments.push(`${bottomSector.sector} lags (${botPerf >= 0 ? '+' : ''}${botPerf.toFixed(1)}%)`);
    }
    if (accumulating > 0) pulseFragments.push(`${accumulating} sector${accumulating > 1 ? 's' : ''} accumulating`);
    else if (distributing > 0) pulseFragments.push(`${distributing} sector${distributing > 1 ? 's' : ''} distributing`);
    pulseFragments.push(`breadth ${avgBreadth.toFixed(0)}%`);

    return (
      <div className="space-y-4">
        {/* Sector Pulse — AI-style narrative summary */}
        <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sector Pulse</span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', {
              'bg-emerald-500/10 text-emerald-400': regime === 'Risk-On',
              'bg-red-500/10 text-red-400': regime === 'Risk-Off',
              'bg-amber-500/10 text-amber-400': regime === 'Rotation',
              'bg-slate-500/10 text-slate-400': regime === 'Consolidation',
            })}>{regime}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-white/80">
            {pulseFragments.join('. ')}.
          </p>
        </div>

        {/* Rotation Regime Summary */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sector Rotation</span>
            <span className={cn('text-xs font-bold', regimeColor)}>{regime}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">{quadrantCounts.leading} Leading</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-muted-foreground">{quadrantCounts.improving} Improving</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">{quadrantCounts.weakening} Weakening</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span className="text-muted-foreground">{quadrantCounts.lagging} Lagging</span>
            </span>
          </div>
        </div>

        {/* Mini Sector Grid — click to select */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Quick Select
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {allSectors.map((s) => {
              const p = s.performance[timeframe] ?? 0;
              return (
                <button
                  key={s.sector}
                  onClick={() => onSectorSelect(s)}
                  className="rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.06] transition-colors border border-white/[0.04]"
                  style={{ borderLeftColor: SECTOR_COLORS[s.sector] ?? '#64748B', borderLeftWidth: 3 }}
                >
                  <div className="text-[9px] font-medium text-white truncate">{s.sector}</div>
                  <div className={cn('text-[9px] font-semibold tabular-nums', perfTextClass(p))}>
                    {p >= 0 ? '+' : ''}{p.toFixed(1)}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <SectorRRG sectors={allSectors} onSectorClick={onSectorSelect} />
        <SectorBreadthPanel sectors={allSectors} />

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Top Performers ({timeframe})
          </div>
          <div className="space-y-1.5">
            {sortedByPerf.slice(0, 3).map((s) => {
              const perf = s.performance[timeframe] ?? 0;
              return (
                <button
                  key={s.sector}
                  onClick={() => onSectorSelect(s)}
                  className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: SECTOR_COLORS[s.sector] ?? '#64748B' }}
                    />
                    <span className="text-xs font-medium text-white">{s.sector}</span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold tabular-nums',
                      perfTextClass(perf),
                    )}
                  >
                    {perf >= 0 ? '+' : ''}
                    {perf.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/5 mt-2 pt-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              Bottom Performers
            </div>
            <div className="space-y-1.5">
              {sortedByPerf
                .slice(-3)
                .reverse()
                .map((s) => {
                  const perf = s.performance[timeframe] ?? 0;
                  return (
                    <button
                      key={s.sector}
                      onClick={() => onSectorSelect(s)}
                      className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: SECTOR_COLORS[s.sector] ?? '#64748B' }}
                        />
                        <span className="text-xs font-medium text-white">{s.sector}</span>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-semibold tabular-nums',
                          perfTextClass(perf),
                        )}
                      >
                        {perf >= 0 ? '+' : ''}
                        {perf.toFixed(2)}%
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── SELECTED MODE ─── (sector selected — lazy accordion)
  const sectorColor = SECTOR_COLORS[selectedSector.sector] ?? '#64748B';
  const rrg = selectedSector.rrg;
  const perf = selectedSector.performance;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedSector.sector}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="space-y-2 overflow-y-auto"
      >
        {/* ─── Header (always visible) ─── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: sectorColor }} />
              <span className="text-sm font-bold text-white">{selectedSector.sector}</span>
            </div>
            <button
              onClick={() => onSectorSelect(null)}
              aria-label="Close sector detail"
              className="p-1 rounded-md hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:outline-none"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                selectedSector.avg_change_pct >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400',
              )}
            >
              {selectedSector.avg_change_pct >= 0 ? '+' : ''}
              {selectedSector.avg_change_pct.toFixed(2)}%
            </span>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${RRG_QUADRANT_COLORS[rrg.quadrant]}20`,
                color: RRG_QUADRANT_COLORS[rrg.quadrant],
              }}
            >
              {RRG_QUADRANT_LABELS[rrg.quadrant]}
            </span>
            <span className="text-[9px] text-muted-foreground">
              Mom: {selectedSector.momentum_score.toFixed(0)}/100
            </span>
          </div>

          {/* Performance strip */}
          <div className="grid grid-cols-6 gap-1 mt-3">
            {(['1d', '1w', '1m', '3m', '6m', 'ytd'] as const).map((tf) => {
              const val = perf[tf] ?? 0;
              return (
                <div
                  key={tf}
                  className={cn(
                    'rounded-lg p-1.5 text-center border',
                    tf === timeframe
                      ? 'border-brand-blue/30 bg-brand-blue/5'
                      : 'border-white/5 bg-white/[0.02]',
                  )}
                >
                  <div className="text-[9px] text-muted-foreground uppercase">{tf}</div>
                  <div
                    className={cn(
                      'text-[10px] font-semibold tabular-nums',
                      perfTextClass(val),
                    )}
                  >
                    {val >= 0 ? '+' : ''}
                    {val.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Breadth (always visible) ─── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '> 200 DMA', val: selectedSector.breadth.above_200dma_pct },
              { label: '> 50 DMA', val: selectedSector.breadth.above_50dma_pct },
              { label: '> 20 DMA', val: selectedSector.breadth.above_20dma_pct },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-[9px] text-muted-foreground mb-1">{label}</div>
                <div className="relative h-10 w-10 mx-auto">
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
                    <span className="text-[10px] font-bold text-white">{val.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 mt-2 text-[9px] text-muted-foreground">
            <span>
              Adv: <span className="text-emerald-400">{selectedSector.breadth.advancing}</span>
            </span>
            <span>
              Dec: <span className="text-red-400">{selectedSector.breadth.declining}</span>
            </span>
            <span>
              A/D: <span className="text-white">{selectedSector.breadth.ad_ratio.toFixed(2)}</span>
            </span>
          </div>
        </div>

        {/* ─── Top Movers (always visible) ─── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Top Movers ({selectedSector.stock_count} stocks)
          </div>
          <div className="space-y-1">
            {selectedSector.stocks.slice(0, 5).map((stock) => (
              <button
                key={stock.ticker}
                onClick={() => handleStockClick(stock.ticker)}
                className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
              >
                <div>
                  <span className="text-[11px] font-semibold text-white">{stock.ticker}</span>
                  {stock.last_price != null && (
                    <span className="text-[9px] text-muted-foreground ml-1.5">
                      {formatPrice(stock.last_price, exchange as ExchangeCode)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {stock.volume_ratio != null && (
                    <span
                      className={cn(
                        'text-[9px] tabular-nums',
                        stock.volume_ratio > 1.5 ? 'text-emerald-400' : 'text-muted-foreground',
                      )}
                    >
                      {stock.volume_ratio.toFixed(1)}x
                    </span>
                  )}
                  <span
                    className={cn(
                      'text-[11px] font-medium tabular-nums',
                      perfTextClass(stock.change_pct),
                    )}
                  >
                    {stock.change_pct >= 0 ? '+' : ''}
                    {stock.change_pct.toFixed(2)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => onDrillOpen(selectedSector)}
            className="flex items-center justify-center gap-1 w-full mt-2 py-2 rounded-lg border border-white/[0.06] text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            View All Stocks <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* ─── Smart Tabs ─── */}
        <SectorDetailTabs
          sector={selectedSector.sector}
          sectorColor={sectorColor}
          exchange={exchange}
          timeframeDays={timeframeDays}
        />
      </motion.div>
    </AnimatePresence>
  );
}
