/**
 * Watchlist API client for My Picks functionality.
 * Handles communication with the backend watchlist endpoints.
 */

export interface WatchlistItem {
    ticker: string;
    exchange: string;
    stock_name: string | null;
    added_at: string;
    notes: string | null;
    last_price: number | null;
    change: number | null;
    change_percent: number | null;
}

export interface WatchlistResponse {
    items: WatchlistItem[];
    count: number;
    max_size: number;
}

export interface WatchlistStatusResponse {
    success: boolean;
    message: string;
    ticker?: string;
    exchange?: string;
}

export interface WatchlistCheckResponse {
    is_in_watchlist: boolean;
    ticker: string;
    exchange: string;
}

export interface WatchlistCountResponse {
    count: number;
    max_size: number;
    remaining: number;
}

/**
 * Get user's complete watchlist with enriched stock data.
 */
export async function getWatchlist(): Promise<WatchlistResponse> {
    const response = await fetch('/api/watchlist', {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch watchlist');
    }

    return response.json();
}

/**
 * Add a stock to user's watchlist.
 */
export async function addToWatchlist(
    ticker: string,
    exchange: string,
    notes?: string
): Promise<WatchlistStatusResponse> {
    const response = await fetch('/api/watchlist', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker, exchange, notes }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to add to watchlist');
    }

    return response.json();
}

/**
 * Remove a stock from user's watchlist.
 */
export async function removeFromWatchlist(
    ticker: string,
    exchange: string
): Promise<WatchlistStatusResponse> {
    const params = new URLSearchParams({ ticker, exchange });
    const response = await fetch(`/api/watchlist?${params}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to remove from watchlist');
    }

    return response.json();
}

/**
 * Check if a stock is in user's watchlist.
 */
export async function checkWatchlist(
    ticker: string,
    exchange: string
): Promise<WatchlistCheckResponse> {
    const params = new URLSearchParams({ ticker, exchange });
    const response = await fetch(`/api/watchlist/check?${params}`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to check watchlist status');
    }

    return response.json();
}

/**
 * Get watchlist count and remaining capacity.
 */
export async function getWatchlistCount(): Promise<WatchlistCountResponse> {
    const response = await fetch('/api/watchlist/count', {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to get watchlist count');
    }

    return response.json();
}
