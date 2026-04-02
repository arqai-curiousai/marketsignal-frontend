'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getMarketStatus } from '@/src/lib/api/signalApi';
import type { IMarketStatus } from '@/types/stock';

interface MarketStatusBadgeProps {
    market: string;
    className?: string;
}

const MARKET_LABELS: Record<string, string> = {
    nse: 'NSE',
    nasdaq: 'NASDAQ',
    nyse: 'NYSE',
    lse: 'LSE',
    hkse: 'HKSE',
    forex: 'Forex',
    commodity: 'MCX',
};

/** Equity exchange keys that may appear in status.exchanges */
const EQUITY_EXCHANGES = new Set(['nse', 'nasdaq', 'nyse', 'lse', 'sgx', 'hkse']);

export function MarketStatusBadge({ market, className }: MarketStatusBadgeProps) {
    const [status, setStatus] = useState<IMarketStatus | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        async function fetchStatus() {
            const result = await getMarketStatus(controller.signal);
            if (!controller.signal.aborted && result.success) {
                setStatus(result.data);
            }
        }
        fetchStatus();

        // Poll every 60 seconds
        const interval = setInterval(() => {
            if (!controller.signal.aborted) fetchStatus();
        }, 60_000);
        return () => {
            controller.abort();
            clearInterval(interval);
        };
    }, []);

    // For equity exchanges, try the multi-exchange status shape first, then fall back
    const isOpen = (() => {
        if (!status) return false;
        if (EQUITY_EXCHANGES.has(market)) {
            const exchangeKey = market.toUpperCase();
            // New multi-exchange shape: status.exchanges.NSE.is_open
            const exEntry = status.exchanges?.[exchangeKey];
            if (exEntry && typeof exEntry.is_open === 'boolean') {
                return exEntry.is_open;
            }
        }
        // Backward-compatible: status.nse.is_open / status.forex.is_open
        const marketEntry = status[market as keyof IMarketStatus];
        if (marketEntry && typeof marketEntry === 'object' && 'is_open' in marketEntry) {
            return Boolean(marketEntry.is_open);
        }
        return false;
    })();

    return (
        <div className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            isOpen
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-white/5 text-muted-foreground border border-white/10',
            className,
        )}>
            <span className={cn(
                'h-1.5 w-1.5 rounded-full',
                isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-500',
            )} />
            {MARKET_LABELS[market]} {isOpen ? 'Open' : 'Closed'}
        </div>
    );
}

export default MarketStatusBadge;
