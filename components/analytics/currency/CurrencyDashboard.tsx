'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import { CurrencyPairStrip } from './CurrencyPairStrip';
import { CurrencyHeader } from './CurrencyHeader';
import { CurrencySubTabs, type CurrencyTab } from './CurrencySubTabs';

// Tab 1: Heatmap
import { ForexHeatMap } from './ForexHeatMap';
import { ForexTopMovers } from './ForexTopMovers';
import { ForexMarketClock } from './ForexMarketClock';
import { ForexOverviewKPIs } from './ForexOverviewKPIs';

// Tab 2: Strength
import { CurrencyStrengthMeter } from './CurrencyStrengthMeter';

// Tab 3: Deep Dive (existing components)
import { CurrencyChartPanel } from './CurrencyChartPanel';
import { CurrencyMetricsBar } from './CurrencyMetricsBar';
import { CurrencyCorrelationMini } from './CurrencyCorrelationMini';
import { CurrencyNewsPanel } from './CurrencyNewsPanel';
import { CurrencyTechnicals } from './CurrencyTechnicals';
import { CurrencyVolatility } from './CurrencyVolatility';
import { CurrencySessions } from './CurrencySessions';

// Tab 4: Correlation
import { ForexCorrelationFull } from './ForexCorrelationFull';
import { ForexRiskCalculator } from './ForexRiskCalculator';

// Tab 5: Carry & Rates
import { CentralBankDashboard } from './CentralBankDashboard';
import { CarryTradeTable } from './CarryTradeTable';

// Tab 6: Calendar
import { EconomicCalendar } from './EconomicCalendar';

import {
  getCurrencyOverview,
  getCurrencyStrength,
  getCurrencyTechnicals,
  getCurrencyTopMovers,
  getCurrencyMarketClock,
} from '@/src/lib/api/analyticsApi';
import type {
  ICurrencyOverview,
  ICurrencyStrength,
  ICurrencyTechnicals,
  ITopMovers,
  IMarketClock,
} from '@/src/types/analytics';

const TIMEFRAMES = ['5m', '15m', '30m', '1h', '1D', '1W'] as const;
const REFRESH_INTERVAL_MS = 60_000;

export function CurrencyDashboard() {
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [activeTab, setActiveTab] = useState<CurrencyTab>('heatmap');
  const [overview, setOverview] = useState<ICurrencyOverview | null>(null);
  const [strength, setStrength] = useState<ICurrencyStrength | null>(null);
  const [technicals, setTechnicals] = useState<ICurrencyTechnicals | null>(null);
  const [topMovers, setTopMovers] = useState<ITopMovers | null>(null);
  const [marketClock, setMarketClock] = useState<IMarketClock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(prev => !overview ? true : prev);
    setError(null);
    try {
      const [ovRes, strRes, tmRes, mcRes] = await Promise.all([
        getCurrencyOverview(),
        getCurrencyStrength(),
        getCurrencyTopMovers(),
        getCurrencyMarketClock(),
      ]);
      if (ovRes.success) {
        setOverview(ovRes.data);
        setLastUpdated(ovRes.data.computed_at);
      } else {
        setError(ovRes.error?.message || 'Failed to load currency data');
      }
      if (strRes.success) setStrength(strRes.data);
      if (tmRes.success) setTopMovers(tmRes.data);
      if (mcRes.success) setMarketClock(mcRes.data);
    } catch {
      setError('Failed to load currency data');
    } finally {
      setLoading(false);
    }
  }, [overview]);

  const fetchTechnicals = useCallback(async () => {
    try {
      const res = await getCurrencyTechnicals(selectedPair);
      if (res.success) setTechnicals(res.data);
    } catch {
      // silent
    }
  }, [selectedPair]);

  useEffect(() => {
    fetchOverview();
    fetchTechnicals();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTechnicals();
  }, [selectedPair]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!autoRefreshPaused) {
      intervalRef.current = setInterval(() => {
        fetchOverview();
        if (activeTab === 'deepdive') fetchTechnicals();
      }, REFRESH_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefreshPaused, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualRefresh = useCallback(() => {
    fetchOverview();
    fetchTechnicals();
  }, [fetchOverview, fetchTechnicals]);

  const handleSelectPairFromHeatmap = useCallback((pair: string) => {
    setSelectedPair(pair);
    setActiveTab('deepdive');
  }, []);

  const selectedData = overview?.pairs?.find(p => p.ticker === selectedPair) ?? null;

  if (loading && !overview) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <DollarSign className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">Currency Dashboard</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchOverview}
          className="mt-4 text-xs flex items-center gap-1 text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header: strength, sessions, refresh controls */}
      <CurrencyHeader
        strength={strength}
        autoRefreshPaused={autoRefreshPaused}
        onToggleRefresh={() => setAutoRefreshPaused(p => !p)}
        onManualRefresh={handleManualRefresh}
        lastUpdated={lastUpdated}
      />

      {/* Sub-tabs */}
      <CurrencySubTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Tab 1: Heat Map ── */}
      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <ForexOverviewKPIs
            strength={strength}
            marketClock={marketClock}
            topMovers={topMovers}
          />
          <ForexTopMovers onSelectPair={handleSelectPairFromHeatmap} />
          <ForexHeatMap onSelectPair={handleSelectPairFromHeatmap} />
          <ForexMarketClock />
        </div>
      )}

      {/* ── Tab 2: Strength ── */}
      {activeTab === 'strength' && (
        <CurrencyStrengthMeter />
      )}

      {/* ── Tab 3: Deep Dive ── */}
      {activeTab === 'deepdive' && (
        <div className="space-y-4">
          {/* Pair Strip */}
          <CurrencyPairStrip
            pairs={overview?.pairs ?? []}
            selectedPair={selectedPair}
            onSelect={setSelectedPair}
          />

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 px-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  timeframe === tf
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart */}
          <CurrencyChartPanel pair={selectedPair} timeframe={timeframe} technicals={technicals} />

          {/* Sub-tabs for deep dive: Metrics / Technicals / Volatility / Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CurrencyMetricsBar pair={selectedData} technicals={technicals} />
            <CurrencyCorrelationMini />
          </div>

          <CurrencyTechnicals pair={selectedPair} />
          <CurrencyVolatility pair={selectedPair} />
          <CurrencySessions pair={selectedPair} />

          {/* News */}
          <CurrencyNewsPanel pair={selectedPair} />
        </div>
      )}

      {/* ── Tab 4: Correlation & Risk ── */}
      {activeTab === 'correlation' && (
        <div className="space-y-4">
          <ForexCorrelationFull />
          <ForexRiskCalculator />
        </div>
      )}

      {/* ── Tab 5: Carry & Rates ── */}
      {activeTab === 'carry' && (
        <div className="space-y-4">
          <CentralBankDashboard />
          <CarryTradeTable />
        </div>
      )}

      {/* ── Tab 6: Calendar ── */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <EconomicCalendar />
          <CurrencyNewsPanel pair={selectedPair} />
        </div>
      )}
    </motion.div>
  );
}
