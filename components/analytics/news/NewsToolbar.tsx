'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Network,
  GitBranch,
  Clock,
  Search,
  X,
  RefreshCw,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsViewMode } from './constants';
import { SOURCE_FILTER_OPTIONS, TIME_RANGES, getSourceDisplayName } from './constants';
import type { INewsArticle } from '@/types/analytics';

const VIEW_OPTIONS: { id: NewsViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'feed', label: 'Feed', icon: <Newspaper className="h-3.5 w-3.5" /> },
  { id: 'graph', label: 'Network', icon: <Network className="h-3.5 w-3.5" /> },
  { id: 'mindmap', label: 'Mind Map', icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 'timeline', label: 'Timeline', icon: <Clock className="h-3.5 w-3.5" /> },
];

const SENTIMENT_OPTIONS = [
  { label: 'All', value: 'all' as const },
  { label: 'Bullish', value: 'bullish' as const },
  { label: 'Bearish', value: 'bearish' as const },
];

interface NewsToolbarProps {
  activeView: NewsViewMode;
  onViewChange: (view: NewsViewMode) => void;
  selectedTicker: string | null;
  onTickerChange: (ticker: string | null) => void;
  sentimentFilter: 'all' | 'bullish' | 'bearish';
  onSentimentChange: (s: 'all' | 'bullish' | 'bearish') => void;
  tickerOptions: string[];
  sourceFilter?: string;
  onSourceChange?: (source: string) => void;
  timeRange?: number;
  onTimeRangeChange?: (hours: number) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  secondsAgo?: number;
  onSearch?: (query: string) => void;
  searchResults?: INewsArticle[];
  searchLoading?: boolean;
  onSelectArticle?: (article: INewsArticle) => void;
}

export function NewsToolbar({
  activeView,
  onViewChange,
  selectedTicker,
  onTickerChange,
  sentimentFilter,
  onSentimentChange,
  tickerOptions,
  sourceFilter,
  onSourceChange,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  refreshing,
  secondsAgo,
  onSearch,
  searchResults,
  searchLoading,
  onSelectArticle,
}: NewsToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        onSearch?.('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchOpen, onSearch]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      // Debounce article search
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (onSearch) {
        debounceRef.current = setTimeout(() => {
          onSearch(value);
        }, 400);
      }
    },
    [onSearch]
  );

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    onSearch?.('');
  }, [onSearch]);

  const filteredTickers = searchQuery
    ? tickerOptions.filter((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  const showArticleResults = searchResults && searchResults.length > 0 && searchQuery.length >= 2;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* View switcher */}
      <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
        {VIEW_OPTIONS.map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all',
              activeView === v.id
                ? 'bg-brand-blue/20 text-white shadow-sm'
                : 'text-white/35 hover:text-white/60'
            )}
            style={activeView === v.id ? {
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.08)',
            } : undefined}
          >
            {v.icon}
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* Unified search — tickers + full-text */}
      <div className="relative">
        {selectedTicker ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-blue/[0.12] border border-brand-blue/25 text-xs font-mono font-bold text-brand-blue">
            {selectedTicker}
            <button
              onClick={() => onTickerChange(null)}
              className="hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all',
                searchOpen
                  ? 'bg-white/[0.08] border-white/[0.15] text-white'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/[0.1]'
              )}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              {!searchOpen && (
                <kbd className="hidden sm:inline text-[9px] text-white/20 bg-white/[0.04] px-1 py-0.5 rounded font-mono">/</kbd>
              )}
            </button>
            {searchOpen && (
              <>
              <div className="fixed inset-0 z-40" onClick={closeSearch} />
              <div className="absolute top-full left-0 mt-1.5 z-50 w-72 max-w-[calc(100vw-2rem)] bg-[#151a26] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search stocks or news..."
                    className="w-full pl-9 pr-3 py-2.5 bg-transparent text-xs text-white placeholder:text-white/25 outline-none border-b border-white/[0.06]"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {/* Ticker matches */}
                  {filteredTickers.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-white/25 font-semibold">
                        Stocks
                      </div>
                      {filteredTickers.map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            onTickerChange(t);
                            closeSearch();
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-white/60 hover:bg-white/[0.06] font-mono transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </>
                  )}
                  {/* Article search results */}
                  {showArticleResults && (
                    <>
                      {filteredTickers.length > 0 && (
                        <div className="border-t border-white/[0.06]" />
                      )}
                      <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-white/25 font-semibold">
                        Articles
                      </div>
                      {searchResults!.slice(0, 5).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => {
                            onSelectArticle?.(a);
                            closeSearch();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-white/55 hover:bg-white/[0.06] leading-snug line-clamp-2 transition-colors"
                        >
                          {a.headline}
                          <span className="block text-[9px] text-white/25 mt-0.5">
                            {getSourceDisplayName(a.source)}
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                  {/* Loading / No results */}
                  {searchQuery.length >= 2 && filteredTickers.length === 0 && !showArticleResults && (
                    <div className="px-3 py-4 text-[10px] text-white/25 text-center">
                      {searchLoading ? (
                        <Loader2 className="h-4 w-4 mx-auto animate-spin opacity-40" />
                      ) : (
                        'No results found'
                      )}
                    </div>
                  )}
                </div>
              </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Sentiment filter */}
      <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
        {SENTIMENT_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => onSentimentChange(s.value)}
            className={cn(
              'px-2.5 py-1.5 text-xs font-medium rounded-md transition-all',
              sentimentFilter === s.value
                ? s.value === 'bullish'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : s.value === 'bearish'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-white/[0.08] text-white'
                : 'text-white/35 hover:text-white/60'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Time range selector */}
      {onTimeRangeChange && timeRange && (
        <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
          {TIME_RANGES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTimeRangeChange(t.value)}
              className={cn(
                'px-2 py-1.5 text-xs font-medium rounded-md transition-all tabular-nums',
                timeRange === t.value
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/35 hover:text-white/60'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Source filter — custom dropdown */}
      {onSourceChange && (
        <SourceDropdown
          value={sourceFilter || ''}
          onChange={onSourceChange}
        />
      )}

      {/* Refresh / sync now */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all',
            'bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/[0.1]',
            refreshing && 'opacity-40 cursor-not-allowed'
          )}
          title="Fetch latest news now"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      )}

      {/* Last updated indicator */}
      {secondsAgo != null && secondsAgo > 0 && (
        <span className="text-[10px] text-white/20 tabular-nums">
          {secondsAgo < 60
            ? `${secondsAgo}s ago`
            : `${Math.floor(secondsAgo / 60)}m ago`}
        </span>
      )}

      {/* Filter active indicator for non-feed views */}
      {activeView !== 'feed' && (sentimentFilter !== 'all' || !!sourceFilter) && (
        <span className="text-[9px] text-amber-500/60 bg-amber-500/[0.08] px-1.5 py-0.5 rounded-md border border-amber-500/[0.12]">
          Filters apply to Feed only
        </span>
      )}
    </div>
  );
}

/** Custom source filter dropdown matching dark theme */
function SourceDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = SOURCE_FILTER_OPTIONS.find((s) => s.value === value) ?? SOURCE_FILTER_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all',
          value
            ? 'bg-white/[0.08] border-white/[0.15] text-white'
            : 'bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/[0.1]'
        )}
      >
        {selected.label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 z-50 w-48 bg-[#151a26] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden">
            {SOURCE_FILTER_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  onChange(s.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs transition-colors',
                  value === s.value
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/50 hover:bg-white/[0.06] hover:text-white/70'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
