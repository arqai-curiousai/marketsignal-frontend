'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp, TrendingDown, Globe, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getConditionalCorrelation,
  getEnhancedCorrelation,
  getPartialCorrelation,
} from '@/src/lib/api/analyticsApi';
import type {
  IConditionalCorrelation,
  IEnhancedCorrelation,
  IPartialCorrelation,
  ICorrelationMatrix,
  IGlobalEffects,
} from '@/types/analytics';
import { ASSET_MAP, TYPE_COLORS, corrColor, corrStrength } from './constants';
import { RollingCorrelationChart } from './RollingCorrelationChart';
import { ScatterPlotChart } from './ScatterPlotChart';
import { LeadLagChart } from './LeadLagChart';

interface PairDetailPanelProps {
  selectedPair: [string, string] | null;
  pairCorrelation: number | null;
  window: string;
  method: string;
  equityMatrix: ICorrelationMatrix | null;
  globalData: IGlobalEffects | null;
  onAddAsset: (ticker: string) => void;
  onPairSelect: (pair: [string, string] | null) => void;
}

export function PairDetailPanel({
  selectedPair,
  pairCorrelation,
  window: windowValue,
  method,
  equityMatrix,
  globalData,
  onAddAsset,
  onPairSelect,
}: PairDetailPanelProps) {
  const [conditionalData, setConditionalData] = useState<IConditionalCorrelation | null>(null);
  const [conditionalLoading, setConditionalLoading] = useState(false);
  const [enhancedData, setEnhancedData] = useState<IEnhancedCorrelation | null>(null);
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [partialData, setPartialData] = useState<IPartialCorrelation | null>(null);
  const [partialLoading, setPartialLoading] = useState(false);

  // Fetch enhanced + conditional + partial correlation when pair selected
  useEffect(() => {
    if (!selectedPair || !selectedPair[1]) {
      setConditionalData(null);
      setEnhancedData(null);
      setPartialData(null);
      return;
    }
    const [a, b] = selectedPair;
    const assetA = ASSET_MAP.get(a);
    const assetB = ASSET_MAP.get(b);
    const bothStocks = assetA?.type === 'stock' && assetB?.type === 'stock';

    // Enhanced correlation (both Pearson + Spearman)
    setEnhancedLoading(true);
    const exA = assetA?.type === 'currency' ? 'FX' : assetA?.type === 'commodity' ? 'CMDTY' : 'NSE';
    const exB = assetB?.type === 'currency' ? 'FX' : assetB?.type === 'commodity' ? 'CMDTY' : 'NSE';

    getEnhancedCorrelation(a, b, exA, exB).then((result) => {
      if (result.success && result.data && !('error' in result.data)) {
        setEnhancedData(result.data);
      }
      setEnhancedLoading(false);
    });

    // Conditional + partial (stock-stock only)
    if (bothStocks) {
      setConditionalLoading(true);
      getConditionalCorrelation(a, b, -2.0).then((result) => {
        if (result.success && result.data) {
          setConditionalData(result.data);
        }
        setConditionalLoading(false);
      });

      setPartialLoading(true);
      getPartialCorrelation(a, b, exA, exB).then((result) => {
        if (result.success && result.data && !('error' in result.data)) {
          setPartialData(result.data);
        }
        setPartialLoading(false);
      });
    } else {
      setConditionalData(null);
      setPartialData(null);
    }
  }, [selectedPair]);

  return (
    <div className="space-y-4">
      {/* Pair Detail */}
      <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
        {selectedPair && selectedPair[1] ? (
          <PairDetail
            pair={selectedPair}
            pairCorrelation={pairCorrelation}
            windowValue={windowValue}
            method={method}
            enhancedData={enhancedData}
            enhancedLoading={enhancedLoading}
            conditionalData={conditionalData}
            conditionalLoading={conditionalLoading}
            partialData={partialData}
            partialLoading={partialLoading}
          />
        ) : selectedPair && !selectedPair[1] ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              <span className="text-white font-medium">{selectedPair[0]}</span> selected.
              Click another asset to compare.
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Click two nodes or an edge to see correlation details.
            </p>
          </div>
        )}
      </div>

      {/* Top Correlations Summary */}
      {equityMatrix && (
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Strongest Pairs ({windowValue === '365d' ? '1Y' : windowValue})
          </h4>
          <div className="space-y-1.5">
            {equityMatrix.top_positive_pairs?.slice(0, 4).map((p) => (
              <button
                key={p.pair.join('-')}
                onClick={() => {
                  onAddAsset(p.pair[0]);
                  onAddAsset(p.pair[1]);
                  onPairSelect([p.pair[0], p.pair[1]]);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
                <span className="text-xs text-white flex-1 truncate">{p.pair[0]} — {p.pair[1]}</span>
                <span className="text-xs font-mono font-bold text-emerald-400">+{p.correlation.toFixed(2)}</span>
              </button>
            ))}
            {equityMatrix.top_negative_pairs?.slice(0, 3).map((p) => (
              <button
                key={p.pair.join('-')}
                onClick={() => {
                  onAddAsset(p.pair[0]);
                  onAddAsset(p.pair[1]);
                  onPairSelect([p.pair[0], p.pair[1]]);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
              >
                <TrendingDown className="h-3 w-3 text-red-400 shrink-0" />
                <span className="text-xs text-white flex-1 truncate">{p.pair[0]} — {p.pair[1]}</span>
                <span className="text-xs font-mono font-bold text-red-400">{p.correlation.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Market Context */}
      {globalData && (
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Global Markets
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {globalData.indices
              .filter((idx) => idx.value !== null)
              .slice(0, 6)
              .map((idx) => (
                <div key={idx.index_name} className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] text-muted-foreground truncate">{idx.display_name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {(idx.change_pct ?? 0) >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    )}
                    <span
                      className={cn(
                        'text-xs font-bold font-mono',
                        (idx.change_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
                      )}
                    >
                      {(idx.change_pct ?? 0) >= 0 ? '+' : ''}
                      {(idx.change_pct ?? 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
          {globalData.pre_market_signal && (
            <div
              className={cn(
                'mt-3 p-2 rounded-lg text-xs',
                globalData.pre_market_signal.direction === 'bullish' && 'bg-emerald-500/10 text-emerald-400',
                globalData.pre_market_signal.direction === 'bearish' && 'bg-red-500/10 text-red-400',
                globalData.pre_market_signal.direction === 'neutral' && 'bg-white/5 text-muted-foreground',
              )}
            >
              Pre-market:{' '}
              <span className="font-bold capitalize">{globalData.pre_market_signal.direction}</span>
              {' '}({globalData.pre_market_signal.estimated_gap_pct >= 0 ? '+' : ''}
              {globalData.pre_market_signal.estimated_gap_pct.toFixed(2)}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Pair Detail subcomponent
// ═══════════════════════════════════════════════════════════════

function PairDetail({
  pair,
  pairCorrelation,
  windowValue,
  method,
  enhancedData,
  enhancedLoading,
  conditionalData,
  conditionalLoading,
  partialData,
  partialLoading,
}: {
  pair: [string, string];
  pairCorrelation: number | null;
  windowValue: string;
  method: string;
  enhancedData: IEnhancedCorrelation | null;
  enhancedLoading: boolean;
  conditionalData: IConditionalCorrelation | null;
  conditionalLoading: boolean;
  partialData: IPartialCorrelation | null;
  partialLoading: boolean;
}) {
  const assetA = ASSET_MAP.get(pair[0]);
  const assetB = ASSET_MAP.get(pair[1]);

  return (
    <div className="space-y-4">
      {/* Pair header */}
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

      {/* Correlation value */}
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

          {/* Visual bar */}
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

          {/* Interpretation */}
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

      {/* Enhanced: Pearson vs Spearman */}
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
          <div className="grid grid-cols-2 gap-3">
            {/* Pearson */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground">Pearson</span>
                {enhancedData.pearson.significant ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                )}
              </div>
              <div className="text-sm font-bold font-mono" style={{ color: corrColor(enhancedData.pearson.r) }}>
                {enhancedData.pearson.r >= 0 ? '+' : ''}{enhancedData.pearson.r.toFixed(3)}
              </div>
              <div className="text-[9px] text-muted-foreground">
                p={enhancedData.pearson.p_value < 0.001 ? '<0.001' : enhancedData.pearson.p_value.toFixed(3)}
              </div>
            </div>

            {/* Spearman */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-muted-foreground">Spearman</span>
                {enhancedData.spearman.significant ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                )}
              </div>
              <div className="text-sm font-bold font-mono" style={{ color: corrColor(enhancedData.spearman.rho) }}>
                {enhancedData.spearman.rho >= 0 ? '+' : ''}{enhancedData.spearman.rho.toFixed(3)}
              </div>
              <div className="text-[9px] text-muted-foreground">
                p={enhancedData.spearman.p_value < 0.001 ? '<0.001' : enhancedData.spearman.p_value.toFixed(3)}
              </div>
            </div>
          </div>

          {/* Divergence warning */}
          {enhancedData.divergence_flag && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[10px] text-amber-300">
                Methods diverge by {enhancedData.method_divergence.toFixed(3)} — potential outliers or non-linear relationship
              </span>
            </div>
          )}

          {/* Stability badge */}
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
                σ={enhancedData.stability.std?.toFixed(3)}
              </span>
            </div>
          )}

          <div className="text-[10px] text-muted-foreground">
            Based on {enhancedData.n_observations} observations ({enhancedData.window_days}d)
          </div>
        </div>
      ) : null}

      {/* Partial Correlation (market-adjusted) */}
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
            <span className="text-muted-foreground text-lg">→</span>
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

      {/* Rolling Correlation Chart */}
      {pair[0] && pair[1] && (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <RollingCorrelationChart
            tickerA={pair[0]}
            tickerB={pair[1]}
            exchangeA={assetA?.type === 'currency' ? 'FX' : assetA?.type === 'commodity' ? 'CMDTY' : 'NSE'}
            exchangeB={assetB?.type === 'currency' ? 'FX' : assetB?.type === 'commodity' ? 'CMDTY' : 'NSE'}
            height={200}
          />
        </div>
      )}

      {/* Scatter Plot */}
      {pair[0] && pair[1] && (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <ScatterPlotChart
            tickerA={pair[0]}
            tickerB={pair[1]}
            exchangeA={assetA?.type === 'currency' ? 'FX' : assetA?.type === 'commodity' ? 'CMDTY' : 'NSE'}
            exchangeB={assetB?.type === 'currency' ? 'FX' : assetB?.type === 'commodity' ? 'CMDTY' : 'NSE'}
            height={250}
          />
        </div>
      )}

      {/* Lead-Lag Analysis */}
      {pair[0] && pair[1] && (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <LeadLagChart
            tickerA={pair[0]}
            tickerB={pair[1]}
            exchangeA={assetA?.type === 'currency' ? 'FX' : assetA?.type === 'commodity' ? 'CMDTY' : 'NSE'}
            exchangeB={assetB?.type === 'currency' ? 'FX' : assetB?.type === 'commodity' ? 'CMDTY' : 'NSE'}
            height={180}
          />
        </div>
      )}

      {/* Stress Analysis (conditional correlation) */}
      {conditionalLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading stress analysis...</span>
        </div>
      ) : conditionalData && !conditionalData.insufficient_data ? (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
          <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider">Stress Analysis</h4>
          <p className="text-xs text-white">
            When <span className="font-bold text-red-400">{conditionalData.ticker_a}</span> drops ≥{Math.abs(conditionalData.threshold_pct)}%:
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

      {/* Window info */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span>Window: <span className="text-white font-medium">{windowValue === '365d' ? '1 Year' : windowValue}</span></span>
        <span>Method: <span className="text-white font-medium capitalize">{method}</span></span>
      </div>
    </div>
  );
}
