'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { simulationApi } from '@/lib/api/simulationApi';
import { useExchange } from '@/context/ExchangeContext';
import { downloadCSV, downloadPNG } from '@/lib/utils/export';
import { S } from '@/components/playground/pyramid/tokens';
import { SimPortfolioToolbar } from '@/components/playground/simulations/shared/SimPortfolioToolbar';
import type { IFactorDecomposition, IPresetBasket } from '@/types/simulation';

import { FactorConstellationCanvas } from './FactorConstellationCanvas';
import { FactorKPIRow } from './FactorKPIRow';
import { FactorTiltTable } from './FactorTiltTable';
import { FactorReturnAttribution } from './FactorReturnAttribution';

// ─── Default tickers ─────────────────────────────────────────

const DEFAULT_TICKERS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC'];

// ─── Skeleton loader ─────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-[340px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="h-[260px] rounded-xl bg-white/[0.03]" />
      </div>
      <Skeleton className="h-[200px] rounded-xl bg-white/[0.03]" />
    </div>
  );
}

// ─── Export helper ────────────────────────────────────────────

function buildExportCSV(data: IFactorDecomposition): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  for (const stock of data.perStockScores) {
    const row: Record<string, unknown> = {
      Section: 'Stock Scores',
      Ticker: stock.ticker,
      Sector: stock.sector,
    };
    for (const f of data.factors) {
      row[f.label] = stock.scores[f.id] ?? 0;
    }
    rows.push(row);
  }

  const pRow: Record<string, unknown> = { Section: 'Portfolio Tilts' };
  for (const f of data.factors) {
    pRow[f.label] = data.portfolioTilts[f.id] ?? 0;
  }
  rows.push(pRow);

  const bRow: Record<string, unknown> = { Section: 'Benchmark Tilts' };
  for (const f of data.factors) {
    bRow[f.label] = data.benchmarkTilts[f.id] ?? 0;
  }
  rows.push(bRow);

  for (const a of data.factorAttribution) {
    rows.push({
      Section: 'Attribution',
      Factor: a.label,
      Contribution: a.contribution,
      PortfolioTilt: a.portfolioTilt,
      BenchmarkTilt: a.benchmarkTilt,
    });
  }

  return rows;
}

// ─── Main Component ──────────────────────────────────────────

export function FactorDashboard() {
  const { exchangeConfig } = useExchange();
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);
  const [presets, setPresets] = useState<IPresetBasket[]>([]);
  const [data, setData] = useState<IFactorDecomposition | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch presets once
  useEffect(() => {
    const controller = new AbortController();
    simulationApi.getPresets(exchangeConfig.code).then((res) => {
      if (!controller.signal.aborted && res.success) setPresets(res.data);
    }).catch((err) => {
      if (!controller.signal.aborted) console.warn('Failed to load presets:', err);
    });
    return () => controller.abort();
  }, [exchangeConfig.code]);

  const fetchData = useCallback(
    async (tickerList: string[], isRefresh = false) => {
      if (tickerList.length === 0) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await simulationApi.analyzeFactors(
          tickerList,
          undefined,
          exchangeConfig.code,
        );
        if (result.success) {
          setData(result.data);
          if (isRefresh) toast.success('Factor analysis refreshed');
        } else {
          setError(result.error.message);
          toast.error('Factor analysis failed');
        }
      } catch {
        setError('Failed to compute factor analysis');
        toast.error('Failed to load factor data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [exchangeConfig.code],
  );

  // Fetch on ticker or exchange change
  useEffect(() => {
    if (tickers.length > 0) {
      fetchData(tickers);
    }
  }, [tickers, fetchData]);

  const handleTickersChange = useCallback((newTickers: string[]) => {
    setTickers(newTickers);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData(tickers, true);
  }, [tickers, fetchData]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;
    const rows = buildExportCSV(data);
    downloadCSV(rows, `factors_${data.tickers.join('_')}.csv`);
    toast.success('CSV exported');
  }, [data]);

  const handleExportPNG = useCallback(async () => {
    const el = document.getElementById('factor-dashboard-container');
    if (el) {
      await downloadPNG(el, `factors_${tickers.join('_')}.png`);
      toast.success('PNG exported');
    }
  }, [tickers]);

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <SimPortfolioToolbar
        tickers={tickers}
        onTickersChange={handleTickersChange}
        presets={presets}
        exchange={exchangeConfig.code}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onExportCSV={data ? handleExportCSV : undefined}
        onExportPNG={data ? handleExportPNG : undefined}
      />

      {/* ── Content ── */}
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className={cn(S.card, 'p-8 text-center')}>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchData(tickers)}>
            Retry
          </Button>
        </div>
      ) : data ? (
        <div id="factor-dashboard-container" className="space-y-3">
          {/* Natural language summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(S.card, 'px-4 py-3')}
          >
            <p className="text-sm text-white/60 leading-relaxed">{data.naturalLanguage}</p>
          </motion.div>

          {/* KPI Row */}
          <FactorKPIRow
            data={{
              factors: data.factors,
              portfolioTilts: data.portfolioTilts,
              benchmarkTilts: data.benchmarkTilts,
              factorAttribution: data.factorAttribution,
              dataPoints: data.dataPoints,
            }}
          />

          {/* Row 1: Fingerprint + Attribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FactorConstellationCanvas data={data} />
            <FactorReturnAttribution attribution={data.factorAttribution} />
          </div>

          {/* Row 2: Factor Tilt Table */}
          <FactorTiltTable
            factors={data.factors}
            perStockScores={data.perStockScores}
            portfolioTilts={data.portfolioTilts}
            benchmarkTilts={data.benchmarkTilts}
          />
        </div>
      ) : null}
    </div>
  );
}
