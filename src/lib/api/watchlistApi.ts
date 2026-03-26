/**
 * Watchlist API client for My Picks functionality.
 * Uses apiClient for CSRF headers, retry logic, and 401 token refresh.
 */

import { apiClient, ApiResult } from './apiClient';

export interface WatchlistItem {
  ticker: string;
  exchange: string;
  instrument_type: string;
  stock_name: string | null;
  added_at: string;
  notes: string | null;
  signal_active: boolean;
  last_price: number | null;
  change: number | null;
  change_percent: number | null;
  currency?: string;
}

interface WatchlistResponse {
  items: WatchlistItem[];
  count: number;
  max_size: number;
}

interface WatchlistStatusResponse {
  success: boolean;
  message: string;
  ticker?: string;
  exchange?: string;
}

/**
 * Get user's complete watchlist with enriched stock data.
 */
export function getWatchlist(): Promise<ApiResult<WatchlistResponse>> {
  return apiClient.get<WatchlistResponse>('/api/watchlist');
}

/**
 * Add a stock to user's watchlist.
 */
export function addToWatchlist(
  ticker: string,
  exchange: string,
  notes?: string,
  instrumentType?: string
): Promise<ApiResult<WatchlistStatusResponse>> {
  return apiClient.post<WatchlistStatusResponse>('/api/watchlist', {
    ticker,
    exchange,
    notes,
    ...(instrumentType && { instrument_type: instrumentType }),
  });
}

/**
 * Remove a stock from user's watchlist.
 */
export function removeFromWatchlist(
  ticker: string,
  exchange: string
): Promise<ApiResult<WatchlistStatusResponse>> {
  return apiClient.delete<WatchlistStatusResponse>(
    `/api/watchlist?ticker=${encodeURIComponent(ticker)}&exchange=${encodeURIComponent(exchange)}`
  );
}

