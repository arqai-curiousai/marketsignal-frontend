'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Dice5, RefreshCw, Download, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { simulationApi } from '@/lib/api/simulationApi';
import { useExchange } from '@/context/ExchangeContext';
import type { IMonteCarloAnalysis } from '@/types/simulation';
import { downloadCSV, downloadPNG } from '@/lib/utils/export';
import { S } from '@/components/playground/pyramid/tokens';

import { HORIZON_OPTIONS, HORIZON_LABELS, fmtPrice, fmtPct, fmtProb } from './mc-tokens';
import { TickerCombobox } from './TickerCombobox';
import { MonteCarloKPIRow } from './MonteCarloKPIRow';
import { SimulationGauge } from './SimulationGauge';
import { NarrativeSummary } from './NarrativeSummary';
import { ProbabilityCone } from './ProbabilityCone';
import { PathDensityHeatmap } from './PathDensityHeatmap';
import { DistributionChart } from './DistributionChart';
import { RiskEvolution } from './RiskEvolution';
import { DrawdownAnalysis } from './DrawdownAnalysis';
import { OutcomeDashboard } from './OutcomeDashboard';
import { TargetPriceCalculator } from './TargetPriceCalculator';
import { RegimeToggle } from './RegimeToggle';
import { ConvergencePlot } from './ConvergencePlot';
import { RiskMetricsPanel } from './RiskMetricsPanel';

// ─── Skeleton Loader ─────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {/* KPI Row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] rounded-lg bg-white/[0.03]" />
        ))}
      </div>
      {/* Row 1: Gauge + Narrative */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Skeleton className="md:col-span-2 h-[300px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="md:col-span-3 h-[300px] rounded-xl bg-white/[0.03]" />
      </div>
      {/* Row 2: Cone */}
      <Skeleton className="h-[280px] md:h-[400px] rounded-xl bg-white/[0.03]" />
      {/* Row 3: Distribution + Risk Evolution */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Skeleton className="md:col-span-3 h-[320px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="md:col-span-2 h-[320px] rounded-xl bg-white/[0.03]" />
      </div>
      {/* Row 4: Drawdown + Outcome */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Skeleton className="md:col-span-3 h-[380px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="md:col-span-2 h-[380px] rounded-xl bg-white/[0.03]" />
      </div>
      {/* Row 5: Target + Regime + Convergence */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Skeleton className="md:col-span-2 h-[260px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="md:col-span-2 h-[260px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="md:col-span-1 h-[260px] rounded-xl bg-white/[0.03]" />
      </div>
      {/* Row 6: Risk Metrics */}
      <Skeleton className="h-[260px] rounded-xl bg-white/[0.03]" />
    </div>
  );
}

// ─── Export Helpers ───────────────────────────────────────────────

function buildExportCSV(data: IMonteCarloAnalysis): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  // Summary
  rows.push({ Section: 'Summary', Metric: 'Ticker', Value: data.ticker });
  rows.push({ Section: 'Summary', Metric: 'Exchange', Value: data.exchange });
  rows.push({ Section: 'Summary', Metric: 'Current Price', Value: fmtPrice(data.currentPrice) });
  rows.push({ Section: 'Summary', Metric: 'Horizon', Value: `${data.horizon} days` });
  rows.push({ Section: 'Summary', Metric: 'Simulations', Value: data.nPaths });

  // Verdict
  if (data.verdict) {
    rows.push({ Section: 'Verdict', Metric: 'Verdict', Value: data.verdict.verdict });
    rows.push({ Section: 'Verdict', Metric: 'Score', Value: data.verdict.score.toFixed(3) });
    rows.push({ Section: 'Verdict', Metric: 'Confidence', Value: `${data.verdict.confidence}%` });
    rows.push({ Section: 'Verdict', Metric: 'Description', Value: data.verdict.description });
  }

  // Quality
  if (data.qualityScore) {
    rows.push({
      Section: 'Quality',
      Metric: 'Composite Score',
      Value: data.qualityScore.compositeScore,
    });
  }

  // Risk metrics
  const rm = data.regimeAware.riskMetrics;
  rows.push({ Section: 'Risk', Metric: 'Prob of Profit', Value: fmtProb(rm.probProfit) });
  rows.push({ Section: 'Risk', Metric: 'Expected Return', Value: fmtPct(rm.expectedReturn) });
  rows.push({ Section: 'Risk', Metric: 'VaR 5%', Value: fmtPrice(rm.var5) });
  rows.push({ Section: 'Risk', Metric: 'CVaR 5%', Value: fmtPrice(rm.cvar5) });
  rows.push({ Section: 'Risk', Metric: 'VaR 5% (%)', Value: fmtPct(rm.varPct) });
  rows.push({ Section: 'Risk', Metric: 'CVaR 5% (%)', Value: fmtPct(rm.cvarPct) });
  rows.push({ Section: 'Risk', Metric: 'Max Drawdown Median', Value: fmtPct(rm.maxDrawdownMedian) });

  // Percentile bands
  for (const band of data.regimeAware.percentileBands) {
    rows.push({
      Section: 'Percentile Bands',
      Day: band.day,
      P5: band.p5.toFixed(2),
      P10: band.p10.toFixed(2),
      P25: band.p25.toFixed(2),
      P50: band.p50.toFixed(2),
      P75: band.p75.toFixed(2),
      P90: band.p90.toFixed(2),
      P95: band.p95.toFixed(2),
    });
  }

  // Final distribution stats
  const stats = data.regimeAware.finalDistribution.stats;
  rows.push({ Section: 'Distribution', Metric: 'Mean', Value: stats.mean?.toFixed(2) });
  rows.push({ Section: 'Distribution', Metric: 'Median', Value: stats.median?.toFixed(2) });
  rows.push({ Section: 'Distribution', Metric: 'Std Dev', Value: stats.std?.toFixed(2) });
  rows.push({ Section: 'Distribution', Metric: 'Skew', Value: stats.skew?.toFixed(3) });
  rows.push({ Section: 'Distribution', Metric: 'Kurtosis', Value: stats.kurtosis?.toFixed(3) });

  // Risk evolution
  for (const pt of data.riskEvolution) {
    rows.push({
      Section: 'Risk Evolution',
      Day: pt.day,
      'VaR 5%': fmtPct(pt.var5),
      'CVaR 5%': fmtPct(pt.cvar5),
      'Prob Profit': fmtProb(pt.probProfit),
    });
  }

  // Drawdown stats
  if (data.drawdownAnalysis) {
    const dd = data.drawdownAnalysis;
    rows.push({
      Section: 'Drawdown',
      Metric: 'Max DD Median',
      Value: fmtPct(dd.maxDrawdownDistribution.stats.median),
    });
    rows.push({
      Section: 'Drawdown',
      Metric: 'Max DD P5',
      Value: fmtPct(dd.maxDrawdownDistribution.stats.p5),
    });
    rows.push({
      Section: 'Drawdown',
      Metric: 'Max DD P95',
      Value: fmtPct(dd.maxDrawdownDistribution.stats.p95),
    });
    rows.push({
      Section: 'Drawdown',
      Metric: 'Median Recovery Days',
      Value: dd.recoveryStats.medianRecoveryDays ?? 'N/A',
    });
    rows.push({
      Section: 'Drawdown',
      Metric: 'Avg Episodes Per Path',
      Value: dd.recoveryStats.avgEpisodesPerPath.toFixed(1),
    });
  }

  return rows;
}

// ─── Main Component ───────────────────────────────────────────────

export function MonteCarloDashboard() {
  const { exchangeConfig } = useExchange();
  const [selectedTicker, setSelectedTicker] = useState(exchangeConfig.defaultTicker);
  const [horizon, setHorizon] = useState<number>(252);
  const [data, setData] = useState<IMonteCarloAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coneView, setConeView] = useState<'cone' | 'density'>('cone');

  // Reset ticker when exchange changes
  useEffect(() => {
    setSelectedTicker(exchangeConfig.defaultTicker);
  }, [exchangeConfig.code, exchangeConfig.defaultTicker]);

  const fetchData = useCallback(
    async (ticker: string, horizonDays: number, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await simulationApi.getMonteCarloAnalysis(
          ticker,
          exchangeConfig.code,
          horizonDays,
        );
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error.message);
        }
      } catch {
        setError('Failed to fetch Monte Carlo simulation data');
        toast.error('Failed to load Monte Carlo data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [exchangeConfig.code],
  );

  useEffect(() => {
    fetchData(selectedTicker, horizon);
  }, [selectedTicker, horizon, fetchData]);

  const handleTickerChange = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  const handleHorizonChange = (days: number) => {
    setHorizon(days);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const rows = buildExportCSV(data);
    downloadCSV(rows, `montecarlo_${data.ticker}_${data.exchange}_${data.horizon}d`);
  };

  const handleExportPNG = async () => {
    const el = document.getElementById('mc-dashboard-container');
    if (!el) return;
    await downloadPNG(el, `montecarlo_${data?.ticker ?? 'chart'}`);
  };

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Ticker selector */}
        <div className="flex items-center gap-2">
          <Dice5 className="h-3.5 w-3.5 text-indigo-400" />
          <TickerCombobox value={selectedTicker} onChange={handleTickerChange} />
        </div>

        {/* Horizon pills */}
        <div className="flex items-center gap-1">
          {HORIZON_OPTIONS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => handleHorizonChange(days)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all',
                horizon === days
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60',
              )}
            >
              {HORIZON_LABELS[days]}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] text-white/40 hover:text-white/70"
          onClick={() => fetchData(selectedTicker, horizon, true)}
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
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] text-white/40 hover:text-white/70"
          onClick={handleExportPNG}
          disabled={!data}
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          PNG
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
            onClick={() => fetchData(selectedTicker, horizon)}
          >
            Retry
          </Button>
        </div>
      ) : data ? (
        <motion.div
          id="mc-dashboard-container"
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Row 0: KPI Row */}
          <MonteCarloKPIRow data={data} />

          {/* Row 1: SimulationGauge (2/5) + NarrativeSummary (3/5) */}
          {data.verdict && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <SimulationGauge
                className="md:col-span-2"
                verdict={data.verdict}
                qualityScore={data.qualityScore}
              />
              <NarrativeSummary
                className="md:col-span-3"
                narrative={data.narrative ?? 'No narrative available for this simulation.'}
                qualityScore={data.qualityScore}
              />
            </div>
          )}

          {/* Row 2: ProbabilityCone / PathDensityHeatmap toggle */}
          <div>
            {/* Cone/Density pill toggle */}
            <div className="flex items-center gap-1 mb-2">
              <button
                type="button"
                onClick={() => setConeView('cone')}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all',
                  coneView === 'cone'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60',
                )}
              >
                Cone
              </button>
              {data.pathDensity && (
                <button
                  type="button"
                  onClick={() => setConeView('density')}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all',
                    coneView === 'density'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/60',
                  )}
                >
                  Density
                </button>
              )}
            </div>

            {coneView === 'cone' ? (
              <ProbabilityCone
                data={data.regimeAware}
                currentPrice={data.currentPrice}
                target={data.target ? undefined : undefined}
                samplePaths={data.regimeAware.samplePaths}
              />
            ) : data.pathDensity ? (
              <PathDensityHeatmap
                density={data.pathDensity}
                currentPrice={data.currentPrice}
              />
            ) : null}
          </div>

          {/* Row 3: DistributionChart (3/5) + RiskEvolution (2/5) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <DistributionChart
              className="md:col-span-3"
              distribution={data.regimeAware.finalDistribution}
              returnDistribution={data.returnDistribution}
              currentPrice={data.currentPrice}
            />
            <RiskEvolution
              className="md:col-span-2"
              evolution={data.riskEvolution}
            />
          </div>

          {/* Row 4: DrawdownAnalysis (3/5) + OutcomeDashboard (2/5) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {data.drawdownAnalysis ? (
              <DrawdownAnalysis
                className="md:col-span-3"
                drawdown={data.drawdownAnalysis}
              />
            ) : (
              <OutcomeDashboard
                className="md:col-span-3"
                data={data.regimeAware}
                currentPrice={data.currentPrice}
              />
            )}
            {data.drawdownAnalysis ? (
              <OutcomeDashboard
                className="md:col-span-2"
                data={data.regimeAware}
                currentPrice={data.currentPrice}
              />
            ) : (
              <TargetPriceCalculator
                className="md:col-span-2"
                ticker={data.ticker}
                exchange={data.exchange}
                currentPrice={data.currentPrice}
                horizon={data.horizon}
                initialTarget={data.target}
              />
            )}
          </div>

          {/* Row 5: TargetPriceCalculator (2/5) + RegimeToggle (2/5) + ConvergencePlot (1/5) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {data.drawdownAnalysis && (
              <TargetPriceCalculator
                className="md:col-span-2"
                ticker={data.ticker}
                exchange={data.exchange}
                currentPrice={data.currentPrice}
                horizon={data.horizon}
                initialTarget={data.target}
              />
            )}
            <RegimeToggle
              className={data.drawdownAnalysis ? 'md:col-span-2' : 'md:col-span-3'}
              regimeAware={data.regimeAware}
              constant={data.constant}
              currentPrice={data.currentPrice}
            />
            <ConvergencePlot
              className={data.drawdownAnalysis ? 'md:col-span-1' : 'md:col-span-2'}
              convergence={data.convergence}
              qualityScore={data.qualityScore}
            />
          </div>

          {/* Row 6: RiskMetricsPanel (full width) */}
          <RiskMetricsPanel metrics={data.regimeAware.riskMetrics} />
        </motion.div>
      ) : null}
    </div>
  );
}
