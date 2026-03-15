'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSectorRisk,
  getSectorHistory,
  getSectorSeasonality,
  getSectorMansfield,
  getSectorFlow,
} from '@/src/lib/api/analyticsApi';
import type {
  ISectorAnalytics,
  ISectorRiskScorecard,
  ISectorHistory,
  ISectorSeasonality,
  ISectorMansfieldRS,
  ISectorVolumeFlow,
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
import { RiskRadarChart } from './RiskRadarChart';
import { HistoryChart } from './HistoryChart';
import { SeasonalityCalendar } from './SeasonalityCalendar';
import { MansfieldRSChart } from './MansfieldRSChart';
import { VolumeFlowGauge } from './VolumeFlowGauge';
import { SectorValuationPanel } from './SectorValuationPanel';
import { SectorFIIFlowPanel } from './SectorFIIFlowPanel';
import { SectorFinancialsPanel } from './SectorFinancialsPanel';
import { SectorEarningsCalendar } from './SectorEarningsCalendar';

interface SectorDetailPanelProps {
  selectedSector: ISectorAnalytics | null;
  allSectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
  onSectorSelect: (sector: ISectorAnalytics | null) => void;
  onDrillOpen: (sector: ISectorAnalytics) => void;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-4">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );
}

function NoData() {
  return (
    <div className="text-[10px] text-muted-foreground text-center py-3">
      Insufficient data
    </div>
  );
}

/** Lazy accordion section — mounts children on first expand, toggles visibility after. */
function LazySection({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [hasOpened, setHasOpened] = useState(defaultOpen);

  const toggle = () => {
    if (!open && !hasOpened) setHasOpened(true);
    setOpen((o) => !o);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors focus-visible:ring-2 focus-visible:ring-brand-blue/50 focus-visible:outline-none"
      >
        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {title}
          </span>
          {description && (
            <div className="text-[9px] text-muted-foreground/60 mt-0.5 truncate">{description}</div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-3 w-3 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2',
            open && 'rotate-180',
          )}
        />
      </button>
      {hasOpened && (
        <div
          className={cn(
            'px-3 pb-3 transition-all duration-200',
            !open && 'hidden',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** Section group header */
function SectionGroupLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-white/[0.06]" />
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium">{label}</span>
      <div className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

// ─── Self-fetching lazy sections ──────────────────────────────
// Each mounts only when its accordion opens, fetches its own data.

function LazyRiskSection({ sector, sectorColor }: { sector: string; sectorColor: string }) {
  const [data, setData] = useState<ISectorRiskScorecard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSectorRisk(sector)
      .then((r) => {
        if (!cancelled && r.success && r.data) setData(r.data);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sector]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <NoData />;
  return <RiskRadarChart data={data} sectorColor={sectorColor} />;
}

function LazyHistorySection({ sector, sectorColor }: { sector: string; sectorColor: string }) {
  const [data, setData] = useState<ISectorHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSectorHistory(sector, 252)
      .then((r) => {
        if (!cancelled && r.success && r.data) setData(r.data);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sector]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <NoData />;
  return <HistoryChart data={data} sectorColor={sectorColor} />;
}

function LazySeasonalitySection({ sector }: { sector: string }) {
  const [data, setData] = useState<ISectorSeasonality | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSectorSeasonality(sector)
      .then((r) => {
        if (!cancelled && r.success && r.data) setData(r.data);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sector]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <NoData />;
  return <SeasonalityCalendar data={data} />;
}

function LazyMansfieldSection({ sector, sectorColor }: { sector: string; sectorColor: string }) {
  const [data, setData] = useState<ISectorMansfieldRS | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSectorMansfield(sector, 252)
      .then((r) => {
        if (!cancelled && r.success && r.data) setData(r.data);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sector]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <NoData />;
  return <MansfieldRSChart data={data} sectorColor={sectorColor} />;
}

function LazyFlowSection({ sector }: { sector: string }) {
  const [data, setData] = useState<ISectorVolumeFlow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSectorFlow(sector)
      .then((r) => {
        if (!cancelled && r.success && r.data) setData(r.data);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [sector]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <NoData />;
  return <VolumeFlowGauge data={data} />;
}

// ─── Main Component ──────────────────────────────────────────

export function SectorDetailPanel({
  selectedSector,
  allSectors,
  timeframe,
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

  // ─── OVERVIEW MODE ─── (no sector selected)
  if (!selectedSector) {
    return (
      <div className="space-y-4">
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
                      ₹{stock.last_price.toLocaleString()}
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

        {/* ─── Fundamentals ─── */}
        <SectionGroupLabel label="Fundamentals" />

        <LazySection title="Valuation" description="PE, PB, DY, EV/EBITDA, ROE — market-cap weighted">
          <SectorValuationPanel sector={selectedSector.sector} />
        </LazySection>

        <LazySection title="Financials" description="Revenue, EBITDA, PAT with YoY growth">
          <SectorFinancialsPanel sector={selectedSector.sector} />
        </LazySection>

        <LazySection title="Earnings Calendar" description="Upcoming and recent earnings dates">
          <SectorEarningsCalendar sector={selectedSector.sector} />
        </LazySection>

        {/* ─── Institutional ─── */}
        <SectionGroupLabel label="Institutional" />

        <LazySection title="FII / FPI Sector Flow" description="Quarterly ownership trends across investor categories">
          <SectorFIIFlowPanel sector={selectedSector.sector} />
        </LazySection>

        <LazySection title="Performance vs NIFTY 50" description="Cumulative returns and drawdown vs benchmark">
          <LazyHistorySection sector={selectedSector.sector} sectorColor={sectorColor} />
        </LazySection>

        {/* ─── Technical ─── */}
        <SectionGroupLabel label="Technical" />

        <LazySection title="Risk Scorecard" description="Sharpe, Sortino, Calmar ratios and max drawdown">
          <LazyRiskSection sector={selectedSector.sector} sectorColor={sectorColor} />
        </LazySection>

        <LazySection title="Mansfield RS" description="Relative strength stage analysis vs NIFTY 50">
          <LazyMansfieldSection sector={selectedSector.sector} sectorColor={sectorColor} />
        </LazySection>

        <LazySection title="Seasonality" description="Monthly return patterns and hit rates">
          <LazySeasonalitySection sector={selectedSector.sector} />
        </LazySection>

        <LazySection title="Volume Flow" description="OBV-based accumulation/distribution analysis">
          <LazyFlowSection sector={selectedSector.sector} />
        </LazySection>
      </motion.div>
    </AnimatePresence>
  );
}
