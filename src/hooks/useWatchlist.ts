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
    WatchlistResponse,
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
    addStock: (ticker: string, exchange: string, notes?: string) => Promise<boolean>;
    /** Remove a stock from watchlist */
    removeStock: (ticker: string, exchange: string) => Promise<boolean>;
    /** Check if stock is in watchlist */
    isInWatchlist: (ticker: string, exchange: string) => boolean;
    /** Refresh watchlist data */
    refresh: () => Promise<void>;
}

export function useWatchlist(): UseWatchlistReturn {
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [count, setCount] = useState(0);
    const [maxSize, setMaxSize] = useState(50);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Build a Set for O(1) lookup
    const [watchlistSet, setWatchlistSet] = useState<Set<string>>(new Set());

    // Helper to create unique key for stock
    const getStockKey = (ticker: string, exchange: string) =>
        `${ticker.toUpperCase()}:${exchange.toUpperCase()}`;

    // Fetch watchlist data
    const fetchWatchlist = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data: WatchlistResponse = await getWatchlist();
            setItems(data.items);
            setCount(data.count);
            setMaxSize(data.max_size);

            // Build lookup set
            const set = new Set(
                data.items.map((item) => getStockKey(item.ticker, item.exchange))
            );
            setWatchlistSet(set);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load watchlist';
            setError(message);
            console.error('Watchlist fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load watchlist on mount
    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    // Add stock to watchlist
    const addStock = useCallback(
        async (ticker: string, exchange: string, notes?: string): Promise<boolean> => {
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

            try {
                await addToWatchlist(ticker, exchange, notes);
                toast.success(`${ticker} added to your picks`);
                // Refresh to get full data
                await fetchWatchlist();
                return true;
            } catch (err) {
                // Rollback
                setWatchlistSet((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
                const message = err instanceof Error ? err.message : 'Failed to add stock';
                toast.error(message);
                return false;
            }
        },
        [watchlistSet, count, maxSize, fetchWatchlist]
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

            try {
                await removeFromWatchlist(ticker, exchange);
                toast.success(`${ticker} removed from your picks`);
                setCount((prev) => prev - 1);
                return true;
            } catch (err) {
                // Rollback
                await fetchWatchlist();
                const message = err instanceof Error ? err.message : 'Failed to remove stock';
                toast.error(message);
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
        addStock,
        removeStock,
        isInWatchlist,
        refresh: fetchWatchlist,
    };
}

export default useWatchlist;
