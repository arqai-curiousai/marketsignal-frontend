'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    TrendingUp,
    Search,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/src/hooks/useWatchlist';
import { MyPicksList } from '@/components/signals/MyPicksList';
import { AddToPicksButton } from '@/components/signals/AddToPicksButton';
import { getStocks } from '@/src/lib/api/stockApi';
import { IStock } from '@/types/stock';

// Exchange tabs ordered per user requirement: NSE, BSE first, then America, then LSE
const EXCHANGES = [
    { id: 'NSE', name: 'NSE', flag: '🇮🇳' },
    { id: 'BSE', name: 'BSE', flag: '🇮🇳' },
    { id: 'NASDAQ', name: 'NASDAQ', flag: '🇺🇸' },
    { id: 'NYSE', name: 'NYSE', flag: '🇺🇸' },
    { id: 'LSE', name: 'LSE', flag: '🇬🇧' },
];

/**
 * SignalsHub - Main signals page with My Picks and exchange tabs
 * 
 * Features:
 * - "My Picks" as default tab showing user's selected stocks
 * - Exchange tabs for browsing and adding stocks
 * - Smooth scrolling with 50 stock limit
 * - Modern tab design with gradients
 */
export default function SignalsHub() {
    const [activeTab, setActiveTab] = useState('my-picks');
    const [searchQuery, setSearchQuery] = useState('');
    const [exchangeStocks, setExchangeStocks] = useState<IStock[]>([]);
    const [isLoadingStocks, setIsLoadingStocks] = useState(false);

    const {
        items: watchlistItems,
        count: watchlistCount,
        maxSize: watchlistMaxSize,
        isLoading: isLoadingWatchlist,
        addStock,
        removeStock,
        isInWatchlist,
        refresh: refreshWatchlist
    } = useWatchlist();

    // Fetch stocks when exchange tab is selected
    const fetchExchangeStocks = useCallback(async (exchange: string) => {
        if (exchange === 'my-picks') return;

        setIsLoadingStocks(true);
        try {
            const result = await getStocks({
                exchange,
                page: 1,
                pageSize: 50,
                search: searchQuery || undefined
            });
            if (result.success) {
                setExchangeStocks(result.data.items || []);
            } else {
                setExchangeStocks([]);
            }
        } catch (error) {
            console.error('Failed to fetch stocks:', error);
            setExchangeStocks([]);
        } finally {
            setIsLoadingStocks(false);
        }
    }, [searchQuery]);

    // Fetch stocks when tab changes (excluding my-picks)
    useEffect(() => {
        if (activeTab !== 'my-picks') {
            fetchExchangeStocks(activeTab);
        }
    }, [activeTab, fetchExchangeStocks]);

    // Debounced search
    useEffect(() => {
        if (activeTab === 'my-picks') return;

        const timer = setTimeout(() => {
            fetchExchangeStocks(activeTab);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab, fetchExchangeStocks]);

    const handleAddStock = async (ticker: string, exchange: string) => {
        return await addStock(ticker, exchange);
    };

    const handleRemoveStock = async (ticker: string, exchange: string) => {
        return await removeStock(ticker, exchange);
    };

    return (
        <div className="container py-12 px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        My Signals
                    </h1>
                    <p className="text-muted-foreground">
                        Track your favorite stocks and discover new opportunities.
                    </p>
                </div>

                {/* Watchlist stats */}
                <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <Star className="h-4 w-4 text-brand-violet" />
                    <span className="text-sm text-muted-foreground">
                        <span className="text-white font-semibold">{watchlistCount}</span>
                        /{watchlistMaxSize} picks
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <TabsList className="bg-white/5 border border-white/10 p-1.5 flex-wrap h-auto">
                        {/* My Picks Tab - Default */}
                        <TabsTrigger
                            value="my-picks"
                            className={cn(
                                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-blue/50 data-[state=active]:to-brand-violet/50",
                                "data-[state=active]:text-white data-[state=active]:border-none",
                                "flex items-center gap-2 px-4 py-2"
                            )}
                        >
                            <Star className="h-4 w-4" />
                            My Picks
                            {watchlistCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/10">
                                    {watchlistCount}
                                </span>
                            )}
                        </TabsTrigger>

                        {/* Exchange Tabs */}
                        {EXCHANGES.map((exchange) => (
                            <TabsTrigger
                                key={exchange.id}
                                value={exchange.id}
                                className={cn(
                                    "data-[state=active]:bg-white/10 data-[state=active]:text-white",
                                    "flex items-center gap-2 px-4 py-2"
                                )}
                            >
                                <span>{exchange.flag}</span>
                                {exchange.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Search - Only show for exchange tabs */}
                    {activeTab !== 'my-picks' && (
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search stocks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white/5 border-white/10"
                            />
                        </div>
                    )}
                </div>

                {/* My Picks Content */}
                <TabsContent value="my-picks" className="mt-0">
                    <MyPicksList
                        items={watchlistItems}
                        isLoading={isLoadingWatchlist}
                        onRemove={handleRemoveStock}
                        onSelectStock={(ticker, exchange) => {
                            // Could navigate to stock detail page
                            console.log('Selected stock:', ticker, exchange);
                        }}
                    />

                    {/* Refresh button */}
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
                </TabsContent>

                {/* Exchange Content */}
                {EXCHANGES.map((exchange) => (
                    <TabsContent key={exchange.id} value={exchange.id} className="mt-0">
                        {isLoadingStocks ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-brand-blue mb-4" />
                                <p className="text-muted-foreground">
                                    Loading {exchange.name} stocks...
                                </p>
                            </div>
                        ) : exchangeStocks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl">
                                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">
                                    No stocks found
                                </h3>
                                <p className="text-muted-foreground">
                                    {searchQuery
                                        ? 'Try a different search term'
                                        : `No ${exchange.name} stocks available`
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto scroll-smooth pr-2 custom-scrollbar">
                                <AnimatePresence>
                                    {exchangeStocks.map((stock, index) => (
                                        <motion.div
                                            key={`${stock.ticker}-${stock.exchange}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl",
                                                "bg-white/5 border border-white/10 hover:bg-white/10",
                                                "transition-colors duration-200"
                                            )}
                                        >
                                            {/* Stock Info */}
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="p-2 rounded-lg bg-white/10">
                                                    <TrendingUp className="h-4 w-4 text-brand-emerald" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white text-lg">
                                                            {stock.ticker}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                                                            {stock.exchange}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {stock.name || stock.ticker}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Price (if available) */}
                                            <div className="text-right mx-4">
                                                {stock.lastPrice !== undefined && stock.lastPrice !== null ? (
                                                    <div className="text-lg font-semibold text-white">
                                                        ₹{stock.lastPrice.toLocaleString('en-IN', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">--</span>
                                                )}
                                            </div>

                                            {/* Add to Picks Button */}
                                            <AddToPicksButton
                                                ticker={stock.ticker}
                                                exchange={stock.exchange}
                                                isInWatchlist={isInWatchlist(stock.ticker, stock.exchange)}
                                                onAdd={() => handleAddStock(stock.ticker, stock.exchange)}
                                                onRemove={() => handleRemoveStock(stock.ticker, stock.exchange)}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
