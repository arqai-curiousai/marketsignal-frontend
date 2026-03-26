/**
 * Strategy Pipeline API service for multi-layer AI signal engine.
 */

import apiClient from './apiClient';
import type { ApiResult } from './apiClient';
import type {
  IStrategySignal,
  IStrategyPerformance,
  IStrategyDashboard,
  IFeatureInspection,
  IFeatureDetail,
  ILayerResult,
  StrategySignal,
} from '@/types/strategy';

// =============================================================================
// Types for backend snake_case responses
// =============================================================================

interface RawLayerResult {
  layer_name: string;
  bias: string;
  confidence: number;
  features: Record<string, number>;
  metadata: Record<string, unknown>;
  computed_at: string;
  computation_ms: number;
}

interface RawStrategySignal {
  id: string;
  ticker: string;
  exchange: string;
  signal: string;
  confidence: number;
  position_size_pct: number;
  layer_outputs: Record<string, RawLayerResult>;
  top_features: Array<{ feature: string; impact: number }>;
  risk_metrics: Record<string, number>;
  reasoning: string;
  price_at_signal: number | null;
  generated_at: string;
  outcome_price: number | null;
  outcome_correct: boolean | null;
  pnl_percent: number | null;
  outcome_evaluated_at: string | null;
}

interface RawStrategyPerformance {
  period: string;
  total_signals: number;
  correct_predictions: number;
  accuracy: number;
  avg_confidence: number;
  win_rate: number;
  total_pnl_percent: number;
  sharpe_estimate: number;
  profit_factor: number;
  calibration_error: number;
  layer_accuracy: Record<string, number>;
  by_regime: Record<string, { accuracy: number; count: number }>;
  computed_at: string;
  avg_win_loss_ratio?: number;
  max_drawdown_pct?: number;
}

interface RawFeatureDetail {
  name: string;
  value: number;
  z_score: number | null;
  direction: 'bullish' | 'bearish' | 'neutral';
  importance: number;
  sparkline: number[];
}

interface RawFeatureInspection {
  ticker: string;
  layers: Record<string, RawFeatureDetail[]>;
  generated_at: string;
}

// =============================================================================
// Transform helpers
// =============================================================================

function transformLayerResult(raw: RawLayerResult): ILayerResult {
  return {
    layerName: raw.layer_name,
    bias: raw.bias as StrategySignal,
    confidence: raw.confidence,
    features: raw.features,
    metadata: raw.metadata,
    computedAt: raw.computed_at,
    computationMs: raw.computation_ms,
  };
}

function transformSignal(raw: RawStrategySignal): IStrategySignal {
  const layerOutputs: Record<string, ILayerResult> = {};
  for (const [key, val] of Object.entries(raw.layer_outputs)) {
    layerOutputs[key] = transformLayerResult(val);
  }

  return {
    id: raw.id,
    ticker: raw.ticker,
    exchange: raw.exchange,
    signal: raw.signal as StrategySignal,
    confidence: raw.confidence,
    positionSizePct: raw.position_size_pct,
    layerOutputs,
    topFeatures: raw.top_features,
    riskMetrics: raw.risk_metrics,
    reasoning: raw.reasoning,
    priceAtSignal: raw.price_at_signal,
    generatedAt: raw.generated_at,
    outcomePrice: raw.outcome_price,
    outcomeCorrect: raw.outcome_correct,
    pnlPercent: raw.pnl_percent,
    outcomeEvaluatedAt: raw.outcome_evaluated_at,
  };
}

function transformPerformance(raw: RawStrategyPerformance): IStrategyPerformance {
  return {
    period: raw.period,
    totalSignals: raw.total_signals,
    correctPredictions: raw.correct_predictions,
    accuracy: raw.accuracy,
    avgConfidence: raw.avg_confidence,
    winRate: raw.win_rate,
    totalPnlPercent: raw.total_pnl_percent,
    sharpeEstimate: raw.sharpe_estimate,
    profitFactor: raw.profit_factor,
    calibrationError: raw.calibration_error,
    layerAccuracy: raw.layer_accuracy,
    byRegime: raw.by_regime,
    computedAt: raw.computed_at,
    avgWinLossRatio: raw.avg_win_loss_ratio ?? 0,
    maxDrawdownPct: raw.max_drawdown_pct ?? 0,
  };
}

function transformFeatureDetail(raw: RawFeatureDetail): IFeatureDetail {
  return {
    name: raw.name,
    value: raw.value,
    zScore: raw.z_score,
    direction: raw.direction,
    importance: raw.importance,
    sparkline: raw.sparkline,
  };
}

function transformFeatureInspection(raw: RawFeatureInspection): IFeatureInspection {
  const layers: Record<string, IFeatureDetail[]> = {};
  for (const [key, val] of Object.entries(raw.layers)) {
    layers[key] = val.map(transformFeatureDetail);
  }

  return {
    ticker: raw.ticker,
    layers,
    generatedAt: raw.generated_at,
  };
}

// =============================================================================
// API Functions
// =============================================================================

export async function getDashboard(
  exchange?: string,
  ticker?: string,
  signal?: AbortSignal
): Promise<ApiResult<IStrategyDashboard>> {
  const params: Record<string, string | undefined> = {};
  if (exchange) params.exchange = exchange;
  if (ticker) params.ticker = ticker;

  const result = await apiClient.get<{
    latest_signals: RawStrategySignal[];
    recent_outcomes: RawStrategySignal[];
    performance: RawStrategyPerformance[];
    pipeline_health: Record<string, boolean>;
  }>('/api/playground/strategy/dashboard', params, { signal });

  if (!result.success) return result;

  return {
    success: true,
    data: {
      latestSignals: result.data.latest_signals.map(transformSignal),
      recentOutcomes: result.data.recent_outcomes.map(transformSignal),
      performance: result.data.performance.map(transformPerformance),
      pipelineHealth: result.data.pipeline_health,
    },
  };
}

export async function getFeatures(
  ticker: string,
  signal?: AbortSignal
): Promise<ApiResult<IFeatureInspection>> {
  const result = await apiClient.get<RawFeatureInspection>(
    `/api/playground/strategy/features/${ticker}`,
    undefined,
    { signal }
  );

  if (!result.success) return result;
  return { success: true, data: transformFeatureInspection(result.data) };
}

// =============================================================================
// Export namespace
// =============================================================================

export const strategyApi = {
  getDashboard,
  getFeatures,
};

export default strategyApi;
