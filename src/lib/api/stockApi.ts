/**
 * Stock API service for frontend-backend communication.
 *
 * Provides typed methods for:
 * - Stock list by exchange
 * - Historical OHLCV data
 */

import apiClient, { ApiResult } from './apiClient';
import {
    IStock,
    IStockListResponse,
    IOHLCVResponse,
    OHLCVPeriod,
} from '@/types/stock';

// =============================================================================
// Stock List
// =============================================================================

interface StockListParams {
    exchange?: string;
    page?: number;
    pageSize?: number;
    sector?: string;
    search?: string;
}

/**
 * Fetch list of stocks for an exchange
 */
export async function getStocks(params: StockListParams = {}, signal?: AbortSignal): Promise<ApiResult<IStockListResponse>> {
    const result = await apiClient.get<{
        items: Array<{
            ticker: string;
            exchange: string;
            name: string;
            sector?: string;
            industry?: string;
            country: string;
            currency: string;
            status: string;
            last_price?: number;
            change?: number;
            change_percent?: number;
        }>;
        total: number;
        page: number;
        page_size: number;
        exchange: string;
    }>('/api/stocks', {
        exchange: params.exchange || 'NSE',
        page: params.page || 1,
        page_size: params.pageSize || 50,
        sector: params.sector,
        search: params.search,
    }, { signal });

    if (!result.success) {
        return result;
    }

    // Transform snake_case to camelCase
    return {
        success: true,
        data: {
            items: result.data.items.map(item => ({
                ticker: item.ticker,
                exchange: item.exchange,
                name: item.name,
                sector: item.sector,
                industry: item.industry,
                country: item.country,
                currency: item.currency,
                status: item.status as IStock['status'],
                lastPrice: item.last_price,
                change: item.change,
                changePercent: item.change_percent,
            })),
            total: result.data.total,
            page: result.data.page,
            pageSize: result.data.page_size,
            exchange: result.data.exchange,
        },
    };
}

// =============================================================================
// OHLCV Data
// =============================================================================

interface OHLCVParams {
    ticker: string;
    exchange?: string;
    period?: OHLCVPeriod;
    fromDate?: string;
    toDate?: string;
    limit?: number;
}

/**
 * Fetch historical OHLCV data for a stock
 */
export async function getOHLCV(params: OHLCVParams, signal?: AbortSignal): Promise<ApiResult<IOHLCVResponse>> {
    const result = await apiClient.get<{
        ticker: string;
        exchange: string;
        period: string;
        bars: Array<{
            timestamp: string;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
            vwap?: number;
        }>;
        count: number;
    }>(`/api/stocks/${params.ticker}/ohlcv`, {
        exchange: params.exchange || 'NSE',
        period: params.period || '1d',
        from_date: params.fromDate,
        to_date: params.toDate,
        limit: params.limit || 100,
    }, { signal });

    if (!result.success) {
        return result;
    }

    // Parse timestamps to Date objects
    return {
        success: true,
        data: {
            ticker: result.data.ticker,
            exchange: result.data.exchange,
            period: result.data.period,
            count: result.data.count,
            bars: result.data.bars.map(bar => ({
                timestamp: new Date(bar.timestamp),
                open: bar.open,
                high: bar.high,
                low: bar.low,
                close: bar.close,
                volume: bar.volume,
                vwap: bar.vwap,
            })),
        },
    };
}

// =============================================================================
// Instruments (NSE / Currency / Commodity)
// =============================================================================

export { getInstruments } from './signalApi';
export { getMarketStatus, activateSignal, deactivateSignal, getActiveSignals } from './signalApi';

export const stockApi = {
    getStocks,
    getOHLCV,
};

export default stockApi;
