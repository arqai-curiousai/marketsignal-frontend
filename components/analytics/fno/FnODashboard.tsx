'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Activity, Crosshair, Waves, RefreshCw, FileSpreadsheet, Info, Pause, Play } from 'lucide-react';
import { FnOSkeleton } from './FnOSkeleton';
import { DealerRegimeStrip } from './DealerRegimeStrip';
import { cn } from '@/lib/utils';
import { getFnOSnapshot, getFnOUnderlyings } from '@/src/lib/api/analyticsApi';
import { ExportButton } from '@/components/ui/ExportButton';
import { downloadCSV } from '@/src/lib/utils/export';
import type { IFnOSnapshot, IFnOUnderlying } from '@/types/analytics';
import { FOCUS_RING, TAB_ACTIVE, TAB_INACTIVE, T, S } from './tokens';
import { UnderlyingSelector } from './UnderlyingSelector';
import { MarketPulseCard } from './MarketPulseCard';
import { OptionChainVisualizer } from './OptionChainVisualizer';
import { OISupportResistance } from './OISupportResistance';
import { MaxPainChart } from './MaxPainChart';
import { GreeksView } from './GreeksView';
import { TrendsView } from './TrendsView';
import { VolatilityCone } from './VolatilityCone';
import { VIXRegimeCard } from './VIXRegimeCard';
import { RVConeChart } from './RVConeChart';

// ─── TimeSince — isolated to prevent parent re-renders ─────────────────

function TimeSince({ timestamp }: { timestamp: string | null }) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!timestamp) return;
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
      setSecondsAgo(Math.max(0, diff));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [timestamp]);

  if (!timestamp) return null;

  if (secondsAgo < 60) return <span>{secondsAgo}s ago</span>;
  const m = Math.floor(secondsAgo / 60);
  const s = secondsAgo % 60;
  return <span>{m}m {s}s ago</span>;
}

// ─── Tab configuration ──────────────────────────────────────────────────

type FnOTab = 'flow' | 'exposure' | 'volatility';

const FNO_TABS: { id: FnOTab; label: string; icon: typeof Activity }[] = [
  { id: 'flow', label: 'Flow', icon: Activity },
  { id: 'exposure', label: 'Exposure', icon: Crosshair },
  { id: 'volatility', label: 'Volatility', icon: Waves },
];

const REFRESH_INTERVAL_MS = 60_000; // Poll every 60 seconds

// ─── Dashboard ──────────────────────────────────────────────────────────

export function FnODashboard() {
  const [underlyings, setUnderlyings] = useState<IFnOUnderlying[]>([]);
  const [selectedUnderlying, setSelectedUnderlying] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<IFnOSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FnOTab>('flow');
  const [autoRefreshPaused, setAutoRefreshPaused] = useState(false);

  // Fetch underlyings list on mount
  useEffect(() => {
    async function fetchUnderlyings() {
      try {
        const result = await getFnOUnderlyings();
        if (result.success && result.data) {
          setUnderlyings(result.data.items ?? []);
        }
      } catch {
        // Silently fail — underlyings list is optional, user can still select manually
      }
    }
    fetchUnderlyings();
  }, []);

  // Track last computed_at to skip redundant re-renders
  const lastComputedAtRef = useRef<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch snapshot when underlying or expiry changes
  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFnOSnapshot(selectedUnderlying, selectedExpiry ?? undefined);
      if (result.success && result.data) {
        // Skip state update if data hasn't changed (same compute cycle)
        if (lastComputedAtRef.current === result.data.computed_at) {
          setLoading(false);
          return;
        }
        lastComputedAtRef.current = result.data.computed_at;
        setLastUpdated(result.data.computed_at);
        setSnapshot(result.data);
        // Auto-set expiry if not set
        if (!selectedExpiry && (result.data.available_expiries ?? []).length > 0) {
          setSelectedExpiry(result.data.expiry);
        }
      } else {
        setError(!result.success ? result.error.message : 'Failed to load F&O data');
        setSnapshot(null);
      }
    } catch {
      setError('Failed to fetch F&O data. Please try again.');
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [selectedUnderlying, selectedExpiry]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  // Auto-refresh polling every 60 seconds (respects pause)
  useEffect(() => {
    if (autoRefreshPaused) return;
    const interval = setInterval(fetchSnapshot, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchSnapshot, autoRefreshPaused]);


  const handleUnderlyingChange = (symbol: string) => {
    setSelectedUnderlying(symbol);
    setSelectedExpiry(null);
    setSnapshot(null);
  };

  const handleExpiryChange = (expiry: string) => {
    setSelectedExpiry(expiry);
  };


  // Loading state — skeleton preview instead of spinner
  if (loading && !snapshot) {
    return <FnOSkeleton />;
  }

  // Error state
  if (error && !snapshot) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className={T.heading}>{error}</p>
        <p className={cn(T.caption, 'mt-2')}>F&O data requires Kite Connect. Ensure Kite is authenticated.</p>
        <button
          onClick={fetchSnapshot}
          className="mt-4 px-4 py-2 text-xs font-medium rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!snapshot) return null;

  // Find ATM strike for GreeksView (guard empty chain)
  const atmStrike = snapshot.chain.length > 0
    ? snapshot.chain.reduce(
        (closest, s) => Math.abs(s.strike - snapshot.underlying_price) < Math.abs(closest.strike - snapshot.underlying_price) ? s : closest,
        snapshot.chain[0],
      ).strike
    : Math.round(snapshot.underlying_price);

  return (
    <div className="space-y-4">
      {/* Underlying Selector + Refresh Bar */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <div className="flex-1 min-w-0">
          <UnderlyingSelector
            underlyings={underlyings}
            selected={selectedUnderlying}
            selectedExpiry={selectedExpiry}
            availableExpiries={snapshot.available_expiries ?? []}
            onSelectUnderlying={handleUnderlyingChange}
            onSelectExpiry={handleExpiryChange}
          />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
          <ExportButton
            options={(() => {
              const opts = [];
              if (activeTab === 'flow') {
                opts.push({
                  label: 'CSV Option Chain',
                  icon: <FileSpreadsheet className="h-3 w-3" />,
                  onClick: () => {
                    if (!snapshot?.chain) return;
                    const rows = snapshot.chain.map((s) => ({
                      strike: s.strike,
                      ce_ltp: s.ce_ltp,
                      ce_oi: s.ce_oi,
                      ce_volume: s.ce_volume,
                      ce_iv: s.ce_iv,
                      ce_delta: s.ce_delta,
                      pe_ltp: s.pe_ltp,
                      pe_oi: s.pe_oi,
                      pe_volume: s.pe_volume,
                      pe_iv: s.pe_iv,
                      pe_delta: s.pe_delta,
                    }));
                    downloadCSV(rows, `${snapshot.underlying}-chain-${snapshot.expiry}`);
                  },
                });
              }
              if (activeTab === 'exposure') {
                opts.push({
                  label: 'CSV Greeks',
                  icon: <FileSpreadsheet className="h-3 w-3" />,
                  onClick: () => {
                    if (!snapshot?.chain) return;
                    const rows = snapshot.chain.map((s) => ({
                      strike: s.strike,
                      ce_iv: s.ce_iv,
                      ce_delta: s.ce_delta,
                      ce_gamma: s.ce_gamma,
                      ce_theta: s.ce_theta,
                      ce_vega: s.ce_vega,
                      ce_vanna: s.ce_vanna,
                      ce_charm: s.ce_charm,
                      pe_iv: s.pe_iv,
                      pe_delta: s.pe_delta,
                      pe_gamma: s.pe_gamma,
                      pe_theta: s.pe_theta,
                      pe_vega: s.pe_vega,
                      pe_vanna: s.pe_vanna,
                      pe_charm: s.pe_charm,
                    }));
                    downloadCSV(rows, `${snapshot.underlying}-greeks-${snapshot.expiry}`);
                  },
                });
              }
              if (activeTab === 'volatility') {
                opts.push({
                  label: 'CSV Snapshot Summary',
                  icon: <FileSpreadsheet className="h-3 w-3" />,
                  onClick: () => {
                    const row = {
                      underlying: snapshot.underlying,
                      price: snapshot.underlying_price,
                      futures_price: snapshot.futures_price,
                      pcr_oi: snapshot.pcr_oi,
                      atm_iv: snapshot.atm_iv,
                      iv_rank: snapshot.iv_rank,
                      iv_percentile: snapshot.iv_percentile,
                      max_pain: snapshot.max_pain_strike,
                      futures_basis: snapshot.futures_basis,
                      india_vix: snapshot.india_vix,
                      sentiment: snapshot.sentiment,
                      computed_at: snapshot.computed_at,
                    };
                    downloadCSV([row], `${snapshot.underlying}-vol-summary`);
                  },
                });
              }
              return opts;
            })()}
          />
          <TimeSince timestamp={lastUpdated} />
          <button
            onClick={() => setAutoRefreshPaused(!autoRefreshPaused)}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
            title={autoRefreshPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
            aria-label={autoRefreshPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
          >
            {autoRefreshPaused
              ? <Play className="h-3 w-3 text-amber-400/70" />
              : <Pause className="h-3 w-3" />}
          </button>
          <button
            onClick={fetchSnapshot}
            disabled={loading}
            className="p-1 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Market Pulse + Dealer Regime */}
      <MarketPulseCard snapshot={snapshot} />
      <DealerRegimeStrip
        dealerRegime={snapshot.dealer_regime}
        zeroGammaLevel={snapshot.zero_gamma_level}
        callWallStrike={snapshot.call_wall_strike}
        putWallStrike={snapshot.put_wall_strike}
        gexPredictedRangeLow={snapshot.gex_predicted_range_low}
        gexPredictedRangeHigh={snapshot.gex_predicted_range_high}
        underlyingPrice={snapshot.underlying_price}
        netGex={snapshot.net_gex}
      />

      {/* Tab navigation */}
      <div
        className="relative flex items-center gap-1 px-1 overflow-x-auto scrollbar-none"
        role="tablist"
        aria-label="F&O Dashboard views"
      >
        {FNO_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              aria-controls={`fno-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all',
                FOCUS_RING,
                active ? TAB_ACTIVE : TAB_INACTIVE,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
        {/* Scroll fade hint for mobile */}
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
      </div>

      {/* ── Flow tab: Option Chain + Levels ── */}
      {activeTab === 'flow' && (
        <div id="fno-panel-flow" role="tabpanel" className="space-y-4">
          <OptionChainVisualizer
            chain={snapshot.chain}
            underlyingPrice={snapshot.underlying_price}
            expiry={snapshot.expiry}
            lotSize={snapshot.lot_size}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OISupportResistance
              chain={snapshot.chain}
              underlyingPrice={snapshot.underlying_price}
              maxCeOiStrike={snapshot.max_ce_oi_strike}
              maxPeOiStrike={snapshot.max_pe_oi_strike}
            />
            <MaxPainChart
              chain={snapshot.chain}
              underlyingPrice={snapshot.underlying_price}
              maxPainStrike={snapshot.max_pain_strike}
              lotSize={snapshot.lot_size}
            />
          </div>
        </div>
      )}

      {/* ── Exposure tab: GEX, Greeks, IV ── */}
      {activeTab === 'exposure' && (
        <div id="fno-panel-exposure" role="tabpanel" className={cn(S.card, 'p-4')}>
          <GreeksView
            chain={snapshot.chain}
            underlyingPrice={snapshot.underlying_price}
            atmStrike={atmStrike}
            lotSize={snapshot.lot_size}
            zeroGammaLevel={snapshot.zero_gamma_level}
            callWallStrike={snapshot.call_wall_strike}
            putWallStrike={snapshot.put_wall_strike}
            dealerRegime={snapshot.dealer_regime}
            gexPredictedRangeLow={snapshot.gex_predicted_range_low}
            gexPredictedRangeHigh={snapshot.gex_predicted_range_high}
            netGex={snapshot.net_gex}
          />
        </div>
      )}

      {/* ── Volatility tab: VIX + Trends + Vol Cone ── */}
      {activeTab === 'volatility' && (
        <div id="fno-panel-volatility" role="tabpanel" className="space-y-4">
          <div className="flex items-center gap-1.5 px-1 text-[10px] text-white/35">
            <Info className="h-3 w-3 shrink-0" />
            <span>Volatility metrics are underlying-level aggregates, not expiry-specific.</span>
          </div>
          <VIXRegimeCard
            vix={snapshot.india_vix ?? null}
            vixChange={snapshot.india_vix_change ?? null}
          />
          <RVConeChart
            underlying={selectedUnderlying}
            atmIv={snapshot.atm_iv}
          />
          <TrendsView underlying={selectedUnderlying} />
          <VolatilityCone underlying={selectedUnderlying} />
        </div>
      )}

      {/* Loading overlay for refresh */}
      {loading && snapshot && (
        <div className="fixed top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-slate/90 border border-white/10 text-xs text-muted-foreground z-50">
          <Loader2 className="h-3 w-3 animate-spin" />
          Refreshing...
        </div>
      )}
    </div>
  );
}
