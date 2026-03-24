'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ChevronDown, X, FileSpreadsheet, Image as ImageIcon, SlidersHorizontal, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ExportButton } from '@/components/ui/ExportButton';
import { downloadMatrixCSV, downloadPNG } from '@/src/lib/utils/export';
import { DataFreshness } from '../DataFreshness';
import type { ICorrelationMatrix, IEnhancedMatrix } from '@/types/analytics';
import {
  WINDOWS,
  TYPE_COLORS,
  ASSET_MAP,
  corrColor,
  getAllAssets,
  getQuickGroups,
  type CorrelationMethod,
  type ViewMode,
  type AssetScope,
} from './constants';

export type ColorMode = 'type' | 'community';

interface CorrelationToolbarProps {
  selectedAssets: string[];
  window: string;
  method: CorrelationMethod;
  minEdgeCorr: number;
  viewMode: ViewMode;
  mstEnabled: boolean;
  colorMode: ColorMode;
  assetScope: AssetScope;
  exchange: string;
  equityMatrix: ICorrelationMatrix | null;
  enhancedMatrix: IEnhancedMatrix | null;
  lastUpdatedLabel: string | null;
  computedAt?: string | null;
  onAddAsset: (ticker: string) => void;
  onAddGroup: (tickers: string[]) => void;
  onRemoveAsset: (ticker: string) => void;
  onClearAll: () => void;
  onWindowChange: (w: string) => void;
  onMethodChange: (m: CorrelationMethod) => void;
  onMinEdgeCorrChange: (v: number) => void;
  onViewModeChange: (v: ViewMode) => void;
  onMstToggle: (v: boolean) => void;
  onColorModeChange: (v: ColorMode) => void;
  onAssetScopeChange: (v: AssetScope) => void;
  onRefresh: () => void;
}

export function CorrelationToolbar({
  selectedAssets,
  window: windowValue,
  method,
  minEdgeCorr,
  viewMode,
  mstEnabled,
  colorMode,
  assetScope,
  exchange,
  equityMatrix,
  enhancedMatrix,
  lastUpdatedLabel,
  computedAt,
  onAddAsset,
  onAddGroup,
  onRemoveAsset,
  onClearAll,
  onWindowChange,
  onMethodChange,
  onMinEdgeCorrChange,
  onViewModeChange,
  onMstToggle,
  onColorModeChange,
  onAssetScopeChange,
  onRefresh,
}: CorrelationToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickGroupOpen, setQuickGroupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allAssets = useMemo(() => getAllAssets(exchange), [exchange]);
  const quickGroups = useMemo(() => getQuickGroups(exchange), [exchange]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allAssets.filter(
      (a) =>
        !selectedAssets.includes(a.ticker) &&
        (a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)),
    ).slice(0, 8);
  }, [searchQuery, selectedAssets, allAssets]);

  // ── Inline KPI metrics ──
  const kpi = useMemo(() => {
    let avgCorr: number | null = null;
    let avgLabel = '';
    let avgColor = 'text-blue-400';

    if (equityMatrix?.matrix_data) {
      const pairwise: number[] = [];
      for (const [key, val] of Object.entries(equityMatrix.matrix_data)) {
        const parts = key.split(':');
        if (parts.length === 2 && parts[0] !== parts[1]) {
          pairwise.push(val);
        }
      }
      if (pairwise.length > 0) {
        avgCorr = pairwise.reduce((s, v) => s + v, 0) / pairwise.length;
      }
      if (avgCorr !== null) {
        if (avgCorr > 0.6) { avgLabel = 'Risk-On'; avgColor = 'text-orange-400'; }
        else if (avgCorr < 0.3) { avgLabel = 'Picking'; avgColor = 'text-emerald-400'; }
        else { avgLabel = 'Normal'; avgColor = 'text-blue-400'; }
      }
    }

    let topPair: string | null = null;
    let topVal: number | null = null;
    if (equityMatrix?.top_positive_pairs?.length) {
      const t = equityMatrix.top_positive_pairs[0];
      topPair = `${t.pair[0]}/${t.pair[1]}`;
      topVal = t.correlation;
    }

    let botPair: string | null = null;
    let botVal: number | null = null;
    const negPairs = enhancedMatrix?.top_negative_pairs ?? equityMatrix?.top_negative_pairs ?? [];
    if (negPairs.length > 0) {
      const worst = negPairs.reduce((a, b) => (b.correlation < a.correlation ? b : a));
      botPair = `${worst.pair[0]}/${worst.pair[1]}`;
      botVal = worst.correlation;
    }

    let sigCount: number | null = null;
    let totalCount: number | null = null;
    if (enhancedMatrix) {
      sigCount = enhancedMatrix.significant_pairs ?? null;
      const n = enhancedMatrix.tickers?.length ?? 0;
      totalCount = n > 1 ? (n * (n - 1)) / 2 : null;
    }

    return { avgCorr, avgLabel, avgColor, topPair, topVal, botPair, botVal, sigCount, totalCount };
  }, [equityMatrix, enhancedMatrix]);

  // Count active settings to show badge when collapsed
  const settingsSummary = useMemo(() => {
    const parts: string[] = [];
    const w = WINDOWS.find((w) => w.value === windowValue);
    if (w) parts.push(w.label);
    parts.push(method.charAt(0).toUpperCase() + method.slice(1));
    if (mstEnabled) parts.push('MST');
    return parts.join(' · ');
  }, [windowValue, method, mstEnabled]);

  // ── "/" keyboard shortcut to focus search ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-1.5">
      {/* ── Tier 1: Primary Controls (always visible) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[140px] md:min-w-[200px] max-w-[360px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search stocks, currencies, commodities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
          <AnimatePresence>
            {searchOpen && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 top-full mt-1 w-full bg-[#1a1f2e] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
              >
                {searchResults.map((asset) => (
                  <button
                    key={asset.ticker}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onAddAsset(asset.ticker);
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: TYPE_COLORS[asset.type] }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white">{asset.ticker}</span>
                      <span className="text-xs text-muted-foreground ml-2">{asset.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground capitalize">{asset.type}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Groups */}
        <div
          className="relative"
          tabIndex={0}
          onBlur={() => setTimeout(() => setQuickGroupOpen(false), 200)}
        >
          <button
            onClick={() => setQuickGroupOpen(!quickGroupOpen)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white/5 border border-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
          >
            <span className="hidden sm:inline">Quick Add</span>
            <Plus className="h-3.5 w-3.5 sm:hidden" />
            <ChevronDown className={cn('h-3 w-3 transition-transform', quickGroupOpen && 'rotate-180')} />
          </button>
          <AnimatePresence>
            {quickGroupOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-50 top-full mt-1 right-0 w-48 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
              >
                {quickGroups.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => {
                      onAddGroup(g.tickers);
                      setQuickGroupOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    <Plus className="h-3 w-3 text-brand-blue" />
                    <span className="text-sm text-white">{g.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{g.tickers.length}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
          {(['network', 'heatmap', 'explorer'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewModeChange(v)}
              className={cn(
                'px-2.5 md:px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                v === viewMode ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Window Selector — promoted to Tier 0 for quick access */}
        <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              onClick={() => onWindowChange(w.value)}
              className={cn(
                'px-2 py-1 text-[10px] font-medium rounded-md transition-all',
                w.value === windowValue ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
              )}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Settings Popover — advanced controls */}
        <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-2 text-xs rounded-lg border transition-all',
                settingsOpen
                  ? 'bg-brand-blue/10 border-brand-blue/30 text-white'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden md:inline text-[10px]">{settingsSummary}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto p-3 bg-[#1a1f2e] border-white/10"
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* Window (visible on mobile since hidden in Tier 0) */}
              <div className="sm:hidden flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                {WINDOWS.map((w) => (
                  <button
                    key={w.value}
                    onClick={() => onWindowChange(w.value)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                      w.value === windowValue ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
                    )}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              {/* Asset Scope */}
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                {(['equity', 'cross_asset'] as AssetScope[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => onAssetScopeChange(s)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] md:text-xs font-medium rounded-md transition-all',
                      s === assetScope ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
                    )}
                  >
                    {s === 'equity' ? 'Equity' : 'Cross-Asset'}
                  </button>
                ))}
              </div>

              {/* Method Toggle */}
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                {(['pearson', 'spearman', 'kendall'] as CorrelationMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => onMethodChange(m)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] md:text-xs font-medium rounded-md transition-all capitalize',
                      m === method ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Network-specific settings */}
              {viewMode === 'network' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Min |r|</span>
                    <input
                      type="range"
                      min={0}
                      max={0.8}
                      step={0.1}
                      value={minEdgeCorr}
                      onChange={(e) => onMinEdgeCorrChange(parseFloat(e.target.value))}
                      aria-label="Minimum correlation threshold"
                      className="w-20 accent-brand-blue"
                    />
                    <span className="text-[10px] text-white font-mono w-6">{minEdgeCorr.toFixed(1)}</span>
                  </div>
                  <button
                    onClick={() => onMstToggle(!mstEnabled)}
                    className={cn(
                      'px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-all',
                      mstEnabled
                        ? 'bg-brand-blue/20 border-brand-blue/30 text-white'
                        : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white',
                    )}
                  >
                    MST
                  </button>
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10">
                    {(['type', 'community'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => onColorModeChange(mode)}
                        className={cn(
                          'px-2 py-1 text-[10px] font-medium rounded transition-all capitalize',
                          mode === colorMode ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Export */}
        <ExportButton
          options={[
            {
              label: 'CSV Matrix',
              icon: <FileSpreadsheet className="h-3 w-3" />,
              onClick: () => {
                const source = enhancedMatrix ?? equityMatrix;
                if (!source?.tickers || !source?.matrix_data) return;
                const { matrix_data } = source;
                // Export only the visible/selected assets (intersection with matrix tickers)
                const exportTickers = selectedAssets.length > 0
                  ? selectedAssets.filter((a) => source.tickers.includes(a))
                  : source.tickers;
                const t = exportTickers.length > 0 ? exportTickers : source.tickers;
                const matrix2d: number[][] = t.map((rowTicker) =>
                  t.map((colTicker) => {
                    if (rowTicker === colTicker) return 1;
                    return matrix_data[`${rowTicker}:${colTicker}`]
                      ?? matrix_data[`${colTicker}:${rowTicker}`]
                      ?? 0;
                  }),
                );
                downloadMatrixCSV(t, matrix2d, `correlation-matrix-${windowValue}`);
              },
            },
            {
              label: 'PNG Screenshot',
              icon: <ImageIcon className="h-3 w-3" />,
              onClick: async () => {
                const el = document.querySelector('[data-export-target="correlation"]') as HTMLElement;
                if (el) await downloadPNG(el, `correlation-${viewMode}-${windowValue}`);
              },
            },
          ]}
        />

        {/* Refresh + Last Updated (E5/I4) */}
        <button
          onClick={onRefresh}
          className="p-2 bg-white/5 border border-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
          title="Refresh correlation data"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        {computedAt && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <DataFreshness computedAt={computedAt} staleTTLMinutes={60} />
          </span>
        )}
      </div>

      {/* Old Tier 2 removed — settings now in Popover above */}

      {/* ── KPI status bar ── */}
      {(kpi.avgCorr !== null || kpi.topPair || kpi.sigCount !== null) && (
        <TooltipProvider delayDuration={300}>
          <div className="flex flex-wrap items-center gap-2 px-3 py-1 border-l-2 border-white/10 ml-1">
            {kpi.avgCorr !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono cursor-help">
                    <span className="text-muted-foreground">Avg r</span>
                    <span className={kpi.avgColor}>{kpi.avgCorr.toFixed(2)}</span>
                    <span className={cn('text-[9px]', kpi.avgColor)}>{kpi.avgLabel}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px] text-xs">
                  Average pairwise correlation across all equity pairs. High (&gt;0.6) = Risk-On regime, Low (&lt;0.3) = Stock-Picking opportunity
                </TooltipContent>
              </Tooltip>
            )}
            {kpi.avgCorr !== null && (kpi.topPair || kpi.sigCount !== null) && (
              <span className="text-white/10">|</span>
            )}
            {kpi.topPair && kpi.topVal !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono cursor-help">
                    <span className="text-muted-foreground">Top</span>
                    <span className="text-white">{kpi.topPair}</span>
                    <span style={{ color: corrColor(kpi.topVal) }}>+{kpi.topVal.toFixed(2)}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                  Strongest positive correlation pair — these assets move together most
                </TooltipContent>
              </Tooltip>
            )}
            {kpi.botPair && kpi.botVal !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono cursor-help">
                    <span className="text-muted-foreground">Bot</span>
                    <span className="text-white">{kpi.botPair}</span>
                    <span style={{ color: corrColor(kpi.botVal) }}>{kpi.botVal.toFixed(2)}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                  Most negative (inverse) correlation pair — natural hedging candidates
                </TooltipContent>
              </Tooltip>
            )}
            {kpi.sigCount !== null && kpi.totalCount !== null && (
              <>
                {(kpi.topPair || kpi.botPair) && <span className="text-white/10">|</span>}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono cursor-help">
                      <span className="text-muted-foreground">Sig</span>
                      <span className="text-blue-400">{kpi.sigCount}/{kpi.totalCount}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                    Statistically significant pairs after FDR correction at 5% level
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      )}

      {/* ── Selected Assets Pills (horizontal scroll with fade) ── */}
      {selectedAssets.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 min-w-0">
            {/* Fade gradient on right edge */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0d1117] to-transparent z-10" />
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pr-8 max-h-[40px]">
              <AnimatePresence mode="popLayout">
                {selectedAssets.map((ticker) => {
                  const asset = ASSET_MAP.get(ticker);
                  return (
                    <motion.div
                      key={ticker}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-xs border bg-white/5 border-white/10 text-muted-foreground hover:text-white transition-all shrink-0"
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: TYPE_COLORS[asset?.type || 'stock'] }}
                      />
                      <span className="font-medium">{ticker}</span>
                      <button
                        onClick={() => onRemoveAsset(ticker)}
                        className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          <button
            onClick={onClearAll}
            className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors px-2 shrink-0"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Max asset count warning ── */}
      {selectedAssets.length > 20 && (
        <p className={cn(
          'text-[10px] ml-2',
          selectedAssets.length > 30 ? 'text-red-400' : 'text-amber-400',
        )}>
          Large selection — switch to heatmap view for best results
        </p>
      )}
    </div>
  );
}
