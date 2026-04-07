'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2, AlertCircle, RefreshCw, TrendingUp, TrendingDown, Globe, ArrowUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getCorrelations,
  getCrossAsset,
  getGlobalIndices,
  getEnhancedMatrix,
  getMST,
  getCommunities,
  getCorrelationChanges,
} from '@/src/lib/api/analyticsApi';
import type {
  ICorrelationMatrix,
  ICrossAssetCorrelation,
  IGlobalEffects,
  IEnhancedMatrix,
  IMST,
  ICommunityDetection,
  ICorrelationMover,
} from '@/types/analytics';
import { type CorrelationMethod, type ViewMode, type AssetScope, getStockAssets, setDynamicStockAssets, type Asset } from './correlation/constants';
import { getInstruments } from '@/src/lib/api/signalApi';
import { CorrelationToolbar, type ColorMode } from './correlation/CorrelationToolbar';
import { NetworkGraph } from './correlation/NetworkGraph';
import { HeatmapMatrix } from './correlation/HeatmapMatrix';
import { AssetExplorer } from './correlation/AssetExplorer';
import { PairDetailPanel } from './correlation/PairDetailPanel';
import { InsightsPanel } from './correlation/InsightsPanel';
import { deriveAllInsights } from '@/src/lib/correlation/insights';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// ─── URL param helpers (same pattern as UnifiedSectorDashboard) ──────
const VALID_VIEWS = new Set<ViewMode | 'asset'>(['network', 'heatmap', 'explorer', 'asset']);
const VALID_WINDOWS = new Set(['30d', '90d', '180d', '365d']);
const VALID_METHODS = new Set<CorrelationMethod>(['pearson', 'spearman', 'kendall']);
const VALID_SCOPES = new Set<AssetScope>(['equity', 'cross_asset']);

function readUrlParams() {
  if (typeof window === 'undefined') return {};
  const sp = new URLSearchParams(window.location.search);
  const rawView = sp.get('cv');
  const rawMethod = sp.get('cm');
  const rawScope = sp.get('cs');
  return {
    view: rawView && VALID_VIEWS.has(rawView as ViewMode | 'asset') ? rawView as ViewMode | 'asset' : null,
    window: sp.get('cw'),
    method: rawMethod && VALID_METHODS.has(rawMethod as CorrelationMethod) ? rawMethod as CorrelationMethod : null,
    assets: sp.get('ca'),
    scope: rawScope && VALID_SCOPES.has(rawScope as AssetScope) ? rawScope as AssetScope : null,
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

interface CorrelationExplorerProps {
  exchange: string;
}

export function CorrelationExplorer({ exchange }: CorrelationExplorerProps) {
  // ── Read initial state from URL ──
  const urlParams = readUrlParams();
  const initialView: ViewMode = urlParams.view === 'asset' ? 'explorer' : (VALID_VIEWS.has(urlParams.view as ViewMode) ? urlParams.view as ViewMode : 'network');
  const initialWindow = VALID_WINDOWS.has(urlParams.window ?? '') ? urlParams.window! : '90d';
  const initialMethod = VALID_METHODS.has(urlParams.method as CorrelationMethod) ? urlParams.method! : 'pearson';
  const initialScope = VALID_SCOPES.has(urlParams.scope as AssetScope) ? urlParams.scope! : 'equity';
  const exchangeStocks = getStockAssets(exchange);
  const defaultTickers = exchangeStocks.slice(0, 5).map(a => a.ticker);
  const initialAssets = urlParams.assets
    ? urlParams.assets.split(',').filter(Boolean)
    : defaultTickers;

  // ── Data state ──
  const [equityMatrix, setEquityMatrix] = useState<ICorrelationMatrix | null>(null);
  const [enhancedMatrix, setEnhancedMatrix] = useState<IEnhancedMatrix | null>(null);
  const [crossAssetPairs, setCrossAssetPairs] = useState<ICrossAssetCorrelation[]>([]);
  const [globalData, setGlobalData] = useState<IGlobalEffects | null>(null);
  const [correlationMovers, setCorrelationMovers] = useState<ICorrelationMover[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [partialWarning, setPartialWarning] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const forceRefreshRef = React.useRef(false);

  // ── Selection state ──
  const [selectedAssets, setSelectedAssets] = useState<string[]>(initialAssets);
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);

  // ── Controls ──
  const [windowValue, setWindowValue] = useState(initialWindow);
  const [method, setMethod] = useState<CorrelationMethod>(initialMethod);
  const [minEdgeCorr, setMinEdgeCorr] = useState(0.2);
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [assetScope, setAssetScope] = useState<AssetScope>(initialScope);

  // ── Insights dismissed state (persists across re-renders) ──
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const handleDismissInsight = React.useCallback((id: string) => {
    setDismissedInsights((prev) => new Set(prev).add(id));
  }, []);

  // ── Responsive detection ──
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Network Intelligence ──
  const [mstEnabled, setMstEnabled] = useState(false);
  const [mstData, setMstData] = useState<IMST | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>('type');
  const [communityData, setCommunityData] = useState<ICommunityDetection | null>(null);

  // Fetch instruments from backend and populate dynamic cache
  const prevExchangeRef = React.useRef(exchange);
  useEffect(() => {
    let cancelled = false;
    async function loadInstruments() {
      type InstrumentType = 'nse' | 'nasdaq' | 'nyse' | 'lse' | 'hkse' | 'currency' | 'commodity';
      const exchangeTypeMap: Record<string, InstrumentType> = {
        NSE: 'nse', NASDAQ: 'nasdaq', NYSE: 'nyse', LSE: 'lse', HKSE: 'hkse',
      };
      const type = exchangeTypeMap[exchange.toUpperCase()];
      if (!type) return;
      const result = await getInstruments(type);
      if (cancelled || !result.success || !result.data) return;
      const assets: Asset[] = result.data.map((inst) => ({
        ticker: inst.ticker,
        name: inst.name,
        type: 'stock' as const,
        sector: inst.sector ?? undefined,
      }));
      if (assets.length > 0) {
        setDynamicStockAssets(exchange, assets);
      }
    }
    loadInstruments();
    return () => { cancelled = true; };
  }, [exchange]);

  // Reset selected assets when exchange changes
  useEffect(() => {
    if (prevExchangeRef.current !== exchange) {
      prevExchangeRef.current = exchange;
      const stocks = getStockAssets(exchange);
      setSelectedAssets(stocks.slice(0, 5).map(a => a.ticker));
      setSelectedPair(null);
    }
  }, [exchange]);

  // ═══════════════════════════════════════════════════════════════
  // URL State Persistence (E2)
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    writeUrlParams({
      cv: viewMode !== 'network' ? viewMode : null,
      cw: windowValue !== '90d' ? windowValue : null,
      cm: method !== 'pearson' ? method : null,
      ca: selectedAssets.length > 0 ? selectedAssets.join(',') : null,
      cs: assetScope !== 'equity' ? assetScope : null,
    });
  }, [viewMode, windowValue, method, selectedAssets, assetScope]);

  // ═══════════════════════════════════════════════════════════════
  // Data Fetching
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setDataLoading(true);
      setFetchError(null);
      setPartialWarning(null);
      setEquityMatrix(null);
      setEnhancedMatrix(null);

      try {
        const isForceRefresh = forceRefreshRef.current;
        forceRefreshRef.current = false;

        // For cross_exchange scope, use cross_asset backend type (triggers multi-exchange fetch)
        const backendScope = assetScope === 'cross_exchange' ? 'cross_asset' : assetScope;
        const settled = await Promise.allSettled([
          getCorrelations(windowValue, backendScope, exchange, isForceRefresh),
          getEnhancedMatrix(windowValue, backendScope, method, exchange),
          assetScope === 'cross_asset' || assetScope === 'cross_exchange'
            ? getCrossAsset(undefined, undefined, 0.1)
            : Promise.resolve({ success: false as const, data: null }),
          getGlobalIndices(),
        ]);

        const corrResult = settled[0].status === 'fulfilled' ? settled[0].value : { success: false as const, data: null, error: { status: 0, detail: 'Network error' } };
        const enhancedResult = settled[1].status === 'fulfilled' ? settled[1].value : { success: false as const, data: null, error: { status: 0, detail: 'Network error' } };
        const crossResult = settled[2].status === 'fulfilled' ? settled[2].value : { success: false as const, data: null };
        const globalResult = settled[3].status === 'fulfilled' ? settled[3].value : { success: false as const, data: null };

        if (cancelled) return;

        const hasCorr = corrResult.success && corrResult.data;
        const hasEnhanced = enhancedResult.success && enhancedResult.data
          && typeof enhancedResult.data === 'object' && !('error' in enhancedResult.data);

        if (hasCorr) setEquityMatrix(corrResult.data);
        if (hasEnhanced) setEnhancedMatrix(enhancedResult.data as IEnhancedMatrix);
        if (crossResult.success && crossResult.data?.items) {
          setCrossAssetPairs(crossResult.data.items);
        }
        if (globalResult.success && globalResult.data) {
          setGlobalData(globalResult.data);
        }

        // Fetch correlation change leaders (non-blocking)
        getCorrelationChanges(windowValue, 3, exchange).then((changesResult) => {
          if (cancelled) return;
          if (changesResult.success && changesResult.data?.movers) {
            setCorrelationMovers(changesResult.data.movers);
          }
        }).catch(() => {
          // Non-critical — silently ignore correlation changes failure
        });

        // Differentiated error & partial-data handling
        if (!hasCorr && !hasEnhanced) {
          if (!corrResult.success) {
            const status = corrResult.error.status;
            if (status === 429) {
              setFetchError('Rate limited — please wait a moment and try again.');
            } else if (status >= 500) {
              setFetchError('Server error — the backend may be under load. Try again shortly.');
            } else if (status === 422) {
              setFetchError('No data available for the selected assets. Try a different window or exchange.');
            } else {
              setFetchError('Unable to load correlation data. Please check your connection and try again.');
            }
          } else {
            setFetchError('Unable to load correlation data. Please check your connection and try again.');
          }
        } else if (hasCorr && !hasEnhanced) {
          setPartialWarning('Showing basic correlations — enhanced statistics (p-values, significance) unavailable.');
        } else if (!hasCorr && hasEnhanced) {
          setPartialWarning('Showing enhanced statistics only — basic correlation matrix unavailable.');
        }
      } catch {
        if (!cancelled) {
          setFetchError('Unable to load correlation data. Please check your connection and try again.');
        }
      }
      if (!cancelled) setDataLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [windowValue, method, assetScope, retryCount, exchange]);

  // MST fetch
  useEffect(() => {
    if (!mstEnabled || selectedAssets.length < 3) {
      setMstData(null);
      return;
    }
    let cancelled = false;
    const windowDays = parseInt(windowValue) || 90;
    const timer = setTimeout(() => {
      getMST(selectedAssets, windowDays).then((result) => {
        if (cancelled) return;
        if (result.success && result.data && !('error' in result.data)) {
          setMstData(result.data);
        }
      });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [mstEnabled, selectedAssets, windowValue]);

  // Community detection
  useEffect(() => {
    if (colorMode !== 'community' || selectedAssets.length < 4) {
      setCommunityData(null);
      return;
    }
    let cancelled = false;
    const windowDays = parseInt(windowValue) || 90;
    const timer = setTimeout(() => {
      getCommunities(selectedAssets, windowDays).then((result) => {
        if (cancelled) return;
        if (result.success && result.data && !('error' in result.data)) {
          setCommunityData(result.data);
        }
      });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [colorMode, selectedAssets, windowValue]);

  // ═══════════════════════════════════════════════════════════════
  // Correlation Lookup
  // ═══════════════════════════════════════════════════════════════

  const getCorr = useCallback(
    (a: string, b: string): number | null => {
      if (a === b) return 1;
      const matrix = enhancedMatrix || equityMatrix;
      if (matrix?.matrix_data) {
        const key1 = `${a}:${b}`;
        const key2 = `${b}:${a}`;
        if (key1 in matrix.matrix_data) return matrix.matrix_data[key1];
        if (key2 in matrix.matrix_data) return matrix.matrix_data[key2];
      }
      const pair = crossAssetPairs.find(
        (p) =>
          (p.source_ticker === a && p.target_ticker === b) ||
          (p.source_ticker === b && p.target_ticker === a),
      );
      if (pair) return pair.correlation;
      return null;
    },
    [enhancedMatrix, equityMatrix, crossAssetPairs],
  );

  // ═══════════════════════════════════════════════════════════════
  // Asset Management
  // ═══════════════════════════════════════════════════════════════

  const addAsset = useCallback((ticker: string) => {
    setSelectedAssets((prev) => (prev.includes(ticker) ? prev : [...prev, ticker]));
  }, []);

  const removeAsset = useCallback(
    (ticker: string) => {
      setSelectedAssets((prev) => prev.filter((t) => t !== ticker));
      if (selectedPair && selectedPair.includes(ticker)) {
        setSelectedPair(null);
      }
    },
    [selectedPair],
  );

  const addGroup = useCallback((tickers: string[]) => {
    setSelectedAssets((prev) => {
      const set = new Set(prev);
      tickers.forEach((t) => set.add(t));
      return Array.from(set);
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedAssets([]);
    setSelectedPair(null);
  }, []);

  // ── Pair correlation value ──
  const pairCorrelation = useMemo(() => {
    if (!selectedPair || !selectedPair[1]) return null;
    return getCorr(selectedPair[0], selectedPair[1]);
  }, [selectedPair, getCorr]);

  // ── Last updated (I4 / E5) ──
  const computedAt = equityMatrix?.computed_at ?? enhancedMatrix?.computed_at ?? null;

  // ── Insights Engine ──
  const insights = useMemo(
    () =>
      deriveAllInsights({
        equityMatrix,
        enhancedMatrix,
        selectedAssets,
        correlationMovers,
        globalData,
        crossAssetPairs,
      }),
    [equityMatrix, enhancedMatrix, selectedAssets, correlationMovers, globalData, crossAssetPairs],
  );

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-2">
      {/* ── Toolbar with inline KPI metrics ── */}
      <CorrelationToolbar
        selectedAssets={selectedAssets}
        window={windowValue}
        method={method}
        minEdgeCorr={minEdgeCorr}
        viewMode={viewMode}
        mstEnabled={mstEnabled}
        colorMode={colorMode}
        assetScope={assetScope}
        exchange={exchange}
        equityMatrix={equityMatrix}
        enhancedMatrix={enhancedMatrix}
        computedAt={computedAt}
        onAddAsset={addAsset}
        onAddGroup={addGroup}
        onRemoveAsset={removeAsset}
        onClearAll={clearAll}
        onWindowChange={setWindowValue}
        onMethodChange={setMethod}
        onMinEdgeCorrChange={setMinEdgeCorr}
        onViewModeChange={setViewMode}
        onMstToggle={setMstEnabled}
        onColorModeChange={setColorMode}
        onAssetScopeChange={setAssetScope}
        onRefresh={() => { forceRefreshRef.current = true; setRetryCount((c) => c + 1); }}
      />

      {/* ── Contextual Summary Chips (B2: moved above graph for visibility) ── */}
      {!fetchError && !dataLoading && (equityMatrix || globalData) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider shrink-0">Key Pairs</span>
          {equityMatrix?.top_positive_pairs?.slice(0, 3).map((p) => (
            <button
              key={`pos-${p.pair.join('-')}`}
              onClick={() => {
                addAsset(p.pair[0]);
                addAsset(p.pair[1]);
                setSelectedPair([p.pair[0], p.pair[1]]);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors text-left"
            >
              <TrendingUp className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
              <span className="text-[10px] text-white truncate">{p.pair[0]}–{p.pair[1]}</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">+{p.correlation.toFixed(2)}</span>
            </button>
          ))}
          {equityMatrix?.top_negative_pairs?.slice(0, 2).map((p) => (
            <button
              key={`neg-${p.pair.join('-')}`}
              onClick={() => {
                addAsset(p.pair[0]);
                addAsset(p.pair[1]);
                setSelectedPair([p.pair[0], p.pair[1]]);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors text-left"
            >
              <TrendingDown className="h-2.5 w-2.5 text-red-400 shrink-0" />
              <span className="text-[10px] text-white truncate">{p.pair[0]}–{p.pair[1]}</span>
              <span className="text-[10px] font-mono font-bold text-red-400">{p.correlation.toFixed(2)}</span>
            </button>
          ))}

          {correlationMovers.map((m) => (
            <button
              key={`chg-${m.pair.join('-')}`}
              onClick={() => {
                addAsset(m.pair[0]);
                addAsset(m.pair[1]);
                setSelectedPair([m.pair[0], m.pair[1]]);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors text-left"
            >
              <ArrowUpDown className="h-2.5 w-2.5 text-purple-400 shrink-0" />
              <span className="text-[10px] text-white truncate">{m.pair[0]}–{m.pair[1]}</span>
              <span className={cn(
                'text-[10px] font-mono font-bold',
                m.change > 0 ? 'text-emerald-400' : 'text-red-400',
              )}>
                {m.change > 0 ? '+' : ''}{m.change.toFixed(2)}
              </span>
            </button>
          ))}

          {globalData?.pre_market_signal && (
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] border',
              globalData.pre_market_signal.direction === 'bullish' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              globalData.pre_market_signal.direction === 'bearish' && 'bg-red-500/10 text-red-400 border-red-500/20',
              globalData.pre_market_signal.direction === 'neutral' && 'bg-white/[0.03] text-muted-foreground border-white/5',
            )}>
              <Globe className="h-2.5 w-2.5" />
              Pre-mkt: <span className="font-bold capitalize">{globalData.pre_market_signal.direction}</span>
              {' '}({globalData.pre_market_signal.estimated_gap_pct >= 0 ? '+' : ''}
              {globalData.pre_market_signal.estimated_gap_pct.toFixed(2)}%)
            </span>
          )}
        </div>
      )}

      {/* ── Insights Panel ── */}
      {!fetchError && !dataLoading && insights.length > 0 && (
        <InsightsPanel
          insights={insights}
          dismissed={dismissedInsights}
          onDismiss={handleDismissInsight}
          onPairSelect={(pair) => {
            addAsset(pair[0]);
            addAsset(pair[1]);
            setSelectedPair(pair);
          }}
          onAddAsset={addAsset}
        />
      )}

      {/* ── Partial data warning ── */}
      {partialWarning && !dataLoading && (
        <div className="flex items-center gap-2 px-4 py-2 mb-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-400/80 export-exclude">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{partialWarning}</span>
          <button
            onClick={() => setPartialWarning(null)}
            className="ml-auto text-yellow-400/50 hover:text-yellow-400 transition-colors"
            aria-label="Dismiss warning"
          >
            &times;
          </button>
        </div>
      )}

      {/* ── Full-width Main View ── */}
      <div className="relative w-full" data-export-target="correlation">
        {dataLoading && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-[#0d1117]/80 p-4">
            {/* Skeleton heatmap grid */}
            <div className="flex flex-col gap-1 items-center justify-center h-full">
              <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${Math.min(selectedAssets.length || 8, 12)}, 1fr)` }}>
                {Array.from({ length: Math.min((selectedAssets.length || 8) ** 2, 144) }).map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-sm bg-white/[0.04] animate-pulse" style={{ animationDelay: `${(i % 12) * 50}ms` }} />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Computing correlations...</span>
              </div>
            </div>
          </div>
        )}

        {fetchError && !dataLoading && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center max-w-md">
              <AlertCircle className="h-10 w-10 text-red-400/60 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">{fetchError}</p>
              <button
                onClick={() => setRetryCount((c) => c + 1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue/10 text-brand-blue text-sm hover:bg-brand-blue/20 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </div>
        )}

        {!fetchError && viewMode === 'network' && (
          <NetworkGraph
            selectedAssets={selectedAssets}
            getCorr={getCorr}
            minEdgeCorr={minEdgeCorr}
            selectedPair={selectedPair}
            onPairSelect={setSelectedPair}
            mstEdges={mstEnabled ? mstData?.edges ?? null : null}
            communityMap={colorMode === 'community' ? communityData?.node_community ?? null : null}
            hubNode={mstEnabled ? mstData?.hub_node ?? null : null}
          />
        )}
        {!fetchError && viewMode === 'heatmap' && (
          <HeatmapMatrix
            matrix={enhancedMatrix}
            selectedAssets={selectedAssets}
            selectedPair={selectedPair}
            onPairSelect={setSelectedPair}
          />
        )}
        {!fetchError && viewMode === 'explorer' && (
          <AssetExplorer
            selectedAssets={selectedAssets}
            window={windowValue}
            method={method}
            exchange={exchange}
            onPairSelect={setSelectedPair}
          />
        )}
      </div>

      {/* ── Detail Panel: Side drawer on desktop, bottom sheet on mobile ── */}
      <Sheet
        open={!!selectedPair && !!selectedPair[1]}
        onOpenChange={(open) => {
          if (!open) setSelectedPair(null);
        }}
      >
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={cn(
            'overflow-y-auto bg-[#0d1117] px-3 pb-6 pt-2',
            isMobile
              ? 'max-h-[60vh] border-t border-white/10 md:px-6'
              : 'w-[440px] border-l border-white/10 px-5',
          )}
          overlayClassName="bg-black/40"
        >
          {/* Drag handle for mobile + Close button for desktop */}
          <div className="flex items-center justify-between py-2">
            {isMobile ? (
              <>
                <div className="w-10" />
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </>
            ) : null}
            <button
              onClick={() => setSelectedPair(null)}
              className={cn(
                'flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white',
                isMobile && 'hidden',
              )}
              aria-label="Close detail panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SheetHeader className="sr-only">
            <SheetTitle>Pair Detail</SheetTitle>
            <SheetDescription>
              Correlation analysis for the selected asset pair.
            </SheetDescription>
          </SheetHeader>
          <PairDetailPanel
            selectedPair={selectedPair}
            pairCorrelation={pairCorrelation}
            window={windowValue}
            method={method}
            exchange={exchange}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
