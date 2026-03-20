'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StockList } from '@/components/stocks/StockList';
import { BubbleCluster } from '@/components/stocks/BubbleCluster';
import { MyPicksList } from '@/components/signals/MyPicksList';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    TrendingUp, Activity, BarChart3, Clock, CircleDot, List,
    Star, RefreshCw, Lock, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/src/hooks/useWatchlist';
import { getActiveSignals } from '@/src/lib/api/signalApi';
import { useExchange } from '@/context/ExchangeContext';
import type { IAISignal } from '@/types/stock';
import type { WatchlistItem } from '@/src/lib/api/watchlistApi';
import Link from 'next/link';
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from '@/components/ui/resizable';

/**
 * Stocks Dashboard — NIFTY 50
 *
 * Split-screen layout:
 * - Left panel: User's Portfolio (MyPicksList with signal toggles)
 * - Right panel: Stock listing (Bubble cluster or List view)
 * - Mobile: Collapsible portfolio above stock listing
 */
export default function StocksDashboard() {
    const router = useRouter();
    const { selectedExchange, exchangeConfig } = useExchange();
    const [view, setView] = useState<'bubble' | 'list'>('bubble');
    const [mobilePortfolioOpen, setMobilePortfolioOpen] = useState(false);

    // Portfolio state (moved from signals/page.tsx)
    const {
        items: watchlistItems,
        count: watchlistCount,
        isLoading: isLoadingWatchlist,
        isAuthenticated,
        removeStock,
        refresh: refreshWatchlist,
    } = useWatchlist();

    const [activeSignalsMap, setActiveSignalsMap] = useState<Record<string, IAISignal>>({});

    const handleStockSelect = useCallback((ticker: string, exchange?: string) => {
        const ex = exchange || selectedExchange;
        router.push(`/stocks/${encodeURIComponent(ticker)}?exchange=${ex}`);
    }, [router, selectedExchange]);

    const fetchActiveSignals = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const result = await getActiveSignals();
            if (result.success && result.data?.items) {
                const map: Record<string, IAISignal> = {};
                for (const item of result.data.items) {
                    if (item.signal) {
                        map[`${item.ticker}:${item.exchange}`] = item.signal;
                    }
                }
                setActiveSignalsMap(map);
            }
        } catch {
            // Silently fail
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated && watchlistItems.length > 0) {
            fetchActiveSignals();
        }
    }, [isAuthenticated, watchlistItems.length, fetchActiveSignals]);

    return (
        <div className="container py-8 md:py-12 px-4 md:px-6 max-w-[1440px] mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-brand-blue/20 to-brand-violet/20 border border-brand-blue/20">
                        <BarChart3 className="h-5 w-5 text-brand-blue" />
                    </div>
                    <Badge
                        variant="outline"
                        className="px-2.5 py-0.5 border-brand-emerald/30 bg-brand-emerald/5 text-brand-emerald text-[10px] uppercase tracking-widest"
                    >
                        {exchangeConfig.name} Live Data
                    </Badge>

                    {/* View Toggle */}
                    <div className="ml-auto flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                        <button
                            onClick={() => setView('bubble')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                                view === 'bubble'
                                    ? 'bg-brand-blue/20 text-brand-blue'
                                    : 'text-muted-foreground hover:text-white',
                            )}
                        >
                            <CircleDot className="h-3.5 w-3.5" />
                            Bubble
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                                view === 'list'
                                    ? 'bg-brand-blue/20 text-brand-blue'
                                    : 'text-muted-foreground hover:text-white',
                            )}
                        >
                            <List className="h-3.5 w-3.5" />
                            List
                        </button>
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {exchangeConfig.indexName} Stocks
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                    {view === 'bubble'
                        ? 'Interactive bubble visualization — size by market cap, color by sector, glow by momentum.'
                        : `Real-time prices and historical data for ${exchangeConfig.indexName} stocks.`}
                </p>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                    <StatItem
                        icon={<TrendingUp className="h-4 w-4 text-brand-blue" />}
                        label="Index"
                        value={exchangeConfig.indexName}
                    />
                    <StatItem
                        icon={<Activity className="h-4 w-4 text-brand-emerald" />}
                        label="Stocks"
                        value={String(exchangeConfig.stockCount)}
                    />
                    <StatItem
                        icon={<Clock className="h-4 w-4 text-brand-violet" />}
                        label="Market Hours"
                        value={`${exchangeConfig.marketOpen} - ${exchangeConfig.marketClose}`}
                    />
                    <StatItem
                        icon={<BarChart3 className="h-4 w-4 text-yellow-400" />}
                        label="Exchange"
                        value={exchangeConfig.fullName}
                    />
                </div>
            </motion.div>

            {/* ─── Mobile Layout: Collapsible Portfolio + Stock listing ─── */}
            <div className="block md:hidden space-y-4">
                {/* Collapsible Portfolio Header */}
                <button
                    onClick={() => setMobilePortfolioOpen(!mobilePortfolioOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <Star className="h-4 w-4 text-brand-emerald" />
                        <span className="text-sm font-semibold text-white">My Portfolio</span>
                        {isAuthenticated && watchlistCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-brand-emerald/15 text-brand-emerald font-medium">
                                {watchlistCount}
                            </span>
                        )}
                    </div>
                    <ChevronDown className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform duration-200',
                        mobilePortfolioOpen && 'rotate-180',
                    )} />
                </button>

                <AnimatePresence>
                    {mobilePortfolioOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <PortfolioPanel
                                isAuthenticated={isAuthenticated}
                                watchlistItems={watchlistItems}
                                isLoadingWatchlist={isLoadingWatchlist}
                                activeSignalsMap={activeSignalsMap}
                                removeStock={removeStock}
                                handleStockSelect={handleStockSelect}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stock listing */}
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {view === 'bubble' ? (
                        <BubbleCluster exchange={selectedExchange} />
                    ) : (
                        <StockList initialExchange={selectedExchange} pageSize={exchangeConfig.stockCount} />
                    )}
                </motion.div>
            </div>

            {/* ─── Desktop Layout: Resizable Split-Screen ─── */}
            <div className="hidden md:block">
                <ResizablePanelGroup
                    direction="horizontal"
                    className="min-h-[650px] rounded-2xl border border-white/10 bg-white/[0.01]"
                >
                    {/* Portfolio Panel */}
                    <ResizablePanel defaultSize={32} minSize={22} maxSize={42}>
                        <div className="h-full flex flex-col overflow-hidden">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                                <div className="flex items-center gap-2.5">
                                    <Star className="h-4 w-4 text-brand-emerald" />
                                    <span className="text-sm font-semibold text-white">My Portfolio</span>
                                    {isAuthenticated && watchlistCount > 0 && (
                                        <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-brand-emerald/15 text-brand-emerald font-medium">
                                            {watchlistCount}
                                        </span>
                                    )}
                                </div>
                                {isAuthenticated && watchlistItems.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={refreshWatchlist}
                                        className="h-7 w-7 text-muted-foreground hover:text-white"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <PortfolioPanel
                                    isAuthenticated={isAuthenticated}
                                    watchlistItems={watchlistItems}
                                    isLoadingWatchlist={isLoadingWatchlist}
                                    activeSignalsMap={activeSignalsMap}
                                    removeStock={removeStock}
                                    handleStockSelect={handleStockSelect}
                                    hideHeader
                                />
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Stock Listing Panel */}
                    <ResizablePanel defaultSize={68} minSize={50}>
                        <div className="h-full p-4 overflow-y-auto custom-scrollbar">
                            <motion.div
                                key={view}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                {view === 'bubble' ? (
                                    <BubbleCluster />
                                ) : (
                                    <StockList initialExchange="NSE" pageSize={50} />
                                )}
                            </motion.div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
}

/* ─── Portfolio Panel (shared between mobile and desktop) ─── */

interface PortfolioPanelProps {
    isAuthenticated: boolean;
    watchlistItems: WatchlistItem[];
    isLoadingWatchlist: boolean;
    activeSignalsMap: Record<string, IAISignal>;
    removeStock: (ticker: string, exchange: string) => Promise<boolean>;
    handleStockSelect: (ticker: string, exchange: string) => void;
    hideHeader?: boolean;
}

function PortfolioPanel({
    isAuthenticated,
    watchlistItems,
    isLoadingWatchlist,
    activeSignalsMap,
    removeStock,
    handleStockSelect,
    hideHeader,
}: PortfolioPanelProps) {
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="p-3 bg-brand-violet/10 rounded-full mb-3">
                    <Lock className="h-6 w-6 text-brand-violet" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">
                    Sign in to view your portfolio
                </h3>
                <p className="text-xs text-muted-foreground text-center max-w-[220px] mb-4">
                    Build your watchlist and activate AI signals.
                </p>
                <Link href="/login?from=/stocks">
                    <Button size="sm" className="bg-brand-violet hover:bg-brand-violet/90 text-white text-xs">
                        Sign In
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className={cn(!hideHeader && 'p-4')}>
            <MyPicksList
                items={watchlistItems}
                isLoading={isLoadingWatchlist}
                onRemove={removeStock}
                onSelectStock={(ticker, exchange) => handleStockSelect(ticker, exchange)}
                activeSignals={activeSignalsMap}
            />
        </div>
    );
}

function StatItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-white/5">{icon}</div>
            <div>
                <div className="text-[11px] text-muted-foreground">{label}</div>
                <div className="text-sm font-semibold text-white">{value}</div>
            </div>
        </div>
    );
}
