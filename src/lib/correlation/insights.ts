/**
 * Correlation Insights Engine — derives actionable trading intelligence
 * from already-fetched correlation data. No new API calls needed.
 */

import type {
  ICorrelationMatrix,
  IEnhancedMatrix,
  ICrossAssetCorrelation,
  IGlobalEffects,
  ICorrelationMover,
} from '@/types/analytics';

// ─── Insight Types ───────────────────────────────────────────

export type InsightType = 'hedge' | 'regime' | 'concentration' | 'pairs_trade' | 'cross_asset' | 'divergence';

export type InsightSeverity = 'info' | 'warning' | 'opportunity';

export interface CorrelationInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  /** Pair to highlight when clicking the insight */
  pair?: [string, string];
  /** Asset to suggest adding */
  suggestedAsset?: string;
  /** Correlation value relevant to the insight */
  value?: number;
}

// ─── Derivation Functions ────────────────────────────────────

/**
 * Derive hedging opportunities: pairs with r < -0.5 within the selected assets.
 */
export function deriveHedges(
  matrix: ICorrelationMatrix | IEnhancedMatrix | null,
  selectedAssets: string[]
): CorrelationInsight[] {
  if (!matrix?.matrix_data || selectedAssets.length < 2) return [];

  const insights: CorrelationInsight[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < selectedAssets.length; i++) {
    for (let j = i + 1; j < selectedAssets.length; j++) {
      const a = selectedAssets[i];
      const b = selectedAssets[j];
      const key = `${a}:${b}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const corr = matrix.matrix_data[`${a}:${b}`] ?? matrix.matrix_data[`${b}:${a}`] ?? null;
      if (corr !== null && corr < -0.5) {
        const absCorr = Math.abs(corr);
        insights.push({
          id: `hedge-${a}-${b}`,
          type: 'hedge',
          severity: 'opportunity',
          title: `${a} & ${b} are natural hedges`,
          description: `These assets move in opposite directions (r=${corr.toFixed(2)}). A long+short position neutralizes ${Math.round(absCorr * 100)}% of directional risk.`,
          pair: [a, b],
          value: corr,
        });
      }
    }
  }

  return insights.sort((a, b) => (a.value ?? 0) - (b.value ?? 0)).slice(0, 3);
}

/**
 * Derive regime insight from average pairwise correlation.
 */
export function deriveRegimeInsight(
  matrix: ICorrelationMatrix | null
): CorrelationInsight | null {
  if (!matrix?.matrix_data) return null;

  const values: number[] = [];
  for (const [key, val] of Object.entries(matrix.matrix_data)) {
    const parts = key.split(':');
    if (parts.length === 2 && parts[0] !== parts[1]) {
      values.push(val);
    }
  }
  if (values.length === 0) return null;

  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  if (avg > 0.6) {
    return {
      id: 'regime-risk-on',
      type: 'regime',
      severity: 'warning',
      title: 'Risk-On regime detected',
      description: `Average correlation is ${avg.toFixed(2)} — stocks are moving in lockstep. Diversification benefit is low. Consider hedging with commodities or currencies.`,
      value: avg,
    };
  }
  if (avg < 0.25) {
    return {
      id: 'regime-picking',
      type: 'regime',
      severity: 'opportunity',
      title: 'Stock-picking opportunity',
      description: `Average correlation is just ${avg.toFixed(2)} — individual stock selection matters more than macro right now. Good time for active management.`,
      value: avg,
    };
  }
  return null;
}

/**
 * Derive concentration warning when selected assets are too correlated.
 */
export function deriveConcentrationWarning(
  matrix: ICorrelationMatrix | IEnhancedMatrix | null,
  selectedAssets: string[]
): CorrelationInsight | null {
  if (!matrix?.matrix_data || selectedAssets.length < 4) return null;

  let sum = 0;
  let count = 0;
  for (let i = 0; i < selectedAssets.length; i++) {
    for (let j = i + 1; j < selectedAssets.length; j++) {
      const a = selectedAssets[i];
      const b = selectedAssets[j];
      const corr = matrix.matrix_data[`${a}:${b}`] ?? matrix.matrix_data[`${b}:${a}`] ?? null;
      if (corr !== null) {
        sum += corr;
        count++;
      }
    }
  }
  if (count === 0) return null;

  const avgCorr = sum / count;
  if (avgCorr <= 0.65) return null;

  // Find best diversifier from the full matrix
  let bestDiversifier: string | null = null;
  let bestAvgCorr = Infinity;

  const allTickers = matrix.tickers || [];
  const selectedSet = new Set(selectedAssets);

  for (const candidate of allTickers) {
    if (selectedSet.has(candidate)) continue;
    let candSum = 0;
    let candCount = 0;
    for (const asset of selectedAssets) {
      const corr = matrix.matrix_data[`${candidate}:${asset}`] ?? matrix.matrix_data[`${asset}:${candidate}`] ?? null;
      if (corr !== null) {
        candSum += corr;
        candCount++;
      }
    }
    if (candCount > 0) {
      const candAvg = candSum / candCount;
      if (candAvg < bestAvgCorr) {
        bestAvgCorr = candAvg;
        bestDiversifier = candidate;
      }
    }
  }

  const suggestion = bestDiversifier
    ? ` Consider adding ${bestDiversifier} (avg correlation with your basket: ${bestAvgCorr >= 0 ? '+' : ''}${bestAvgCorr.toFixed(2)}).`
    : '';

  return {
    id: 'concentration-warning',
    type: 'concentration',
    severity: 'warning',
    title: `High portfolio concentration`,
    description: `Your ${selectedAssets.length} selected stocks have avg correlation of ${avgCorr.toFixed(2)}. A market-wide move would hit all of them.${suggestion}`,
    suggestedAsset: bestDiversifier ?? undefined,
    value: avgCorr,
  };
}

/**
 * Derive pairs trade candidates from correlation movers (big recent changes).
 */
export function derivePairsTradeInsights(
  movers: ICorrelationMover[]
): CorrelationInsight[] {
  return movers
    .filter((m) => Math.abs(m.change) >= 0.2)
    .slice(0, 2)
    .map((m) => ({
      id: `pairs-${m.pair[0]}-${m.pair[1]}`,
      type: 'pairs_trade' as InsightType,
      severity: 'opportunity' as InsightSeverity,
      title: `${m.pair[0]}–${m.pair[1]} correlation shifted ${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}`,
      description: `Was ${m.previous.toFixed(2)}, now ${m.current.toFixed(2)}. ${Math.abs(m.change) > 0.3 ? 'Large structural change — investigate for regime shift or pair breakdown.' : 'Monitor for mean-reversion or new trend.'}`,
      pair: [m.pair[0], m.pair[1]] as [string, string],
      value: m.change,
    }));
}

/**
 * Derive cross-asset signal from global pre-market data and cross-asset correlations.
 */
export function deriveCrossAssetSignal(
  globalData: IGlobalEffects | null,
  crossAssetPairs: ICrossAssetCorrelation[]
): CorrelationInsight | null {
  if (!globalData?.pre_market_signal) return null;
  const signal = globalData.pre_market_signal;
  if (signal.direction === 'neutral') return null;

  // Find the most impactful cross-asset relationship
  const topPair = crossAssetPairs
    .filter((p) => Math.abs(p.correlation) >= 0.5)
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))[0];

  if (!topPair) return null;

  const direction = signal.direction === 'bullish' ? 'positive' : 'negative';
  return {
    id: 'cross-asset-signal',
    type: 'cross_asset',
    severity: 'info',
    title: `Global markets signal ${signal.direction}`,
    description: `Pre-market gap: ${signal.estimated_gap_pct >= 0 ? '+' : ''}${signal.estimated_gap_pct.toFixed(2)}%. ${topPair.source_ticker} has ${direction} impact on ${topPair.target_ticker} (r=${topPair.correlation >= 0 ? '+' : ''}${topPair.correlation.toFixed(2)}).`,
    pair: [topPair.source_ticker, topPair.target_ticker],
    value: signal.estimated_gap_pct,
  };
}

/**
 * Aggregate all insights from available data.
 */
export function deriveAllInsights(params: {
  equityMatrix: ICorrelationMatrix | null;
  enhancedMatrix: IEnhancedMatrix | null;
  selectedAssets: string[];
  correlationMovers: ICorrelationMover[];
  globalData: IGlobalEffects | null;
  crossAssetPairs: ICrossAssetCorrelation[];
}): CorrelationInsight[] {
  const { equityMatrix, enhancedMatrix, selectedAssets, correlationMovers, globalData, crossAssetPairs } = params;
  const matrix = enhancedMatrix ?? equityMatrix;

  const insights: CorrelationInsight[] = [];

  // Regime insight (highest priority)
  const regime = deriveRegimeInsight(equityMatrix);
  if (regime) insights.push(regime);

  // Concentration warning
  const concentration = deriveConcentrationWarning(matrix, selectedAssets);
  if (concentration) insights.push(concentration);

  // Hedging opportunities
  insights.push(...deriveHedges(matrix, selectedAssets));

  // Pairs trade candidates
  insights.push(...derivePairsTradeInsights(correlationMovers));

  // Cross-asset signal
  const crossAsset = deriveCrossAssetSignal(globalData, crossAssetPairs);
  if (crossAsset) insights.push(crossAsset);

  return insights;
}
