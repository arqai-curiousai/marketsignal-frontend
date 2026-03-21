'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyPulseStrip } from './CurrencyPulseStrip';
import { CurrencyChartPanel } from './CurrencyChartPanel';
import { CurrencyTechnicalsTable } from './CurrencyTechnicalsTable';
import { CurrencyVolatility } from './CurrencyVolatility';
import { CurrencySessions } from './CurrencySessions';
import {
  getCurrencyTechnicals,
  getCurrencyVolatility as getCurrencyVolatilityApi,
  getCurrencyMarketClock,
} from '@/src/lib/api/analyticsApi';
import type {
  ICurrencyTechnicals,
  ICurrencyVolatility,
  IMarketClock,
} from '@/src/types/analytics';

interface AnalysisViewProps {
  selectedPair: string;
  timeframe: string;
}

const ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function AnalysisView({ selectedPair, timeframe }: AnalysisViewProps) {
  const [technicals, setTechnicals] = useState<ICurrencyTechnicals | null>(null);
  const [volatility, setVolatility] = useState<ICurrencyVolatility | null>(null);
  const [marketClock, setMarketClock] = useState<IMarketClock | null>(null);
  const [loading, setLoading] = useState(true);
  const prevPairRef = useRef(selectedPair);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [techRes, volRes, mcRes] = await Promise.all([
        getCurrencyTechnicals(selectedPair),
        getCurrencyVolatilityApi(selectedPair),
        getCurrencyMarketClock(),
      ]);
      if (techRes.success) setTechnicals(techRes.data);
      if (volRes.success) setVolatility(volRes.data);
      if (mcRes.success) setMarketClock(mcRes.data);
    } catch {
      // Components handle individual errors
    } finally {
      setLoading(false);
    }
  }, [selectedPair]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh 60s
  useEffect(() => {
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Reset on pair change
  useEffect(() => {
    if (prevPairRef.current !== selectedPair) {
      setTechnicals(null);
      setVolatility(null);
      prevPairRef.current = selectedPair;
    }
  }, [selectedPair]);

  return (
    <div className="space-y-4">
      {/* Pulse Strip */}
      <motion.div {...ANIM}>
        <CurrencyPulseStrip
          technicals={technicals}
          volatility={volatility}
          activeSessions={marketClock?.active_count}
        />
      </motion.div>

      {/* 2-column grid: Chart + Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        {/* Left: Chart */}
        <motion.div {...ANIM} transition={{ ...ANIM.transition, delay: 0.05 }}>
          {loading && !technicals ? (
            <Skeleton className="h-[480px] w-full rounded-lg" />
          ) : (
            <CurrencyChartPanel
              pair={selectedPair}
              timeframe={timeframe}
              technicals={technicals}
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
        </motion.div>
      </div>
    </div>
  );
}
