/**
 * Signal API client for the dual AI agent pipeline.
 * Handles market status, signal activation, and active signal queries.
 */

import apiClient, { ApiResult } from './apiClient';
import type { IMarketStatus, IInstrument, IActiveSignalItem, IAISignal } from '@/types/stock';

/** Response from the activate-signal endpoint. */
export interface IActivateSignalResponse {
    success: boolean;
    signal: IAISignal | null;
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
                action: string;
                confidence: number;
                conflict_type: string;
                market_maker_bias: string;
                retail_bias: string;
                reasoning: string;
                price_at_signal?: number;
                generated_at: string;
                is_eod: boolean;
            } | null;
            is_eod: boolean;
        }>;
        total: number;
    }>('/api/signals/active', undefined, { signal });

    if (!result.success) return result;

    const items = Array.isArray(result.data?.items) ? result.data.items : [];
    const validActions = new Set(['BUY', 'SELL', 'HOLD']);
    const validConflicts = new Set(['divergence', 'alignment', 'uncertain']);

    return {
        success: true,
        data: {
            items: items.map(item => ({
                ticker: item.ticker,
                exchange: item.exchange,
                instrumentType: item.instrument_type,
                stockName: item.stock_name,
                signal: item.signal ? {
                    action: (() => {
                        if (!validActions.has(item.signal!.action)) {
                            console.warn(`[signalApi] Unknown action "${item.signal!.action}" for ${item.ticker}, falling back to HOLD`);
                        }
                        return (validActions.has(item.signal!.action) ? item.signal!.action : 'HOLD') as 'BUY' | 'SELL' | 'HOLD';
                    })(),
                    confidence: item.signal.confidence,
                    conflictType: (() => {
                        if (!validConflicts.has(item.signal!.conflict_type)) {
                            console.warn(`[signalApi] Unknown conflict_type "${item.signal!.conflict_type}" for ${item.ticker}, falling back to uncertain`);
                        }
                        return (validConflicts.has(item.signal!.conflict_type) ? item.signal!.conflict_type : 'uncertain') as 'divergence' | 'alignment' | 'uncertain';
                    })(),
                    marketMakerBias: item.signal.market_maker_bias,
                    retailBias: item.signal.retail_bias,
                    reasoning: item.signal.reasoning,
                    priceAtSignal: item.signal.price_at_signal,
                    generatedAt: item.signal.generated_at,
                    isEod: item.signal.is_eod,
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

// =============================================================================
// Export
// =============================================================================

export const signalApi = {
    getMarketStatus,
    activateSignal,
    deactivateSignal,
    getActiveSignals,
    getInstruments,
};

export default signalApi;
