'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { scanPatterns } from '@/src/lib/api/analyticsApi';
import type { IScannerResult, IScannerStockResult } from '@/types/analytics';

// ─── Quick scan presets ──────────────────────────────────────

interface ScanPreset {
  label: string;
  categories?: string[];
  direction?: string;
  min_quality?: string;
}

const SCAN_PRESETS: ScanPreset[] = [
  { label: 'All Patterns' },
  { label: 'Candlestick Reversals', categories: ['candlestick'], direction: undefined },
  { label: 'Chart Patterns', categories: ['chart'], direction: undefined },
  { label: 'Momentum Breakouts', categories: ['momentum'], direction: 'bullish' },
  { label: 'Bearish Setups', direction: 'bearish' },
  { label: 'High Quality (A+)', min_quality: 'A+' },
  { label: 'Squeeze Plays', categories: ['volatility'] },
];

// ─── Helpers ────────────────────────────────────────────────

function formatPatternName(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const signalConfig = {
  bullish: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp },
  bearish: { color: 'text-rose-400', bg: 'bg-rose-500/10', icon: TrendingDown },
  neutral: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Minus },
} as const;

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A+': return 'text-emerald-400 bg-emerald-500/15';
    case 'A': return 'text-emerald-400 bg-emerald-500/10';
    case 'B': return 'text-amber-400 bg-amber-500/10';
    default: return 'text-gray-400 bg-gray-500/10';
  }
}

// ─── Sort keys ──────────────────────────────────────────────

type SortKey = 'quality' | 'patterns' | 'ticker';

// ─── Component ──────────────────────────────────────────────

interface ScannerViewProps {
  onSelectTicker: (ticker: string) => void;
  exchange: string;
}

export function ScannerView({ onSelectTicker, exchange }: ScannerViewProps) {
  const [data, setData] = useState<IScannerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('quality');

  const runScan = useCallback(async (preset: ScanPreset) => {
    setLoading(true);
    setError(null);
    try {
      const result = await scanPatterns({
        categories: preset.categories,
        direction: preset.direction,
        min_quality: preset.min_quality,
        exchange,
      });
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError('Failed to run scanner. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runScan(SCAN_PRESETS[0]);
  }, [runScan]);

  const handlePreset = (idx: number) => {
    setActivePreset(idx);
    runScan(SCAN_PRESETS[idx]);
  };

  const sortedResults = React.useMemo(() => {
    if (!data?.results) return [];
    const sorted = [...data.results];
    switch (sortBy) {
      case 'quality':
        sorted.sort((a, b) => {
          const scoreA = a.top_pattern?.quality_score ?? 0;
          const scoreB = b.top_pattern?.quality_score ?? 0;
          return scoreB - scoreA;
        });
        break;
      case 'patterns':
        sorted.sort((a, b) => b.pattern_count - a.pattern_count);
        break;
      case 'ticker':
        sorted.sort((a, b) => a.ticker.localeCompare(b.ticker));
        break;
    }
    return sorted;
  }, [data?.results, sortBy]);

  return (
    <div className="space-y-4">
      {/* Scan Preset Chips */}
      <div className="flex flex-wrap gap-1.5">
        {SCAN_PRESETS.map((preset, idx) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(idx)}
            className={cn(
              'px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all',
              idx === activePreset
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/[0.12]',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
            <span className="text-sm text-gray-500">Scanning NIFTY 50...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Summary Bar */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span>
              <span className="text-white font-semibold">{data.stocks_with_patterns}</span>/{data.total_scanned} stocks
              have active patterns
            </span>
            <span className="text-emerald-400">
              {data.summary.bullish_stocks} bullish
            </span>
            <span className="text-rose-400">
              {data.summary.bearish_stocks} bearish
            </span>
            <span className="text-amber-400">
              {data.summary.neutral_stocks} neutral
            </span>
            <span className="text-gray-500 ml-auto">
              {data.total_patterns} total patterns
            </span>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-[11px] text-gray-500">Sort:</span>
            {(['quality', 'patterns', 'ticker'] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={cn(
                  'px-2 py-0.5 text-[10px] font-medium rounded transition-all',
                  sortBy === key
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300',
                )}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          {/* Results Table */}
          {sortedResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No patterns match the selected filters.</p>
            </div>
          ) : (
            <div className="border border-white/[0.06] rounded-xl overflow-hidden">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_1fr_70px_70px_60px] gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                <span>Ticker</span>
                <span>Signal</span>
                <span>Top Pattern</span>
                <span className="text-center">Grade</span>
                <span className="text-center">Conf.</span>
                <span className="text-center">Count</span>
              </div>

              {/* Rows */}
              {sortedResults.map((row: IScannerStockResult) => {
                const signal = signalConfig[row.overall_signal] ?? signalConfig.neutral;
                const SignalIcon = signal.icon;
                const topP = row.top_pattern;

                return (
                  <button
                    key={row.ticker}
                    onClick={() => onSelectTicker(row.ticker)}
                    className="w-full text-left border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Desktop row */}
                    <div className="hidden sm:grid grid-cols-[1fr_80px_1fr_70px_70px_60px] gap-2 px-4 py-3">
                      <div>
                        <span className="text-sm font-semibold text-white">{row.ticker}</span>
                        {row.current_price != null && (
                          <span className="ml-2 text-[11px] text-gray-500 font-mono">
                            {'\u20B9'}{row.current_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', signal.color)}>
                        <SignalIcon className="h-3 w-3" />
                        {row.overall_signal.charAt(0).toUpperCase() + row.overall_signal.slice(1)}
                      </span>
                      <span className="text-xs text-gray-300 truncate">
                        {topP ? formatPatternName(topP.type) : '-'}
                      </span>
                      <div className="flex justify-center">
                        {topP && (
                          <span className={cn('text-[10px] font-bold font-mono rounded px-1.5 py-0.5', gradeColor(topP.quality_grade))}>
                            {topP.quality_grade}
                          </span>
                        )}
                      </div>
                      <span className="text-center text-xs font-mono text-gray-300">
                        {topP ? `${Math.round(topP.confidence * 100)}%` : '-'}
                      </span>
                      <span className="text-center text-xs font-mono text-gray-400">
                        {row.pattern_count}
                      </span>
                    </div>

                    {/* Mobile card layout */}
                    <div className="sm:hidden px-4 py-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{row.ticker}</span>
                          <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', signal.color)}>
                            <SignalIcon className="h-3 w-3" />
                            {row.overall_signal.charAt(0).toUpperCase() + row.overall_signal.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {topP && (
                            <>
                              <span className="text-[9px] text-gray-600">Grade:</span>
                              <span className={cn('text-[10px] font-bold font-mono rounded px-1.5 py-0.5', gradeColor(topP.quality_grade))}>
                                {topP.quality_grade}
                              </span>
                            </>
                          )}
                          <span className="text-[9px] text-gray-600">Patterns:</span>
                          <span className="text-xs font-mono text-gray-400">
                            {row.pattern_count}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="text-gray-300 truncate max-w-[60%]">
                          {topP ? formatPatternName(topP.type) : '-'}
                        </span>
                        {row.current_price != null && (
                          <span className="font-mono text-gray-500">
                            {'\u20B9'}{row.current_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
