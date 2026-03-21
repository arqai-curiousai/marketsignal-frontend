'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  DollarSign,
  RefreshCw,
  Radar,
  LineChart,
  LayoutGrid,
  Activity,
  Globe,
  Landmark,
  Calendar,
  FileSpreadsheet,
  Image,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Analyze mode components
import { CurrencyChartPanel } from './CurrencyChartPanel';
import { CurrencyPulseStrip } from './CurrencyPulseStrip';
import { CurrencyTechnicalsTable } from './CurrencyTechnicalsTable';
import { CurrencyVolatility } from './CurrencyVolatility';
import { CurrencySessions } from './CurrencySessions';
import { CurrencyCorrelationMini } from './CurrencyCorrelationMini';
import { CurrencyNewsPanel } from './CurrencyNewsPanel';

// Carry & Calendar
import { CentralBankDashboard } from './CentralBankDashboard';
import { CarryTradeTable } from './CarryTradeTable';
import { EconomicCalendar } from './EconomicCalendar';

// Scan mode
import { CurrencyScannerView } from './CurrencyScannerView';

// Export
import { ExportButton } from '@/components/ui/ExportButton';
import { downloadCSV, downloadPNG } from '@/src/lib/utils/export';

// Shared constants
import { NSE_FOREX_PAIRS, FOREX_TIMEFRAMES, FOREX_DISCLAIMER } from './constants';

// API
import {
  getCurrencyOverview,
  getCurrencyTechnicals,
  getCurrencyVolatility as getCurrencyVolatilityApi,
  getCurrencyMarketClock,
} from '@/src/lib/api/analyticsApi';
import type {
  ICurrencyTechnicals,
  ICurrencyVolatility,
  IMarketClock,
} from '@/src/types/analytics';

// ─── Constants ───────────────────────────────────────────────────────────────

const TIMEFRAMES = FOREX_TIMEFRAMES;
const REFRESH_INTERVAL_MS = 60_000;

type CurrencyCategory = 'all' | 'technicals' | 'volatility' | 'sessions' | 'carry' | 'calendar';

const CATEGORY_TABS: { id: CurrencyCategory; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'technicals', label: 'Technicals', icon: LineChart },
  { id: 'volatility', label: 'Volatility', icon: Activity },
  { id: 'sessions', label: 'Sessions', icon: Globe },
  { id: 'carry', label: 'Carry & Rates', icon: Landmark },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
];

const ALL_PAIRS = [...NSE_FOREX_PAIRS];

// ─── Component ───────────────────────────────────────────────────────────────

export function CurrencyDashboard() {
  // View mode
  const [viewMode, setViewMode] = useState<'analyze' | 'scan'>('analyze');

  // Analyze mode state
  const [selectedPair, setSelectedPair] = useState('USD/INR');
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [selectedCategory, setSelectedCategory] = useState<CurrencyCategory>('all');

  // Data
  const [technicals, setTechnicals] = useState<ICurrencyTechnicals | null>(null);
  const [volatility, setVolatility] = useState<ICurrencyVolatility | null>(null);
  const [marketClock, setMarketClock] = useState<IMarketClock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  // ── Fetch Data ───────────────────────────────────────────────────────────

  const fetchPairData = useCallback(async (pair: string) => {
    if (!hasLoadedRef.current) setLoading(true);
    setError(null);
    try {
      const [techRes, volRes, mcRes] = await Promise.all([
        getCurrencyTechnicals(pair),
        getCurrencyVolatilityApi(pair),
        getCurrencyMarketClock(),
      ]);
      if (techRes.success) {
        setTechnicals(techRes.data);
        setLastUpdated(new Date());
        hasLoadedRef.current = true;
      } else {
        setError(techRes.error?.message || 'Failed to load technicals');
      }
      if (volRes.success) setVolatility(volRes.data);
      if (mcRes.success) setMarketClock(mcRes.data);
    } catch {
      setError('Failed to load currency data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'analyze') fetchPairData(selectedPair);
  }, [selectedPair, viewMode, fetchPairData]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (viewMode === 'analyze') {
      intervalRef.current = setInterval(() => fetchPairData(selectedPair), REFRESH_INTERVAL_MS);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedPair, viewMode, fetchPairData]);

  // ── Pair Search ──────────────────────────────────────────────────────────

  const filteredPairs = useMemo(() => {
    if (!searchInput.trim()) return ALL_PAIRS;
    const q = searchInput.toUpperCase();
    return ALL_PAIRS.filter(p => p.includes(q));
  }, [searchInput]);

  const handleSelectPair = useCallback((pair: string) => {
    setSelectedPair(pair);
    setSearchInput('');
    setShowSuggestions(false);
    hasLoadedRef.current = false;
    if (viewMode === 'scan') setViewMode('analyze');
  }, [viewMode]);

  const handleSearchSubmit = useCallback(() => {
    if (filteredPairs.length > 0) {
      handleSelectPair(filteredPairs[0]);
    }
  }, [filteredPairs, handleSelectPair]);

  const handleRefresh = useCallback(() => {
    fetchPairData(selectedPair);
  }, [fetchPairData, selectedPair]);

  // ── Export ───────────────────────────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    if (!technicals) return;
    const rows = [
      { indicator: 'RSI', value: technicals.rsi.value, signal: technicals.rsi.signal },
      { indicator: 'MACD', value: technicals.macd.macd, signal: technicals.macd.histogram > 0 ? 'bullish' : 'bearish' },
      { indicator: 'Bollinger %B', value: technicals.bollinger.pctB, signal: technicals.bollinger.pctB > 1 ? 'overbought' : technicals.bollinger.pctB < 0 ? 'oversold' : 'neutral' },
    ];
    downloadCSV(rows, `${selectedPair.replace('/', '_')}_technicals.csv`);
  }, [technicals, selectedPair]);

  const handleExportPNG = useCallback(() => {
    if (dashboardRef.current) {
      downloadPNG(dashboardRef.current, `${selectedPair.replace('/', '_')}_dashboard.png`);
    }
  }, [selectedPair]);

  // Active sessions count
  const activeSessions = marketClock?.active_count ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div ref={dashboardRef} className="space-y-3">
      {/* ── OTC Disclaimer ── */}
      <div className="text-[10px] text-muted-foreground/60 px-1 py-0.5">
        {FOREX_DISCLAIMER}
      </div>
      {/* ── Command Bar ── */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/[0.04] -mx-1 px-1 py-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Analyze / Scan toggle */}
          <div className="flex rounded-lg border border-white/[0.08] overflow-hidden">
            <button
              onClick={() => setViewMode('analyze')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                viewMode === 'analyze'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-white/[0.04]'
              }`}
            >
              <LineChart className="h-3.5 w-3.5" />
              Analyze
            </button>
            <button
              onClick={() => setViewMode('scan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-colors ${
                viewMode === 'scan'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-white/[0.04]'
              }`}
            >
              <Radar className="h-3.5 w-3.5" />
              Scan
            </button>
          </div>

          {/* Pair search (Analyze mode only) */}
          {viewMode === 'analyze' && (
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                placeholder={selectedPair}
                className="pl-8 h-8 text-xs bg-white/[0.03] border-white/[0.08]"
              />
              {showSuggestions && filteredPairs.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1f2e] border border-white/[0.08] rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto">
                  {filteredPairs.map((p) => (
                    <button
                      key={p}
                      onMouseDown={() => handleSelectPair(p)}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/[0.06] transition-colors ${
                        p === selectedPair ? 'text-primary font-medium' : 'text-white/80'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeframe pills (Analyze mode only) */}
          {viewMode === 'analyze' && (
            <div className="flex items-center gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                    timeframe === tf
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {/* Export + Refresh */}
          <div className="flex items-center gap-1.5 ml-auto">
            {viewMode === 'analyze' && (
              <ExportButton
                options={[
                  { label: 'CSV', icon: <FileSpreadsheet className="h-3.5 w-3.5" />, onClick: handleExportCSV },
                  { label: 'PNG', icon: <Image className="h-3.5 w-3.5" />, onClick: handleExportPNG },
                ]}
              />
            )}
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground tabular-nums hidden sm:inline">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-md hover:bg-white/[0.06] text-muted-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Scan Mode ── */}
      {viewMode === 'scan' && (
        <CurrencyScannerView onSelectPair={handleSelectPair} />
      )}

      {/* ── Analyze Mode ── */}
      {viewMode === 'analyze' && (
        <>
          {/* Loading Skeleton */}
          {loading && !technicals && (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {/* Error State */}
          {error && !technicals && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <DollarSign className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">{selectedPair}</p>
              <p className="text-sm mt-1">{error}</p>
              <button onClick={handleRefresh} className="mt-4 text-xs flex items-center gap-1 text-primary hover:underline">
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </div>
          )}

          {/* Main Dashboard */}
          {technicals && (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPair}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {/* Pulse Strip */}
                <CurrencyPulseStrip
                  technicals={technicals}
                  volatility={volatility}
                  activeSessions={activeSessions}
                />

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {CATEGORY_TABS.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full whitespace-nowrap transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06]'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Chart */}
                <CurrencyChartPanel pair={selectedPair} timeframe={timeframe} technicals={technicals} />

                {/* Category Content */}
                {(selectedCategory === 'all' || selectedCategory === 'technicals') && (
                  <CurrencyTechnicalsTable technicals={technicals} />
                )}

                {(selectedCategory === 'all' || selectedCategory === 'volatility') && (
                  <CurrencyVolatility pair={selectedPair} />
                )}

                {(selectedCategory === 'all' || selectedCategory === 'sessions') && (
                  <CurrencySessions pair={selectedPair} />
                )}

                {(selectedCategory === 'carry') && (
                  <div className="space-y-4">
                    <CentralBankDashboard />
                    <CarryTradeTable />
                  </div>
                )}

                {(selectedCategory === 'calendar') && (
                  <div className="space-y-4">
                    <EconomicCalendar />
                    <CurrencyNewsPanel pair={selectedPair} />
                  </div>
                )}

                {/* Deep Analysis Accordion (All category only) */}
                {selectedCategory === 'all' && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="correlation" className="border-white/[0.06]">
                      <AccordionTrigger className="text-xs text-muted-foreground hover:text-white py-3">
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5" />
                          Correlation Analysis
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <CurrencyCorrelationMini />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {/* News (always visible in 'all' mode) */}
                {selectedCategory === 'all' && (
                  <CurrencyNewsPanel pair={selectedPair} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  );
}
