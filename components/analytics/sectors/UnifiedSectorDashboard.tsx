'use client';

import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';
import type { SectorViewMode, SortOption } from './constants';
import { SECTOR_COLORS } from './constants';
import type { PyramidColorMode } from '../pyramid/constants';
import { useUnifiedSectorData } from './hooks/useUnifiedSectorData';
import { UnifiedToolbar } from './UnifiedToolbar';
import { UnifiedKPICards } from './UnifiedKPICards';
import { UnifiedDetailPanel } from './UnifiedDetailPanel';
import { SectorHeatmapGrid } from './SectorHeatmapGrid'; // Eager: default mobile view
import { SectorDrillSheet } from './SectorDrillSheet';
import { PyramidMobileFallback } from '../pyramid/PyramidMobileFallback';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getExchangeConfig, type ExchangeCode } from '@/src/lib/exchange/config';
import { downloadCSV, downloadPNG } from '@/src/lib/utils/export';

// Lazy-loaded view components — only the active view is loaded
const SectorTreemap = lazy(() => import('./SectorTreemap').then(m => ({ default: m.SectorTreemap })));
const SectorPerformanceTable = lazy(() => import('./SectorPerformanceTable').then(m => ({ default: m.SectorPerformanceTable })));
const SectorFlowView = lazy(() => import('./SectorFlowView').then(m => ({ default: m.SectorFlowView })));
const PyramidView = lazy(() => import('../pyramid/PyramidView').then(m => ({ default: m.PyramidView })));

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
  if (typeof window === 'undefined') return;
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

  // View + controls — SSR-safe default; mobile override applied in useEffect below
  const defaultView = (): SectorViewMode => {
    if (urlParams.view && VALID_VIEWS.has(urlParams.view)) return urlParams.view;
    return 'treemap';
  };
  const [viewMode, setViewMode] = useState<SectorViewMode>(defaultView);
  const [timeframe, setTimeframe] = useState<SectorTimeframe>(
    urlParams.tf && VALID_TF.has(urlParams.tf) ? urlParams.tf : '1d',
  );
  const [sortBy, setSortBy] = useState<SortOption>('performance');
  const [colorMode, setColorMode] = useState<PyramidColorMode>('performance');

  // Selection state — sector/stock restored after data loads (read-only from URL)
  const pendingSector = useRef(urlParams.sector).current;
  const pendingStock = useRef(urlParams.stock).current;
  const [selectedSector, setSelectedSector] = useState<ISectorAnalytics | null>(null);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  // Colorblind toggle: increment key to force visualization re-render without API refetch
  const [colorblindKey, setColorblindKey] = useState(0);
  const handleColorblindToggle = useCallback(() => setColorblindKey(k => k + 1), []);

  // Track mobile breakpoint reactively (avoids SSR mismatch + responds to resize)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Apply mobile-friendly default view on first client render
      if (mobile && !urlParams.view) setViewMode('heatmap');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Keyboard shortcuts ────────────────────────────────────────────────
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'Escape':
          if (selectedStock) { setSelectedStock(null); writeUrlParams({ stock: null }); }
          else if (selectedSector) { setSelectedSector(null); writeUrlParams({ sector: null }); }
          else if (showShortcuts) setShowShortcuts(false);
          break;
        case '1': updateViewMode('treemap'); break;
        case '2': updateViewMode('heatmap'); break;
        case '3': updateViewMode('table'); break;
        case '4': updateViewMode('flow'); break;
        case '5': updateViewMode('pyramid'); break;
        case '[': {
          const tfList: SectorTimeframe[] = ['1d', '1w', '1m', '3m', '6m', 'ytd'];
          const idx = tfList.indexOf(timeframe);
          if (idx > 0) updateTimeframe(tfList[idx - 1]);
          break;
        }
        case ']': {
          const tfList: SectorTimeframe[] = ['1d', '1w', '1m', '3m', '6m', 'ytd'];
          const idx = tfList.indexOf(timeframe);
          if (idx < tfList.length - 1) updateTimeframe(tfList[idx + 1]);
          break;
        }
        case 'j':
        case 'J': {
          if (sortedSectors.length === 0) break;
          const curIdx = selectedSector ? sortedSectors.findIndex(s => s.sector === selectedSector.sector) : -1;
          const nextIdx = Math.min(curIdx + 1, sortedSectors.length - 1);
          const next = sortedSectors[nextIdx];
          setSelectedSector(next);
          setSelectedStock(null);
          writeUrlParams({ sector: next.sector, stock: null });
          break;
        }
        case 'k':
        case 'K': {
          if (sortedSectors.length === 0) break;
          const curIdx = selectedSector ? sortedSectors.findIndex(s => s.sector === selectedSector.sector) : sortedSectors.length;
          const prevIdx = Math.max(curIdx - 1, 0);
          const prev = sortedSectors[prevIdx];
          setSelectedSector(prev);
          setSelectedStock(null);
          writeUrlParams({ sector: prev.sector, stock: null });
          break;
        }
        case '?':
          e.preventDefault();
          setShowShortcuts(s => !s);
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedSector, selectedStock, sortedSectors, timeframe, showShortcuts, updateViewMode, updateTimeframe]);

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

  // ─── Export handlers ─────────────────────────────────────────────────
  const vizRef = useRef<HTMLDivElement>(null);

  const handleExportCSV = useCallback(() => {
    const rows = sortedSectors.map((s) => ({
      Sector: s.sector,
      '1D (%)': s.performance['1d']?.toFixed(2) ?? '',
      '1W (%)': s.performance['1w']?.toFixed(2) ?? '',
      '1M (%)': s.performance['1m']?.toFixed(2) ?? '',
      '3M (%)': s.performance['3m']?.toFixed(2) ?? '',
      '6M (%)': s.performance['6m']?.toFixed(2) ?? '',
      'YTD (%)': s.performance.ytd?.toFixed(2) ?? '',
      Momentum: s.momentum_score?.toFixed(1) ?? '',
      'Breadth (%)': s.breadth?.above_20dma_pct?.toFixed(1) ?? '',
      'Market Cap': s.total_market_cap ?? '',
      'Volume Flow': s.volume_flow_score?.toFixed(1) ?? '',
      PE: s.valuation?.metrics?.pe_ratio?.weighted_avg?.toFixed(1) ?? '',
      PB: s.valuation?.metrics?.price_to_book?.weighted_avg?.toFixed(1) ?? '',
      DY: s.valuation?.metrics?.dividend_yield?.weighted_avg?.toFixed(2) ?? '',
    }));
    downloadCSV(rows, `sector-analytics-${timeframe}-${new Date().toISOString().slice(0, 10)}`);
  }, [sortedSectors, timeframe]);

  const handleExportPNG = useCallback(async () => {
    if (vizRef.current) {
      await downloadPNG(vizRef.current, `sector-${viewMode}-${timeframe}-${new Date().toISOString().slice(0, 10)}`);
    }
  }, [viewMode, timeframe]);

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
        onColorblindToggle={handleColorblindToggle}
        onExportCSV={handleExportCSV}
        onExportPNG={handleExportPNG}
      />

      {/* Sector color legend — treemap/heatmap only */}
      {(viewMode === 'treemap' || viewMode === 'heatmap') && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 px-1">
          {sortedSectors.map((s) => (
            <div key={s.sector} className="flex items-center gap-1">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: SECTOR_COLORS[s.sector] ?? '#64748B' }}
              />
              <span className="text-[9px] text-muted-foreground">{s.sector}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main: Visualization + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
        {/* Active View */}
        <div className="min-w-0" ref={vizRef} key={`viz-${colorblindKey}`}>
          <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand-blue" /></div>}>
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
              exchange={exchange as ExchangeCode}
            />
          )}
          {viewMode === 'table' && (
            <SectorPerformanceTable
              sectors={sortedSectors}
              timeframe={timeframe}
              selectedSector={selectedSector?.sector ?? null}
              exchange={exchange}
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
                  exchange={exchange as ExchangeCode}
                />
              </div>
              {/* Mobile: accordion fallback */}
              <div className="lg:hidden">
                <PyramidMobileFallback
                  sectors={pyramidSectors}
                  onStockClick={handlePyramidStockClick}
                  exchange={exchange as ExchangeCode}
                />
              </div>
            </>
          )}
          </Suspense>
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
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto bg-background border-t border-white/10 rounded-t-2xl px-4 pt-2 pb-6">
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
              exchange={exchange}
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
        exchange={exchange as ExchangeCode}
      />

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="rounded-xl border border-white/10 bg-brand-slate/95 backdrop-blur-md p-4 sm:p-6 shadow-2xl max-w-[90vw] sm:max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-white mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-xs">
              {[
                ['1 – 5', 'Switch view mode'],
                ['[ / ]', 'Cycle timeframe'],
                ['J / K', 'Navigate sectors'],
                ['Esc', 'Deselect / Close'],
                ['?', 'Toggle this help'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                    {key}
                  </kbd>
                  <span className="text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
