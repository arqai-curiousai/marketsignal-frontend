'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { simulationApi } from '@/lib/api/simulationApi';
import { useExchange } from '@/context/ExchangeContext';
import { downloadCSV, downloadPNG } from '@/lib/utils/export';
import { T, S } from '@/components/playground/pyramid/tokens';
import { SimPortfolioToolbar } from '@/components/playground/simulations/shared/SimPortfolioToolbar';
import type { IScenarioResult, IScenarioPreset, IPresetBasket } from '@/types/simulation';

import { ScenarioSelector } from './ScenarioSelector';
import { ScenarioKPIRow } from './ScenarioKPIRow';
import { ScenarioComparisonChart } from './ScenarioComparisonChart';
import { ScenarioImpactTable } from './ScenarioImpactTable';
import { ShockwaveGauge } from './ShockwaveGauge';

// ─── Default tickers ─────────────────────────────────────────

const DEFAULT_TICKERS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC'];

// ─── Skeleton loader ─────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-lg bg-white/[0.03]" />
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[64px] rounded-lg bg-white/[0.03]" />
        ))}
      </div>
      <Skeleton className="h-[280px] rounded-xl bg-white/[0.03]" />
      <Skeleton className="h-[200px] rounded-xl bg-white/[0.03]" />
    </div>
  );
}

// ─── Custom scenario panel ───────────────────────────────────

interface CustomPanelProps {
  params: { volMultiplier: number; driftShock: number; correlationShift: number };
  onChange: (params: { volMultiplier: number; driftShock: number; correlationShift: number }) => void;
}

function CustomScenarioPanel({ params, onChange }: CustomPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className={cn(S.card, 'p-4 space-y-4')}
    >
      <h3 className={cn(T.heading, 'text-orange-300/80')}>Custom Scenario Parameters</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] text-white/40">
            Volatility Multiplier: {params.volMultiplier.toFixed(1)}×
          </Label>
          <Slider
            value={[params.volMultiplier]}
            onValueChange={([v]) => onChange({ ...params, volMultiplier: v })}
            min={0.5}
            max={5.0}
            step={0.1}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] text-white/40">
            Drift Shock: {(params.driftShock * 100).toFixed(0)}%
          </Label>
          <Slider
            value={[params.driftShock]}
            onValueChange={([v]) => onChange({ ...params, driftShock: v })}
            min={-0.5}
            max={0.3}
            step={0.01}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] text-white/40">
            Correlation Shift: {params.correlationShift.toFixed(2)}
          </Label>
          <Slider
            value={[params.correlationShift]}
            onValueChange={([v]) => onChange({ ...params, correlationShift: v })}
            min={0}
            max={0.5}
            step={0.01}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Export helper ────────────────────────────────────────────

function buildExportCSV(data: IScenarioResult): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  // Summary
  rows.push({
    Section: 'Summary',
    Scenario: data.scenario.label,
    Tickers: data.tickers.join(', '),
    ComputedAt: data.computedAt,
  });

  // Metrics
  for (const key of Object.keys(data.baselineMetrics) as Array<keyof typeof data.baselineMetrics>) {
    rows.push({
      Section: 'Metrics',
      Metric: key,
      Baseline: data.baselineMetrics[key],
      Stressed: data.stressedMetrics[key],
      Delta: data.deltaMetrics[key],
    });
  }

  // Per-stock
  for (const s of data.perStockImpact) {
    rows.push({
      Section: 'Per-Stock Impact',
      Ticker: s.ticker,
      Sector: s.sector,
      Weight: s.weight,
      BaselineReturn: s.baselineReturn,
      StressedReturn: s.stressedReturn,
      DeltaReturn: s.deltaReturn,
      DeltaVol: s.deltaVol,
      SectorBeta: s.sectorBeta,
    });
  }

  return rows;
}

// ─── Main Component ──────────────────────────────────────────

export function ScenarioDashboard() {
  const { exchangeConfig } = useExchange();
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);
  const [presets, setPresets] = useState<IScenarioPreset[]>([]);
  const [portfolioPresets, setPortfolioPresets] = useState<IPresetBasket[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [customParams, setCustomParams] = useState({
    volMultiplier: 2.0,
    driftShock: -0.20,
    correlationShift: 0.1,
  });
  const [data, setData] = useState<IScenarioResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runControllerRef = useRef<AbortController | null>(null);

  // Fetch presets once
  useEffect(() => {
    const controller = new AbortController();
    simulationApi.getScenarioPresets({ signal: controller.signal }).then((res) => {
      if (res.success) setPresets(res.data);
    }).catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('Failed to load scenario presets:', err);
    });

    simulationApi.getPresets({ signal: controller.signal }).then((res) => {
      if (res.success) setPortfolioPresets(res.data);
    }).catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('Failed to load portfolio presets:', err);
    });

    return () => controller.abort();
  }, []);

  // Abort runScenario on unmount
  useEffect(() => {
    return () => runControllerRef.current?.abort();
  }, []);

  const runScenario = useCallback(async () => {
    if (!selectedScenario || tickers.length === 0) return;

    runControllerRef.current?.abort();
    runControllerRef.current = new AbortController();
    const signal = runControllerRef.current.signal;

    setRunning(true);
    setError(null);

    try {
      const isCustom = selectedScenario === 'custom';
      const result = await simulationApi.runScenario(
        tickers,
        isCustom ? undefined : selectedScenario,
        isCustom ? {
          vol_multiplier: customParams.volMultiplier,
          drift_shock: customParams.driftShock,
          correlation_shift: customParams.correlationShift,
          label: 'Custom Scenario',
          description: `Vol ×${customParams.volMultiplier.toFixed(1)}, Drift ${(customParams.driftShock * 100).toFixed(0)}%, Corr +${customParams.correlationShift.toFixed(2)}`,
        } : undefined,
        undefined,
        exchangeConfig.code,
        { signal },
      );

      if (signal.aborted) return;
      if (result.success) {
        setData(result.data);
        toast.success(`Stress test complete: ${result.data.scenario.label}`);
      } else {
        setError(result.error.message);
        toast.error('Stress test failed');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('Failed to run scenario analysis');
      toast.error('Failed to run stress test');
    } finally {
      setRunning(false);
    }
  }, [tickers, selectedScenario, customParams, exchangeConfig.code]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;
    const rows = buildExportCSV(data);
    downloadCSV(rows, `scenario_${data.scenario.id}_${data.tickers.join('_')}.csv`);
    toast.success('CSV exported');
  }, [data]);

  const handleExportPNG = useCallback(async () => {
    const el = document.getElementById('scenario-dashboard-container');
    if (el) {
      await downloadPNG(el, `scenario_${data?.scenario.id || 'result'}.png`);
      toast.success('PNG exported');
    }
  }, [data]);

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <SimPortfolioToolbar
        tickers={tickers}
        onTickersChange={setTickers}
        presets={portfolioPresets}
        exchange={exchangeConfig.code}
        onExportCSV={data ? handleExportCSV : undefined}
        onExportPNG={data ? handleExportPNG : undefined}
      >
        {data && (
          <motion.span
            className={cn(
              'text-[9px] font-semibold px-2.5 py-1 rounded-full',
              'bg-orange-500/10 text-orange-400 border border-orange-500/20',
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {data.scenario.label}
          </motion.span>
        )}
      </SimPortfolioToolbar>

      {/* ── Scenario Selector ── */}
      <ScenarioSelector
        presets={presets}
        selectedId={selectedScenario}
        onSelect={setSelectedScenario}
        loading={running}
      />

      {/* ── Custom params panel ── */}
      {selectedScenario === 'custom' && (
        <CustomScenarioPanel params={customParams} onChange={setCustomParams} />
      )}

      {/* ── Run button ── */}
      {selectedScenario && (
        <div className="flex items-center gap-3">
          <Button
            onClick={runScenario}
            disabled={running || tickers.length === 0}
            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30"
            size="sm"
          >
            {running ? (
              <>
                <Zap className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                Running stress test...
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Run Stress Test
              </>
            )}
          </Button>
          {running && (
            <span className="text-[10px] text-white/30 animate-pulse">
              Applying scenario shocks to covariance matrix...
            </span>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className={cn(S.card, 'p-6 text-center')}>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={runScenario}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Results ── */}
      {running && !data && <DashboardSkeleton />}

      {data && !running && (
        <div id="scenario-dashboard-container" className="space-y-3">
          {/* Shockwave Gauge hero */}
          <ShockwaveGauge
            baselineReturn={data.baselineMetrics.annualReturn}
            stressedReturn={data.stressedMetrics.annualReturn}
            baselineVol={data.baselineMetrics.annualVol}
            stressedVol={data.stressedMetrics.annualVol}
            baselineSharpe={data.baselineMetrics.sharpe}
            stressedSharpe={data.stressedMetrics.sharpe}
            baselineVaR={data.baselineMetrics.var95}
            stressedVaR={data.stressedMetrics.var95}
            scenarioLabel={data.scenario.label}
          />

          {/* Natural language summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(S.card, 'px-4 py-3')}
          >
            <p className="text-sm text-white/60 leading-relaxed">{data.naturalLanguage}</p>
          </motion.div>

          {/* KPI Row */}
          <ScenarioKPIRow data={data} />

          {/* Comparison Chart */}
          <ScenarioComparisonChart data={data} />

          {/* Impact Table */}
          <ScenarioImpactTable impacts={data.perStockImpact} />
        </div>
      )}

      {/* Empty state */}
      {!data && !running && !error && !selectedScenario && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-3">
            <Zap className="h-6 w-6 text-orange-400" />
          </div>
          <h3 className={cn(T.heading, 'text-white/70 mb-1')}>Select a Scenario</h3>
          <p className="text-xs text-white/30 max-w-md">
            Choose a preset stress scenario above or create a custom one, then run the stress test.
          </p>
        </div>
      )}
    </div>
  );
}
