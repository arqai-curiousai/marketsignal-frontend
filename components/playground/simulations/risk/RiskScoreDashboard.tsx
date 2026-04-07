'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { simulationApi } from '@/lib/api/simulationApi';
import { useExchange } from '@/context/ExchangeContext';
import type { IRiskScoreResult, IPresetBasket } from '@/types/simulation';
import { downloadCSV, downloadPNG } from '@/lib/utils/export';
import { T, S } from '@/components/playground/pyramid/tokens';

import { SimPortfolioToolbar } from '@/components/playground/simulations/shared/SimPortfolioToolbar';
import { RiskAuroraCanvas } from './RiskAuroraCanvas';
import { RiskBreakdown } from './RiskBreakdown';
import { RiskComparison } from './RiskComparison';
import { RiskTimeline } from './RiskTimeline';
import { ActionableRisks } from './ActionableRisks';
import { RiskMatchQuiz } from './RiskMatchQuiz';
import { RiskKPIRow } from './RiskKPIRow';
import { getZoneForScore, fmtScoreFull } from './risk-tokens';

// ─── Default tickers ─────────────────────────────────────────

const DEFAULT_TICKERS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC'];

// ─── Skeleton loader ─────────────────────────────────────────

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
          <Skeleton className="h-[300px] rounded-xl bg-white/[0.03]" />
        </div>
      </div>
      <Skeleton className="h-[160px] rounded-xl bg-white/[0.03]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton className="h-[280px] rounded-xl bg-white/[0.03]" />
        <Skeleton className="h-[260px] rounded-xl bg-white/[0.03]" />
      </div>
    </div>
  );
}

// ─── Export helpers ───────────────────────────────────────────

function buildExportCSV(data: IRiskScoreResult): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];

  // Summary row
  rows.push({
    Section: 'Summary',
    Tickers: data.tickers.join(', '),
    CompositeScore: data.compositeScore,
    Zone: data.zone.label,
    ComputedAt: data.computedAt,
  });

  // Sub-score rows
  for (const sub of data.subScores) {
    rows.push({
      Section: 'Sub-Scores',
      Name: sub.label,
      Score: sub.score,
      Weight: sub.weight,
      Description: sub.description,
    });
  }

  // Suggestion rows
  for (const s of data.suggestions) {
    rows.push({
      Section: 'Suggestions',
      Action: s.action,
      Impact: s.estimatedChange,
      Description: s.impactDescription,
    });
  }

  return rows;
}

// ─── Main Component ──────────────────────────────────────────

export function RiskScoreDashboard() {
  const { exchangeConfig } = useExchange();
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS);
  const [presets, setPresets] = useState<IPresetBasket[]>([]);
  const [data, setData] = useState<IRiskScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  // Fetch presets once
  useEffect(() => {
    const controller = new AbortController();
    simulationApi.getPresets(undefined, { signal: controller.signal }).then((res) => {
      if (res.success) setPresets(res.data);
    }).catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('Failed to load presets:', err);
    });
    return () => controller.abort();
  }, []);

  const fetchData = useCallback(
    async (tickerList: string[], isRefresh = false, signal?: AbortSignal) => {
      if (tickerList.length === 0) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const result = await simulationApi.computeRiskScore(
          tickerList,
          undefined,
          exchangeConfig.code,
          { signal },
        );
        if (signal?.aborted) return;
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Failed to compute risk score');
        toast.error('Failed to load risk data');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [exchangeConfig.code],
  );

  // Fetch on ticker or exchange change
  useEffect(() => {
    const controller = new AbortController();
    if (tickers.length > 0) {
      fetchData(tickers, false, controller.signal);
    }
    return () => controller.abort();
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
    downloadCSV(rows, `risk_score_${data.tickers.join('_')}.csv`);
  }, [data]);

  const handleExportPNG = useCallback(async () => {
    const el = document.getElementById('risk-dashboard-container');
    if (el) await downloadPNG(el, `risk_score_${tickers.join('_')}.png`);
  }, [tickers]);

  // Zone badge for toolbar
  const zoneConfig = data ? getZoneForScore(data.compositeScore) : null;

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
      >
        {/* Zone badge */}
        {zoneConfig && data && (
          <motion.span
            className={cn(
              'text-[9px] font-semibold px-2.5 py-1 rounded-full',
              zoneConfig.bg,
              zoneConfig.text,
              zoneConfig.border,
              'border',
            )}
            key={data.zone.name}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {zoneConfig.label} {fmtScoreFull(data.compositeScore)}
          </motion.span>
        )}
      </SimPortfolioToolbar>

      {/* ── Content ── */}
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className={cn(S.card, 'p-8 text-center')}>
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(tickers)}
          >
            Retry
          </Button>
        </div>
      ) : data ? (
        <div id="risk-dashboard-container" className="space-y-3">
          {/* KPI Row */}
          <RiskKPIRow data={data} />

          {/* Row 1: Compass + Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 flex items-center justify-center">
              <RiskAuroraCanvas data={data} />
            </div>
            <div className="md:col-span-3">
              <RiskBreakdown subScores={data.subScores} className="h-full" />
            </div>
          </div>

          {/* Row 2: Risk Comparison (full width) */}
          <RiskComparison data={data} />

          {/* Row 3: Actionable Risks + Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionableRisks suggestions={data.suggestions} />
            <RiskTimeline data={data} />
          </div>

          {/* Row 4: Collapsible Quiz */}
          <div className={cn(S.card, 'overflow-hidden')}>
            <button
              type="button"
              onClick={() => setQuizOpen((o) => !o)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3',
                'hover:bg-white/[0.02] transition-colors',
              )}
            >
              <span className={cn(T.heading, 'text-white/70')}>
                Risk Tolerance Quiz
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-white/30 transition-transform',
                  quizOpen && 'rotate-180',
                )}
              />
            </button>
            {quizOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-2 pb-2">
                  <RiskMatchQuiz portfolioScore={data.compositeScore} />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
