'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  SlidersHorizontal,
} from 'lucide-react';
import { ForexHeatMap } from './ForexHeatMap';
import { ForexTopMovers } from './ForexTopMovers';
import { ForexOverviewKPIs } from './ForexOverviewKPIs';
import { ForexMarketClock } from './ForexMarketClock';
import { CurrencyStrengthMeter } from './CurrencyStrengthMeter';
import {
  getCurrencyOverview,
  getCurrencyStrength,
  getCurrencyTopMovers,
  getCurrencyMarketClock,
} from '@/src/lib/api/analyticsApi';
import type {
  ICurrencyOverview,
  ICurrencyStrength,
  ITopMovers,
  IMarketClock,
} from '@/src/types/analytics';

interface CurrencyScannerViewProps {
  onSelectPair: (pair: string) => void;
}

const SCAN_PRESETS = [
  { label: 'All Pairs', filter: () => true },
  { label: 'Cross Pairs', filter: (p: string) => ['EUR/USD', 'GBP/USD', 'USD/JPY'].includes(p) },
  { label: 'INR Pairs', filter: (p: string) => p.includes('INR') },
  { label: 'Gainers', filter: (_p: string, pct: number) => pct > 0 },
  { label: 'Losers', filter: (_p: string, pct: number) => pct < 0 },
] as const;

export function CurrencyScannerView({ onSelectPair }: CurrencyScannerViewProps) {
  const [overview, setOverview] = useState<ICurrencyOverview | null>(null);
  const [strength, setStrength] = useState<ICurrencyStrength | null>(null);
  const [topMovers, setTopMovers] = useState<ITopMovers | null>(null);
  const [marketClock, setMarketClock] = useState<IMarketClock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, strRes, tmRes, mcRes] = await Promise.all([
        getCurrencyOverview(),
        getCurrencyStrength(),
        getCurrencyTopMovers(),
        getCurrencyMarketClock(),
      ]);
      if (ovRes.success) setOverview(ovRes.data);
      else setError(ovRes.error?.message || 'Failed to load');
      if (strRes.success) setStrength(strRes.data);
      if (tmRes.success) setTopMovers(tmRes.data);
      if (mcRes.success) setMarketClock(mcRes.data);
    } catch {
      setError('Failed to load forex scanner');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredPairs = useMemo(() => {
    if (!overview?.pairs) return [];
    const preset = SCAN_PRESETS[activePreset];
    return overview.pairs.filter(p =>
      preset.filter(p.ticker, p.change_pct)
    );
  }, [overview, activePreset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">{error}</p>
        <button onClick={fetchAll} className="mt-2 text-xs text-primary hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scan presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground mr-1" />
        {SCAN_PRESETS.map((preset, i) => (
          <button
            key={preset.label}
            onClick={() => setActivePreset(i)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-full transition-colors ${
              activePreset === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/[0.04] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <ForexOverviewKPIs strength={strength} marketClock={marketClock} topMovers={topMovers} />

      {/* Market Clock */}
      <ForexMarketClock />

      {/* Filtered Pairs Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-white/[0.06] overflow-hidden"
      >
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-px px-3 py-2 text-[10px] text-muted-foreground font-medium border-b border-white/[0.06] bg-white/[0.02]">
          <span>Pair</span>
          <span className="text-right">Price</span>
          <span className="text-right">Change</span>
          <span className="text-right hidden sm:block">High</span>
          <span className="text-right">Signal</span>
        </div>
        {filteredPairs.map((pair, i) => {
          const isPositive = pair.change_pct >= 0;
          return (
            <motion.div
              key={pair.ticker}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onSelectPair(pair.ticker)}
              className="grid grid-cols-4 sm:grid-cols-5 gap-px px-3 py-2.5 text-xs cursor-pointer hover:bg-white/[0.03] transition-colors border-b border-white/[0.02] last:border-b-0"
            >
              <span className="font-medium text-white">{pair.ticker}</span>
              <span className="text-right text-white/80 tabular-nums">{pair.price.toFixed(4)}</span>
              <span className={`text-right tabular-nums font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{pair.change_pct.toFixed(2)}%
              </span>
              <span className="text-right text-muted-foreground tabular-nums hidden sm:block">
                {pair.high ? pair.high.toFixed(4) : '—'}
              </span>
              <div className="flex items-center justify-end gap-1">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                ) : pair.change_pct < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                ) : (
                  <Minus className="h-3 w-3 text-white/40" />
                )}
              </div>
            </motion.div>
          );
        })}
        {filteredPairs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No pairs match this filter</div>
        )}
      </motion.div>

      {/* Heat Map + Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ForexHeatMap onSelectPair={onSelectPair} />
        <ForexTopMovers onSelectPair={onSelectPair} />
      </div>

      {/* Strength Meter */}
      <CurrencyStrengthMeter />
    </div>
  );
}
