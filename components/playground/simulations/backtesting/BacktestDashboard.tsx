'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { simulationApi } from '@/lib/api/simulationApi';
import { useExchange } from '@/context/ExchangeContext';
import type { IBacktestAnalysis, IStrategyCatalogItem } from '@/types/simulation';
import { downloadCSV } from '@/lib/utils/export';
import { T, S } from '@/components/playground/pyramid/tokens';
import { NIFTY50_TICKERS } from '@/components/playground/pyramid/constants';

import { BacktestKPIRow } from './BacktestKPIRow';
import { EquityCurveRace } from './EquityCurveRace';
import { StrategyScorecardGrid } from './StrategyScorecardGrid';
import { DrawdownChart } from './DrawdownChart';
import { OverfittingDetector } from './OverfittingDetector';
import { RollingMetricsPanel } from './RollingMetricsPanel';
import { TransactionCostPanel } from './TransactionCostPanel';
import { fmtReturn, fmtSharpe, fmtPct, fmtCurrency } from './backtest-tokens';

// ─── Constants ──────────────────────────────────────────────────

const DEFAULT_LOOKBACK = 3;
const MIN_LOOKBACK = 2;
const MAX_LOOKBACK = 10;

// ─── Skeleton loader ──────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] rounded-lg bg-white/[0.03]" />
        ))}
      </div>
      <Skeleton className="h-[360px] rounded-xl bg-white/[0.03]" />
      <Skeleton className="h-[200px] rounded-xl bg-white/[0.03]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-[280px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="h-[280px] rounded-xl bg-white/[0.03]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-[340px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="h-[280px] rounded-xl bg-white/[0.03]" />
      </div>
    </div>
  );
}

// ─── Loading message ─────────────────────────────────────────────

function RunningMessage({ elapsed }: { elapsed: number }) {
  return (
    <div className="space-y-3">
      <DashboardSkeleton />
      {elapsed >= 3000 && (
        <motion.div
          className={cn(S.card, 'p-6 text-center')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FlaskConical className="h-5 w-5 text-indigo-400 mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-white/60">Running simulations...</p>
          <p className="text-[10px] text-white/30 mt-1">
            Backtesting multiple strategies across {'>'}1000 trading days
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Export helpers ──────────────────────────────────────────────

function buildExportCSV(data: IBacktestAnalysis): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (const s of data.strategies) {
    rows.push({
      Strategy: s.label,
      'Gross Return': fmtReturn(s.backtest.aggregate.totalReturnGross),
      'Net Return': fmtReturn(s.backtest.aggregate.totalReturnNet),
      'Annual Return': fmtReturn(s.backtest.aggregate.annualReturn),
      'Annual Vol': fmtPct(s.backtest.aggregate.annualVolatility),
      Sharpe: fmtSharpe(s.backtest.aggregate.sharpe),
      'Deflated Sharpe': fmtSharpe(s.deflatedSharpe.deflatedSharpe),
      'Max Drawdown': fmtPct(s.backtest.aggregate.maxDrawdown),
      'Win Rate': fmtPct(s.backtest.aggregate.winRate),
      'Overfit Risk': s.overfitting.trafficLight,
      PBO: fmtPct(s.overfitting.pbo),
      'Cost/Lakh': fmtCurrency(s.transactionImpact.costPerLakh),
      Rebalance: s.rebalance,
    });
  }
  return rows;
}

// ─── Main Component ──────────────────────────────────────────────

export function BacktestDashboard() {
  const { exchangeConfig } = useExchange();

  // Toolbar state — need at least 2 tickers for multi-strategy backtesting
  const [selectedTickers, setSelectedTickers] = useState<string[]>([
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  ]);
  const [catalog, setCatalog] = useState<IStrategyCatalogItem[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set());
  const [lookback, setLookback] = useState(DEFAULT_LOOKBACK);

  // Data state
  const [data, setData] = useState<IBacktestAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStrategy, setActiveStrategy] = useState<string>('');

  // Loading timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch strategy catalog on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchCatalog() {
      const result = await simulationApi.getBacktestStrategies();
      if (!cancelled && result.success) {
        setCatalog(result.data);
        // Select all by default
        setSelectedStrategies(new Set(result.data.map((s) => s.name)));
      }
    }
    fetchCatalog();
    return () => { cancelled = true; };
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Run backtest ──
  const runBacktest = useCallback(async () => {
    if (!selectedTickers.length) return;

    setLoading(true);
    setError(null);
    setData(null);
    setElapsed(0);

    // Start elapsed timer
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 500);

    try {
      const strats = selectedStrategies.size > 0
        ? Array.from(selectedStrategies)
        : undefined;

      const result = await simulationApi.runBacktest(
        selectedTickers,
        exchangeConfig.code,
        strats,
        lookback,
      );

      if (result.success) {
        setData(result.data);
        setActiveStrategy(result.data.bestStrategy || result.data.strategies[0]?.name || '');
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Failed to run backtest');
      toast.error('Failed to run backtest');
    } finally {
      setLoading(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [selectedTickers, selectedStrategies, lookback, exchangeConfig.code]);

  // ── Ticker management ──
  const handleTickerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ticker = e.target.value;
    if (ticker && !selectedTickers.includes(ticker)) {
      setSelectedTickers((prev) => [...prev, ticker]);
    }
  };

  const removeTicker = (ticker: string) => {
    setSelectedTickers((prev) => prev.filter((t) => t !== ticker));
  };

  // ── Strategy toggle ──
  const toggleStrategy = (name: string) => {
    setSelectedStrategies((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // ── Export ──
  const handleExportCSV = () => {
    if (!data) return;
    const rows = buildExportCSV(data);
    downloadCSV(rows, `backtest_${data.tickers.join('_')}`);
  };

  // ── Active overfitting data ──
  const activeStrat = data?.strategies.find((s) => s.name === activeStrategy);

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Ticker selector */}
        <div className="flex items-center gap-2">
          <FlaskConical className="h-3.5 w-3.5 text-indigo-400" />
          <select
            value=""
            onChange={handleTickerChange}
            className={cn(
              'bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5',
              'text-xs font-mono text-white/80 focus:outline-none focus:border-indigo-500/30',
              'appearance-none cursor-pointer',
            )}
          >
            <option value="" disabled className="bg-zinc-900">
              + Add Ticker
            </option>
            {NIFTY50_TICKERS.filter((t) => !selectedTickers.includes(t)).map((t) => (
              <option key={t} value={t} className="bg-zinc-900">
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Selected tickers chips */}
        <div className="flex flex-wrap items-center gap-1">
          {selectedTickers.map((ticker) => (
            <span
              key={ticker}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
            >
              {ticker}
              <button
                type="button"
                className="text-indigo-400/50 hover:text-indigo-400 ml-0.5"
                onClick={() => removeTicker(ticker)}
              >
                x
              </button>
            </span>
          ))}
        </div>

        <div className="flex-1" />

        {/* Lookback slider */}
        <div className="flex items-center gap-2">
          <span className={cn(T.badge, 'text-white/35')}>Lookback</span>
          <input
            type="range"
            min={MIN_LOOKBACK}
            max={MAX_LOOKBACK}
            step={1}
            value={lookback}
            onChange={(e) => setLookback(Number(e.target.value))}
            className="w-20 h-1 accent-indigo-500 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-white/60">{lookback}Y</span>
        </div>

        {/* Actions */}
        <Button
          variant="default"
          size="sm"
          className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={runBacktest}
          disabled={loading || selectedTickers.length < 2}
        >
          <Play className={cn('h-3 w-3 mr-1', loading && 'animate-pulse')} />
          Run Backtest
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

      {/* Strategy checkboxes */}
      {catalog.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(T.badge, 'text-white/35')}>Strategies:</span>
          {catalog.map((s) => (
            <label
              key={s.name}
              className={cn(
                'flex items-center gap-1.5 text-[10px] font-mono cursor-pointer px-2 py-1 rounded-lg transition-all',
                selectedStrategies.has(s.name)
                  ? 'bg-white/[0.06] text-white/70'
                  : 'text-white/30 hover:text-white/50',
              )}
            >
              <input
                type="checkbox"
                checked={selectedStrategies.has(s.name)}
                onChange={() => toggleStrategy(s.name)}
                className="w-3 h-3 accent-indigo-500 rounded"
              />
              {s.label}
            </label>
          ))}
        </div>
      )}

      {/* ── Minimum tickers warning ── */}
      {selectedTickers.length < 2 && (
        <div className="text-[10px] text-amber-400/70 px-1">
          Select at least 2 tickers to run multi-strategy backtesting.
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <RunningMessage elapsed={elapsed} />
      ) : error ? (
        <div className={cn(S.card, 'p-8 text-center')}>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={runBacktest}
          >
            Retry
          </Button>
        </div>
      ) : data ? (
        <div id="backtest-dashboard-container" className="space-y-3">
          {/* KPI Row */}
          <BacktestKPIRow data={data} />

          {/* Equity Curve Race (full width, hero) */}
          <EquityCurveRace strategies={data.strategies} />

          {/* Strategy Scorecard Grid (full width) */}
          <StrategyScorecardGrid
            strategies={data.strategies}
            bestStrategy={data.bestStrategy}
          />

          {/* Row: Drawdown + Overfitting (1/2 + 1/2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DrawdownChart
              strategies={data.strategies}
              activeStrategy={activeStrategy}
              onStrategyChange={setActiveStrategy}
            />
            {activeStrat && (
              <OverfittingDetector
                overfitting={activeStrat.overfitting}
                strategyLabel={activeStrat.label}
              />
            )}
          </div>

          {/* Row: Rolling Metrics + Transaction Cost (1/2 + 1/2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <RollingMetricsPanel
              strategies={data.strategies}
              activeStrategy={activeStrategy}
            />
            <TransactionCostPanel strategies={data.strategies} />
          </div>

          {/* Natural Language Summary */}
          {data.naturalLanguage && (
            <motion.div
              className={cn(S.card, 'p-2')}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h4 className={cn(T.heading, 'text-white/80 mb-2')}>Summary</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">
                {data.naturalLanguage}
              </p>
            </motion.div>
          )}
        </div>
      ) : (
        /* Empty state — prompt to run */
        <div className={cn(S.card, 'p-12 text-center')}>
          <FlaskConical className="h-8 w-8 text-indigo-400/30 mx-auto mb-3" />
          <p className="text-sm text-white/50 mb-1">Backtesting Engine</p>
          <p className="text-[10px] text-white/25 max-w-md mx-auto leading-relaxed">
            Select tickers, choose strategies, and click &quot;Run Backtest&quot; to compare
            strategy performance with overfitting detection, deflated Sharpe ratios, and
            transaction cost analysis.
          </p>
        </div>
      )}
    </div>
  );
}
