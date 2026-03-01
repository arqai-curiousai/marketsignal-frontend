/**
 * Playground (Algo Trading) TypeScript types.
 * Maps to backend playground models and API responses.
 */

// =============================================================================
// Signal Types
// =============================================================================

export type PlaygroundSignal = 'buy' | 'hold' | 'sell';

// =============================================================================
// Algo Info
// =============================================================================

export interface IAlgoInfo {
  name: string;
  version: string;
  description: string;
  minBars: number;
  isActive: boolean;
}

// =============================================================================
// Algo Signal
// =============================================================================

export interface IAlgoSignal {
  id: string;
  ticker: string;
  exchange: string;
  signal: PlaygroundSignal;
  confidence: number;
  algoName: string;
  algoVersion: string;
  indicators: Record<string, number>;
  reason: string;
  priceAtSignal: number | null;
  generatedAt: string;
  outcomePrice: number | null;
  outcomeCorrect: boolean | null;
  pnlPercent: number | null;
  outcomeEvaluatedAt: string | null;
}

// =============================================================================
// Algo Performance
// =============================================================================

export interface IAlgoPerformance {
  algoName: string;
  algoVersion: string;
  period: string;
  totalSignals: number;
  correctPredictions: number;
  accuracy: number;
  avgConfidence: number;
  totalPnlPercent: number;
  winRate: number;
  computedAt: string;
}

// =============================================================================
// Dashboard Aggregate
// =============================================================================

export interface IPlaygroundDashboard {
  algos: IAlgoInfo[];
  latestSignals: IAlgoSignal[];
  performance: IAlgoPerformance[];
  recentOutcomes: IAlgoSignal[];
}

// =============================================================================
// Paginated Signals Response
// =============================================================================

export interface IAlgoSignalListResponse {
  items: IAlgoSignal[];
  total: number;
  page: number;
  pageSize: number;
}

// =============================================================================
// Helpers
// =============================================================================

export function getSignalColor(signal: PlaygroundSignal): string {
  switch (signal) {
    case 'buy':
      return 'text-green-400';
    case 'sell':
      return 'text-red-400';
    case 'hold':
    default:
      return 'text-white';
  }
}

export function getSignalBg(signal: PlaygroundSignal): string {
  switch (signal) {
    case 'buy':
      return 'bg-green-500/20 border-green-500/30';
    case 'sell':
      return 'bg-red-500/20 border-red-500/30';
    case 'hold':
    default:
      return 'bg-white/10 border-white/20';
  }
}

export function getSignalLabel(signal: PlaygroundSignal): string {
  switch (signal) {
    case 'buy':
      return 'BUY';
    case 'sell':
      return 'SELL';
    case 'hold':
    default:
      return 'HOLD';
  }
}
