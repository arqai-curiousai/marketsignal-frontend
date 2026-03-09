'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Newspaper,
  Network,
  GitBranch,
  Clock,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NewsViewMode } from './constants';
import { TIME_RANGES } from './constants';

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
  timeRange: number;
  onTimeRangeChange: (hours: number) => void;
  selectedTicker: string | null;
  onTickerChange: (ticker: string | null) => void;
  sentimentFilter: 'all' | 'bullish' | 'bearish';
  onSentimentChange: (s: 'all' | 'bullish' | 'bearish') => void;
  tickerOptions: string[];
}

export function NewsToolbar({
  activeView,
  onViewChange,
  timeRange,
  onTimeRangeChange,
  selectedTicker,
  onTickerChange,
  sentimentFilter,
  onSentimentChange,
  tickerOptions,
}: NewsToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  const filteredTickers = searchQuery
    ? tickerOptions.filter((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

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

      {/* Time range */}
      <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
        {TIME_RANGES.map((t) => (
          <button
            key={t.value}
            onClick={() => onTimeRangeChange(t.value)}
            className={cn(
              'px-2 py-1.5 text-xs font-medium rounded-md transition-all',
              timeRange === t.value
                ? 'bg-white/10 text-white'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ticker search / chip */}
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
              <span className="hidden sm:inline">Stock</span>
            </button>
            {searchOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-[#1a1f2e] border border-white/15 rounded-lg shadow-xl overflow-hidden">
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticker..."
                  className="w-full px-3 py-2 bg-transparent text-xs text-white placeholder:text-muted-foreground outline-none border-b border-white/10"
                />
                {filteredTickers.length > 0 && (
                  <div className="max-h-48 overflow-y-auto">
                    {filteredTickers.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          onTickerChange(t);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 font-mono"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
    </div>
  );
}
