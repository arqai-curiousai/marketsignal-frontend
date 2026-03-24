'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Layers, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { simulationApi } from '@/lib/api/simulationApi';
import { useExchange } from '@/context/ExchangeContext';
import type { IRegimeAnalysis } from '@/types/simulation';
import { downloadCSV } from '@/lib/utils/export';
import { S } from '@/components/playground/pyramid/tokens';
import { NIFTY50_TICKERS } from '@/components/playground/pyramid/constants';

import { RegimeKPIRow } from './RegimeKPIRow';
import { RegimeCompass } from './RegimeCompass';
import { RegimeTimeline } from './RegimeTimeline';
import { RegimeStateCards } from './RegimeStateCards';
import { RegimeTransitionMatrix } from './RegimeTransitionMatrix';
import { RegimeForecastStrip } from './RegimeForecastStrip';
import { getRegimeColor, fmtReturn, fmtProb, fmtDays } from './regime-tokens';

// ─── Skeleton loader ──────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] rounded-lg bg-white/[0.03]" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2 flex justify-center">
          <Skeleton className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] rounded-full bg-white/[0.03]" />
        </div>
        <div className="md:col-span-3">
          <Skeleton className="min-h-[28vh] max-h-[400px] rounded-xl bg-white/[0.03]" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl bg-white/[0.03]" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="min-h-[28vh] max-h-[400px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="min-h-[28vh] max-h-[400px] rounded-xl bg-white/[0.03]" />
      </div>
    </div>
  );
}

// ─── Export helpers ────────────────────────────────────────────────

function buildExportCSV(data: IRegimeAnalysis): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  // Current state
  rows.push({
    Section: 'Current State',
    Label: data.currentState.label,
    Confidence: fmtProb(data.currentState.probability),
    Duration: fmtDays(data.currentState.durationDays),
  });

  // State statistics
  for (const stat of data.stateStatistics) {
    rows.push({
      Section: 'State Statistics',
      Label: stat.label,
      AvgDailyReturn: fmtReturn(stat.avgDailyReturn),
      AvgVolatility: stat.avgVolatility != null ? `${(stat.avgVolatility * 100).toFixed(1)}%` : 'N/A',
      SharpeProxy: stat.sharpeProxy?.toFixed(2) ?? 'N/A',
      TypicalDuration: fmtDays(stat.typicalDurationDays),
      MaxDuration: fmtDays(stat.maxDurationDays),
      Frequency: fmtProb(stat.frequency),
    });
  }

  // Transition matrix
  for (const row of data.transitionMatrix) {
    for (const cell of row) {
      rows.push({
        Section: 'Transition Matrix',
        From: cell.fromLabel,
        To: cell.toLabel,
        Probability: fmtProb(cell.probability),
      });
    }
  }

  // Forecast
  for (const f of data.forecast) {
    const probEntries = Object.entries(f.probabilities)
      .map(([k, v]) => `${k}: ${fmtProb(v)}`)
      .join(', ');
    rows.push({
      Section: 'Forecast',
      Horizon: `${f.horizon}D`,
      Probabilities: probEntries,
    });
  }

  return rows;
}

// ─── Main Component ──────────────────────────────────────────────

export function RegimeDashboard() {
  const { exchangeConfig } = useExchange();
  const [selectedTicker, setSelectedTicker] = useState(exchangeConfig.defaultTicker);
  const [data, setData] = useState<IRegimeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (ticker: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await simulationApi.getRegimeAnalysis(
        ticker,
        exchangeConfig.code,
      );
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Failed to fetch regime analysis');
      toast.error('Failed to load regime data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [exchangeConfig.code]);

  useEffect(() => {
    fetchData(selectedTicker);
  }, [selectedTicker, fetchData]);

  const handleTickerChange = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const rows = buildExportCSV(data);
    downloadCSV(rows, `regime_${data.ticker}_${data.exchange}`);
  };

  // Regime config for header badge
  const regimeColor = data ? getRegimeColor(data.currentState.label) : null;

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Ticker selector */}
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          <select
            value={selectedTicker}
            onChange={(e) => handleTickerChange(e.target.value)}
            className={cn(
              'bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5',
              'text-xs font-mono text-white/80 focus:outline-none focus:border-indigo-500/30',
              'appearance-none cursor-pointer',
            )}
          >
            {NIFTY50_TICKERS.map((t) => (
              <option key={t} value={t} className="bg-zinc-900">
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Regime badge */}
        {regimeColor && (
          <motion.span
            className={cn(
              'text-[9px] font-semibold px-2.5 py-1 rounded-full',
              regimeColor.bg,
              regimeColor.text,
              regimeColor.border,
              'border',
            )}
            key={data?.currentState.label}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {regimeColor.label}
          </motion.span>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] text-white/40 hover:text-white/70"
          onClick={() => fetchData(selectedTicker, true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn('h-3 w-3 mr-1', refreshing && 'animate-spin')} />
          Refresh
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] text-white/40 hover:text-white/70"
          onClick={handleExportCSV}
          disabled={!data}
        >
          <Download className="h-3 w-3 mr-1" />
          CSV
        </Button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className={cn(S.card, 'p-8 text-center')}>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(selectedTicker)}
          >
            Retry
          </Button>
        </div>
      ) : data ? (
        <div id="regime-dashboard-container" className="space-y-3">
          {/* KPI Row */}
          <RegimeKPIRow data={data} />

          {/* Row 1: Compass (2/5) + Timeline (3/5) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 flex items-center justify-center">
              <RegimeCompass data={data} />
            </div>
            <div className="md:col-span-3">
              <RegimeTimeline timeline={data.timeline} className="h-full" />
            </div>
          </div>

          {/* Row 2: State Cards (full width) */}
          <RegimeStateCards
            statistics={data.stateStatistics}
            states={data.states}
            currentLabel={data.currentState.label}
          />

          {/* Row 3: Transition Matrix (1/2) + Forecast Strip (1/2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <RegimeTransitionMatrix
              matrix={data.transitionMatrix}
              states={data.states}
            />
            <RegimeForecastStrip
              forecast={data.forecast}
              states={data.states}
            />
          </div>

          {/* Description */}
          {data.description && (
            <motion.div
              className={cn(S.card, 'p-2')}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {data.description}
              </p>
              <p className="text-[9px] text-white/20 mt-2">
                Computed at {new Date(data.computedAt).toLocaleString('en-IN')} | BIC: {data.selectedModelBic.toFixed(1)}
              </p>
            </motion.div>
          )}
        </div>
      ) : null}
    </div>
  );
}
