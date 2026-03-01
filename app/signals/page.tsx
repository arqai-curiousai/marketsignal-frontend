'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
    Star,
    Search,
    Loader2,
    RefreshCw,
    Lock,
    BarChart3,
    DollarSign,
    Gem,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/src/hooks/useWatchlist';
import { MyPicksList } from '@/components/signals/MyPicksList';
import { AddToPicksButton } from '@/components/signals/AddToPicksButton';
import { StockListItem } from '@/components/signals/StockListItem';
import { MarketStatusBadge } from '@/components/signals/MarketStatusBadge';
import { InstrumentList } from '@/components/signals/InstrumentList';
import { getStocks } from '@/src/lib/api/stockApi';
import { getActiveSignals } from '@/src/lib/api/signalApi';
import { IStock } from '@/types/stock';
import type { IAISignal } from '@/types/stock';
import type { SignalType } from '@/components/signals/SignalOrb';
import Link from 'next/link';

/**
 * Markets Hub — India-first intraday signal platform
 *
 * 4 fixed tabs:
 * - My Portfolio: user's watchlist with signal toggle + AI signals
 * - NSE: NIFTY50 stocks with live prices
 * - Currency: Top 5 INR currency pairs
 * - Commodity: Top 5 commodities
 */
export default function MarketsHub() {
    const [activeTab, setActiveTab] = useState('my-portfolio');
    const [searchQuery, setSearchQuery] = useState('');
    const [nseStocks, setNseStocks] = useState<IStock[]>([]);
    const [isLoadingNse, setIsLoadingNse] = useState(false);
    const [activeSignalsMap, setActiveSignalsMap] = useState<Record<string, IAISignal>>({});
    const router = useRouter();

    const {
        items: watchlistItems,
        count: watchlistCount,
        maxSize: watchlistMaxSize,
        isLoading: isLoadingWatchlist,
        isAuthenticated,
        addStock,
        removeStock,
        isInWatchlist,
        refresh: refreshWatchlist,
    } = useWatchlist();

    const handleStockSelect = (ticker: string) => {
        router.push(`/stocks/${ticker}`);
    };

    // Fetch NSE stocks
    const fetchNseStocks = useCallback(async () => {
        setIsLoadingNse(true);
        try {
            const result = await getStocks({
                exchange: 'NSE',
                page: 1,
                pageSize: 50,
                search: searchQuery || undefined,
            });
            if (result.success) {
                setNseStocks(result.data.items || []);
            } else {
                setNseStocks([]);
            }
        } catch {
            setNseStocks([]);
        } finally {
            setIsLoadingNse(false);
        }
    }, [searchQuery]);

    // Fetch NSE when tab selected or search changes
    useEffect(() => {
        if (activeTab === 'nse') {
            const timer = setTimeout(() => fetchNseStocks(), 300);
            return () => clearTimeout(timer);
        }
    }, [activeTab, searchQuery, fetchNseStocks]);

    // Fetch active signals for portfolio items
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
            // Silently fail — signals are supplementary
        }
    }, [isAuthenticated]);

    // Load active signals when portfolio tab is visible and watchlist changes
    useEffect(() => {
        if (activeTab === 'my-portfolio' && isAuthenticated && watchlistItems.length > 0) {
            fetchActiveSignals();
        }
    }, [activeTab, isAuthenticated, watchlistItems.length, fetchActiveSignals]);

    const handleAddStock = async (ticker: string, exchange: string) => {
        if (!isAuthenticated) {
            window.location.href = '/login?from=/signals';
            return false;
        }
        return await addStock(ticker, exchange);
    };

    const handleAddInstrument = async (ticker: string, exchange: string, instrumentType: string) => {
        if (!isAuthenticated) {
            window.location.href = '/login?from=/signals';
            return;
        }
        await addStock(ticker, exchange, undefined, instrumentType);
    };

    return (
        <div className="container py-12 px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Markets</h1>
                    <p className="text-muted-foreground">
                        India-first intraday signals powered by dual AI agents.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Market status badges */}
                    <MarketStatusBadge market="nse" />
                    <MarketStatusBadge market="forex" />
                    <MarketStatusBadge market="commodity" />

                    {/* Watchlist stats */}
                    {isAuthenticated && (
                        <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                            <Star className="h-4 w-4 text-brand-violet" />
                            <span className="text-sm text-muted-foreground">
                                <span className="text-white font-semibold">{watchlistCount}</span>
                                /{watchlistMaxSize} picks
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-white/5 border border-white/10 p-1.5 flex-wrap h-auto">
                        {/* My Portfolio */}
                        <TabsTrigger
                            value="my-portfolio"
                            className={cn(
                                'data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-blue/50 data-[state=active]:to-brand-violet/50',
                                'data-[state=active]:text-white data-[state=active]:border-none',
                                'flex items-center gap-2 px-4 py-2',
                            )}
                        >
                            <Star className="h-4 w-4" />
                            My Portfolio
                            {isAuthenticated && watchlistCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/10">
                                    {watchlistCount}
                                </span>
                            )}
                        </TabsTrigger>

                        {/* NSE */}
                        <TabsTrigger
                            value="nse"
                            className={cn(
                                'data-[state=active]:bg-white/10 data-[state=active]:text-white',
                                'flex items-center gap-2 px-3 py-2',
                            )}
                        >
                            <BarChart3 className="h-4 w-4" />
                            NSE
                        </TabsTrigger>

                        {/* Currency */}
                        <TabsTrigger
                            value="currency"
                            className={cn(
                                'data-[state=active]:bg-white/10 data-[state=active]:text-white',
                                'flex items-center gap-2 px-3 py-2',
                            )}
                        >
                            <DollarSign className="h-4 w-4" />
                            Currency
                        </TabsTrigger>

                        {/* Commodity */}
                        <TabsTrigger
                            value="commodity"
                            className={cn(
                                'data-[state=active]:bg-white/10 data-[state=active]:text-white',
                                'flex items-center gap-2 px-3 py-2',
                            )}
                        >
                            <Gem className="h-4 w-4" />
                            Commodity
                        </TabsTrigger>
                    </TabsList>

                    {/* Search — only for NSE tab */}
                    {activeTab === 'nse' && (
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search NIFTY50 stocks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10"
                            />
                        </div>
                    )}
                </div>

                {/* ============================================================ */}
                {/* My Portfolio */}
                {/* ============================================================ */}
                <TabsContent value="my-portfolio" className="mt-0">
                    {!isAuthenticated ? (
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                            <div className="p-4 bg-brand-violet/10 rounded-full mb-4">
                                <Lock className="h-8 w-8 text-brand-violet" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Login to View Your Portfolio
                            </h3>
                            <p className="text-muted-foreground text-center max-w-md mb-6">
                                Sign in to build your portfolio and activate AI-powered signals.
                            </p>
                            <Link href="/login?from=/signals">
                                <Button className="bg-brand-violet hover:bg-brand-violet/90 text-white">
                                    Sign In / Register
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <MyPicksList
                                items={watchlistItems}
                                isLoading={isLoadingWatchlist}
                                onRemove={removeStock}
                                onSelectStock={(ticker) => handleStockSelect(ticker)}
                                activeSignals={activeSignalsMap}
                            />

                            {watchlistItems.length > 0 && (
                                <div className="flex justify-center mt-6">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={refreshWatchlist}
                                        className="text-muted-foreground hover:text-white"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh prices
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* ============================================================ */}
                {/* NSE (NIFTY50) */}
                {/* ============================================================ */}
                <TabsContent value="nse" className="mt-0">
                    {isLoadingNse ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-brand-blue mb-4" />
                            <p className="text-muted-foreground">Loading NIFTY50 stocks...</p>
                        </div>
                    ) : nseStocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl">
                            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No stocks found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery ? 'Try a different search term' : 'No NSE stocks available yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-[600px] overflow-y-auto scroll-smooth pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {nseStocks.map((stock) => (
                                    <div key={stock.ticker} className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <StockListItem
                                                ticker={stock.ticker}
                                                name={stock.name || stock.ticker}
                                                exchange="NSE"
                                                signal={(stock.signal?.signal as SignalType) || 'hold'}
                                                price={stock.lastPrice}
                                                change={stock.change}
                                                changePercent={stock.changePercent}
                                                confidence={stock.signal?.confidence}
                                                currency="INR"
                                                onSelect={() => handleStockSelect(stock.ticker)}
                                            />
                                        </div>
                                        <AddToPicksButton
                                            ticker={stock.ticker}
                                            exchange="NSE"
                                            isInWatchlist={isInWatchlist(stock.ticker, 'NSE')}
                                            onAdd={() => handleAddStock(stock.ticker, 'NSE')}
                                            onRemove={() => removeStock(stock.ticker, 'NSE')}
                                        />
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </TabsContent>

                {/* ============================================================ */}
                {/* Currency */}
                {/* ============================================================ */}
                <TabsContent value="currency" className="mt-0">
                    <InstrumentList
                        type="currency"
                        onAddToPortfolio={handleAddInstrument}
                    />
                </TabsContent>

                {/* ============================================================ */}
                {/* Commodity */}
                {/* ============================================================ */}
                <TabsContent value="commodity" className="mt-0">
                    <InstrumentList
                        type="commodity"
                        onAddToPortfolio={handleAddInstrument}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
