/**
 * Stock API service for frontend-backend communication.
 * 
 * Provides typed methods for:
 * - Stock list by exchange
 * - Historical OHLCV data
 * - Real-time quotes
 * - Exchange information
 */

import apiClient, { ApiResult } from './apiClient';
import {
    IStock,
    IStockListResponse,
    IOHLCVResponse,
    IStockQuote,
    IExchange,
    ISignal,
    OHLCVPeriod,
} from '@/types/stock';

// =============================================================================
// Stock List
// =============================================================================

export interface StockListParams {
    exchange?: string;
    page?: number;
    pageSize?: number;
    sector?: string;
    search?: string;
}

/**
 * Fetch list of stocks for an exchange
 */
export async function getStocks(params: StockListParams = {}): Promise<ApiResult<IStockListResponse>> {
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
    }>('/stocks', {
        exchange: params.exchange || 'NASDAQ',
        page: params.page || 1,
        page_size: params.pageSize || 50,
        sector: params.sector,
        search: params.search,
    });

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

export interface OHLCVParams {
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
export async function getOHLCV(params: OHLCVParams): Promise<ApiResult<IOHLCVResponse>> {
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
    }>(`/stocks/${params.ticker}/ohlcv`, {
        exchange: params.exchange || 'NASDAQ',
        period: params.period || '1d',
        from_date: params.fromDate,
        to_date: params.toDate,
        limit: params.limit || 100,
    });

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
// Quote
// =============================================================================

/**
 * Fetch real-time quote for a stock
 */
export async function getQuote(
    ticker: string,
    exchange: string = 'NASDAQ'
): Promise<ApiResult<IStockQuote>> {
    const result = await apiClient.get<{
        ticker: string;
        exchange: string;
        price: number;
        change: number;
        change_percent: number;
        high: number;
        low: number;
        volume: number;
        timestamp: string;
    }>(`/stocks/${ticker}/quote`, { exchange });

    if (!result.success) {
        return result;
    }

    return {
        success: true,
        data: {
            ticker: result.data.ticker,
            exchange: result.data.exchange,
            price: result.data.price,
            change: result.data.change,
            changePercent: result.data.change_percent,
            high: result.data.high,
            low: result.data.low,
            volume: result.data.volume,
            timestamp: new Date(result.data.timestamp),
        },
    };
}

// =============================================================================
// Exchanges
// =============================================================================

/**
 * Fetch list of available exchanges
 */
export async function getExchanges(): Promise<ApiResult<IExchange[]>> {
    const result = await apiClient.get<Array<{
        code: string;
        name: string;
        country: string;
        stock_count: number;
    }>>('/stocks/exchanges');

    if (!result.success) {
        return result;
    }

    return {
        success: true,
        data: result.data.map(exch => ({
            code: exch.code,
            name: exch.name,
            country: exch.country,
            stockCount: exch.stock_count,
        })),
    };
}

// =============================================================================
// Stock Signal
// =============================================================================

/**
 * Fetch latest algo signal for a stock
 */
export async function getStockSignal(
    ticker: string,
    exchange: string = 'NASDAQ'
): Promise<ApiResult<ISignal>> {
    const result = await apiClient.get<{
        ticker: string;
        exchange: string;
        signal: string;
        confidence: number;
        algo_name: string;
        generated_at: string;
    }>(`/stocks/${ticker}/signal`, { exchange });

    if (!result.success) {
        return result;
    }

    return {
        success: true,
        data: {
            signal: result.data.signal as ISignal['signal'],
            confidence: result.data.confidence,
            algoName: result.data.algo_name,
            generatedAt: new Date(result.data.generated_at),
        },
    };
}

// =============================================================================
// Export all functions
// =============================================================================

export const stockApi = {
    getStocks,
    getOHLCV,
    getQuote,
    getExchanges,
    getStockSignal,
};

export default stockApi;
