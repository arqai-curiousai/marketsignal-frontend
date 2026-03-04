'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IStock } from '@/types/stock';
import { getStocks } from '@/lib/api/stockApi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
 * StockList - Professional stock list for NSE NIFTY 50
 *
 * Features:
 * - List/Grid toggle
 * - Search by ticker or company name
 * - Sector filter badges
 * - Real-time price data from Kite Connect
 * - Pagination
 * - AI Chat integration
 */
export function StockList({
    initialExchange = 'NSE',
    pageSize = 50,
}: StockListProps) {
    const [stocks, setStocks] = useState<IStock[]>([]);
    const [currentExchange] = useState(initialExchange);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [activeSector, setActiveSector] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedStock, setSelectedStock] = useState<IStock | null>(null);
    const [, setLastUpdated] = useState<Date | null>(null);

    // Fetch stocks
    const loadStocks = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await getStocks({
            exchange: currentExchange,
            page,
            pageSize,
            sector: activeSector || undefined,
            search: search || undefined,
        });

        if (result.success) {
            setStocks(result.data.items);
            setTotal(result.data.total);
            setLastUpdated(new Date());
        } else {
            setError(result.error.detail || result.error.message);
            setStocks([]);
        }

        setIsLoading(false);
    }, [currentExchange, page, pageSize, search, activeSector]);

    useEffect(() => {
        loadStocks();
    }, [loadStocks]);

    // Sector list extracted from stocks
    const sectors = React.useMemo(() => {
        const sectorSet = new Set<string>();
        stocks.forEach((s) => {
            if (s.sector) sectorSet.add(s.sector);
        });
        return Array.from(sectorSet).sort();
    }, [stocks]);

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadStocks();
    };

    const handleSectorFilter = (sector: string | null) => {
        setActiveSector(sector);
        setPage(1);
    };

    // Pagination
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const getSignalForStock = (_stock: IStock): SignalType | null => null;
    const getConfidenceForStock = (_stock: IStock): number => 0;

    const hasAnyPrice = stocks.some((s) => s.lastPrice != null);

    return (
        <div className="space-y-4">
            {/* Control Bar */}
            <div className="flex flex-col gap-3">
                {/* Top: Search + Actions */}
                <div className="flex items-center justify-between gap-3">
                    {/* Exchange Badge */}
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="px-3 py-1.5 border-brand-blue/30 bg-brand-blue/5 text-brand-blue font-mono text-xs"
                        >
                            NSE
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {total > 0 ? `${total} stocks` : 'NIFTY 50'}
                        </span>
                        {hasAnyPrice && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                                <Wifi className="h-3 w-3" />
                                Live
                            </span>
                        )}
                        {!hasAnyPrice && !isLoading && stocks.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <WifiOff className="h-3 w-3" />
                                Cached
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <ViewToggle mode={viewMode} onChange={setViewMode} />

                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative w-48 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search ticker or name..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 bg-white/5 border-white/10 text-sm"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={loadStocks}
                                disabled={isLoading}
                                className="h-9 w-9 border-white/10 hover:bg-white/5"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Sector Filter Chips */}
                {sectors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        <button
                            onClick={() => handleSectorFilter(null)}
                            className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                                activeSector === null
                                    ? 'bg-white/15 text-white'
                                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                            }`}
                        >
                            All
                        </button>
                        {sectors.map((sector) => (
                            <button
                                key={sector}
                                onClick={() => handleSectorFilter(sector)}
                                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                                    activeSector === sector
                                        ? 'bg-white/15 text-white'
                                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                                }`}
                            >
                                {sector}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className={viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
                    : 'space-y-1.5'
                }>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className={viewMode === 'grid'
                                ? 'h-40 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.06]'
                                : 'h-16 rounded-lg bg-white/[0.03] animate-pulse border border-white/[0.06]'
                            }
                        />
                    ))}
                </div>
            ) : (
                <>
                    {stocks.length > 0 ? (
                        <>
                            {/* Table Header (list view only) */}
                            {viewMode === 'list' && (
                                <div className="hidden sm:flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground/60 uppercase tracking-wider">
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="min-w-[56px]">Ticker</span>
                                        <span className="flex-1">Company</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="hidden lg:block w-20 text-center">Signal</span>
                                        <span className="min-w-[100px] text-right">Price</span>
                                        <span className="w-[44px]" />
                                    </div>
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                {viewMode === 'grid' ? (
                                    <motion.div
                                        key="grid"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                                    >
                                        {stocks.map((stock, index) => (
                                            <motion.div
                                                key={`${stock.exchange}-${stock.ticker}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.02 }}
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
                                                    onSelect={() => setSelectedStock(stock)}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-1"
                                    >
                                        {stocks.map((stock, index) => (
                                            <motion.div
                                                key={`${stock.exchange}-${stock.ticker}`}
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.015 }}
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
                                                    sector={stock.sector}
                                                    currency={stock.currency || 'INR'}
                                                    onSelect={() => setSelectedStock(stock)}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-base font-medium text-white mb-1">No stocks found</h3>
                            <p className="text-sm text-muted-foreground">
                                {search
                                    ? `No results for "${search}"`
                                    : 'Stocks will appear once data is synced from Kite Connect'
                                }
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {total > pageSize && (
                        <div className="flex items-center justify-between pt-4">
                            <span className="text-xs text-muted-foreground">
                                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!hasPrevPage}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="border-white/10 h-8"
                                >
                                    Previous
                                </Button>
                                <span className="text-xs text-muted-foreground px-2">
                                    {page} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!hasNextPage}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="border-white/10 h-8"
                                >
                                    Next
                                </Button>
                            </div>
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
