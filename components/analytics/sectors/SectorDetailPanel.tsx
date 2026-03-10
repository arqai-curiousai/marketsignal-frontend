'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
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
  MANSFIELD_STAGE_COLORS,
  perfTextClass,
  formatMarketCap,
} from './constants';
import { SectorRRG } from './SectorRRG';
import { SectorBreadthPanel } from './SectorBreadthPanel';
import { RiskRadarChart } from './RiskRadarChart';
import { HistoryChart } from './HistoryChart';
import { SeasonalityCalendar } from './SeasonalityCalendar';
import { MansfieldRSChart } from './MansfieldRSChart';
import { VolumeFlowGauge } from './VolumeFlowGauge';

interface SectorDetailPanelProps {
  selectedSector: ISectorAnalytics | null;
  allSectors: ISectorAnalytics[];
  timeframe: SectorTimeframe;
  onSectorSelect: (sector: ISectorAnalytics | null) => void;
  onDrillOpen: (sector: ISectorAnalytics) => void;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
      {children}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-4">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );
}

export function SectorDetailPanel({
  selectedSector,
  allSectors,
  timeframe,
  onSectorSelect,
  onDrillOpen,
}: SectorDetailPanelProps) {
  const router = useRouter();

  // On-demand data states
  const [riskData, setRiskData] = useState<ISectorRiskScorecard | null>(null);
  const [historyData, setHistoryData] = useState<ISectorHistory | null>(null);
  const [seasonalityData, setSeasonalityData] = useState<ISectorSeasonality | null>(null);
  const [mansfieldData, setMansfieldData] = useState<ISectorMansfieldRS | null>(null);
  const [flowData, setFlowData] = useState<ISectorVolumeFlow | null>(null);

  const [riskLoading, setRiskLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [seasonalityLoading, setSeasonalityLoading] = useState(false);
  const [mansfieldLoading, setMansfieldLoading] = useState(false);
  const [flowLoading, setFlowLoading] = useState(false);

  // Fetch all on-demand data when sector changes
  useEffect(() => {
    if (!selectedSector) {
      setRiskData(null);
      setHistoryData(null);
      setSeasonalityData(null);
      setMansfieldData(null);
      setFlowData(null);
      return;
    }

    const sectorName = selectedSector.sector;
    let cancelled = false;

    // Fetch risk
    setRiskLoading(true);
    getSectorRisk(sectorName).then((r) => {
      if (!cancelled && r.success && r.data) setRiskData(r.data);
      if (!cancelled) setRiskLoading(false);
    });

    // Fetch history
    setHistoryLoading(true);
    getSectorHistory(sectorName, 252).then((r) => {
      if (!cancelled && r.success && r.data) setHistoryData(r.data);
      if (!cancelled) setHistoryLoading(false);
    });

    // Fetch seasonality
    setSeasonalityLoading(true);
    getSectorSeasonality(sectorName).then((r) => {
      if (!cancelled && r.success && r.data) setSeasonalityData(r.data);
      if (!cancelled) setSeasonalityLoading(false);
    });

    // Fetch mansfield
    setMansfieldLoading(true);
    getSectorMansfield(sectorName, 252).then((r) => {
      if (!cancelled && r.success && r.data) setMansfieldData(r.data);
      if (!cancelled) setMansfieldLoading(false);
    });

    // Fetch flow
    setFlowLoading(true);
    getSectorFlow(sectorName).then((r) => {
      if (!cancelled && r.success && r.data) setFlowData(r.data);
      if (!cancelled) setFlowLoading(false);
    });

    return () => { cancelled = true; };
  }, [selectedSector]);

  const handleStockClick = useCallback((ticker: string) => {
    router.push(`/stocks/${ticker}`);
  }, [router]);

  // Sort sectors for top/bottom lists
  const sortedByPerf = [...allSectors].sort(
    (a, b) => (b.performance[timeframe] ?? 0) - (a.performance[timeframe] ?? 0),
  );

  // ─── OVERVIEW MODE ─── (no sector selected)
  if (!selectedSector) {
    return (
      <div className="space-y-4">
        {/* Compact RRG */}
        <SectorRRG sectors={allSectors} onSectorClick={onSectorSelect} />

        {/* Compact Breadth */}
        <SectorBreadthPanel sectors={allSectors} />

        {/* Top / Bottom performers */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <SectionHeader>Top Performers ({timeframe})</SectionHeader>
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
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[s.sector] ?? '#64748B' }} />
                    <span className="text-xs font-medium text-white">{s.sector}</span>
                  </div>
                  <span className={cn('text-xs font-semibold tabular-nums', perfTextClass(perf))}>
                    {perf >= 0 ? '+' : ''}{perf.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/5 mt-2 pt-2">
            <SectionHeader>Bottom Performers</SectionHeader>
            <div className="space-y-1.5">
              {sortedByPerf.slice(-3).reverse().map((s) => {
                const perf = s.performance[timeframe] ?? 0;
                return (
                  <button
                    key={s.sector}
                    onClick={() => onSectorSelect(s)}
                    className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[s.sector] ?? '#64748B' }} />
                      <span className="text-xs font-medium text-white">{s.sector}</span>
                    </div>
                    <span className={cn('text-xs font-semibold tabular-nums', perfTextClass(perf))}>
                      {perf >= 0 ? '+' : ''}{perf.toFixed(2)}%
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

  // ─── SELECTED MODE ─── (sector selected — deep analytics)
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
        className="space-y-3 overflow-y-auto"
      >
        {/* ─── Header ─── */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: sectorColor }} />
              <span className="text-sm font-bold text-white">{selectedSector.sector}</span>
            </div>
            <button
              onClick={() => onSectorSelect(null)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
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
            {mansfieldData && (
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${MANSFIELD_STAGE_COLORS[mansfieldData.stage] ?? '#94A3B8'}20`,
                  color: MANSFIELD_STAGE_COLORS[mansfieldData.stage] ?? '#94A3B8',
                }}
              >
                {mansfieldData.stage}
              </span>
            )}
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
                  <div className="text-[8px] text-muted-foreground uppercase">{tf}</div>
                  <div className={cn('text-[10px] font-semibold tabular-nums', perfTextClass(val))}>
                    {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Risk Radar ─── */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <SectionHeader>Risk Scorecard</SectionHeader>
          {riskLoading ? <LoadingSpinner /> : riskData ? (
            <RiskRadarChart data={riskData} sectorColor={sectorColor} />
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-3">Insufficient data</div>
          )}
        </div>

        {/* ─── History Chart ─── */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <SectionHeader>Performance vs NIFTY 50</SectionHeader>
          {historyLoading ? <LoadingSpinner /> : historyData ? (
            <HistoryChart data={historyData} sectorColor={sectorColor} />
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-3">Insufficient data</div>
          )}
        </div>

        {/* ─── Seasonality ─── */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <SectionHeader>Seasonality Calendar</SectionHeader>
          {seasonalityLoading ? <LoadingSpinner /> : seasonalityData ? (
            <SeasonalityCalendar data={seasonalityData} />
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-3">Insufficient data</div>
          )}
        </div>

        {/* ─── Mansfield RS ─── */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <SectionHeader>Mansfield Relative Strength</SectionHeader>
          {mansfieldLoading ? <LoadingSpinner /> : mansfieldData ? (
            <MansfieldRSChart data={mansfieldData} sectorColor={sectorColor} />
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-3">Insufficient data</div>
          )}
        </div>

        {/* ─── Volume Flow ─── */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <SectionHeader>Volume Flow (OBV)</SectionHeader>
          {flowLoading ? <LoadingSpinner /> : flowData ? (
            <VolumeFlowGauge data={flowData} />
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-3">Insufficient data</div>
          )}
        </div>

        {/* ─── Breadth gauges ─── */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <SectionHeader>Breadth</SectionHeader>
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
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <circle
                      cx="24" cy="24" r="20" fill="none"
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
            <span>Adv: <span className="text-emerald-400">{selectedSector.breadth.advancing}</span></span>
            <span>Dec: <span className="text-red-400">{selectedSector.breadth.declining}</span></span>
            <span>A/D: <span className="text-white">{selectedSector.breadth.ad_ratio.toFixed(2)}</span></span>
          </div>
        </div>

        {/* ─── Top Stocks ─── */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
          <SectionHeader>Top Movers ({selectedSector.stock_count} stocks)</SectionHeader>
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
                    <span className={cn(
                      'text-[9px] tabular-nums',
                      stock.volume_ratio > 1.5 ? 'text-emerald-400' : 'text-muted-foreground',
                    )}>
                      {stock.volume_ratio.toFixed(1)}x
                    </span>
                  )}
                  <span className={cn('text-[11px] font-medium tabular-nums', perfTextClass(stock.change_pct))}>
                    {stock.change_pct >= 0 ? '+' : ''}{stock.change_pct.toFixed(2)}%
                  </span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => onDrillOpen(selectedSector)}
            className="flex items-center justify-center gap-1 w-full mt-2 py-2 rounded-lg border border-white/10 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            View All Stocks <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
