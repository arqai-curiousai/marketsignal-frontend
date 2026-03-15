'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LineChart,
  LayoutGrid,
  TrendingUp,
  Gauge,
  Activity,
  BarChart3,
  GitBranch,
  Fingerprint,
  CandlestickChart,
  Radar,
  FileSpreadsheet,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { getPatternsV2, getPatternMTF } from '@/src/lib/api/analyticsApi';
import type { IPatternDetectionV2, IPatternV2, IMTFAlignment } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/ui/ExportButton';
import { downloadCSV, downloadPNG } from '@/src/lib/utils/export';
import { PatternChart } from './PatternChart';
import { PatternKPICards } from './PatternKPICards';
import { PatternCard } from './PatternCard';
import { MatrixProfilePanel } from './MatrixProfilePanel';
import { RegimeTimeline } from './RegimeTimeline';
import { ScannerView } from './ScannerView';
import { PatternErrorBoundary } from './PatternErrorBoundary';

const DEFAULT_TICKER = 'RELIANCE';

const POPULAR_TICKERS = [
  'RELIANCE', 'HDFCBANK', 'TCS', 'INFY', 'ICICIBANK',
  'SBIN', 'TATASTEEL', 'WIPRO', 'MARUTI', 'TITAN',
];

// Full NIFTY 50 universe for autocomplete (Fix 8)
const NIFTY_50 = [
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
  'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BPCL', 'BHARTIARTL',
  'BRITANNIA', 'CIPLA', 'COALINDIA', 'DIVISLAB', 'DRREDDY',
  'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE',
  'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'ITC',
  'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LT',
  'M&M', 'MARUTI', 'NESTLEIND', 'NTPC', 'ONGC',
  'POWERGRID', 'RELIANCE', 'SBILIFE', 'SBIN', 'SUNPHARMA',
  'TCS', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL', 'TECHM',
  'TITAN', 'ULTRACEMCO', 'UPL', 'WIPRO', 'LTIM',
];

type PatternCategory = 'all' | 'candlestick' | 'chart' | 'momentum' | 'volatility' | 'volume' | 'regime' | 'matrix_profile';

const CATEGORY_TABS: { id: PatternCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: 'candlestick', label: 'Candlestick', icon: <CandlestickChart className="h-3.5 w-3.5" /> },
  { id: 'chart', label: 'Chart', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { id: 'momentum', label: 'Momentum', icon: <Gauge className="h-3.5 w-3.5" /> },
  { id: 'volume', label: 'Volume', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'volatility', label: 'Volatility', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'regime', label: 'Regime', icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 'matrix_profile', label: 'Matrix Profile', icon: <Fingerprint className="h-3.5 w-3.5" /> },
];

type ViewMode = 'analyze' | 'scan';

const TIMEFRAME_OPTIONS: { label: string; value: string }[] = [
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '1D', value: 'daily' },
  { label: '1W', value: 'weekly' },
];

// Quality grade ranking for sort (Fix 10)
const GRADE_RANK: Record<string, number> = { 'A+': 0, 'A': 1, 'B': 2, 'C': 3 };

export function PatternDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('analyze');
  const [data, setData] = useState<IPatternDetectionV2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState(DEFAULT_TICKER);
  const [searchInput, setSearchInput] = useState(DEFAULT_TICKER);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PatternCategory>('all');
  const [timeframe, setTimeframe] = useState<string>('daily');
  const [mtfData, setMtfData] = useState<IMTFAlignment | null>(null);
  const [mtfLoading, setMtfLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPatterns = useCallback(async (t: string, tf: string, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPatternsV2(t, 'NSE', tf);
      if (signal?.aborted) return;
      if (result.success && result.data) {
        if ('error' in result.data && result.data.error) {
          setError(result.data.error);
          setData(null);
        } else if (result.data.chart_data && Array.isArray(result.data.chart_data)) {
          setData(result.data);
          setLastUpdated(new Date());
        } else {
          setError('No chart data available for this ticker.');
          setData(null);
        }
      } else {
        setError('Failed to fetch patterns. Please ensure you are logged in.');
      }
    } catch {
      if (!signal?.aborted) {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMTF = useCallback(async (t: string, signal?: AbortSignal) => {
    setMtfLoading(true);
    try {
      const result = await getPatternMTF(t);
      if (signal?.aborted) return;
      if (result.success && result.data) {
        setMtfData(result.data);
      } else {
        setMtfData(null);
      }
    } catch {
      if (!signal?.aborted) setMtfData(null);
    } finally {
      setMtfLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const debounceTimer = setTimeout(() => {
      fetchPatterns(ticker, timeframe, controller.signal);
      fetchMTF(ticker, controller.signal);
    }, 300);
    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [ticker, timeframe, fetchPatterns, fetchMTF]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      setTicker(searchInput.trim().toUpperCase());
    }
  };

  // Manual refresh (Fix 11)
  const handleRefresh = useCallback(() => {
    fetchPatterns(ticker, timeframe);
    fetchMTF(ticker);
  }, [ticker, timeframe, fetchPatterns, fetchMTF]);

  // Autocomplete suggestions (Fix 8)
  const filteredSuggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const query = searchInput.trim().toUpperCase();
    return NIFTY_50.filter((t) => t.startsWith(query) && t !== query).slice(0, 8);
  }, [searchInput]);

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

  // Split patterns + sort by quality (Fix 10)
  const regularPatterns = useMemo(() => {
    const base = selectedCategory === 'matrix_profile'
      ? filteredPatterns
      : filteredPatterns.filter((p: IPatternV2) => p.category !== 'matrix_profile');
    return [...base].sort((a, b) => {
      const gradeA = GRADE_RANK[a.quality_grade] ?? 4;
      const gradeB = GRADE_RANK[b.quality_grade] ?? 4;
      if (gradeA !== gradeB) return gradeA - gradeB;
      return b.quality_score - a.quality_score;
    });
  }, [filteredPatterns, selectedCategory]);

  const showMatrixProfile = selectedCategory === 'all' || selectedCategory === 'matrix_profile';

  // Current price for PatternCard context (Fix 14)
  const currentPrice = useMemo(() => {
    if (!data) return null;
    return data.indicators?.current_price ?? data.chart_data?.[data.chart_data.length - 1]?.close ?? null;
  }, [data]);

  // When scanner selects a ticker, switch to analyze mode
  const handleScannerSelect = useCallback((t: string) => {
    setTicker(t);
    setSearchInput(t);
    setViewMode('analyze');
  }, []);

  return (
    <PatternErrorBoundary fallbackMessage="Pattern Dashboard encountered an error">
    <div className="space-y-5">
      {/* ─── Mode Toggle + Ticker Selector ─── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Analyze / Scan toggle */}
        <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          <button
            onClick={() => setViewMode('analyze')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5',
              viewMode === 'analyze'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            <Search className="h-3.5 w-3.5" />
            Analyze
          </button>
          <button
            onClick={() => setViewMode('scan')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5',
              viewMode === 'scan'
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            <Radar className="h-3.5 w-3.5" />
            Scan
          </button>
        </div>

        {/* Ticker search with autocomplete (Fix 8) */}
        {viewMode === 'analyze' && (
          <>
            <div className="relative flex-1 min-w-[140px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
              <Input
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value.toUpperCase()); setShowSuggestions(true); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(); setShowSuggestions(false); } }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Enter ticker (e.g., RELIANCE)"
                className="pl-10 bg-white/5 border-white/10 h-9 text-sm"
                autoComplete="off"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#111827] border border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((t) => (
                    <button
                      key={t}
                      onMouseDown={() => { setTicker(t); setSearchInput(t); setShowSuggestions(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
            >
              Analyze
            </button>

            {/* Timeframe selector pills */}
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
              {TIMEFRAME_OPTIONS.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
                    timeframe === tf.value
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-500 hover:text-gray-300',
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {data && !loading && (
              <>
                <ExportButton
                  options={[
                    {
                      label: 'CSV Patterns',
                      icon: <FileSpreadsheet className="h-3 w-3" />,
                      onClick: () => {
                        if (!data?.patterns) return;
                        const rows = data.patterns.map((p: IPatternV2) => ({
                          type: p.type,
                          category: p.category,
                          direction: p.direction,
                          confidence: p.confidence,
                          quality_score: p.quality_score,
                          quality_grade: p.quality_grade,
                          description: p.description,
                        }));
                        downloadCSV(rows, `${data.ticker}-patterns`);
                      },
                    },
                    {
                      label: 'PNG Screenshot',
                      icon: <ImageIcon className="h-3 w-3" />,
                      onClick: async () => {
                        const el = document.querySelector('[data-export-target="patterns"]') as HTMLElement;
                        if (el) await downloadPNG(el, `${data.ticker}-patterns`);
                      },
                    },
                  ]}
                />

                {/* Last updated + refresh (Fix 11) */}
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  {lastUpdated && (
                    <span>
                      {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-1 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                    title="Refresh data"
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ─── Scanner Mode ─── */}
      {viewMode === 'scan' && (
        <ScannerView onSelectTicker={handleScannerSelect} />
      )}

      {/* ─── Analyze Mode ─── */}
      {viewMode === 'analyze' && (
        <>
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

      {/* ─── Loading Skeleton (Fix 9) ─── */}
      {loading && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Chart skeleton */}
          <Skeleton className="h-[280px] md:h-[400px] rounded-xl" />
          {/* KPI cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          {/* Category tabs skeleton */}
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-lg" />
            ))}
          </div>
          {/* Pattern cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
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
            data-export-target="patterns"
          >
            {/* Hero Chart */}
            {data.chart_data && Array.isArray(data.chart_data) && data.chart_data.length > 0 && (
              <PatternErrorBoundary fallbackMessage="Chart failed to render">
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
                supertrend={data.supertrend}
                trendlines={data.trendlines}
                fibonacci={data.fibonacci}
              />
              </PatternErrorBoundary>
            )}

            {/* Category Tabs — moved above KPIs for better access (Fix 6) */}
            <div className="sticky top-0 z-10 py-2 -mx-1 px-1 bg-[#0B0F19]">
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
            </div>

            {/* KPI Cards Row (Fix 7: regime card removed) */}
            <PatternKPICards
              overallSignal={data.overall_signal}
              overallQuality={data.overall_quality || { score: 0, grade: 'C' as const }}
              patternCount={data.active_pattern_count || 0}
              bullishCount={data.patterns?.filter((p: IPatternV2) => p.direction === 'bullish').length || 0}
              bearishCount={data.patterns?.filter((p: IPatternV2) => p.direction === 'bearish').length || 0}
              neutralCount={data.patterns?.filter((p: IPatternV2) => p.direction === 'neutral').length || 0}
              momentum={data.momentum || {
                rsi: { value: 50, zone: 'neutral' },
                macd: { histogram: 0, signal: 'neutral', strengthening: false },
                adx: { value: 0, trend: 'no_trend', direction: 'neutral' },
              }}
              mtfAlignment={mtfData}
              mtfLoading={mtfLoading}
            />

            {/* Regime Timeline (Fix 16: pass chartDates) */}
            {data.regime && (
              <RegimeTimeline
                regime={data.regime}
                totalBars={data.chart_data?.length || 90}
                chartDates={data.chart_data?.map((d) => d.date)}
              />
            )}

            {/* Matrix Profile Panel (star feature) */}
            {showMatrixProfile && data.matrix_profile && (
              <MatrixProfilePanel
                matrixProfile={data.matrix_profile}
                chartData={data.chart_data.map((d) => ({ date: d.date, close: d.close }))}
              />
            )}

            {/* Pattern Cards Grid */}
            {filteredPatterns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Activity className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm font-medium text-gray-400 mb-1">
                  {selectedCategory === 'all'
                    ? `Markets are quiet for ${data.ticker}`
                    : `No ${selectedCategory.replace('_', ' ')} patterns detected`}
                </p>
                <p className="text-xs text-gray-600 mb-4">
                  Try a different timeframe or check during market hours
                </p>
                <div className="flex items-center gap-1.5">
                  {TIMEFRAME_OPTIONS.filter((tf) => tf.value !== timeframe).slice(0, 3).map((tf) => (
                    <button
                      key={tf.value}
                      onClick={() => setTimeframe(tf.value)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                    >
                      Try {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {regularPatterns.map((pattern: IPatternV2, i: number) => (
                  <PatternCard key={pattern.id || i} pattern={pattern} currentPrice={currentPrice} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
        </>
      )}
    </div>
    </PatternErrorBoundary>
  );
}
