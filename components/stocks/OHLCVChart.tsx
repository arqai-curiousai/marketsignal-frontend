'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IOHLCVBar, OHLCVPeriod, OHLCV_PERIODS, formatPrice, formatVolume } from '@/types/stock';
import { getOHLCV } from '@/lib/api/stockApi';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface OHLCVChartProps {
    ticker: string;
    exchange?: string;
    initialPeriod?: OHLCVPeriod;
    height?: number;
    className?: string;
}

/**
 * OHLCVChart - Simple price chart with period selector
 * 
 * Uses SVG for lightweight rendering without external dependencies.
 * Shows price line with volume bars.
 */
export function OHLCVChart({
    ticker,
    exchange = 'NASDAQ',
    initialPeriod = '1d',
    height = 300,
    className,
}: OHLCVChartProps) {
    const [bars, setBars] = useState<IOHLCVBar[]>([]);
    const [period, setPeriod] = useState<OHLCVPeriod>(initialPeriod);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch OHLCV data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            const result = await getOHLCV({
                ticker,
                exchange,
                period,
                limit: 100,
            });

            if (result.success) {
                setBars(result.data.bars);
            } else {
                setError(result.error.detail || result.error.message);
                setBars([]);
            }

            setIsLoading(false);
        };

        loadData();
    }, [ticker, exchange, period]);

    // Calculate chart metrics
    const chartMetrics = useMemo(() => {
        if (bars.length === 0) return null;

        const closes = bars.map((b) => b.close);
        const volumes = bars.map((b) => b.volume);

        const minPrice = Math.min(...closes) * 0.995;
        const maxPrice = Math.max(...closes) * 1.005;
        const maxVolume = Math.max(...volumes);

        const priceRange = maxPrice - minPrice;
        const firstPrice = closes[0];
        const lastPrice = closes[closes.length - 1];
        const priceChange = lastPrice - firstPrice;
        const priceChangePercent = (priceChange / firstPrice) * 100;

        return {
            minPrice,
            maxPrice,
            priceRange,
            maxVolume,
            firstPrice,
            lastPrice,
            priceChange,
            priceChangePercent,
            isPositive: priceChange >= 0,
        };
    }, [bars]);

    // Generate SVG path for price line
    const pricePath = useMemo(() => {
        if (!chartMetrics || bars.length === 0) return '';

        const width = 100; // SVG viewBox percentage
        const priceHeight = 70; // 70% for price

        const points = bars.map((bar, i) => {
            const x = (i / (bars.length - 1)) * width;
            const y = priceHeight - ((bar.close - chartMetrics.minPrice) / chartMetrics.priceRange) * priceHeight;
            return `${x},${y}`;
        });

        return `M${points.join(' L')}`;
    }, [bars, chartMetrics]);

    // Generate area path (for gradient fill)
    const areaPath = useMemo(() => {
        if (!pricePath) return '';
        return `${pricePath} L100,70 L0,70 Z`;
    }, [pricePath]);

    if (isLoading) {
        return (
            <Card className={cn("p-6 flex items-center justify-center", className)} style={{ height }}>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={cn("p-6 flex items-center justify-center", className)} style={{ height }}>
                <p className="text-muted-foreground">{error}</p>
            </Card>
        );
    }

    if (!chartMetrics || bars.length === 0) {
        return (
            <Card className={cn("p-6 flex items-center justify-center", className)} style={{ height }}>
                <p className="text-muted-foreground">No data available for {ticker}</p>
            </Card>
        );
    }

    return (
        <Card className={cn("overflow-hidden bg-white/[0.02] border-white/10", className)}>
            {/* Header */}
            <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{ticker}</h3>
                        <div className={cn(
                            "flex items-center gap-1 text-sm font-medium",
                            chartMetrics.isPositive ? "text-green-400" : "text-red-400"
                        )}>
                            {chartMetrics.isPositive ? (
                                <TrendingUp className="h-4 w-4" />
                            ) : (
                                <TrendingDown className="h-4 w-4" />
                            )}
                            <span>
                                {chartMetrics.isPositive ? '+' : ''}
                                {chartMetrics.priceChangePercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                            {formatPrice(chartMetrics.lastPrice)}
                        </div>
                    </div>
                </div>

                {/* Period Selector */}
                <Tabs value={period} onValueChange={(v) => setPeriod(v as OHLCVPeriod)} className="mt-3">
                    <TabsList className="bg-white/5 h-8">
                        {OHLCV_PERIODS.slice(0, 5).map((p) => (
                            <TabsTrigger
                                key={p.value}
                                value={p.value}
                                className="text-xs h-6 data-[state=active]:bg-white/10"
                            >
                                {p.value.toUpperCase()}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* Chart SVG */}
            <div className="p-4" style={{ height: height - 100 }}>
                <svg
                    viewBox="0 0 100 85"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id={`gradient-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="0%"
                                stopColor={chartMetrics.isPositive ? '#22c55e' : '#ef4444'}
                                stopOpacity="0.3"
                            />
                            <stop
                                offset="100%"
                                stopColor={chartMetrics.isPositive ? '#22c55e' : '#ef4444'}
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <path
                        d={areaPath}
                        fill={`url(#gradient-${ticker})`}
                    />

                    {/* Price Line */}
                    <path
                        d={pricePath}
                        fill="none"
                        stroke={chartMetrics.isPositive ? '#22c55e' : '#ef4444'}
                        strokeWidth="0.5"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Volume Bars */}
                    {bars.map((bar, i) => {
                        const x = (i / bars.length) * 100;
                        const barWidth = 100 / bars.length - 0.5;
                        const barHeight = (bar.volume / chartMetrics.maxVolume) * 15;

                        return (
                            <rect
                                key={i}
                                x={x}
                                y={85 - barHeight}
                                width={barWidth}
                                height={barHeight}
                                fill="rgba(99, 102, 241, 0.3)"
                            />
                        );
                    })}
                </svg>
            </div>

            {/* Footer Stats */}
            <div className="px-4 pb-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="text-xs text-muted-foreground">Open</div>
                        <div className="text-sm font-medium text-white">
                            {formatPrice(bars[0]?.open || 0)}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">High</div>
                        <div className="text-sm font-medium text-white">
                            {formatPrice(Math.max(...bars.map(b => b.high)))}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Low</div>
                        <div className="text-sm font-medium text-white">
                            {formatPrice(Math.min(...bars.map(b => b.low)))}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Volume</div>
                        <div className="text-sm font-medium text-white">
                            {formatVolume(bars.reduce((sum, b) => sum + b.volume, 0))}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default OHLCVChart;
