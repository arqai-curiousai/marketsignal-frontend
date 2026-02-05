'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IStock, IExchange } from '@/types/stock';
import { getStocks, getExchanges } from '@/lib/api/stockApi';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// New Components
import { StockSignalCard } from '@/components/signals/StockSignalCard';
import { StockListItem } from '@/components/signals/StockListItem';
import { StockChatSheet } from '@/components/stocks/StockChatSheet';
import { ViewToggle, ViewMode } from '@/components/ui/ViewToggle';
import { SignalType } from '@/components/signals/SignalOrb';

interface StockListProps {
    initialExchange?: string;
    pageSize?: number;
}

/**
 * StockList - Grid of stock cards with exchange tabs and search
 * 
 * Features:
 * - List/Grid toggle
 * - Zen-themed signal cards/items
 * - Exchange tab navigation
 * - Search by ticker/name
 * - Pagination
 * - AI Chat integration
 */
export function StockList({
    initialExchange = 'NASDAQ',
    pageSize = 50
}: StockListProps) {
    // State
    const [stocks, setStocks] = useState<IStock[]>([]);
    const [exchanges, setExchanges] = useState<IExchange[]>([]);
    const [currentExchange, setCurrentExchange] = useState(initialExchange);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list view as requested
    const [selectedStock, setSelectedStock] = useState<IStock | null>(null);

    // Fetch exchanges on mount
    useEffect(() => {
        const loadExchanges = async () => {
            const result = await getExchanges();
            if (result.success) {
                setExchanges(result.data);
            }
        };
        loadExchanges();
    }, []);

    // Fetch stocks when exchange, page, or search changes
    const loadStocks = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await getStocks({
            exchange: currentExchange,
            page,
            pageSize,
            search: search || undefined,
        });

        if (result.success) {
            setStocks(result.data.items);
            setTotal(result.data.total);
        } else {
            setError(result.error.detail || result.error.message);
            setStocks([]);
        }

        setIsLoading(false);
    }, [currentExchange, page, pageSize, search]);

    useEffect(() => {
        loadStocks();
    }, [loadStocks]);

    // Handle exchange change
    const handleExchangeChange = (exchange: string) => {
        setCurrentExchange(exchange);
        setPage(1);
        setSearch('');
    };

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadStocks();
    };

    // Calculate pagination
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Helper to get signal for a stock (Placeholder logic for now)
    const getSignalForStock = (_stock: IStock): SignalType => {
        // TODO: Replace with real algo signal logic later
        return 'hold';
    };

    const getConfidenceForStock = (stock: IStock): number => {
        // TODO: Replace with real confidence from backend when available using [stock.signalConfidence]
        // For now, generating stable random confidence based on ticker for UI demo
        const hash = stock.ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        // Normalize to 0.2 - 0.95 range
        return 0.2 + (hash % 76) / 100;
    };

    return (
        <div className="space-y-6">
            {/* Control Bar: Exchange Tabs, Search, View Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Tabs
                    value={currentExchange}
                    onValueChange={handleExchangeChange}
                    className="w-full md:w-auto"
                >
                    <TabsList className="bg-white/5 border border-white/10 p-1 overflow-x-auto max-w-full">
                        {exchanges.length > 0 ? (
                            exchanges.map((exch) => (
                                <TabsTrigger
                                    key={exch.code}
                                    value={exch.code}
                                    className="data-[state=active]:bg-white/10 whitespace-nowrap"
                                >
                                    <span>{exch.code}</span>
                                    <span className="ml-1.5 text-[10px] text-muted-foreground hidden sm:inline">
                                        ({exch.stockCount})
                                    </span>
                                </TabsTrigger>
                            ))
                        ) : (
                            ['NASDAQ', 'NYSE', 'NSE', 'BSE', 'LSE'].map((code) => (
                                <TabsTrigger
                                    key={code}
                                    value={code}
                                    className="data-[state=active]:bg-white/10"
                                >
                                    {code}
                                </TabsTrigger>
                            ))
                        )}
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* View Toggle */}
                    <ViewToggle mode={viewMode} onChange={setViewMode} />

                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex gap-2 flex-1 md:flex-none">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-white/5 border-white/10 w-full"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={loadStocks}
                            disabled={isLoading}
                            className="border-white/10 hover:bg-white/5"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </form>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className={viewMode === 'grid'
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "space-y-2"
                }>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className={viewMode === 'grid'
                                ? "h-44 rounded-xl bg-white/5 animate-pulse border border-white/10"
                                : "h-20 rounded-lg bg-white/5 animate-pulse border border-white/10"
                            }
                        />
                    ))}
                </div>
            ) : (
                <>
                    {/* Stocks Display */}
                    {stocks.length > 0 ? (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {stocks.map((stock, index) => (
                                        <motion.div
                                            key={`${stock.exchange}-${stock.ticker}`}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <StockSignalCard
                                                ticker={stock.ticker}
                                                name={stock.name}
                                                exchange={stock.exchange}
                                                signal={getSignalForStock(stock)}
                                                price={stock.lastPrice}
                                                change={stock.change}
                                                changePercent={stock.changePercent}
                                                confidence={getConfidenceForStock(stock)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {stocks.map((stock, index) => (
                                        <motion.div
                                            key={`${stock.exchange}-${stock.ticker}`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <StockListItem
                                                ticker={stock.ticker}
                                                name={stock.name}
                                                exchange={stock.exchange}
                                                signal={getSignalForStock(stock)}
                                                price={stock.lastPrice}
                                                change={stock.change}
                                                changePercent={stock.changePercent}
                                                confidence={getConfidenceForStock(stock)}
                                                onSelect={() => setSelectedStock(stock)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
                            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No stocks found</h3>
                            <p className="text-muted-foreground">
                                {search
                                    ? `No results for "${search}" on ${currentExchange}`
                                    : `No stocks available for ${currentExchange}`
                                }
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {total > pageSize && (
                        <div className="flex items-center justify-center gap-4 pt-6">
                            <Button
                                variant="outline"
                                disabled={!hasPrevPage}
                                onClick={() => setPage(p => p - 1)}
                                className="border-white/10"
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages} ({total} stocks)
                            </span>
                            <Button
                                variant="outline"
                                disabled={!hasNextPage}
                                onClick={() => setPage(p => p + 1)}
                                className="border-white/10"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* AI Chat Sheet */}
            <StockChatSheet
                isOpen={!!selectedStock}
                onClose={() => setSelectedStock(null)}
                stock={selectedStock}
            />
        </div>
    );
}

export default StockList;
