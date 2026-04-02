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

export interface IStockOHLCVBar {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vwap?: number;
}

/** @deprecated Use IStockOHLCVBar instead. Kept for backward compatibility. */
export type IOHLCVBar = IStockOHLCVBar;

export interface IOHLCVResponse {
    ticker: string;
    exchange: string;
    period: string;
    bars: IStockOHLCVBar[];
    count: number;
}

// =============================================================================
// Pattern Intelligence Types
// =============================================================================

export interface IPatternInsight {
    narrativeType: 'divergence' | 'alignment' | 'quiet';
    conviction: number;
    institutionalStance: string;
    retailSentiment: string;
    narrative: string;
    marketMakerBias: string;
    retailBias: string;
    priceAtSignal?: number;
    generatedAt: string;
    isEod: boolean;
    overallQualityGrade?: string;
    activePatternCount?: number;
}

/** @deprecated Use IPatternInsight instead */
export type IAISignal = IPatternInsight;

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

interface IExchangeStatus {
    is_open: boolean;
    timezone: string;
    market_open?: string;
    market_close?: string;
    next_open?: string;
    next_close?: string;
    note?: string;
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
        note?: string;
    };
    commodity: {
        is_open: boolean;
        timezone: string;
        market_open: string;
        market_close: string;
    };
    exchanges?: Record<string, IExchangeStatus>;
}

export interface IActiveSignalItem {
    ticker: string;
    exchange: string;
    instrumentType: string;
    stockName?: string;
    signal: IPatternInsight | null;
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
