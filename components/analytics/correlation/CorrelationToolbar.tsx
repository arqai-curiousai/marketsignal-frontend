'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ALL_ASSETS,
  QUICK_GROUPS,
  WINDOWS,
  TYPE_COLORS,
  ASSET_MAP,
  type CorrelationMethod,
  type ViewMode,
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
}

export function CorrelationToolbar({
  selectedAssets,
  window: windowValue,
  method,
  minEdgeCorr,
  viewMode,
  mstEnabled,
  colorMode,
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
}: CorrelationToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickGroupOpen, setQuickGroupOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_ASSETS.filter(
      (a) =>
        !selectedAssets.includes(a.ticker) &&
        (a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)),
    ).slice(0, 8);
  }, [searchQuery, selectedAssets]);

  return (
    <div className="space-y-3">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
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
        <div className="relative">
          <button
            onClick={() => setQuickGroupOpen(!quickGroupOpen)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white/5 border border-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
          >
            Quick Add
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
                {QUICK_GROUPS.map((g) => (
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
          {(['network', 'heatmap'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewModeChange(v)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                v === viewMode ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Window Selector */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              onClick={() => onWindowChange(w.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                w.value === windowValue ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
              )}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Method Toggle */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
          {(['pearson', 'spearman'] as CorrelationMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => onMethodChange(m)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize',
                m === method ? 'bg-brand-blue/30 text-white' : 'text-muted-foreground hover:text-white',
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Correlation Threshold (network view only) */}
        {viewMode === 'network' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Min |r|</span>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.1}
              value={minEdgeCorr}
              onChange={(e) => onMinEdgeCorrChange(parseFloat(e.target.value))}
              className="w-20 accent-brand-blue"
            />
            <span className="text-[10px] text-white font-mono w-6">{minEdgeCorr.toFixed(1)}</span>
          </div>
        )}

        {/* MST toggle (network view only) */}
        {viewMode === 'network' && (
          <button
            onClick={() => onMstToggle(!mstEnabled)}
            className={cn(
              'px-2.5 py-1.5 text-[10px] font-medium rounded-lg border transition-all',
              mstEnabled
                ? 'bg-brand-blue/20 border-brand-blue/30 text-white'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white',
            )}
          >
            MST
          </button>
        )}

        {/* Color mode (network view only) */}
        {viewMode === 'network' && (
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
        )}
      </div>

      {/* Selected Assets Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedAssets.map((ticker) => {
          const asset = ASSET_MAP.get(ticker);
          return (
            <motion.div
              key={ticker}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full text-xs border bg-white/5 border-white/10 text-muted-foreground hover:text-white transition-all"
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
        {selectedAssets.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors px-2"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
