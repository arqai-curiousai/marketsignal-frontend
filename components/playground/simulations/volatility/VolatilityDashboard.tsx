'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { simulationApi } from '@/lib/api/simulationApi';
import { useExchange } from '@/context/ExchangeContext';
import type { IVolatilityAnalysis } from '@/types/simulation';
import { downloadCSV } from '@/lib/utils/export';
import { S } from '@/components/playground/pyramid/tokens';
import { useInstrumentList } from '@/lib/hooks/useInstrumentList';

import { VolatilityVortexCanvas } from './VolatilityVortexCanvas';
import { VolatilityConeChart } from './VolatilityConeChart';
import { EstimatorComparisonPanel } from './EstimatorComparisonPanel';
import { GARCHForecastChart } from './GARCHForecastChart';
import { VolatilityTimeline } from './VolatilityTimeline';
import { VolatilityKPIRow } from './VolatilityKPIRow';
import { getRegimeConfig } from './vol-tokens';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-[280px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="h-[280px] rounded-xl bg-white/[0.03]" />
      </div>
      <Skeleton className="h-[260px] rounded-xl bg-white/[0.03]" />
    </div>
  );
}

// ─── Export helpers ────────────────────────────────────────────────

function buildExportCSV(data: IVolatilityAnalysis): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const est of data.estimators) {
    rows.push({
      Section: 'Estimators',
      Name: est.label,
      Value: est.currentValue != null ? (est.currentValue * 100).toFixed(2) + '%' : 'N/A',
      Efficiency: `${est.efficiency}x`,
    });
  }
  for (const c of data.cone) {
    rows.push({
      Section: 'Cone',
      Name: c.windowLabel,
      Current: (c.current * 100).toFixed(2) + '%',
      P10: (c.p10 * 100).toFixed(2) + '%',
      P25: (c.p25 * 100).toFixed(2) + '%',
      P50: (c.p50 * 100).toFixed(2) + '%',
      P75: (c.p75 * 100).toFixed(2) + '%',
      P90: (c.p90 * 100).toFixed(2) + '%',
    });
  }
  return rows;
}

// ─── Main Component ───────────────────────────────────────────────

export function VolatilityDashboard() {
  const { exchangeConfig } = useExchange();
  const { instruments } = useInstrumentList(exchangeConfig.code);
  const [selectedTicker, setSelectedTicker] = useState(exchangeConfig.defaultTicker);
  const [data, setData] = useState<IVolatilityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (
    ticker: string,
    isRefresh = false,
    signal?: AbortSignal,
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await simulationApi.getVolatility(
        ticker,
        exchangeConfig.code,
        'yang_zhang',
        { signal },
      );
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Failed to fetch volatility data');
      toast.error('Failed to load volatility data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [exchangeConfig.code]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(selectedTicker, false, controller.signal);
    return () => controller.abort();
  }, [selectedTicker, fetchData]);

  const handleTickerChange = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const rows = buildExportCSV(data);
    downloadCSV(rows, `volatility_${data.ticker}_${data.exchange}.csv`);
  };

  // ── Regime config for header badge ──
  const regimeConfig = data ? getRegimeConfig(data.regime.regime) : null;

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Ticker selector */}
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-indigo-400" />
          <select
            value={selectedTicker}
            onChange={(e) => handleTickerChange(e.target.value)}
            aria-label="Select ticker"
            className={cn(
              'bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5',
              'text-xs font-mono text-white/80 focus:outline-none focus:border-indigo-500/30',
              'appearance-none cursor-pointer',
            )}
          >
            {instruments.map((inst) => (
              <option key={inst.ticker} value={inst.ticker} className="bg-zinc-900">
                {inst.ticker}
              </option>
            ))}
          </select>
        </div>

        {/* Regime badge */}
        {regimeConfig && (
          <motion.span
            className={cn(
              'text-[9px] font-semibold px-2.5 py-1 rounded-full',
              regimeConfig.bg,
              regimeConfig.text,
              regimeConfig.border,
              'border',
            )}
            key={data?.regime.regime}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {regimeConfig.label}
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
        <div id="vol-dashboard-container" className="space-y-3">
          {/* KPI Row */}
          <VolatilityKPIRow data={data} />

          {/* Row 1: Storm Gauge + Cone */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 flex items-center justify-center">
              <VolatilityVortexCanvas data={data} />
            </div>
            <div className="md:col-span-3">
              <VolatilityConeChart cone={data.cone} className="h-full" />
            </div>
          </div>

          {/* Row 2: Estimators + GARCH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <EstimatorComparisonPanel
              estimators={data.estimators}
              recommended={data.recommendedEstimator}
            />
            {data.garch ? (
              <GARCHForecastChart garch={data.garch} />
            ) : (
              <div className={cn(S.card, 'p-2 flex items-center justify-center')}>
                <p className="text-xs text-muted-foreground text-center">
                  GARCH forecast unavailable for this ticker.
                  <br />
                  <span className="text-[10px] text-white/25">
                    Requires 100+ daily bars with sufficient price variation.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Row 3: Timeline */}
          <VolatilityTimeline rollingSeries={data.rollingSeries} />
        </div>
      ) : null}
    </div>
  );
}
