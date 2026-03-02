/**
 * Playground API service for algo trading dashboard communication.
 */

import apiClient from './apiClient';
import type { ApiResult } from './apiClient';
import type {
  IAlgoInfo,
  IAlgoSignal,
  IAlgoPerformance,
  IPlaygroundDashboard,
  IAlgoSignalListResponse,
} from '@/types/playground';

// =============================================================================
// Types for backend snake_case responses
// =============================================================================

interface RawAlgoInfo {
  name: string;
  version: string;
  description: string;
  min_bars: number;
  is_active: boolean;
}

interface RawAlgoSignal {
  id: string;
  ticker: string;
  exchange: string;
  signal: string;
  confidence: number;
  algo_name: string;
  algo_version: string;
  indicators: Record<string, number>;
  reason: string;
  price_at_signal: number | null;
  generated_at: string;
  outcome_price: number | null;
  outcome_correct: boolean | null;
  pnl_percent: number | null;
  outcome_evaluated_at: string | null;
}

interface RawAlgoPerformance {
  algo_name: string;
  algo_version: string;
  period: string;
  total_signals: number;
  correct_predictions: number;
  accuracy: number;
  avg_confidence: number;
  total_pnl_percent: number;
  win_rate: number;
  computed_at: string;
}

// =============================================================================
// Transform helpers
// =============================================================================

function transformAlgoInfo(raw: RawAlgoInfo): IAlgoInfo {
  return {
    name: raw.name,
    version: raw.version,
    description: raw.description,
    minBars: raw.min_bars,
    isActive: raw.is_active,
  };
}

function transformSignal(raw: RawAlgoSignal): IAlgoSignal {
  return {
    id: raw.id,
    ticker: raw.ticker,
    exchange: raw.exchange,
    signal: raw.signal as IAlgoSignal['signal'],
    confidence: raw.confidence,
    algoName: raw.algo_name,
    algoVersion: raw.algo_version,
    indicators: raw.indicators,
    reason: raw.reason,
    priceAtSignal: raw.price_at_signal,
    generatedAt: raw.generated_at,
    outcomePrice: raw.outcome_price,
    outcomeCorrect: raw.outcome_correct,
    pnlPercent: raw.pnl_percent,
    outcomeEvaluatedAt: raw.outcome_evaluated_at,
  };
}

function transformPerformance(raw: RawAlgoPerformance): IAlgoPerformance {
  return {
    algoName: raw.algo_name,
    algoVersion: raw.algo_version,
    period: raw.period,
    totalSignals: raw.total_signals,
    correctPredictions: raw.correct_predictions,
    accuracy: raw.accuracy,
    avgConfidence: raw.avg_confidence,
    totalPnlPercent: raw.total_pnl_percent,
    winRate: raw.win_rate,
    computedAt: raw.computed_at,
  };
}

// =============================================================================
// API Functions
// =============================================================================

export async function getDashboard(exchange?: string): Promise<ApiResult<IPlaygroundDashboard>> {
  const params: Record<string, string | undefined> = {};
  if (exchange) params.exchange = exchange;

  const result = await apiClient.get<{
    algos: RawAlgoInfo[];
    latest_signals: RawAlgoSignal[];
    recent_outcomes: RawAlgoSignal[];
    performance: RawAlgoPerformance[];
  }>('/api/playground/dashboard', params);

  if (!result.success) return result;

  return {
    success: true,
    data: {
      algos: result.data.algos.map(transformAlgoInfo),
      latestSignals: result.data.latest_signals.map(transformSignal),
      recentOutcomes: result.data.recent_outcomes.map(transformSignal),
      performance: result.data.performance.map(transformPerformance),
    },
  };
}

export async function getAlgos(): Promise<ApiResult<IAlgoInfo[]>> {
  const result = await apiClient.get<{ algos: RawAlgoInfo[] }>('/api/playground/algos');
  if (!result.success) return result;
  return { success: true, data: result.data.algos.map(transformAlgoInfo) };
}

export async function getSignals(params: {
  algo?: string;
  ticker?: string;
  signal?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResult<IAlgoSignalListResponse>> {
  const result = await apiClient.get<{
    items: RawAlgoSignal[];
    total: number;
    page: number;
    page_size: number;
  }>('/api/playground/signals', {
    algo: params.algo,
    ticker: params.ticker,
    signal: params.signal,
    page: params.page || 1,
    page_size: params.pageSize || 20,
  });

  if (!result.success) return result;

  return {
    success: true,
    data: {
      items: result.data.items.map(transformSignal),
      total: result.data.total,
      page: result.data.page,
      pageSize: result.data.page_size,
    },
  };
}

export async function getPerformance(
  algoName?: string
): Promise<ApiResult<IAlgoPerformance[]>> {
  const endpoint = algoName
    ? `/api/playground/performance/${algoName}`
    : '/api/playground/performance';

  const result = await apiClient.get<RawAlgoPerformance[]>(endpoint);
  if (!result.success) return result;
  return { success: true, data: result.data.map(transformPerformance) };
}

export async function triggerRun(
  _exchange: string = 'NSE'
): Promise<ApiResult<{ success: boolean; signals_created: number }>> {
  return apiClient.post('/api/playground/run', undefined);
}

// =============================================================================
// Export namespace
// =============================================================================

export const playgroundApi = {
  getDashboard,
  getAlgos,
  getSignals,
  getPerformance,
  triggerRun,
};

export default playgroundApi;
