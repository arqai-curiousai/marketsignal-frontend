'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';
import type { SectorViewMode, SortOption } from './constants';
import type { PyramidColorMode } from '../pyramid/constants';
import { useUnifiedSectorData } from './hooks/useUnifiedSectorData';
import { UnifiedToolbar } from './UnifiedToolbar';
import { UnifiedKPICards } from './UnifiedKPICards';
import { UnifiedDetailPanel } from './UnifiedDetailPanel';
import { SectorTreemap } from './SectorTreemap';
import { SectorHeatmapGrid } from './SectorHeatmapGrid';
import { SectorPerformanceTable } from './SectorPerformanceTable';
import { SectorFlowView } from './SectorFlowView';
import { SectorDrillSheet } from './SectorDrillSheet';
import { PyramidView } from '../pyramid/PyramidView';
import { PyramidMobileFallback } from '../pyramid/PyramidMobileFallback';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getExchangeConfig } from '@/src/lib/exchange/config';

// ─── URL param helpers ─────────────────────────────────────────────────
const VALID_VIEWS = new Set<SectorViewMode>(['treemap', 'heatmap', 'table', 'flow', 'pyramid']);
const VALID_TF = new Set<SectorTimeframe>(['1d', '1w', '1m', '3m', '6m', 'ytd']);

function readUrlParams() {
  if (typeof window === 'undefined') return {};
  const sp = new URLSearchParams(window.location.search);
  return {
    view: sp.get('view') as SectorViewMode | null,
    tf: sp.get('tf') as SectorTimeframe | null,
    sector: sp.get('sector'),
    stock: sp.get('stock'),
  };
}

function writeUrlParams(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  }
  window.history.replaceState({}, '', url.toString());
}

interface UnifiedSectorDashboardProps {
  exchange: string;
}

export function UnifiedSectorDashboard({ exchange }: UnifiedSectorDashboardProps) {
  const {
    sectors,
    pyramidSectors,
    kpi,
    loading,
    computedAt,
    refreshing,
    refetch,
  } = useUnifiedSectorData(exchange);

  // Read initial state from URL params
  const urlParams = readUrlParams();

  // View + controls — default to heatmap on mobile (treemap tiles are too small)
  const defaultView = (): SectorViewMode => {
    if (urlParams.view && VALID_VIEWS.has(urlParams.view)) return urlParams.view;
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return 'heatmap';
    return 'treemap';
  };
  const [viewMode, setViewMode] = useState<SectorViewMode>(defaultView);
  const [timeframe, setTimeframe] = useState<SectorTimeframe>(
    urlParams.tf && VALID_TF.has(urlParams.tf) ? urlParams.tf : '1d',
  );
  const [sortBy, setSortBy] = useState<SortOption>('performance');
  const [colorMode, setColorMode] = useState<PyramidColorMode>('performance');

  // Selection state — sector/stock restored after data loads
  const [pendingSector] = useState(urlParams.sector);
  const [pendingStock] = useState(urlParams.stock);
  const [selectedSector, setSelectedSector] = useState<ISectorAnalytics | null>(null);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  // Track mobile breakpoint reactively (avoids SSR mismatch + responds to resize)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Restore sector/stock selection from URL once data is loaded
  useEffect(() => {
    if (sectors.length === 0) return;
    if (pendingSector && !selectedSector) {
      const found = sectors.find((s) => s.sector === pendingSector);
      if (found) {
        setSelectedSector(found);
        if (pendingStock) setSelectedStock(pendingStock);
      }
    }
  }, [sectors, pendingSector, pendingStock, selectedSector]);

  // Sync state changes back to URL
  const updateViewMode = useCallback((mode: SectorViewMode) => {
    setViewMode(mode);
    writeUrlParams({ view: mode === 'treemap' ? null : mode });
  }, []);

  const updateTimeframe = useCallback((tf: SectorTimeframe) => {
    setTimeframe(tf);
    writeUrlParams({ tf: tf === '1d' ? null : tf });
  }, []);

  // ─── Auto-refresh: poll every 5 min during market hours ─────────────────
  useEffect(() => {
    const POLL_MS = 5 * 60 * 1000;
    const cfg = getExchangeConfig(exchange);

    function isMarketOpen(): boolean {
      const now = new Date();
      const tz = cfg.timezone;
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'short',
      }).formatToParts(now);
      const weekday = parts.find(p => p.type === 'weekday')?.value ?? '';
      if (['Sat', 'Sun'].includes(weekday)) return false;
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
      const nowMin = hour * 60 + minute;
      const [openH, openM] = cfg.marketOpen.split(':').map(Number);
      const [closeH, closeM] = cfg.marketClose.split(':').map(Number);
      return nowMin >= openH * 60 + openM && nowMin <= closeH * 60 + closeM;
    }

    const interval = setInterval(() => {
      if (isMarketOpen()) refetch();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [refetch, exchange]);

  // Drill sheet
  const [drillSector, setDrillSector] = useState<ISectorAnalytics | null>(null);
  const [drillOpen, setDrillOpen] = useState(false);

  // Detail panel mode
  const detailMode = selectedStock
    ? ('stock' as const)
    : selectedSector
      ? ('sector' as const)
      : ('overview' as const);

  // Sorted sectors for non-pyramid views
  const sortedSectors = useMemo(() => {
    const copy = [...sectors];
    switch (sortBy) {
      case 'performance':
        return copy.sort(
          (a, b) => (b.performance[timeframe] ?? 0) - (a.performance[timeframe] ?? 0),
        );
      case 'market_cap':
        return copy.sort(
          (a, b) => (b.total_market_cap ?? 0) - (a.total_market_cap ?? 0),
        );
      case 'momentum':
        return copy.sort((a, b) => b.momentum_score - a.momentum_score);
      default:
        return copy;
    }
  }, [sectors, sortBy, timeframe]);

  // Sector click from treemap/heatmap/table/flow (receives ISectorAnalytics)
  const handleSectorClick = useCallback((sector: ISectorAnalytics) => {
    setSelectedStock(null);
    setSelectedSector(sector);
    writeUrlParams({ sector: sector.sector, stock: null });
  }, []);

  // Sector click from pyramid (receives sector name string)
  const handlePyramidSectorClick = useCallback(
    (sectorName: string) => {
      setSelectedStock(null);
      const found = sectors.find((s) => s.sector === sectorName);
      const next = found && selectedSector?.sector === sectorName ? null : (found ?? null);
      setSelectedSector(next);
      writeUrlParams({ sector: next?.sector ?? null, stock: null });
    },
    [sectors, selectedSector],
  );

  // Stock click from pyramid
  const handlePyramidStockClick = useCallback(
    (ticker: string, sectorName: string) => {
      const found = sectors.find((s) => s.sector === sectorName);
      if (found) setSelectedSector(found);
      const next = selectedStock === ticker ? null : ticker;
      setSelectedStock(next);
      writeUrlParams({ sector: found?.sector ?? null, stock: next });
    },
    [sectors, selectedStock],
  );

  const handleStockClose = useCallback(() => {
    setSelectedStock(null);
    writeUrlParams({ stock: null });
  }, []);

  const handleDrillOpen = useCallback((sector: ISectorAnalytics) => {
    setDrillSector(sector);
    setDrillOpen(true);
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
        <p>Sector analytics not yet available. Data is computed every 5 minutes.</p>
      </div>
    );
  }

  const isPyramid = viewMode === 'pyramid';

  return (
    <div className="space-y-3">
      {/* Status Line */}
      <UnifiedKPICards
        sectors={sectors}
        kpi={kpi}
        timeframe={timeframe}
        computedAt={computedAt}
      />

      {/* Toolbar */}
      <UnifiedToolbar
        viewMode={viewMode}
        timeframe={timeframe}
        sortBy={sortBy}
        colorMode={colorMode}
        onViewModeChange={updateViewMode}
        onTimeframeChange={updateTimeframe}
        onSortChange={setSortBy}
        onColorModeChange={setColorMode}
        onRefresh={refetch}
        refreshing={refreshing}
      />

      {/* Main: Visualization + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Active View */}
        <div className="min-w-0">
          {viewMode === 'treemap' && (
            <SectorTreemap
              sectors={sortedSectors}
              timeframe={timeframe}
              selectedSector={selectedSector?.sector ?? null}
              onSectorClick={handleSectorClick}
            />
          )}
          {viewMode === 'heatmap' && (
            <SectorHeatmapGrid
              sectors={sortedSectors}
              timeframe={timeframe}
              selectedSector={selectedSector?.sector ?? null}
              onSectorClick={handleSectorClick}
            />
          )}
          {viewMode === 'table' && (
            <SectorPerformanceTable
              sectors={sortedSectors}
              timeframe={timeframe}
              selectedSector={selectedSector?.sector ?? null}
              onSectorClick={handleSectorClick}
            />
          )}
          {viewMode === 'flow' && (
            <SectorFlowView
              sectors={sortedSectors}
              timeframe={timeframe}
              selectedSector={selectedSector?.sector ?? null}
              onSectorClick={handleSectorClick}
            />
          )}
          {isPyramid && (
            <>
              {/* Desktop: SVG pyramid */}
              <div className="hidden lg:block rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3">
                <PyramidView
                  sectors={pyramidSectors}
                  timeframe={timeframe}
                  colorMode={colorMode}
                  selectedSector={selectedSector?.sector ?? null}
                  selectedStock={selectedStock}
                  onSectorClick={handlePyramidSectorClick}
                  onStockClick={handlePyramidStockClick}
                />
              </div>
              {/* Mobile: accordion fallback */}
              <div className="lg:hidden">
                <PyramidMobileFallback
                  sectors={pyramidSectors}
                  onStockClick={handlePyramidStockClick}
                />
              </div>
            </>
          )}
        </div>

        {/* Detail Panel — sticky + independently scrollable */}
        <div className="hidden lg:block max-h-[calc(100vh-160px)] overflow-y-auto sticky top-4 custom-scrollbar">
          <UnifiedDetailPanel
            mode={detailMode}
            sectors={sectors}
            selectedSector={selectedSector}
            selectedStock={selectedStock}
            timeframe={timeframe}
            exchange={exchange}
            onSectorSelect={setSelectedSector}
            onDrillOpen={handleDrillOpen}
            onStockClose={handleStockClose}
          />
        </div>
        {/* Mobile detail — bottom sheet that slides up when sector selected */}
        <Sheet
          open={!!selectedSector && isMobile}
          onOpenChange={(open) => { if (!open) { setSelectedSector(null); setSelectedStock(null); writeUrlParams({ sector: null, stock: null }); } }}
        >
          <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto bg-background border-t border-white/10 rounded-t-2xl px-4 pt-2 pb-6">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-sm font-bold text-white">
                {selectedSector?.sector ?? 'Sector Details'}
              </SheetTitle>
            </SheetHeader>
            <UnifiedDetailPanel
              mode={detailMode}
              sectors={sectors}
              selectedSector={selectedSector}
              selectedStock={selectedStock}
              timeframe={timeframe}
              onSectorSelect={setSelectedSector}
              onDrillOpen={handleDrillOpen}
              onStockClose={handleStockClose}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Drill-down Sheet */}
      <SectorDrillSheet
        sector={drillSector}
        open={drillOpen}
        onOpenChange={setDrillOpen}
        timeframe={timeframe}
      />
    </div>
  );
}
