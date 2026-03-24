'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';
import type { INewsArticle } from '@/types/analytics';
import { TIME_RANGES, SOURCE_FILTER_OPTIONS } from './constants';
import type { SentimentFilterValue } from './hooks/useNewsFilters';

export type IntelligenceMode = 'pulse' | 'flow' | 'map';

interface NewsFilterBarProps {
  // Mode toggle
  mode: IntelligenceMode;
  onModeChange: (mode: IntelligenceMode) => void;

  // Filter state
  timeRange: number;
  sentimentFilter: SentimentFilterValue;
  sourceFilter: string;
  activeFilterCount: number;

  // Setters
  onTimeRangeChange: (range: number) => void;
  onSentimentChange: (filter: SentimentFilterValue) => void;
  onSourceChange: (source: string) => void;
  onClearAll: () => void;

  // Search
  onSearch: (query: string) => void;
  searchResults: INewsArticle[];
  searchLoading: boolean;
  onSelectArticle: (article: INewsArticle) => void;

  // Freshness
  hasNewArticles: boolean;
  onScrollToTop: () => void;

  // Refresh
  onRefresh?: () => void;
  refreshing?: boolean;
  secondsAgo?: number;
}

/**
 * Progressive disclosure toolbar — only 3 visible elements:
 * 1. Search icon (expands to full-width search)
 * 2. Filter pill (shows count, reveals dropdown)
 * 3. Freshness dot (pulses when new articles arrive)
 */
const MODE_OPTIONS: { value: IntelligenceMode; label: string }[] = [
  { value: 'pulse', label: 'Pulse' },
  { value: 'flow', label: 'Flow' },
  { value: 'map', label: 'Map' },
];

export function NewsFilterBar({
  mode,
  onModeChange,
  timeRange,
  sentimentFilter,
  sourceFilter,
  activeFilterCount,
  onTimeRangeChange,
  onSentimentChange,
  onSourceChange,
  onClearAll,
  onSearch,
  searchResults,
  searchLoading,
  onSelectArticle,
  hasNewArticles,
  onScrollToTop,
  onRefresh,
  refreshing,
  secondsAgo,
}: NewsFilterBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Keyboard shortcut: "/" to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setFilterOpen(false);
        setSearchQuery('');
        onSearch('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, onSearch]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(value), 400);
    },
    [onSearch]
  );

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
      {/* Mode toggle — Pulse | Flow | Map */}
      <div className="flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onModeChange(opt.value)}
            className={`px-2 sm:px-2.5 py-1.5 sm:py-1 rounded-md text-[11px] font-medium transition-all min-h-[36px] sm:min-h-0 ${
              mode === opt.value
                ? 'bg-white/[0.08] text-white/80 shadow-sm'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Search */}
      <AnimatePresence mode="wait">
        {searchOpen ? (
          <motion.div
            key="search-expanded"
            initial={{ width: 36, opacity: 0.5 }}
            animate={{ width: '100%', opacity: 1 }}
            exit={{ width: 36, opacity: 0.5 }}
            transition={{ duration: 0.2 }}
            className="relative flex-1"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03]">
              <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search news..."
                className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/25 outline-none"
              />
              {searchLoading && (
                <div className="w-3 h-3 rounded-full border border-white/20 border-t-white/60 animate-spin" />
              )}
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  onSearch('');
                }}
                className="text-white/30 hover:text-white/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search results dropdown */}
            {searchQuery.length >= 2 && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-white/[0.08] bg-[#0d1117]/95 backdrop-blur-md p-1 z-50 max-h-48 overflow-y-auto max-w-[calc(100vw-2rem)]">
                {searchResults.slice(0, 8).map((article) => (
                  <button
                    key={article.id}
                    onClick={() => {
                      onSelectArticle(article);
                      setSearchOpen(false);
                      setSearchQuery('');
                      onSearch('');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-white/70 hover:bg-white/[0.04] line-clamp-1"
                  >
                    {article.headline}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="search-icon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            title="Search (Press /)"
          >
            <Search className="w-3.5 h-3.5 text-white/40" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Filter pill */}
      <div ref={filterRef} className="relative">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
            filterOpen || activeFilterCount > 0
              ? 'border-white/[0.15] bg-white/[0.04] text-white/70'
              : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:bg-white/[0.04]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter dropdown */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-1.5 w-56 max-w-[calc(100vw-2rem)] rounded-lg border border-white/[0.08] bg-[#0d1117]/95 backdrop-blur-md p-3 z-50 space-y-3"
            >
              {/* Time range */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">
                  Time range
                </div>
                <div className="flex gap-1">
                  {TIME_RANGES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => onTimeRangeChange(t.value)}
                      className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors ${
                        timeRange === t.value
                          ? 'bg-white/[0.08] text-white/80'
                          : 'text-white/30 hover:text-white/50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sentiment */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">
                  Sentiment
                </div>
                <div className="flex gap-1">
                  {(['all', 'bullish', 'bearish'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => onSentimentChange(s)}
                      className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors capitalize ${
                        sentimentFilter === s
                          ? 'bg-white/[0.08] text-white/80'
                          : 'text-white/30 hover:text-white/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">
                  Source
                </div>
                <select
                  value={sourceFilter}
                  onChange={(e) => onSourceChange(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded px-2 py-1 text-[11px] text-white/60 outline-none"
                >
                  {SOURCE_FILTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button
                  onClick={onClearAll}
                  className="w-full text-[11px] text-white/30 hover:text-white/50 py-1"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Last updated + Refresh + Freshness dot */}
      <div className="flex items-center gap-1.5">
        {secondsAgo != null && secondsAgo > 0 && (
          <span className="text-[10px] text-white/25 tabular-nums hidden sm:inline">
            {secondsAgo < 60 ? `${secondsAgo}s` : `${Math.floor(secondsAgo / 60)}m`}
          </span>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center justify-center w-7 h-7 rounded-md border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors disabled:opacity-40"
            title="Refresh news"
          >
            <RefreshCw className={`w-3 h-3 text-white/40 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        <button
          onClick={onScrollToTop}
          className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          title="Scroll to top"
        >
          {hasNewArticles ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-400" />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-white/[0.15]" />
          )}
        </button>
      </div>
    </div>
  );
}
