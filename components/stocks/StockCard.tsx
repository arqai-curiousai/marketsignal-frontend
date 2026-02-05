'use client';

import React from 'react';
import { IStock, formatPrice, formatPercent, getPriceChangeClass } from '@/types/stock';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface StockCardProps {
    stock: IStock;
    className?: string;
}

/**
 * StockCard - Individual stock display component
 * 
 * Features:
 * - Ticker and company name
 * - Current price with change indicator
 * - Sector badge
 * - Visual trend indicator
 */
export function StockCard({ stock, className }: StockCardProps) {
    const hasPrice = stock.lastPrice !== undefined && stock.lastPrice !== null;
    const change = stock.change ?? 0;
    const changePercent = stock.changePercent ?? 0;

    // Determine trend icon
    const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

    return (
        <Link href={`/stocks/${stock.ticker}?exchange=${stock.exchange}`}>
            <Card
                className={cn(
                    "group relative overflow-hidden transition-all duration-200",
                    "hover:bg-white/5 border-white/10 bg-white/[0.02] backdrop-blur-sm",
                    "hover:border-brand-blue/30 hover:shadow-lg hover:shadow-brand-blue/5",
                    className
                )}
            >
                {/* Change indicator bar */}
                <div
                    className={cn(
                        "absolute top-0 left-0 right-0 h-0.5 opacity-60",
                        change > 0 && "bg-gradient-to-r from-green-500 to-emerald-400",
                        change < 0 && "bg-gradient-to-r from-red-500 to-rose-400",
                        change === 0 && "bg-gradient-to-r from-gray-500 to-slate-400"
                    )}
                />

                <div className="p-5">
                    {/* Header: Ticker + Trend */}
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white group-hover:text-brand-blue transition-colors">
                                    {stock.ticker}
                                </h3>
                                <Badge
                                    variant="outline"
                                    className="text-[9px] px-1.5 py-0 border-white/20 text-white/60"
                                >
                                    {stock.exchange}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                {stock.name}
                            </p>
                        </div>

                        <div className={cn(
                            "p-1.5 rounded-lg",
                            change > 0 && "bg-green-500/10 text-green-400",
                            change < 0 && "bg-red-500/10 text-red-400",
                            change === 0 && "bg-gray-500/10 text-gray-400"
                        )}>
                            <TrendIcon className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Price Section */}
                    <div className="flex items-end justify-between">
                        <div>
                            {hasPrice ? (
                                <>
                                    <div className="text-2xl font-bold text-white">
                                        {formatPrice(stock.lastPrice!, stock.currency)}
                                    </div>
                                    <div className={cn("text-sm font-medium mt-0.5", getPriceChangeClass(change))}>
                                        {change >= 0 ? '+' : ''}{change.toFixed(2)} ({formatPercent(changePercent)})
                                    </div>
                                </>
                            ) : (
                                <div className="text-lg text-muted-foreground">
                                    Price unavailable
                                </div>
                            )}
                        </div>

                        {/* Sector Badge */}
                        {stock.sector && (
                            <Badge
                                variant="secondary"
                                className="bg-white/5 text-white/70 text-[10px] truncate max-w-24"
                            >
                                {stock.sector}
                            </Badge>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end mt-4 pt-3 border-t border-white/5">
                        <span className="text-xs text-muted-foreground group-hover:text-white/70 transition-colors flex items-center gap-1">
                            View Details
                            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

export default StockCard;
