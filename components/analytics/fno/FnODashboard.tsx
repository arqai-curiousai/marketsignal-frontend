'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, BarChart3, Link2, Shield, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFnOSnapshot, getFnOUnderlyings } from '@/src/lib/api/analyticsApi';
import type { IFnOSnapshot, IFnOUnderlying } from '@/types/analytics';
import { UnderlyingSelector } from './UnderlyingSelector';
import { MarketPulseCard } from './MarketPulseCard';
import { OptionChainVisualizer } from './OptionChainVisualizer';
import { OISupportResistance } from './OISupportResistance';
import { MaxPainChart } from './MaxPainChart';
import { GreeksView } from './GreeksView';

// ─── Tab configuration ──────────────────────────────────────────────────

type FnOTab = 'chain' | 'gex' | 'levels';

const FNO_TABS: { id: FnOTab; label: string; icon: typeof BarChart3 }[] = [
  { id: 'chain', label: 'Chain', icon: BarChart3 },
  { id: 'gex', label: 'GEX & Greeks', icon: Link2 },
  { id: 'levels', label: 'Levels', icon: Target },
];

// ─── Dashboard ──────────────────────────────────────────────────────────

export function FnODashboard() {
  const [underlyings, setUnderlyings] = useState<IFnOUnderlying[]>([]);
  const [selectedUnderlying, setSelectedUnderlying] = useState('NIFTY');
  const [selectedExpiry, setSelectedExpiry] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<IFnOSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FnOTab>('chain');

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

  // Fetch snapshot when underlying or expiry changes
  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getFnOSnapshot(selectedUnderlying, selectedExpiry ?? undefined);
    if (result.success && result.data) {
      setSnapshot(result.data);
      // Auto-set expiry if not set
      if (!selectedExpiry && result.data.available_expiries?.length > 0) {
        setSelectedExpiry(result.data.expiry);
      }
    } else {
      setError(!result.success ? result.error.message : 'Failed to load F&O data');
      setSnapshot(null);
    }
    setLoading(false);
  }, [selectedUnderlying, selectedExpiry]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  const handleUnderlyingChange = (symbol: string) => {
    setSelectedUnderlying(symbol);
    setSelectedExpiry(null);
    setSnapshot(null);
  };

  const handleExpiryChange = (expiry: string) => {
    setSelectedExpiry(expiry);
  };

  // Loading state
  if (loading && !snapshot) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  // Error state
  if (error && !snapshot) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">{error}</p>
        <p className="text-xs mt-2">F&O data requires Kite Connect. Ensure Kite is authenticated.</p>
      </div>
    );
  }

  if (!snapshot) return null;

  // Find ATM strike for GreeksView
  const atmStrike = snapshot.chain.length > 0
    ? snapshot.chain.reduce(
        (closest, s) => Math.abs(s.strike - snapshot.underlying_price) < Math.abs(closest.strike - snapshot.underlying_price) ? s : closest,
        snapshot.chain[0],
      ).strike
    : snapshot.underlying_price;

  return (
    <div className="space-y-4">
      {/* Underlying Selector */}
      <UnderlyingSelector
        underlyings={underlyings}
        selected={selectedUnderlying}
        selectedExpiry={selectedExpiry}
        availableExpiries={snapshot.available_expiries}
        onSelectUnderlying={handleUnderlyingChange}
        onSelectExpiry={handleExpiryChange}
      />

      {/* Market Pulse */}
      <MarketPulseCard snapshot={snapshot} />

      {/* Tab navigation */}
      <div className="flex items-center gap-1 px-1">
        {FNO_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all',
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'chain' && (
        <OptionChainVisualizer
          chain={snapshot.chain}
          underlyingPrice={snapshot.underlying_price}
          expiry={snapshot.expiry}
          lotSize={snapshot.lot_size}
          zeroGammaLevel={snapshot.zero_gamma_level}
          callWallStrike={snapshot.call_wall_strike}
          putWallStrike={snapshot.put_wall_strike}
          dealerRegime={snapshot.dealer_regime}
          gexPredictedRangeLow={snapshot.gex_predicted_range_low}
          gexPredictedRangeHigh={snapshot.gex_predicted_range_high}
          netGex={snapshot.net_gex}
        />
      )}

      {activeTab === 'gex' && (
        <div className="rounded-xl border border-white/[0.06] bg-brand-slate/40 p-4">
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

      {activeTab === 'levels' && (
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
