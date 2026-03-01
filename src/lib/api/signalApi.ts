/**
 * Signal API client for the dual AI agent pipeline.
 * Handles market status, signal activation, and active signal queries.
 */

import apiClient, { ApiResult } from './apiClient';
import type { IMarketStatus, IInstrument, IActiveSignalItem } from '@/types/stock';

// =============================================================================
// Market Status
// =============================================================================

export async function getMarketStatus(): Promise<ApiResult<IMarketStatus>> {
    return apiClient.get<IMarketStatus>('/api/signals/market-status');
}

// =============================================================================
// Signal Activation
// =============================================================================

export async function activateSignal(
    ticker: string,
    exchange: string,
    instrumentType: string = 'equity'
): Promise<ApiResult<{ success: boolean; signal: unknown }>> {
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

export async function getActiveSignals(): Promise<ApiResult<{ items: IActiveSignalItem[]; total: number }>> {
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
    }>('/api/signals/active');

    if (!result.success) return result;

    return {
        success: true,
        data: {
            items: result.data.items.map(item => ({
                ticker: item.ticker,
                exchange: item.exchange,
                instrumentType: item.instrument_type,
                stockName: item.stock_name,
                signal: item.signal ? {
                    action: item.signal.action as 'BUY' | 'SELL' | 'HOLD',
                    confidence: item.signal.confidence,
                    conflictType: item.signal.conflict_type as 'divergence' | 'alignment' | 'uncertain',
                    marketMakerBias: item.signal.market_maker_bias,
                    retailBias: item.signal.retail_bias,
                    reasoning: item.signal.reasoning,
                    priceAtSignal: item.signal.price_at_signal,
                    generatedAt: item.signal.generated_at,
                    isEod: item.signal.is_eod,
                } : null,
                isEod: item.is_eod,
            })),
            total: result.data.total,
        },
    };
}

// =============================================================================
// Instruments
// =============================================================================

export async function getInstruments(
    type: 'nse' | 'currency' | 'commodity'
): Promise<ApiResult<IInstrument[]>> {
    const result = await apiClient.get<Array<{
        ticker: string;
        name: string;
        instrument_type: string;
        exchange: string;
        price?: number;
        change?: number;
        change_percent?: number;
        currency: string;
    }>>('/api/stocks/instruments', { type });

    if (!result.success) return result;

    return {
        success: true,
        data: result.data.map(item => ({
            ticker: item.ticker,
            name: item.name,
            instrumentType: item.instrument_type as IInstrument['instrumentType'],
            exchange: item.exchange,
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
