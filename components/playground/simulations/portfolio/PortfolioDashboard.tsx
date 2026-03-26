'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, RefreshCw, Download, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { simulationApi } from '@/lib/api/simulationApi';
import { useExchange } from '@/context/ExchangeContext';
import type { IPortfolioOptimization, IPresetBasket } from '@/types/simulation';
import { downloadCSV } from '@/lib/utils/export';
import { T, S } from '@/components/playground/pyramid/tokens';
import {
  getStrategyColor,
  getStrategyLabel,
  fmtWeight,
  fmtReturn,
  fmtSharpe,
} from './portfolio-tokens';

import { PortfolioKPIRow } from './PortfolioKPIRow';
import { AllocationSunburst } from './AllocationSunburst';
import { EfficientFrontierChart } from './EfficientFrontierChart';
import { StrategyComparisonCards } from './StrategyComparisonCards';
import { WeightTable } from './WeightTable';
import { RiskDecompositionPanel } from './RiskDecompositionPanel';
import { TickerSelector } from './TickerSelector';
import { PortfolioFlowHero } from './PortfolioFlowHero';

// ─── Lookback options ────────────────────────────────────────────

const LOOKBACK_OPTIONS = [
  { label: '1Y', days: 252 },
  { label: '2Y', days: 504 },
  { label: '3Y', days: 756 },
  { label: '5Y', days: 1260 },
] as const;

// ─── Max weight slider steps ────────────────────────────────────

const MAX_WEIGHT_OPTIONS = [10, 15, 20, 25, 30, 40, 50];

// ─── Skeleton loader ────────────────────────────────────────────

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
          <Skeleton className="w-[220px] h-[220px] md:w-[280px] md:h-[280px] rounded-full bg-white/[0.03]" />
        </div>
        <div className="md:col-span-3">
          <Skeleton className="h-[340px] rounded-xl bg-white/[0.03]" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-[200px] h-[220px] rounded-xl bg-white/[0.03] shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="min-h-[28vh] max-h-[400px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="min-h-[28vh] max-h-[400px] rounded-xl bg-white/[0.03]" />
      </div>
    </div>
  );
}

// ─── Export helpers ──────────────────────────────────────────────

function buildExportCSV(data: IPortfolioOptimization): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  for (const strategy of data.strategies) {
    // Strategy summary row
    rows.push({
      Section: 'Strategy',
      Strategy: getStrategyLabel(strategy.mode),
      Ticker: '',
      Sector: '',
      Weight: '',
      AnnualReturn: fmtReturn(strategy.metrics.annualReturn),
      Volatility: fmtWeight(strategy.metrics.annualVolatility),
      Sharpe: fmtSharpe(strategy.metrics.sharpe),
      Sortino: fmtSharpe(strategy.metrics.sortino),
      MaxDrawdown: fmtReturn(strategy.metrics.maxDrawdown),
    });

    // Individual allocations
    for (const [ticker, weight] of Object.entries(strategy.weights)) {
      if (weight < 0.001) continue;
      const sector = data.sectors[ticker] ?? '';
      const rc = strategy.riskContribution.find((r) => r.ticker === ticker);
      rows.push({
        Section: 'Allocation',
        Strategy: getStrategyLabel(strategy.mode),
        Ticker: ticker,
        Sector: sector,
        Weight: fmtWeight(weight),
        RiskContribution: rc ? fmtWeight(rc.riskContribution) : '',
      });
    }
  }

  return rows;
}

// ─── Main Component ─────────────────────────────────────────────

export function PortfolioDashboard() {
  const { exchangeConfig } = useExchange();
  const [selectedTickers, setSelectedTickers] = useState<string[]>([
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'BHARTIARTL', 'SBIN', 'ITC', 'LT', 'HCLTECH',
  ]);
  const [lookbackDays, setLookbackDays] = useState(756);
  const [maxWeightPct, setMaxWeightPct] = useState(30);
  const [data, setData] = useState<IPortfolioOptimization | null>(null);
  const [presets, setPresets] = useState<IPresetBasket[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStrategyIdx, setActiveStrategyIdx] = useState(0);
  const optimizeControllerRef = useRef<AbortController | null>(null);

  // Fetch presets on mount
  useEffect(() => {
    const controller = new AbortController();
    async function loadPresets() {
      try {
        const result = await simulationApi.getPresets({ signal: controller.signal });
        if (controller.signal.aborted) return;
        if (result.success) {
          setPresets(result.data);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Failed to load presets:', err);
      }
    }
    loadPresets();
    return () => controller.abort();
  }, []);

  // Abort optimize on unmount
  useEffect(() => {
    return () => optimizeControllerRef.current?.abort();
  }, []);

  // Optimize handler
  const handleOptimize = useCallback(async () => {
    if (selectedTickers.length < 2) {
      setError('Select at least 2 tickers to optimize.');
      return;
    }

    optimizeControllerRef.current?.abort();
    optimizeControllerRef.current = new AbortController();
    const signal = optimizeControllerRef.current.signal;

    setOptimizing(true);
    setLoading(true);
    setError(null);

    try {
      const result = await simulationApi.optimizePortfolio(
        selectedTickers,
        exchangeConfig.code,
        lookbackDays,
        maxWeightPct / 100,
        undefined,
        undefined,
        { signal },
      );

      if (signal.aborted) return;
      if (result.success) {
        setData(result.data);
        // Find best strategy index
        const bestIdx = result.data.strategies.findIndex(
          (s) => s.mode === result.data.bestStrategy,
        );
        setActiveStrategyIdx(bestIdx >= 0 ? bestIdx : 0);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Failed to optimize portfolio. Please try again.');
      toast.error('Failed to optimize portfolio');
    } finally {
      setLoading(false);
      setOptimizing(false);
    }
  }, [selectedTickers, exchangeConfig.code, lookbackDays, maxWeightPct]);

  // Cycle strategy (for sunburst center click)
  const handleCycleStrategy = useCallback(() => {
    if (!data) return;
    setActiveStrategyIdx((idx) => (idx + 1) % data.strategies.length);
  }, [data]);

  // Active strategy
  const activeStrategy = data?.strategies[activeStrategyIdx] ?? null;

  // Export
  const handleExportCSV = () => {
    if (!data) return;
    const rows = buildExportCSV(data);
    downloadCSV(rows, `portfolio_optimization_${data.exchange}`);
  };

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="space-y-3">
        {/* Row 1: Ticker selector */}
        <div className="flex items-start gap-3">
          <Briefcase className="h-3.5 w-3.5 text-amber-400 mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <TickerSelector
              selectedTickers={selectedTickers}
              onTickersChange={setSelectedTickers}
              presets={presets}
            />
          </div>
        </div>

        {/* Row 2: Lookback pills, max weight, optimize button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Lookback pills */}
          <div className="flex items-center gap-1">
            <span className={cn(T.badge, 'text-white/25 mr-1')}>Lookback</span>
            {LOOKBACK_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                className={cn(
                  'px-2 py-0.5 rounded-full text-[9px] font-medium transition-all',
                  lookbackDays === opt.days
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-white/30 hover:text-white/50',
                )}
                onClick={() => setLookbackDays(opt.days)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Max weight selector */}
          <div className="flex items-center gap-1.5">
            <span className={cn(T.badge, 'text-white/25')}>Max Wt</span>
            <select
              value={maxWeightPct}
              onChange={(e) => setMaxWeightPct(Number(e.target.value))}
              className={cn(
                'bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-0.5',
                'text-[10px] font-mono text-white/70 focus:outline-none focus:border-indigo-500/30',
                'appearance-none cursor-pointer',
              )}
            >
              {MAX_WEIGHT_OPTIONS.map((v) => (
                <option key={v} value={v} className="bg-zinc-900">
                  {v}%
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1" />

          {/* Actions */}
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
            size="sm"
            className={cn(
              'h-7 text-[10px] font-medium',
              'bg-amber-500/20 text-amber-400 border border-amber-500/30',
              'hover:bg-amber-500/30 hover:text-amber-300',
              'disabled:opacity-40',
            )}
            onClick={handleOptimize}
            disabled={optimizing || selectedTickers.length < 2}
          >
            {optimizing ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            {optimizing ? 'Optimizing...' : 'Optimize'}
          </Button>
        </div>
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
            onClick={handleOptimize}
          >
            Retry
          </Button>
        </div>
      ) : data && activeStrategy ? (
        <div id="portfolio-dashboard-container" className="space-y-3">
          {/* Active strategy pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn(T.badge, 'text-white/25 mr-1')}>Strategy</span>
            {data.strategies.map((s, i) => {
              const color = getStrategyColor(s.mode);
              const isActive = i === activeStrategyIdx;

              return (
                <button
                  key={s.mode}
                  type="button"
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[9px] font-medium transition-all border',
                    isActive
                      ? 'border-opacity-40'
                      : 'text-white/30 border-white/[0.06] hover:text-white/50',
                  )}
                  style={isActive ? {
                    backgroundColor: `${color}20`,
                    color: color,
                    borderColor: `${color}50`,
                  } : undefined}
                  onClick={() => setActiveStrategyIdx(i)}
                >
                  {getStrategyLabel(s.mode)}
                </button>
              );
            })}
          </div>

          {/* Capital Flow Hero */}
          <PortfolioFlowHero
            weights={activeStrategy.weights}
            sectors={data.sectors}
            strategyLabel={getStrategyLabel(activeStrategy.mode)}
            annualReturn={activeStrategy.metrics.annualReturn}
            sharpe={activeStrategy.metrics.sharpe}
          />

          {/* KPI Row */}
          <PortfolioKPIRow data={data} />

          {/* Row 1: Sunburst + Efficient Frontier */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <AllocationSunburst
                strategy={activeStrategy}
                sectors={data.sectors}
                onCycleStrategy={handleCycleStrategy}
              />
            </div>
            <div className="md:col-span-3">
              <EfficientFrontierChart
                frontier={data.efficientFrontier}
                strategies={data.strategies}
                individualStocks={data.individualStocks}
                activeStrategy={activeStrategy.mode}
                riskFreeRate={data.riskFreeRate}
              />
            </div>
          </div>

          {/* Row 2: Strategy Comparison Cards */}
          <StrategyComparisonCards
            strategies={data.strategies}
            bestStrategy={data.bestStrategy}
          />

          {/* Row 3: Weight Table + Risk Decomposition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <WeightTable
              strategy={activeStrategy}
              sectors={data.sectors}
            />
            <RiskDecompositionPanel
              strategy={activeStrategy}
              sectors={data.sectors}
            />
          </div>

          {/* Row 4: Natural Language Summary */}
          {data.naturalLanguage && (
            <motion.div
              className={cn(S.card, 'p-2')}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <h4 className={cn(T.heading, 'text-white/80 mb-2')}>Summary</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">
                {data.naturalLanguage}
              </p>
            </motion.div>
          )}
        </div>
      ) : (
        <div className={cn(S.card, 'p-8 text-center')}>
          <Briefcase className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40 mb-1">Portfolio Optimizer</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-md mx-auto">
            Select tickers above and click Optimize to run mean-variance optimization
            across 5 strategies: Equal Weight, Min Variance, Max Sharpe, Risk Parity, and HRP.
          </p>
          <Button
            size="sm"
            className={cn(
              'text-[10px] font-medium',
              'bg-amber-500/20 text-amber-400 border border-amber-500/30',
              'hover:bg-amber-500/30',
            )}
            onClick={handleOptimize}
            disabled={selectedTickers.length < 2}
          >
            <Play className="h-3 w-3 mr-1" />
            Optimize Portfolio
          </Button>
        </div>
      )}
    </div>
  );
}
