'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketAwarePolling } from '@/lib/hooks/useMarketAwarePolling';
import { CurrencyPulseStrip } from './CurrencyPulseStrip';
import { CurrencyChartPanel } from './CurrencyChartPanel';
import { CurrencyTechnicalsTable } from './CurrencyTechnicalsTable';
import { CurrencyVolatility } from './CurrencyVolatility';
import { CurrencySessions } from './CurrencySessions';
import { AlertPanel } from './AlertPanel';
import {
  getCurrencyTechnicals,
  getCurrencyVolatility as getCurrencyVolatilityApi,
  getCurrencyMarketClock,
  getCurrencyMeanReversion,
  getCurrencyRegime,
} from '@/src/lib/api/analyticsApi';
import type {
  ICurrencyTechnicals,
  ICurrencyVolatility,
  IMarketClock,
  ICurrencyMeanReversion,
  ICurrencyRegime,
} from '@/src/types/analytics';
import { cn } from '@/lib/utils';
import { Activity, BarChart3, Clock, RefreshCw } from 'lucide-react';

export interface ChartOverlays {
  vol: boolean;
  sma: boolean;
  bb: boolean;
  pivots: boolean;
}

interface AnalysisViewProps {
  selectedPair: string;
  timeframe: string;
  onTimeframeChange?: (tf: string) => void;
  chartOverlays?: ChartOverlays;
  onChartOverlaysChange?: (overlays: ChartOverlays) => void;
}

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function AnalysisView({ selectedPair, timeframe, onTimeframeChange, chartOverlays, onChartOverlaysChange }: AnalysisViewProps) {
  const [technicals, setTechnicals] = useState<ICurrencyTechnicals | null>(null);
  const [volatility, setVolatility] = useState<ICurrencyVolatility | null>(null);
  const [marketClock, setMarketClock] = useState<IMarketClock | null>(null);
  const [meanReversion, setMeanReversion] = useState<ICurrencyMeanReversion | null>(null);
  const [regime, setRegime] = useState<ICurrencyRegime | null>(null);
  const [loading, setLoading] = useState(true);
  const prevPairRef = useRef(selectedPair);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [minutesAgo, setMinutesAgo] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        getCurrencyTechnicals(selectedPair),
        getCurrencyVolatilityApi(selectedPair),
        getCurrencyMarketClock(),
        getCurrencyMeanReversion(selectedPair),
        getCurrencyRegime(selectedPair),
      ]);
      const unwrap = <T,>(r: PromiseSettledResult<T>): T | { success: false; data: null } =>
        r.status === 'fulfilled' ? r.value : { success: false, data: null };
      const techRes = unwrap(settled[0]);
      const volRes = unwrap(settled[1]);
      const mcRes = unwrap(settled[2]);
      const mrRes = unwrap(settled[3]);
      const rgRes = unwrap(settled[4]);
      if (techRes.success) setTechnicals(techRes.data);
      if (volRes.success) setVolatility(volRes.data);
      if (mcRes.success) setMarketClock(mcRes.data);
      if (mrRes.success) setMeanReversion(mrRes.data);
      if (rgRes.success) setRegime(rgRes.data);
      setLastRefresh(Date.now());
      setMinutesAgo(0);
    } catch {
      // Components handle individual errors
    } finally {
      setLoading(false);
    }
  }, [selectedPair]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Market-hours-aware polling: 60s when open, 5min when closed
  useMarketAwarePolling({
    fetchFn: fetchData,
    marketType: 'forex',
    activeIntervalMs: 60_000,
    inactiveIntervalMs: 300_000,
  });

  // Update "minutes ago" display every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesAgo(Math.floor((Date.now() - lastRefresh) / 60_000));
    }, 30_000);
    return () => clearInterval(timer);
  }, [lastRefresh]);

  // Reset on pair change
  useEffect(() => {
    if (prevPairRef.current !== selectedPair) {
      setTechnicals(null);
      setVolatility(null);
      setMeanReversion(null);
      setRegime(null);
      prevPairRef.current = selectedPair;
    }
  }, [selectedPair]);

  return (
    <div className="space-y-4">
      {/* Staleness indicator */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-[10px] text-muted-foreground">
          {minutesAgo === 0 ? 'Just updated' : `Updated ${minutesAgo}m ago`}
        </span>
        <button
          onClick={fetchData}
          className="p-1 rounded hover:bg-white/[0.06] transition-colors"
          title="Refresh analysis data"
        >
          <RefreshCw className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Pulse Strip */}
      <motion.div {...ANIM}>
        <CurrencyPulseStrip
          technicals={technicals}
          volatility={volatility}
          activeSessions={marketClock?.active_count}
        />
      </motion.div>

      {/* Regime + Mean Reversion Info Strip */}
      {(regime || meanReversion) && (
        <motion.div {...ANIM} transition={{ ...ANIM.transition, delay: 0.03 }}>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-x-auto whitespace-nowrap">
            {regime && (
              <>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Regime:</span>
                  <span className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                    regime.hurst_classification === 'trending' ? 'bg-sky-400/10 text-sky-400 border-sky-400/20' :
                    regime.hurst_classification === 'mean_reverting' ? 'bg-violet-400/10 text-violet-400 border-violet-400/20' :
                    'bg-white/[0.06] text-white/60 border-white/10'
                  )}>
                    {regime.current_regime}
                  </span>
                </div>
                <div className="w-px h-4 bg-white/[0.06]" />
                {regime.hurst_exponent != null && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Hurst:</span>
                    <span className="text-[10px] font-mono font-medium text-white/70">{regime.hurst_exponent.toFixed(3)}</span>
                  </div>
                )}
                {regime.regime_duration_days > 0 && (
                  <>
                    <div className="w-px h-4 bg-white/[0.06]" />
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{regime.regime_duration_days}d in regime</span>
                    </div>
                  </>
                )}
              </>
            )}
            {meanReversion && (
              <>
                <div className="w-px h-4 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Z-Score:</span>
                  <span className={cn(
                    'text-[10px] font-mono font-semibold',
                    Math.abs(meanReversion.z_score) > 2 ? 'text-orange-400' :
                    Math.abs(meanReversion.z_score) > 1 ? 'text-amber-400' : 'text-white/70'
                  )}>
                    {meanReversion.z_score >= 0 ? '+' : ''}{meanReversion.z_score.toFixed(2)}
                  </span>
                </div>
                {meanReversion.half_life_days != null && (
                  <>
                    <div className="w-px h-4 bg-white/[0.06]" />
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">Half-life:</span>
                      <span className="text-[10px] font-mono text-white/70">{meanReversion.half_life_days.toFixed(0)}d</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* 2-column grid: Chart + Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-[5fr_3fr] gap-5">
        {/* Left: Chart */}
        <motion.div {...ANIM} transition={{ ...ANIM.transition, delay: 0.05 }}>
          {loading && !technicals ? (
            <Skeleton className="h-[480px] w-full rounded-lg" />
          ) : (
            <CurrencyChartPanel
              pair={selectedPair}
              timeframe={timeframe}
              technicals={technicals}
              onTimeframeChange={onTimeframeChange}
              overlays={chartOverlays}
              onOverlaysChange={onChartOverlaysChange}
            />
          )}
        </motion.div>

        {/* Right: Technicals + Volatility + Sessions */}
        <motion.div
          {...ANIM}
          transition={{ ...ANIM.transition, delay: 0.1 }}
          className="space-y-4"
        >
          <CurrencyTechnicalsTable technicals={technicals} />
          <CurrencyVolatility pair={selectedPair} />
          <CurrencySessions pair={selectedPair} />
          <AlertPanel selectedPair={selectedPair} />
        </motion.div>
      </div>
    </div>
  );
}
