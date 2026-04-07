'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useMarketAwarePolling } from '@/src/lib/hooks/useMarketAwarePolling';
import {
  getCurrencyOverview,
  getCurrencyStrength,
  getCurrencyTopMovers,
  getCurrencyMarketClock,
  getCurrencyCrossRates,
  getCurrencyTechnicals,
  getCurrencyVolatility,
  getCurrencyRegime,
  getCurrencyMeanReversion,
} from '@/src/lib/api/analyticsApi';
import type {
  ICurrencyOverview,
  ICurrencyStrength,
  ITopMovers,
  IMarketClock,
  ICrossRatesMatrix,
  ICurrencyTechnicals,
  ICurrencyVolatility,
  ICurrencyRegime,
  ICurrencyMeanReversion,
} from '@/src/types/analytics';
import { ALL_FOREX_PAIRS, FOREX_TIMEFRAMES } from './constants';

/* ── Types ── */

interface ForexDataContextValue {
  // Selection state
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;

  // Global data (shared across all panels)
  overview: ICurrencyOverview | null;
  strength: ICurrencyStrength | null;
  marketClock: IMarketClock | null;
  crossRates: ICrossRatesMatrix | null;
  topMovers: ITopMovers | null;

  // Pair-specific data
  technicals: ICurrencyTechnicals | null;
  volatility: ICurrencyVolatility | null;
  regime: ICurrencyRegime | null;
  meanReversion: ICurrencyMeanReversion | null;

  // State
  loading: boolean;
  pairLoading: boolean;
  lastRefresh: number;

  // Actions
  refresh: () => void;
}

const ForexDataContext = createContext<ForexDataContextValue | null>(null);

export function useForexData(): ForexDataContextValue {
  const ctx = useContext(ForexDataContext);
  if (!ctx) throw new Error('useForexData must be used within ForexDataProvider');
  return ctx;
}

/* ── URL helpers ── */

function writeUrlParams(params: Record<string, string | null>) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState({}, '', url.toString());
}

/* ── Provider ── */

export function ForexDataProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();

  // Selection state — synced with URL
  const rawPair = searchParams.get('pair');
  const rawTf = searchParams.get('tf');
  const [selectedPair, setSelectedPairState] = useState(
    rawPair && (ALL_FOREX_PAIRS as readonly string[]).includes(rawPair)
      ? rawPair
      : 'EUR/USD',
  );
  const [timeframe, setTimeframeState] = useState(
    rawTf && (FOREX_TIMEFRAMES as readonly string[]).includes(rawTf)
      ? rawTf
      : '1D',
  );

  const setSelectedPair = useCallback((pair: string) => {
    setSelectedPairState(pair);
    writeUrlParams({ pair: pair === 'EUR/USD' ? null : pair });
  }, []);

  const setTimeframe = useCallback((tf: string) => {
    setTimeframeState(tf);
    writeUrlParams({ tf: tf === '1D' ? null : tf });
  }, []);

  // Global data
  const [overview, setOverview] = useState<ICurrencyOverview | null>(null);
  const [strength, setStrength] = useState<ICurrencyStrength | null>(null);
  const [marketClock, setMarketClock] = useState<IMarketClock | null>(null);
  const [crossRates, setCrossRates] = useState<ICrossRatesMatrix | null>(null);
  const [topMovers, setTopMovers] = useState<ITopMovers | null>(null);

  // Pair-specific data
  const [technicals, setTechnicals] = useState<ICurrencyTechnicals | null>(null);
  const [volatility, setVolatility] = useState<ICurrencyVolatility | null>(null);
  const [regime, setRegime] = useState<ICurrencyRegime | null>(null);
  const [meanReversion, setMeanReversion] = useState<ICurrencyMeanReversion | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);
  const [pairLoading, setPairLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const hasLoaded = useRef(false);

  // Fetch global data
  const fetchGlobal = useCallback(async () => {
    if (!hasLoaded.current) setLoading(true);
    try {
      const settled = await Promise.allSettled([
        getCurrencyOverview(),
        getCurrencyStrength(),
        getCurrencyTopMovers(),
        getCurrencyMarketClock(),
        getCurrencyCrossRates('1d', 'g10'),
      ]);
      const unwrap = <T,>(r: PromiseSettledResult<{ success: boolean; data: T }>): T | null =>
        r.status === 'fulfilled' && r.value.success ? r.value.data : null;

      const ov = unwrap(settled[0] as PromiseSettledResult<{ success: boolean; data: ICurrencyOverview }>);
      const str = unwrap(settled[1] as PromiseSettledResult<{ success: boolean; data: ICurrencyStrength }>);
      const tm = unwrap(settled[2] as PromiseSettledResult<{ success: boolean; data: ITopMovers }>);
      const mc = unwrap(settled[3] as PromiseSettledResult<{ success: boolean; data: IMarketClock }>);
      const cr = unwrap(settled[4] as PromiseSettledResult<{ success: boolean; data: ICrossRatesMatrix }>);

      if (ov) setOverview(ov);
      if (str) setStrength(str);
      if (tm) setTopMovers(tm);
      if (mc) setMarketClock(mc);
      if (cr) setCrossRates(cr);
      hasLoaded.current = true;
      setLastRefresh(Date.now());
    } catch {
      // Individual panels handle null gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pair-specific data
  const fetchPairData = useCallback(async (pair: string) => {
    setPairLoading(true);
    try {
      const settled = await Promise.allSettled([
        getCurrencyTechnicals(pair),
        getCurrencyVolatility(pair),
        getCurrencyRegime(pair),
        getCurrencyMeanReversion(pair),
      ]);
      const unwrap = <T,>(r: PromiseSettledResult<{ success: boolean; data: T }>): T | null =>
        r.status === 'fulfilled' && r.value.success ? r.value.data : null;

      const tech = unwrap(settled[0] as PromiseSettledResult<{ success: boolean; data: ICurrencyTechnicals }>);
      const vol = unwrap(settled[1] as PromiseSettledResult<{ success: boolean; data: ICurrencyVolatility }>);
      const reg = unwrap(settled[2] as PromiseSettledResult<{ success: boolean; data: ICurrencyRegime }>);
      const mr = unwrap(settled[3] as PromiseSettledResult<{ success: boolean; data: ICurrencyMeanReversion }>);

      if (tech) setTechnicals(tech);
      if (vol) setVolatility(vol);
      if (reg) setRegime(reg);
      if (mr) setMeanReversion(mr);
    } catch {
      // Handled by null state
    } finally {
      setPairLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchGlobal();
  }, [fetchGlobal]);

  // Refetch pair data when selectedPair changes
  useEffect(() => {
    fetchPairData(selectedPair);
  }, [selectedPair, fetchPairData]);

  // Adaptive polling for global data
  useMarketAwarePolling({
    fetchFn: fetchGlobal,
    marketType: 'forex',
    activeIntervalMs: 60_000,
    inactiveIntervalMs: 300_000,
  });

  // Adaptive polling for pair data
  const fetchCurrentPair = useCallback(
    () => fetchPairData(selectedPair),
    [selectedPair, fetchPairData],
  );
  useMarketAwarePolling({
    fetchFn: fetchCurrentPair,
    marketType: 'forex',
    activeIntervalMs: 60_000,
    inactiveIntervalMs: 300_000,
  });

  const refresh = useCallback(() => {
    fetchGlobal();
    fetchPairData(selectedPair);
  }, [fetchGlobal, fetchPairData, selectedPair]);

  const value = useMemo<ForexDataContextValue>(
    () => ({
      selectedPair,
      setSelectedPair,
      timeframe,
      setTimeframe,
      overview,
      strength,
      marketClock,
      crossRates,
      topMovers,
      technicals,
      volatility,
      regime,
      meanReversion,
      loading,
      pairLoading,
      lastRefresh,
      refresh,
    }),
    [
      selectedPair, setSelectedPair, timeframe, setTimeframe,
      overview, strength, marketClock, crossRates, topMovers,
      technicals, volatility, regime, meanReversion,
      loading, pairLoading, lastRefresh, refresh,
    ],
  );

  return (
    <ForexDataContext.Provider value={value}>
      {children}
    </ForexDataContext.Provider>
  );
}
