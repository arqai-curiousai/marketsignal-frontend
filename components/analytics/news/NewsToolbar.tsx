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
    <div className="flex flex-wrap items-center gap-3">
      {/* View switcher */}
      <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
        {VIEW_OPTIONS.map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all',
              activeView === v.id
                ? 'bg-brand-blue/30 text-white'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            {v.icon}
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>

      {/* Unified search — tickers + full-text */}
      <div className="relative">
        {selectedTicker ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-blue/20 border border-brand-blue/30 text-xs font-mono font-semibold text-brand-blue">
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
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white'
              )}
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
              {!searchOpen && (
                <kbd className="hidden sm:inline text-[9px] text-white/30 bg-white/5 px-1 py-0.5 rounded font-mono">/</kbd>
              )}
            </button>
            {searchOpen && (
              <>
              <div className="fixed inset-0 z-40" onClick={closeSearch} />
              <div className="absolute top-full left-0 mt-1 z-50 w-64 max-w-[calc(100vw-2rem)] bg-[#1a1f2e] border border-white/15 rounded-lg shadow-xl overflow-hidden">
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search stocks or news..."
                  className="w-full px-3 py-2 bg-transparent text-xs text-white placeholder:text-muted-foreground outline-none border-b border-white/10"
                />
                <div className="max-h-64 overflow-y-auto">
                  {/* Ticker matches */}
                  {filteredTickers.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Stocks
                      </div>
                      {filteredTickers.map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            onTickerChange(t);
                            closeSearch();
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 font-mono"
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
                        <div className="border-t border-white/10" />
                      )}
                      <div className="px-3 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Articles
                      </div>
                      {searchResults!.slice(0, 5).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => {
                            onSelectArticle?.(a);
                            closeSearch();
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 leading-snug line-clamp-2"
                        >
                          {a.headline}
                          <span className="block text-[9px] text-muted-foreground mt-0.5">
                            {getSourceDisplayName(a.source)}
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                  {/* Loading / No results */}
                  {searchQuery.length >= 2 && filteredTickers.length === 0 && !showArticleResults && (
                    <div className="px-3 py-3 text-[10px] text-muted-foreground text-center">
                      {searchLoading ? (
                        <Loader2 className="h-4 w-4 mx-auto animate-spin opacity-60" />
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
      <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
        {SENTIMENT_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => onSentimentChange(s.value)}
            className={cn(
              'px-2 py-1.5 text-xs font-medium rounded-md transition-all',
              sentimentFilter === s.value
                ? 'bg-white/10 text-white'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Time range selector */}
      {onTimeRangeChange && timeRange && (
        <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
          {TIME_RANGES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTimeRangeChange(t.value)}
              className={cn(
                'px-2 py-1.5 text-xs font-medium rounded-md transition-all tabular-nums',
                timeRange === t.value
                  ? 'bg-white/10 text-white'
                  : 'text-muted-foreground hover:text-white'
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
            'bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:border-white/20',
            refreshing && 'opacity-50 cursor-not-allowed'
          )}
          title="Fetch latest news now"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      )}

      {/* Last updated indicator */}
      {secondsAgo != null && secondsAgo > 0 && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {secondsAgo < 60
            ? `${secondsAgo}s ago`
            : `${Math.floor(secondsAgo / 60)}m ago`}
        </span>
      )}

      {/* Filter active indicator for non-feed views */}
      {activeView !== 'feed' && (sentimentFilter !== 'all' || !!sourceFilter) && (
        <span className="text-[9px] text-yellow-500/80 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20">
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
            ? 'bg-white/10 border-white/20 text-white'
            : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white'
        )}
      >
        {selected.label}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-[#1a1f2e] border border-white/15 rounded-lg shadow-xl overflow-hidden">
            {SOURCE_FILTER_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  onChange(s.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-xs transition-colors',
                  value === s.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
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
