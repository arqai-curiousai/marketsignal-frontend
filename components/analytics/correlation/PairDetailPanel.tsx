'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, Shield, ArrowRight, Link2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  getConditionalCorrelation,
  getEnhancedCorrelation,
  getPartialCorrelation,
  getGrangerCausality,
  getCointegration,
  getDCCGarch,
  getRegimeCorrelations,
} from '@/src/lib/api/analyticsApi';
import type {
  IConditionalCorrelation,
  IEnhancedCorrelation,
  IPartialCorrelation,
  IGrangerCausality,
  IGrangerDirection,
  ICointegration,
  IDCCGarch,
  IRegimeCorrelation,
} from '@/types/analytics';
import { ASSET_MAP, TYPE_COLORS, corrColor, corrStrength } from './constants';
import { RollingCorrelationChart } from './RollingCorrelationChart';
import { ScatterPlotChart } from './ScatterPlotChart';
import { LeadLagChart } from './LeadLagChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PairDetailPanelProps {
  selectedPair: [string, string] | null;
  pairCorrelation: number | null;
  window: string;
  method: string;
  exchange: string;
}

export function PairDetailPanel({
  selectedPair,
  pairCorrelation,
  window: windowValue,
  method,
  exchange,
}: PairDetailPanelProps) {
  // ── Overview tab data (fetched immediately) ──
  const [enhancedData, setEnhancedData] = useState<IEnhancedCorrelation | null>(null);
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [partialData, setPartialData] = useState<IPartialCorrelation | null>(null);
  const [partialLoading, setPartialLoading] = useState(false);

  // ── Dynamics tab data (lazy-loaded) ──
  const [dccData, setDccData] = useState<IDCCGarch | null>(null);
  const [dccLoading, setDccLoading] = useState(false);

  // ── Trading tab data (lazy-loaded) ──
  const [conditionalData, setConditionalData] = useState<IConditionalCorrelation | null>(null);
  const [conditionalLoading, setConditionalLoading] = useState(false);
  const [grangerData, setGrangerData] = useState<IGrangerCausality | null>(null);
  const [grangerLoading, setGrangerLoading] = useState(false);
  const [cointegrationData, setCointegrationData] = useState<ICointegration | null>(null);
  const [cointegrationLoading, setCointegrationLoading] = useState(false);
  const [regimeData, setRegimeData] = useState<IRegimeCorrelation | null>(null);
  const [regimeLoading, setRegimeLoading] = useState(false);

  // Track which tabs have been visited (for lazy loading)
  const [activeTab, setActiveTab] = useState('overview');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['overview']));

  // Derive exchange info
  const assetA = selectedPair ? ASSET_MAP.get(selectedPair[0]) : null;
  const assetB = selectedPair ? ASSET_MAP.get(selectedPair[1]) : null;
  const exA = assetA?.type === 'currency' ? 'FX' : assetA?.type === 'commodity' ? 'CMDTY' : exchange;
  const exB = assetB?.type === 'currency' ? 'FX' : assetB?.type === 'commodity' ? 'CMDTY' : exchange;
  const bothStocks = assetA?.type === 'stock' && assetB?.type === 'stock';
  const windowDays = parseInt(windowValue) || 90;

  // ── Overview fetch (immediate on pair select) ──
  useEffect(() => {
    setEnhancedData(null);
    setPartialData(null);
    setDccData(null);
    setConditionalData(null);
    setGrangerData(null);
    setCointegrationData(null);
    setRegimeData(null);
    setActiveTab('overview');
    setVisitedTabs(new Set(['overview']));

    if (!selectedPair || !selectedPair[1]) return;
    const [a, b] = selectedPair;
    let cancelled = false;

    setEnhancedLoading(true);
    getEnhancedCorrelation(a, b, exA, exB, windowDays).then((result) => {
      if (cancelled) return;
      if (result.success && result.data && !('error' in result.data)) {
        setEnhancedData(result.data);
      }
      setEnhancedLoading(false);
    }).catch(() => {
      if (!cancelled) setEnhancedLoading(false);
    });

    if (bothStocks) {
      setPartialLoading(true);
      getPartialCorrelation(a, b, exA, exB, windowDays).then((result) => {
        if (cancelled) return;
        if (result.success && result.data && !('error' in result.data)) {
          setPartialData(result.data);
        }
        setPartialLoading(false);
      }).catch(() => {
        if (!cancelled) setPartialLoading(false);
      });
    }

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPair, windowValue]);

  // ── Dynamics tab lazy fetch ──
  useEffect(() => {
    if (!visitedTabs.has('dynamics') || !selectedPair || !selectedPair[1]) return;
    if (dccLoading) return; // fetch already in progress

    const [a, b] = selectedPair;
    let cancelled = false;

    setDccData(null);
    setDccLoading(true);
    getDCCGarch(a, b, exA, exB).then((res) => {
      if (cancelled) return;
      if (res.success && res.data && !('error' in res.data)) setDccData(res.data);
    }).finally(() => { if (!cancelled) setDccLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitedTabs, selectedPair, windowValue]);

  // ── Trading tab lazy fetch ──
  useEffect(() => {
    if (!visitedTabs.has('trading') || !selectedPair || !selectedPair[1]) return;
    if (grangerData || grangerLoading) return; // already fetched

    const [a, b] = selectedPair;
    let cancelled = false;

    if (bothStocks) {
      setConditionalLoading(true);
      getConditionalCorrelation(a, b, -2.0, exchange).then((result) => {
        if (cancelled) return;
        if (result.success && result.data) setConditionalData(result.data);
      }).finally(() => { if (!cancelled) setConditionalLoading(false); });
    }

    setGrangerLoading(true);
    getGrangerCausality(a, b, exA, exB).then((res) => {
      if (cancelled) return;
      if (res.success && res.data && !('error' in res.data)) setGrangerData(res.data);
    }).finally(() => { if (!cancelled) setGrangerLoading(false); });

    setCointegrationLoading(true);
    getCointegration(a, b, exA, exB).then((res) => {
      if (cancelled) return;
      if (res.success && res.data && !('error' in res.data)) setCointegrationData(res.data);
    }).finally(() => { if (!cancelled) setCointegrationLoading(false); });

    setRegimeLoading(true);
    getRegimeCorrelations(a, b, exA, exB).then((res) => {
      if (cancelled) return;
      if (res.success && res.data && !('error' in res.data)) setRegimeData(res.data);
    }).finally(() => { if (!cancelled) setRegimeLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitedTabs, selectedPair]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  if (!selectedPair || !selectedPair[1]) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          Click two nodes or an edge to see correlation details.
        </p>
      </div>
    );
  }

  const pair = selectedPair;

  return (
    <div className="space-y-4">
      {/* ── Pair Header ── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[assetA?.type || 'stock'] }} />
          <span className="text-sm font-bold text-white">{pair[0]}</span>
        </div>
        <span className="text-muted-foreground text-xs">↔</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[assetB?.type || 'stock'] }} />
          <span className="text-sm font-bold text-white">{pair[1]}</span>
        </div>
      </div>

      {/* ── Correlation Value + Bar ── */}
      {pairCorrelation !== null ? (
        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold font-mono" style={{ color: corrColor(pairCorrelation) }}>
              {pairCorrelation >= 0 ? '+' : ''}{pairCorrelation.toFixed(3)}
            </span>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full mb-1',
              Math.abs(pairCorrelation) >= 0.6 ? 'bg-brand-blue/20 text-brand-blue' : 'bg-white/10 text-muted-foreground',
            )}>
              {corrStrength(pairCorrelation)}
            </span>
          </div>
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="absolute top-0 h-full rounded-full transition-all duration-500"
              style={{
                left: pairCorrelation >= 0 ? '50%' : `${50 + pairCorrelation * 50}%`,
                width: `${Math.abs(pairCorrelation) * 50}%`,
                backgroundColor: corrColor(pairCorrelation),
              }}
            />
            <div className="absolute top-0 left-1/2 w-px h-full bg-white/20" />
          </div>
          <div className="flex justify-between text-[8px] text-muted-foreground font-mono mt-0.5">
            <span>-1</span>
            <span>0</span>
            <span>+1</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {pairCorrelation > 0.6
              ? `${pair[0]} and ${pair[1]} move strongly in the same direction.`
              : pairCorrelation > 0.3
                ? `${pair[0]} and ${pair[1]} show a moderate positive relationship.`
                : pairCorrelation > -0.3
                  ? `${pair[0]} and ${pair[1]} have little linear relationship — good for diversification.`
                  : pairCorrelation > -0.6
                    ? `${pair[0]} and ${pair[1]} tend to move in opposite directions.`
                    : `${pair[0]} and ${pair[1]} are strongly inversely correlated — natural hedges.`}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4">
          No correlation data available for this pair in the selected window.
        </p>
      )}

      {/* ── Tabbed Analysis ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0 h-auto">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-blue data-[state=active]:text-white text-muted-foreground text-xs px-4 py-2 bg-transparent data-[state=active]:bg-transparent"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="dynamics"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-blue data-[state=active]:text-white text-muted-foreground text-xs px-4 py-2 bg-transparent data-[state=active]:bg-transparent"
          >
            Dynamics
          </TabsTrigger>
          <TabsTrigger
            value="trading"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-blue data-[state=active]:text-white text-muted-foreground text-xs px-4 py-2 bg-transparent data-[state=active]:bg-transparent"
          >
            Trading
          </TabsTrigger>
        </TabsList>

        {/* ═══ Overview Tab ═══ */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Statistical Comparison */}
          {enhancedLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Computing statistical analysis...</span>
            </div>
          ) : enhancedData ? (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
              <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Statistical Comparison
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <StatCell label="Pearson" value={enhancedData.pearson.r} pValue={enhancedData.pearson.p_value} significant={enhancedData.pearson.significant} />
                <StatCell label="Spearman" value={enhancedData.spearman.rho} pValue={enhancedData.spearman.p_value} significant={enhancedData.spearman.significant} />
                <StatCell label="Kendall τ" value={enhancedData.kendall?.tau ?? 0} pValue={enhancedData.kendall?.p_value ?? null} significant={enhancedData.kendall?.significant ?? false} />
              </div>

              {enhancedData.divergence_flag && (
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-amber-300">
                    Methods diverge by {enhancedData.method_divergence.toFixed(3)} — potential outliers or non-linear relationship
                  </span>
                </div>
              )}

              {enhancedData.stability?.label && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Stability:</span>
                  <span className={cn(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full',
                    enhancedData.stability.label === 'Stable' && 'bg-emerald-500/15 text-emerald-400',
                    enhancedData.stability.label === 'Variable' && 'bg-amber-500/15 text-amber-400',
                    enhancedData.stability.label === 'Unstable' && 'bg-red-500/15 text-red-400',
                  )}>
                    {enhancedData.stability.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground ml-auto font-mono">
                    &sigma;={enhancedData.stability.std?.toFixed(3)}
                  </span>
                </div>
              )}

              <div className="text-[10px] text-muted-foreground">
                Based on {enhancedData.n_observations} observations ({enhancedData.window_days}d)
              </div>
            </div>
          ) : null}

          {/* Partial Correlation */}
          {partialLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Computing market-adjusted correlation...</span>
            </div>
          ) : partialData ? (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Market-Adjusted (Partial) Correlation
              </h4>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[10px] text-muted-foreground">Raw</div>
                  <div className="text-sm font-bold font-mono" style={{ color: corrColor(partialData.raw_correlation) }}>
                    {partialData.raw_correlation >= 0 ? '+' : ''}{partialData.raw_correlation.toFixed(3)}
                  </div>
                </div>
                <span className="text-muted-foreground text-lg">&rarr;</span>
                <div>
                  <div className="text-[10px] text-muted-foreground">Controlling for market</div>
                  <div className="text-sm font-bold font-mono" style={{ color: corrColor(partialData.partial_correlation) }}>
                    {partialData.partial_correlation >= 0 ? '+' : ''}{partialData.partial_correlation.toFixed(3)}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {partialData.market_effect_pct.toFixed(0)}% of this correlation is explained by the broader market.
              </p>
            </div>
          ) : null}

          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>Window: <span className="text-white font-medium">{windowValue === '365d' ? '1 Year' : windowValue}</span></span>
            <span>Method: <span className="text-white font-medium capitalize">{method}</span></span>
          </div>
        </TabsContent>

        {/* ═══ Dynamics Tab ═══ */}
        <TabsContent value="dynamics" className="mt-4 space-y-4">
          {/* Rolling Correlation */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <RollingCorrelationChart
              tickerA={pair[0]}
              tickerB={pair[1]}
              exchangeA={exA}
              exchangeB={exB}
              height={200}
            />
          </div>

          {/* DCC-GARCH */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            {dccLoading ? (
              <div className="flex items-center gap-2 py-6 justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Computing DCC-GARCH...</span>
              </div>
            ) : dccData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3 w-3" />
                    Dynamic Correlation (DCC-GARCH)
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {dccData.dcc_params == null && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
                        EWMA Fallback
                      </span>
                    )}
                    {dccData.persistence != null && (
                      <span className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                        dccData.persistence > 0.95
                          ? 'bg-amber-500/15 text-amber-400'
                          : dccData.persistence < 0.90
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-blue-500/15 text-blue-400',
                      )}>
                        Persistence: {dccData.persistence.toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={dccData.dates.map((d, i) => ({ date: d, dcc: dccData.dcc_correlation[i] }))}
                    margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  >
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={60} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} axisLine={false} tickCount={5} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                      labelStyle={{ color: '#a1a1aa', fontSize: '10px' }}
                      formatter={(value: number) => [value.toFixed(4), 'DCC']}
                    />
                    <ReferenceLine y={dccData.static_correlation} stroke="#71717a" strokeDasharray="4 4" strokeWidth={1} />
                    <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={0.5} />
                    <Line type="monotone" dataKey="dcc" stroke="#4ADE80" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 text-[9px] text-muted-foreground">
                  <span>Current: <span className="text-white font-mono font-medium">{dccData.current_dcc.toFixed(4)}</span></span>
                  <span>Static: <span className="text-white font-mono font-medium">{dccData.static_correlation.toFixed(4)}</span></span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-px bg-[#71717a]" style={{ borderTop: '1px dashed #71717a' }} />
                    Static ref
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">DCC-GARCH data not available for this pair.</p>
              </div>
            )}
          </div>

          {/* Lead-Lag */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <LeadLagChart tickerA={pair[0]} tickerB={pair[1]} exchangeA={exA} exchangeB={exB} height={180} />
          </div>
        </TabsContent>

        {/* ═══ Trading Tab ═══ */}
        <TabsContent value="trading" className="mt-4 space-y-4">
          {/* Scatter Plot */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <ScatterPlotChart tickerA={pair[0]} tickerB={pair[1]} exchangeA={exA} exchangeB={exB} height={250} />
          </div>

          {/* Regime Correlation */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <h4 className="text-[11px] font-medium text-muted-foreground mb-3">
              Correlation by Market Regime
            </h4>
            {regimeLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : regimeData?.regimes && regimeData.regimes.length > 1 ? (
              <div className="space-y-1.5">
                {regimeData.regimes.map((r) => {
                  const barWidth = Math.abs(r.correlation) * 50;
                  const isOverall = r.regime === 'Overall';
                  return (
                    <div key={r.regime} className="flex items-center gap-2">
                      <span className={cn('text-[10px] w-14 text-right shrink-0', isOverall ? 'text-white font-medium' : 'text-muted-foreground')}>
                        {r.regime}
                      </span>
                      <div className="flex-1 relative h-4 bg-white/[0.03] rounded overflow-hidden">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                        <div
                          className="absolute top-0.5 bottom-0.5 rounded-sm transition-all"
                          style={{
                            backgroundColor: corrColor(r.correlation),
                            width: `${barWidth}%`,
                            ...(r.correlation >= 0 ? { left: '50%' } : { right: '50%' }),
                            opacity: isOverall ? 1 : 0.8,
                          }}
                        />
                      </div>
                      <span className={cn('text-[10px] font-mono w-12 text-right shrink-0', isOverall ? 'font-bold' : '')} style={{ color: corrColor(r.correlation) }}>
                        {r.correlation >= 0 ? '+' : ''}{r.correlation.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-muted-foreground w-6 text-right shrink-0">
                        {r.n_observations}
                      </span>
                    </div>
                  );
                })}
                <p className="text-[9px] text-muted-foreground mt-1">
                  Bull/Bear: NIFTY daily return &gt;/&lt; &plusmn;0.5%. Vol: 20d rolling vs median.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Regime data not available for this pair.</p>
            )}
          </div>

          {/* Granger Causality */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <h4 className="text-[11px] font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3 text-blue-400" />
              Granger Causality
            </h4>
            {grangerLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : grangerData ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{grangerData.interpretation}</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <GrangerCard label={`${grangerData.ticker_a} \u2192 ${grangerData.ticker_b}`} data={grangerData.a_causes_b} />
                  <GrangerCard label={`${grangerData.ticker_b} \u2192 ${grangerData.ticker_a}`} data={grangerData.b_causes_a} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Granger causality data not available.</p>
            )}
          </div>

          {/* Cointegration */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <h4 className="text-[11px] font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
              <Link2 className="h-3 w-3 text-purple-400" />
              Pairs Trading
            </h4>
            {cointegrationLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : cointegrationData ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    cointegrationData.cointegrated ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-muted-foreground',
                  )}>
                    {cointegrationData.cointegrated ? 'Cointegrated' : 'Not Cointegrated'}
                  </span>
                  <span className="text-xs text-muted-foreground">p = {cointegrationData.p_value.toFixed(4)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] text-muted-foreground">Hedge Ratio</p>
                    <p className="text-sm font-semibold text-white">{cointegrationData.hedge_ratio.toFixed(3)}</p>
                  </div>
                  <div className="p-2 rounded bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] text-muted-foreground">Half-Life</p>
                    <p className="text-sm font-semibold text-white">
                      {cointegrationData.half_life_days != null ? `${cointegrationData.half_life_days}d` : '\u2014'}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] text-muted-foreground">Spread Z</p>
                    <p className={cn(
                      'text-sm font-semibold',
                      Math.abs(cointegrationData.spread_z_score) > 2 ? 'text-yellow-400' :
                      Math.abs(cointegrationData.spread_z_score) > 1 ? 'text-blue-400' : 'text-white',
                    )}>
                      {cointegrationData.spread_z_score.toFixed(2)}&sigma;
                    </p>
                  </div>
                </div>
                {cointegrationData.cointegrated && cointegrationData.spread_points.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-muted-foreground mb-1">Spread (last 90d)</p>
                    <div className="h-16 flex items-end gap-px">
                      {cointegrationData.spread_points.map((pt, i) => {
                        const range = cointegrationData.spread_std * 3;
                        const mid = cointegrationData.spread_mean;
                        const pct = Math.max(0, Math.min(100, ((pt.value - mid + range) / (2 * range)) * 100));
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t"
                            style={{
                              height: `${pct}%`,
                              backgroundColor: Math.abs(pt.value - mid) > cointegrationData.spread_std * 2 ? '#FBBF24' : '#4ADE80',
                              minWidth: '1px',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Cointegration data not available.</p>
            )}
          </div>

          {/* Stress Analysis */}
          {conditionalLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading stress analysis...</span>
            </div>
          ) : conditionalData && !conditionalData.insufficient_data ? (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider">Stress Analysis</h4>
              <p className="text-xs text-white">
                When <span className="font-bold text-red-400">{conditionalData.ticker_a}</span> drops &ge;{Math.abs(conditionalData.threshold_pct)}%:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-muted-foreground">Avg move of {conditionalData.ticker_b}</div>
                  <div className={cn(
                    'text-sm font-bold font-mono',
                    conditionalData.avg_b_movement_pct >= 0 ? 'text-emerald-400' : 'text-red-400',
                  )}>
                    {conditionalData.avg_b_movement_pct >= 0 ? '+' : ''}{conditionalData.avg_b_movement_pct.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Same direction</div>
                  <div className="text-sm font-bold font-mono text-white">
                    {conditionalData.same_direction_pct.toFixed(0)}%
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Based on {conditionalData.occurrences} events over {conditionalData.window_days} days
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

function StatCell({ label, value, pValue, significant }: {
  label: string;
  value: number;
  pValue: number | null;
  significant: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        {significant ? (
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
        ) : (
          <AlertTriangle className="h-3 w-3 text-yellow-400" />
        )}
      </div>
      <div className="text-sm font-bold font-mono" style={{ color: corrColor(value) }}>
        {value >= 0 ? '+' : ''}{value.toFixed(3)}
      </div>
      <div className="text-[9px] text-muted-foreground">
        p={pValue != null ? (pValue < 0.001 ? '<0.001' : pValue.toFixed(3)) : '\u2014'}
      </div>
    </div>
  );
}

function GrangerCard({ label, data }: {
  label: string;
  data: IGrangerDirection | null | undefined;
}) {
  const hasError = data && 'error' in data && !!data.error;
  const significant = !hasError && data ? data.significant : false;
  const pValue = !hasError && data ? data.best_p_value : null;

  return (
    <div className="text-center p-2 rounded bg-white/[0.03] border border-white/5">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className={cn(
        'text-sm font-semibold',
        hasError ? 'text-amber-400' : significant ? 'text-green-400' : 'text-muted-foreground',
      )}>
        {hasError ? 'Insufficient Data' : significant ? 'Significant' : 'Not Significant'}
      </p>
      {pValue != null && (
        <p className="text-[10px] text-muted-foreground">p = {pValue.toFixed(4)}</p>
      )}
    </div>
  );
}
