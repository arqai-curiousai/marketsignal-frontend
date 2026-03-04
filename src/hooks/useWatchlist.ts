'use client';

/**
 * useWatchlist hook - Manages user's stock watchlist state
 * 
 * Provides full CRUD operations for My Picks functionality
 * with optimistic updates and smooth scrolling UX.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
    WatchlistItem,
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
} from '@/src/lib/api/watchlistApi';

interface UseWatchlistReturn {
    /** List of stocks in user's watchlist */
    items: WatchlistItem[];
    /** Total count of items */
    count: number;
    /** Maximum allowed stocks (50) */
    maxSize: number;
    /** Remaining slots available */
    remaining: number;
    /** Loading state */
    isLoading: boolean;
    /** Error message if any */
    error: string | null;
    /** Add a stock to watchlist */
    addStock: (ticker: string, exchange: string, notes?: string, instrumentType?: string) => Promise<boolean>;
    /** Remove a stock from watchlist */
    removeStock: (ticker: string, exchange: string) => Promise<boolean>;
    /** Check if stock is in watchlist */
    isInWatchlist: (ticker: string, exchange: string) => boolean;
    /** Refresh watchlist data */
    refresh: () => Promise<void>;
    /** User authentication status */
    isAuthenticated: boolean;
}

export function useWatchlist(): UseWatchlistReturn {
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [count, setCount] = useState(0);
    const [maxSize, setMaxSize] = useState(50);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(true);

    // Build a Set for O(1) lookup
    const [watchlistSet, setWatchlistSet] = useState<Set<string>>(new Set());

    // Helper to create unique key for stock
    const getStockKey = (ticker: string, exchange: string) =>
        `${ticker.toUpperCase()}:${exchange.toUpperCase()}`;

    // Fetch watchlist data
    const fetchWatchlist = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await getWatchlist();
        if (result.success) {
            const data = result.data;
            setItems(data.items);
            setCount(data.count);
            setMaxSize(data.max_size);
            setIsAuthenticated(true);

            // Build lookup set
            const set = new Set(
                data.items.map((item) => getStockKey(item.ticker, item.exchange))
            );
            setWatchlistSet(set);
        } else {
            if (result.error.status === 401) {
                setIsAuthenticated(false);
                setItems([]);
                setCount(0);
                setWatchlistSet(new Set());
            } else {
                setError(result.error.detail || 'Failed to load watchlist');
                console.error('Watchlist fetch error:', result.error);
            }
        }
        setIsLoading(false);
    }, []);

    // Load watchlist on mount
    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    // Add stock to watchlist
    const addStock = useCallback(
        async (ticker: string, exchange: string, notes?: string, instrumentType?: string): Promise<boolean> => {
            if (!isAuthenticated) {
                // Should be handled by UI, but safety check
                window.location.href = '/login?from=/signals';
                return false;
            }

            const key = getStockKey(ticker, exchange);

            // Check if already in watchlist
            if (watchlistSet.has(key)) {
                toast.info(`${ticker} is already in your picks`);
                return false;
            }

            // Check capacity
            if (count >= maxSize) {
                toast.error(`Your picks are full (${maxSize} max)`);
                return false;
            }

            // Optimistic update
            setWatchlistSet((prev) => new Set(prev).add(key));

            const result = await addToWatchlist(ticker, exchange, notes, instrumentType);
            if (result.success) {
                toast.success(`${ticker} added to your picks`);
                // Refresh to get full data
                await fetchWatchlist();
                return true;
            } else {
                // Rollback
                setWatchlistSet((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
                toast.error(result.error.detail || 'Failed to add stock');
                return false;
            }
        },
        [watchlistSet, count, maxSize, fetchWatchlist, isAuthenticated]
    );

    // Remove stock from watchlist
    const removeStock = useCallback(
        async (ticker: string, exchange: string): Promise<boolean> => {
            const key = getStockKey(ticker, exchange);

            // Optimistic update
            setWatchlistSet((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
            setItems((prev) =>
                prev.filter(
                    (item) =>
                        !(item.ticker.toUpperCase() === ticker.toUpperCase() &&
                            item.exchange.toUpperCase() === exchange.toUpperCase())
                )
            );

            const result = await removeFromWatchlist(ticker, exchange);
            if (result.success) {
                toast.success(`${ticker} removed from your picks`);
                setCount((prev) => prev - 1);
                return true;
            } else {
                // Rollback
                await fetchWatchlist();
                toast.error(result.error.detail || 'Failed to remove stock');
                return false;
            }
        },
        [fetchWatchlist]
    );

    // Check if stock is in watchlist (synchronous)
    const isInWatchlist = useCallback(
        (ticker: string, exchange: string): boolean => {
            const key = getStockKey(ticker, exchange);
            return watchlistSet.has(key);
        },
        [watchlistSet]
    );

    return {
        items,
        count,
        maxSize,
        remaining: maxSize - count,
        isLoading,
        error,
        isAuthenticated,
        addStock,
        removeStock,
        isInWatchlist,
        refresh: fetchWatchlist,
    };
}

export default useWatchlist;
