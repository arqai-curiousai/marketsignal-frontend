'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2, Loader2 } from 'lucide-react';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';

interface StockOHLCV {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export default function StockAnalyticsPage() {
    const params = useParams();
    const ticker = typeof params.ticker === 'string' ? params.ticker.toUpperCase() : '';
    const [ohlcv, setOhlcv] = useState<StockOHLCV[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!ticker) return;
        async function fetchData() {
            try {
                const response = await apiClient.get(`/api/stocks/${ticker}/ohlcv`, {
                    params: { period: '1d', limit: 30 },
                });
                setOhlcv(response.data?.bars ?? response.data ?? []);
            } catch {
                console.warn(`Failed to fetch OHLCV for ${ticker}`);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [ticker]);

    const latestBar = ohlcv.length > 0 ? ohlcv[0] : null;
    const prevBar = ohlcv.length > 1 ? ohlcv[1] : null;
    const highestHigh = ohlcv.length > 0 ? Math.max(...ohlcv.map(b => b.high)) : null;
    const lowestLow = ohlcv.length > 0 ? Math.min(...ohlcv.map(b => b.low)) : null;

    return (
        <div className="container py-12 px-6 max-w-7xl mx-auto">
            {/* Header / Back */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <NextLink href="/stocks">
                    <Button variant="ghost" className="text-muted-foreground hover:text-white pl-0 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Stocks
                    </Button>
                </NextLink>
            </motion.div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-8"
            >
                {/* Title Section */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-white">{ticker}</h1>
                            <Badge variant="outline" className="border-white/20 text-white/50">
                                Stock
                            </Badge>
                        </div>
                        <p className="text-lg text-muted-foreground">Stock Analytics</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Chart Area */}
                    <div className="md:col-span-2 h-[400px] rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-8 text-center">
                        {loading ? (
                            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                        ) : ohlcv.length === 0 ? (
                            <>
                                <BarChart2 className="h-16 w-16 text-brand-blue mb-4 opacity-50" />
                                <h3 className="text-xl font-medium text-white mb-2">No Data Available</h3>
                                <p className="text-muted-foreground max-w-md">
                                    OHLCV data for {ticker} is not yet available. Data will appear once the pipeline syncs this stock.
                                </p>
                            </>
                        ) : (
                            <>
                                <BarChart2 className="h-16 w-16 text-brand-blue mb-4 opacity-50" />
                                <h3 className="text-xl font-medium text-white mb-2">
                                    {ohlcv.length} Trading Days Loaded
                                </h3>
                                <p className="text-muted-foreground max-w-md">
                                    Latest close: <span className="text-white font-mono">${latestBar?.close.toFixed(2)}</span>
                                    {prevBar && (
                                        <span className={latestBar && latestBar.close >= prevBar.close ? ' text-emerald-400' : ' text-red-400'}>
                                            {' '}({((latestBar!.close - prevBar.close) / prevBar.close * 100).toFixed(2)}%)
                                        </span>
                                    )}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Stats / Key Levels */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                Latest Price
                            </h3>
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : latestBar ? (
                                <>
                                    <span className="text-2xl font-bold text-white font-mono">
                                        ${latestBar.close.toFixed(2)}
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Vol: {latestBar.volume.toLocaleString()}
                                    </p>
                                </>
                            ) : (
                                <span className="text-muted-foreground">--</span>
                            )}
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                Key Levels ({ohlcv.length}d Range)
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Resistance (High)</span>
                                    <span className="text-red-400 font-mono">
                                        {highestHigh !== null ? `$${highestHigh.toFixed(2)}` : '--'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Support (Low)</span>
                                    <span className="text-emerald-400 font-mono">
                                        {lowestLow !== null ? `$${lowestLow.toFixed(2)}` : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
