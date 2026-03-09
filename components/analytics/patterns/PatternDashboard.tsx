'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Search,
  LineChart,
  LayoutGrid,
  TrendingUp,
  Gauge,
  Activity,
  BarChart3,
  GitBranch,
  Fingerprint,
  Calendar,
} from 'lucide-react';
import { getPatternsV2 } from '@/src/lib/api/analyticsApi';
import type { IPatternDetectionV2, IPatternV2 } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { PatternChart } from './PatternChart';
import { PatternKPICards } from './PatternKPICards';
import { PatternCard } from './PatternCard';
import { MatrixProfilePanel } from './MatrixProfilePanel';
import { RegimeTimeline } from './RegimeTimeline';

const DEFAULT_TICKER = 'RELIANCE';

const POPULAR_TICKERS = [
  'RELIANCE', 'HDFCBANK', 'TCS', 'INFY', 'ICICIBANK',
  'SBIN', 'TATASTEEL', 'WIPRO', 'MARUTI', 'TITAN',
];

type PatternCategory = 'all' | 'chart' | 'momentum' | 'volatility' | 'volume' | 'regime' | 'matrix_profile' | 'seasonality';

const CATEGORY_TABS: { id: PatternCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: 'chart', label: 'Chart', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { id: 'momentum', label: 'Momentum', icon: <Gauge className="h-3.5 w-3.5" /> },
  { id: 'volatility', label: 'Volatility', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'volume', label: 'Volume', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'regime', label: 'Regime', icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 'matrix_profile', label: 'Matrix Profile', icon: <Fingerprint className="h-3.5 w-3.5" /> },
  { id: 'seasonality', label: 'Seasonality', icon: <Calendar className="h-3.5 w-3.5" /> },
];

export function PatternDashboard() {
  const [data, setData] = useState<IPatternDetectionV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState(DEFAULT_TICKER);
  const [searchInput, setSearchInput] = useState(DEFAULT_TICKER);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PatternCategory>('all');

  const fetchPatterns = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    const result = await getPatternsV2(t);
    if (result.success && result.data) {
      if ('error' in result.data && result.data.error) {
        setError(result.data.error);
        setData(null);
      } else {
        setData(result.data);
      }
    } else {
      setError('Failed to fetch patterns. Please ensure you are logged in.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPatterns(ticker);
  }, [ticker, fetchPatterns]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setTicker(searchInput.trim().toUpperCase());
    }
  };

  // Filter patterns by category
  const filteredPatterns = useMemo(() => {
    if (!data?.patterns) return [];
    if (selectedCategory === 'all') return data.patterns;
    return data.patterns.filter((p: IPatternV2) => p.category === selectedCategory);
  }, [data?.patterns, selectedCategory]);

  // Count patterns per category for badges
  const categoryCounts = useMemo(() => {
    if (!data?.patterns) return {};
    const counts: Record<string, number> = {};
    for (const p of data.patterns) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    counts['all'] = data.patterns.length;
    return counts;
  }, [data?.patterns]);

  // Split patterns: matrix_profile ones go into the special panel, rest into cards
  const regularPatterns = useMemo(
    () => filteredPatterns.filter((p: IPatternV2) => p.category !== 'matrix_profile'),
    [filteredPatterns],
  );

  const showMatrixProfile = selectedCategory === 'all' || selectedCategory === 'matrix_profile';

  return (
    <div className="space-y-5">
      {/* ─── Ticker Selector ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter ticker (e.g., RELIANCE)"
            className="pl-10 bg-white/5 border-white/10 h-9 text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
        >
          Analyze
        </button>
      </div>

      {/* Quick Tickers */}
      <div className="flex flex-wrap gap-1.5">
        {POPULAR_TICKERS.map((t) => (
          <button
            key={t}
            onClick={() => { setTicker(t); setSearchInput(t); }}
            className={cn(
              'px-2.5 py-1 text-[11px] font-medium rounded-md border transition-all',
              t === ticker
                ? 'bg-blue-600/20 border-blue-500/50 text-white'
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ─── Loading ─── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="text-sm text-gray-500">Analyzing {ticker}...</span>
          </div>
        </div>
      )}

      {/* ─── Error ─── */}
      {error && !loading && (
        <div className="text-center py-20 text-gray-500">
          <LineChart className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ─── Main Dashboard ─── */}
      {!loading && !error && data && (
        <AnimatePresence mode="wait">
          <motion.div
            key={data.ticker}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {/* Hero Chart */}
            {data.chart_data && data.chart_data.length > 0 && (
              <PatternChart
                ticker={data.ticker}
                chartData={data.chart_data}
                overlayData={data.overlay_data}
                indicators={data.indicators}
                regimeZones={data.regime?.regime_zones || []}
                changepointIndices={data.regime?.changepoint_indices || []}
                patterns={data.patterns}
                supportLevels={data.indicators?.support_levels || []}
                resistanceLevels={data.indicators?.resistance_levels || []}
              />
            )}

            {/* KPI Cards Row */}
            <PatternKPICards
              overallSignal={data.overall_signal}
              overallQuality={data.overall_quality || { score: 0, grade: 'C' as const }}
              patternCount={data.active_pattern_count || 0}
              bullishCount={data.patterns?.filter((p: IPatternV2) => p.direction === 'bullish').length || 0}
              bearishCount={data.patterns?.filter((p: IPatternV2) => p.direction === 'bearish').length || 0}
              neutralCount={data.patterns?.filter((p: IPatternV2) => p.direction === 'neutral').length || 0}
              regime={data.regime || {
                current: 'sideways',
                hurst_exponent: 0.5,
                hurst_classification: 'random_walk',
                last_changepoint_index: null,
              }}
              momentum={data.momentum || {
                rsi: { value: 50, zone: 'neutral' },
                macd: { histogram: 0, signal: 'neutral', strengthening: false },
                adx: { value: 0, trend: 'no_trend', direction: 'neutral' },
              }}
            />

            {/* Regime Timeline */}
            {data.regime && (
              <RegimeTimeline
                regime={data.regime}
                totalBars={data.chart_data?.length || 90}
              />
            )}

            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORY_TABS.map((tab) => {
                const count = categoryCounts[tab.id] || 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap',
                      selectedCategory === tab.id
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                        : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/[0.12]',
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                    {count > 0 && (
                      <span className={cn(
                        'ml-1 px-1.5 py-0.5 text-[10px] rounded-full',
                        selectedCategory === tab.id
                          ? 'bg-blue-500/30 text-blue-300'
                          : 'bg-white/[0.06] text-gray-600',
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Matrix Profile Panel (star feature) */}
            {showMatrixProfile && data.matrix_profile && (
              <MatrixProfilePanel
                matrixProfile={data.matrix_profile}
                chartData={data.chart_data.map((d) => ({ date: d.date, close: d.close }))}
              />
            )}

            {/* Pattern Cards Grid */}
            {filteredPatterns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">
                  {selectedCategory === 'all'
                    ? `No patterns detected for ${data.ticker}.`
                    : `No ${selectedCategory.replace('_', ' ')} patterns detected.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {regularPatterns.map((pattern: IPatternV2, i: number) => (
                  <PatternCard key={pattern.id || i} pattern={pattern} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
