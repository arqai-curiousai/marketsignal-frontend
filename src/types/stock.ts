/**
 * Stock-related TypeScript types for the frontend.
 * Maps to backend Pydantic models for type safety.
 */

// =============================================================================
// Stock Types
// =============================================================================

export interface IStock {
    ticker: string;
    exchange: string;
    name: string;
    sector?: string;
    industry?: string;
    country: string;
    currency: string;
    status: 'active' | 'inactive' | 'delisted';
    lastPrice?: number;
    change?: number;
    changePercent?: number;
    signal?: ISignal;
}

// =============================================================================
// Signal Types
// =============================================================================

export type SignalAction = 'buy' | 'hold' | 'sell';

export interface ISignal {
    signal: SignalAction;
    confidence: number;
    algoName: string;
    generatedAt: Date;
}

export interface IStockListResponse {
    items: IStock[];
    total: number;
    page: number;
    pageSize: number;
    exchange: string;
}

// =============================================================================
// OHLCV Types
// =============================================================================

export interface IOHLCVBar {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vwap?: number;
}

export interface IOHLCVResponse {
    ticker: string;
    exchange: string;
    period: string;
    bars: IOHLCVBar[];
    count: number;
}

// =============================================================================
// Quote Types
// =============================================================================

export interface IStockQuote {
    ticker: string;
    exchange: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    timestamp: Date;
}

// =============================================================================
// Exchange Types
// =============================================================================

export interface IExchange {
    code: string;
    name: string;
    country: string;
    stockCount: number;
    timezone?: string;
    marketOpen?: string;
    marketClose?: string;
    isActive?: boolean;
}

// =============================================================================
// AI Signal Types (Dual Agent Pipeline)
// =============================================================================

export interface IAISignal {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    conflictType: 'divergence' | 'alignment' | 'uncertain';
    marketMakerBias: string;
    retailBias: string;
    reasoning: string;
    priceAtSignal?: number;
    generatedAt: string;
    isEod: boolean;
}

export interface IInstrument {
    ticker: string;
    name: string;
    instrumentType: 'equity' | 'currency' | 'commodity';
    exchange: string;
    sector?: string;
    price?: number;
    change?: number;
    changePercent?: number;
    currency: string;
}

export interface IMarketStatus {
    nse: {
        is_open: boolean;
        timezone: string;
        market_open: string;
        market_close: string;
        next_open?: string;
        next_close?: string;
    };
    forex: {
        is_open: boolean;
        timezone: string;
    };
    commodity: {
        is_open: boolean;
        timezone: string;
        market_open: string;
        market_close: string;
    };
}

export interface IActiveSignalItem {
    ticker: string;
    exchange: string;
    instrumentType: string;
    stockName?: string;
    signal: IAISignal | null;
    isEod: boolean;
}

// =============================================================================
// API Error Type
// =============================================================================

export interface IApiError {
    status: number;
    message: string;
    detail?: string;
}

// =============================================================================
// Time Period Types
// =============================================================================

export type OHLCVPeriod = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1month';

export const OHLCV_PERIODS: { value: OHLCVPeriod; label: string }[] = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '1d', label: 'Daily' },
    { value: '1w', label: 'Weekly' },
];

// =============================================================================
// Price Change Helpers
// =============================================================================

export function getPriceChangeClass(change: number): string {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
}

export function formatPrice(price: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
}

export function formatVolume(volume: number): string {
    if (volume >= 1_000_000_000) {
        return `${(volume / 1_000_000_000).toFixed(2)}B`;
    }
    if (volume >= 1_000_000) {
        return `${(volume / 1_000_000).toFixed(2)}M`;
    }
    if (volume >= 1_000) {
        return `${(volume / 1_000).toFixed(2)}K`;
    }
    return volume.toString();
}

export function formatPercent(percent: number): string {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
}
