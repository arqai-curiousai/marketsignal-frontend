/**
 * Strategy pipeline types — multi-layer AI signal engine.
 */

export type StrategySignal = 'buy' | 'hold' | 'sell';

// ─── Layer Result ───────────────────────────────────────────────────
export interface ILayerResult {
  layerName: string;
  bias: StrategySignal;
  confidence: number;
  features: Record<string, number>;
  metadata: Record<string, unknown>;
  computedAt: string;
  computationMs: number;
}

// ─── Strategy Signal ────────────────────────────────────────────────
export interface IStrategySignal {
  id: string;
  ticker: string;
  exchange: string;
  signal: StrategySignal;
  confidence: number;
  positionSizePct: number;
  layerOutputs: Record<string, ILayerResult>;
  topFeatures: Array<{ feature: string; impact: number }>;
  riskMetrics: Record<string, number>;
  reasoning: string;
  priceAtSignal: number | null;
  generatedAt: string;
  // Outcome tracking
  outcomePrice: number | null;
  outcomeCorrect: boolean | null;
  pnlPercent: number | null;
  outcomeEvaluatedAt: string | null;
}

// ─── Performance ────────────────────────────────────────────────────
export interface IStrategyPerformance {
  period: string;
  totalSignals: number;
  correctPredictions: number;
  accuracy: number;
  avgConfidence: number;
  winRate: number;
  totalPnlPercent: number;
  sharpeEstimate: number;
  profitFactor: number;
  avgWinLossRatio: number;
  maxDrawdownPct: number;
  calibrationError: number;
  layerAccuracy: Record<string, number>;
  byRegime: Record<string, { accuracy: number; count: number }>;
  computedAt: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────
export interface IStrategyDashboard {
  latestSignals: IStrategySignal[];
  recentOutcomes: IStrategySignal[];
  performance: IStrategyPerformance[];
  pipelineHealth: Record<string, boolean>;
}

// ─── Feature Inspection ─────────────────────────────────────────────
export interface IFeatureDetail {
  name: string;
  value: number;
  zScore: number | null;
  direction: 'bullish' | 'bearish' | 'neutral';
  importance: number;
  sparkline: number[];
}

export interface IFeatureInspection {
  ticker: string;
  layers: Record<string, IFeatureDetail[]>;
  generatedAt: string;
}

// ─── Layer Definitions ──────────────────────────────────────────────
export interface ILayerDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  order: number;
  featureCount: number;
}

