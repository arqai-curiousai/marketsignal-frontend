/**
 * Pattern Intelligence API client.
 *
 * Replaces signalApi for the pattern intelligence pivot.
 * Uses /api/insights/ endpoints instead of /api/signals/.
 */
import { apiClient } from './apiClient';
import type { IPatternInsight, IMarketStatus } from '@/types/stock';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface IActiveInsightItem {
  ticker: string;
  exchange: string;
  instrumentType: string;
  stockName?: string;
  insight: IPatternInsight | null;
  isEod: boolean;
}

interface InsightResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ----------------------------------------------------------------
// Market Status
// ----------------------------------------------------------------

export async function getMarketStatus(): Promise<InsightResponse<IMarketStatus>> {
  try {
    const res = await apiClient.get<IMarketStatus>('/api/insights/market-status');
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.error.message };
  } catch {
    return { success: false, error: 'Failed to fetch market status' };
  }
}

// ----------------------------------------------------------------
// Watch / Unwatch
// ----------------------------------------------------------------

export async function watchInstrument(
  ticker: string,
  exchange: string = 'NSE',
  instrumentType: string = 'equity',
): Promise<InsightResponse<{ insight: IPatternInsight | null }>> {
  try {
    const res = await apiClient.post<{ insight: Record<string, unknown> | null }>('/api/insights/watch', {
      ticker: ticker.toUpperCase(),
      exchange: exchange.toUpperCase(),
      instrument_type: instrumentType,
    });
    if (!res.success) return { success: false, error: res.error.message };
    const raw = res.data;
    return {
      success: true,
      data: {
        insight: raw.insight ? transformInsight(raw.insight) : null,
      },
    };
  } catch {
    return { success: false, error: 'Failed to watch instrument' };
  }
}

export async function unwatchInstrument(
  ticker: string,
  exchange: string = 'NSE',
): Promise<InsightResponse<void>> {
  try {
    await apiClient.post('/api/insights/unwatch', {
      ticker: ticker.toUpperCase(),
      exchange: exchange.toUpperCase(),
    });
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to unwatch instrument' };
  }
}

// ----------------------------------------------------------------
// Active Insights
// ----------------------------------------------------------------

export async function getActiveInsights(): Promise<
  InsightResponse<{ items: IActiveInsightItem[]; total: number }>
> {
  try {
    const res = await apiClient.get<{ items: Record<string, unknown>[]; total: number }>('/api/insights/active');
    if (!res.success) return { success: false, error: res.error.message };
    const raw = res.data;

    const items: IActiveInsightItem[] = (raw.items || []).map(
      (item: Record<string, unknown>) => ({
        ticker: item.ticker as string,
        exchange: item.exchange as string,
        instrumentType: (item.instrument_type as string) || 'equity',
        stockName: item.stock_name as string | undefined,
        insight: item.insight ? transformInsight(item.insight as Record<string, unknown>) : null,
        isEod: (item.is_eod as boolean) || false,
      }),
    );

    return { success: true, data: { items, total: raw.total || items.length } };
  } catch {
    return { success: false, error: 'Failed to fetch active insights' };
  }
}

// ----------------------------------------------------------------
// Insight Detail
// ----------------------------------------------------------------

export async function getInsightDetail(
  ticker: string,
  exchange: string = 'NSE',
  timeframe: string = 'daily',
): Promise<InsightResponse<Record<string, unknown>>> {
  try {
    const res = await apiClient.get<Record<string, unknown>>(
      `/api/insights/${encodeURIComponent(ticker)}/detail`,
      { exchange, timeframe },
    );
    if (!res.success) return { success: false, error: res.error.message };
    return { success: true, data: res.data };
  } catch {
    return { success: false, error: 'Failed to fetch insight detail' };
  }
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function transformInsight(raw: Record<string, unknown>): IPatternInsight {
  return {
    narrativeType: (raw.narrative_type as string as IPatternInsight['narrativeType']) || 'quiet',
    conviction: (raw.conviction as number) || 0,
    institutionalStance: (raw.institutional_stance as string) || (raw.market_maker_bias as string) || 'neutral',
    retailSentiment: (raw.retail_sentiment as string) || (raw.retail_bias as string) || 'confused',
    narrative: (raw.narrative as string) || '',
    marketMakerBias: (raw.market_maker_bias as string) || 'neutral',
    retailBias: (raw.retail_bias as string) || 'confused',
    priceAtSignal: raw.price_at_signal as number | undefined,
    generatedAt: (raw.generated_at as string) || '',
    isEod: (raw.is_eod as boolean) || false,
    overallQualityGrade: raw.overall_quality_grade as string | undefined,
    activePatternCount: raw.active_pattern_count as number | undefined,
  };
}
