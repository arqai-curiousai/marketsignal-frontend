/**
 * Signal API client for the dual AI agent pipeline.
 *
 * @deprecated Prefer insightApi.ts for new code. This module is kept for
 *   backward compatibility and now maps legacy backend fields to the
 *   IPatternInsight shape.
 */

import apiClient, { ApiResult } from './apiClient';
import type { IMarketStatus, IInstrument, IActiveSignalItem, IPatternInsight } from '@/types/stock';

// Re-export from insightApi so callers can migrate gradually.
// getMarketStatus is excluded to avoid conflict with the local version.
export {
    watchInstrument,
    unwatchInstrument,
    getActiveInsights,
    getInsightDetail,
    type IActiveInsightItem,
} from './insightApi';

/** Response from the activate-signal endpoint. */
export interface IActivateSignalResponse {
    success: boolean;
    signal: IPatternInsight | null;
}

// =============================================================================
// Market Status
// =============================================================================

export async function getMarketStatus(signal?: AbortSignal): Promise<ApiResult<IMarketStatus>> {
    return apiClient.get<IMarketStatus>('/api/signals/market-status', undefined, { signal });
}

// =============================================================================
// Signal Activation
// =============================================================================

export async function activateSignal(
    ticker: string,
    exchange: string,
    instrumentType: string = 'equity'
): Promise<ApiResult<IActivateSignalResponse>> {
    return apiClient.post('/api/signals/activate', {
        ticker,
        exchange,
        instrument_type: instrumentType,
    });
}

export async function deactivateSignal(
    ticker: string,
    exchange: string
): Promise<ApiResult<{ success: boolean }>> {
    return apiClient.post('/api/signals/deactivate', {
        ticker,
        exchange,
    });
}

// =============================================================================
// Active Signals
// =============================================================================

export async function getActiveSignals(signal?: AbortSignal): Promise<ApiResult<{ items: IActiveSignalItem[]; total: number }>> {
    const result = await apiClient.get<{
        items: Array<{
            ticker: string;
            exchange: string;
            instrument_type: string;
            stock_name?: string;
            signal: {
                narrative_type?: string;
                conviction?: number;
                institutional_stance?: string;
                retail_sentiment?: string;
                narrative?: string;
                // Legacy fields the backend may still send
                action?: string;
                confidence?: number;
                conflict_type?: string;
                reasoning?: string;
                market_maker_bias: string;
                retail_bias: string;
                price_at_signal?: number;
                generated_at: string;
                is_eod: boolean;
                overall_quality_grade?: string;
                active_pattern_count?: number;
            } | null;
            is_eod: boolean;
        }>;
        total: number;
    }>('/api/signals/active', undefined, { signal });

    if (!result.success) return result;

    const items = Array.isArray(result.data?.items) ? result.data.items : [];
    const validNarratives = new Set(['divergence', 'alignment', 'quiet']);

    return {
        success: true,
        data: {
            items: items.map(item => ({
                ticker: item.ticker,
                exchange: item.exchange,
                instrumentType: item.instrument_type,
                stockName: item.stock_name,
                signal: item.signal ? {
                    narrativeType: (() => {
                        const nt = item.signal!.narrative_type || item.signal!.conflict_type || 'quiet';
                        if (!validNarratives.has(nt)) {
                            console.warn(`[signalApi] Unknown narrative_type "${nt}" for ${item.ticker}, falling back to quiet`);
                        }
                        return (validNarratives.has(nt) ? nt : 'quiet') as 'divergence' | 'alignment' | 'quiet';
                    })(),
                    conviction: item.signal.conviction ?? item.signal.confidence ?? 0,
                    institutionalStance: item.signal.institutional_stance || item.signal.market_maker_bias || 'neutral',
                    retailSentiment: item.signal.retail_sentiment || item.signal.retail_bias || 'confused',
                    narrative: item.signal.narrative || item.signal.reasoning || '',
                    marketMakerBias: item.signal.market_maker_bias,
                    retailBias: item.signal.retail_bias,
                    priceAtSignal: item.signal.price_at_signal,
                    generatedAt: item.signal.generated_at,
                    isEod: item.signal.is_eod,
                    overallQualityGrade: item.signal.overall_quality_grade,
                    activePatternCount: item.signal.active_pattern_count,
                } : null,
                isEod: item.is_eod,
            })),
            total: result.data?.total ?? 0,
        },
    };
}

// =============================================================================
// Instruments
// =============================================================================

export async function getInstruments(
    type: 'nse' | 'nasdaq' | 'nyse' | 'lse' | 'sgx' | 'hkse' | 'currency' | 'commodity',
    signal?: AbortSignal
): Promise<ApiResult<IInstrument[]>> {
    const result = await apiClient.get<Array<{
        ticker: string;
        name: string;
        instrument_type: string;
        exchange: string;
        sector?: string;
        price?: number;
        change?: number;
        change_percent?: number;
        currency: string;
    }>>('/api/stocks/instruments', { type }, { signal });

    if (!result.success) return result;

    return {
        success: true,
        data: result.data.map(item => ({
            ticker: item.ticker,
            name: item.name,
            instrumentType: item.instrument_type as IInstrument['instrumentType'],
            exchange: item.exchange,
            sector: item.sector,
            price: item.price,
            change: item.change,
            changePercent: item.change_percent,
            currency: item.currency,
        })),
    };
}

/**
 * Get all instruments across all exchanges in a single call.
 * Returns ~272 items — designed for client-side caching and global search.
 */
export async function getAllInstruments(
    signal?: AbortSignal
): Promise<ApiResult<IInstrument[]>> {
    const result = await apiClient.get<Array<{
        ticker: string;
        name: string;
        instrument_type: string;
        exchange: string;
        sector?: string;
        price?: number;
        change?: number;
        change_percent?: number;
        currency: string;
    }>>('/api/stocks/instruments/all', {}, { signal });

    if (!result.success) return result;

    return {
        success: true,
        data: result.data.map(item => ({
            ticker: item.ticker,
            name: item.name,
            instrumentType: item.instrument_type as IInstrument['instrumentType'],
            exchange: item.exchange,
            sector: item.sector,
            price: item.price,
            change: item.change,
            changePercent: item.change_percent,
            currency: item.currency,
        })),
    };
}

// =============================================================================
// Export
// =============================================================================

export const signalApi = {
    getMarketStatus,
    activateSignal,
    deactivateSignal,
    getActiveSignals,
    getInstruments,
    getAllInstruments,
};

export default signalApi;
