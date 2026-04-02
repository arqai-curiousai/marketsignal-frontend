'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2, Loader2, TrendingUp, TrendingDown, Minus, Zap, Newspaper } from 'lucide-react';
import NextLink from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/apiClient';
import { getStockNews } from '@/src/lib/api/analyticsApi';
import type { INewsArticle } from '@/types/analytics';
import { ArticleCard } from '@/components/analytics/news/ArticleCard';
import { getExchangeConfig, isValidExchange } from '@/lib/exchange/config';
import { getCurrencySymbol as getExchangeCurrencySymbol } from '@/lib/exchange/formatting';

interface StockOHLCV {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface StockQuote {
    ticker: string;
    exchange: string;
    price: number;
    change: number;
    change_percent: number;
    high: number;
    low: number;
    volume: number;
    timestamp: string;
}

function getInstrumentType(exchange: string): string {
    switch (exchange) {
        case 'FX': return 'Currency';
        case 'CMDTY': return 'Commodity';
        default: return 'Stock';
    }
}

function getCurrencySymbol(exchange: string): string {
    return getExchangeCurrencySymbol(isValidExchange(exchange) ? exchange : 'NSE');
}

function formatPrice(value: number, exchange?: string): string {
    const config = getExchangeConfig(exchange ?? 'NSE');
    return new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export default function StockAnalyticsPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const ticker = typeof params.ticker === 'string' ? decodeURIComponent(params.ticker).toUpperCase() : '';
    const rawExchange = searchParams.get('exchange') || 'NSE';
    const exchange = isValidExchange(rawExchange) ? rawExchange : 'NSE';

    const [ohlcv, setOhlcv] = useState<StockOHLCV[]>([]);
    const [quote, setQuote] = useState<StockQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [quoteLoading, setQuoteLoading] = useState(true);
    const [newsArticles, setNewsArticles] = useState<INewsArticle[]>([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [quoteFailed, setQuoteFailed] = useState(false);

    const instrumentType = getInstrumentType(exchange);
    const currencySymbol = getCurrencySymbol(exchange);

    // Fetch quote + news + OHLCV in parallel
    useEffect(() => {
        if (!ticker) return;
        const controller = new AbortController();

        async function fetchAll() {
            const [quoteResult, newsResult, ohlcvResult] = await Promise.allSettled([
                apiClient.get<StockQuote>(
                    `/api/stocks/${encodeURIComponent(ticker)}/quote`,
                    { exchange },
                    { signal: controller.signal },
                ),
                getStockNews(ticker, 10, controller.signal),
                apiClient.get<{ bars?: StockOHLCV[] } | StockOHLCV[]>(
                    `/api/stocks/${encodeURIComponent(ticker)}/ohlcv`,
                    { period: '1d', limit: 30, exchange },
                    { signal: controller.signal },
                ),
            ]);

            if (controller.signal.aborted) return;

            // Quote
            if (quoteResult.status === 'fulfilled' && quoteResult.value.success && quoteResult.value.data) {
                setQuote(quoteResult.value.data);
            } else {
                setQuoteFailed(true);
            }
            setQuoteLoading(false);

            // News
            if (newsResult.status === 'fulfilled' && newsResult.value.success && newsResult.value.data?.items) {
                setNewsArticles(newsResult.value.data.items);
            }
            setNewsLoading(false);

            // OHLCV
            if (ohlcvResult.status === 'fulfilled' && ohlcvResult.value.success) {
                const d = ohlcvResult.value.data;
                setOhlcv(Array.isArray(d) ? d : (d as { bars?: StockOHLCV[] }).bars ?? []);
            }
            setLoading(false);
        }

        fetchAll();
        return () => controller.abort();
    }, [ticker, exchange]);

    // If both quote and OHLCV fetches completed with no data, the ticker is invalid
    if (!quoteLoading && !loading && quoteFailed && ohlcv.length === 0 && !quote) {
        notFound();
    }

    const latestBar = ohlcv.length > 0 ? ohlcv[0] : null;
    const highestHigh = ohlcv.length > 0 ? Math.max(...ohlcv.map(b => b.high)) : null;
    const lowestLow = ohlcv.length > 0 ? Math.min(...ohlcv.map(b => b.low)) : null;

    // Use quote price if available, else fall back to OHLCV
    const currentPrice = quote?.price ?? latestBar?.close ?? null;
    const priceChange = quote?.change ?? null;
    const priceChangePercent = quote?.change_percent ?? null;
    const isPositive = (priceChange ?? 0) > 0;
    const isNegative = (priceChange ?? 0) < 0;
    const displayName = ticker;

    return (
        <div className="container py-12 px-6 max-w-7xl mx-auto">
            {/* Header / Back */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8"
            >
                <NextLink href="/signals">
                    <Button variant="ghost" className="text-muted-foreground hover:text-white pl-0 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Pulse
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
                            <h1 className="text-4xl font-bold text-white">{displayName}</h1>
                            <Badge variant="outline" className="border-white/20 text-white/50">
                                {instrumentType}
                            </Badge>
                            <Badge variant="outline" className="border-white/20 text-white/50">
                                {exchange}
                            </Badge>
                        </div>
                        <p className="text-lg text-muted-foreground">{displayName} Analytics</p>
                    </div>
                </div>

                {/* Price Hero */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    {quoteLoading && loading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : currentPrice !== null ? (
                        <div className="flex items-end gap-4">
                            <span className="text-4xl font-bold text-white font-mono">
                                {currencySymbol}{formatPrice(currentPrice)}
                            </span>
                            {priceChange !== null && priceChangePercent !== null && (
                                <div className="flex items-center gap-2 pb-1">
                                    {isPositive ? (
                                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                                    ) : isNegative ? (
                                        <TrendingDown className="h-5 w-5 text-red-400" />
                                    ) : (
                                        <Minus className="h-5 w-5 text-muted-foreground" />
                                    )}
                                    <span className={
                                        isPositive ? 'text-emerald-400 font-semibold' :
                                        isNegative ? 'text-red-400 font-semibold' :
                                        'text-muted-foreground font-semibold'
                                    }>
                                        {isPositive && '+'}{priceChange.toFixed(2)} ({isPositive && '+'}{priceChangePercent.toFixed(2)}%)
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-2xl text-muted-foreground">Price unavailable</span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Chart Area */}
                    <div className="md:col-span-2 h-[400px] rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-8 text-center">
                        {loading ? (
                            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                        ) : ohlcv.length === 0 ? (
                            <>
                                <BarChart2 className="h-16 w-16 text-brand-blue mb-4 opacity-50" />
                                <h3 className="text-xl font-medium text-white mb-2">No OHLCV Data</h3>
                                <p className="text-muted-foreground max-w-md">
                                    Historical data for {ticker} is not yet available. Data will appear once the pipeline syncs this instrument.
                                </p>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col">
                                <div className="flex items-center justify-between mb-3 px-2">
                                    <span className="text-xs text-muted-foreground">{ohlcv.length} day price range</span>
                                    <span className="text-xs text-white font-mono">
                                        Latest: {currencySymbol}{latestBar ? formatPrice(latestBar.close, exchange) : '--'}
                                    </span>
                                </div>
                                <div className="flex-1 flex items-end gap-[2px] px-2 pb-2">
                                    {ohlcv.slice().reverse().map((bar, idx) => {
                                        const range = (highestHigh ?? 1) - (lowestLow ?? 0) || 1;
                                        const pct = ((bar.close - (lowestLow ?? 0)) / range) * 100;
                                        const isUp = bar.close >= bar.open;
                                        return (
                                            <div
                                                key={idx}
                                                className="flex-1 rounded-t-sm transition-all"
                                                style={{
                                                    height: `${Math.max(pct, 4)}%`,
                                                    backgroundColor: isUp ? 'rgba(52, 211, 153, 0.5)' : 'rgba(248, 113, 113, 0.4)',
                                                }}
                                                title={`${new Date(bar.timestamp).toLocaleDateString()} Close: ${currencySymbol}${formatPrice(bar.close, exchange)}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        {/* Quote Stats */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                Day Stats
                            </h3>
                            {quoteLoading && loading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Open</span>
                                        <span className="text-white font-mono">
                                            {latestBar ? `${currencySymbol}${formatPrice(latestBar.open)}` : '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">High</span>
                                        <span className="text-white font-mono">
                                            {(quote?.high ?? latestBar?.high) != null
                                                ? `${currencySymbol}${formatPrice((quote?.high ?? latestBar?.high) as number)}`
                                                : '--'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Low</span>
                                        <span className="text-white font-mono">
                                            {(quote?.low ?? latestBar?.low) != null
                                                ? `${currencySymbol}${formatPrice((quote?.low ?? latestBar?.low) as number)}`
                                                : '--'}
                                        </span>
                                    </div>
                                    {(exchange as string) !== 'FX' && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Volume</span>
                                            <span className="text-white font-mono">
                                                {(quote?.volume ?? latestBar?.volume) != null
                                                    ? (quote?.volume ?? latestBar?.volume)?.toLocaleString(getExchangeConfig(exchange).locale)
                                                    : '--'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Key Levels */}
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                                Key Levels ({ohlcv.length}d Range)
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Resistance (High)</span>
                                    <span className="text-red-400 font-mono">
                                        {highestHigh !== null ? `${currencySymbol}${formatPrice(highestHigh)}` : '--'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Support (Low)</span>
                                    <span className="text-emerald-400 font-mono">
                                        {lowestLow !== null ? `${currencySymbol}${formatPrice(lowestLow)}` : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* View AI Signal */}
                        <NextLink href={`/signals/${encodeURIComponent(ticker)}`}>
                            <Button className="w-full bg-gradient-to-r from-brand-blue to-brand-violet hover:opacity-90 text-white gap-2">
                                <Zap className="h-4 w-4" />
                                View AI Signal
                            </Button>
                        </NextLink>
                    </div>
                </div>

                {/* Stock News Section */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Newspaper className="h-5 w-5 text-brand-blue" />
                        Latest News
                    </h2>
                    {newsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
                        </div>
                    ) : newsArticles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground rounded-xl border border-white/10 bg-white/[0.02]">
                            <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No recent news found for {ticker}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {newsArticles.map((article, idx) => (
                                <ArticleCard
                                    key={article.id}
                                    article={article}
                                    index={idx}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
