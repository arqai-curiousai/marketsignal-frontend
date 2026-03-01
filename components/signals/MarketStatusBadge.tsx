'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getMarketStatus } from '@/src/lib/api/signalApi';
import type { IMarketStatus } from '@/types/stock';

interface MarketStatusBadgeProps {
    market: 'nse' | 'forex' | 'commodity';
    className?: string;
}

const MARKET_LABELS: Record<string, string> = {
    nse: 'NSE',
    forex: 'Forex',
    commodity: 'MCX',
};

export function MarketStatusBadge({ market, className }: MarketStatusBadgeProps) {
    const [status, setStatus] = useState<IMarketStatus | null>(null);

    useEffect(() => {
        async function fetch() {
            const result = await getMarketStatus();
            if (result.success) {
                setStatus(result.data);
            }
        }
        fetch();

        // Poll every 60 seconds
        const interval = setInterval(fetch, 60_000);
        return () => clearInterval(interval);
    }, []);

    const isOpen = status?.[market]?.is_open ?? false;

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
