'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, Minus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WatchlistItem } from '@/src/lib/api/watchlistApi';
import { SignalToggle } from './SignalToggle';
import type { IAISignal } from '@/types/stock';

interface MyPicksListProps {
    items: WatchlistItem[];
    isLoading: boolean;
    onRemove: (ticker: string, exchange: string) => Promise<boolean>;
    onSelectStock?: (ticker: string, exchange: string) => void;
    /** Map of "TICKER:EXCHANGE" -> AI signal data */
    activeSignals?: Record<string, IAISignal>;
}

/**
 * MyPicksList - Displays user's selected stocks with smooth scrolling
 * 
 * Features:
 * - Smooth vertical scroll for up to 50 items
 * - Animated list items with staggered entrance
 * - Price change indicators
 * - Remove functionality with confirmation
 */
export function MyPicksList({ items, isLoading, onRemove, onSelectStock, activeSignals = {} }: MyPicksListProps) {
    const [removingStock, setRemovingStock] = React.useState<string | null>(null);

    const handleRemove = async (ticker: string, exchange: string) => {
        const key = `${ticker}:${exchange}`;
        setRemovingStock(key);
        await onRemove(ticker, exchange);
        setRemovingStock(null);
    };

    const getChangeIcon = (changePercent: number | null) => {
        if (changePercent === null) return <Minus className="h-3 w-3 text-muted-foreground" />;
        if (changePercent > 0) return <TrendingUp className="h-3 w-3 text-green-400" />;
        if (changePercent < 0) return <TrendingDown className="h-3 w-3 text-red-400" />;
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    };

    const getChangeColor = (changePercent: number | null) => {
        if (changePercent === null) return 'text-muted-foreground';
        if (changePercent > 0) return 'text-green-400';
        if (changePercent < 0) return 'text-red-400';
        return 'text-muted-foreground';
    };

    const getCurrencySymbol = (curr?: string) => {
        switch (curr?.toUpperCase()) {
            case 'INR': return '₹';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'JPY': return '¥';
            default: return '$';
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue mb-4" />
                <p className="text-muted-foreground">Loading your picks...</p>
            </div>
        );
    }

    // Empty state
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <div className="p-4 rounded-full bg-brand-violet/10 mb-4">
                    <Star className="h-8 w-8 text-brand-violet" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No picks yet</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                    Browse stocks from different exchanges and add them to your picks
                    for quick access and monitoring.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[600px] overflow-y-auto scroll-smooth pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
                {items.map((item, index) => {
                    const key = `${item.ticker}:${item.exchange}`;
                    const isRemoving = removingStock === key;

                    return (
                        <motion.div
                            key={key}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: -50 }}
                            transition={{
                                delay: index * 0.03,
                                layout: { duration: 0.3 }
                            }}
                            className={cn(
                                "group flex items-center justify-between p-4 rounded-xl",
                                "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
                                "transition-all duration-200 cursor-pointer",
                                isRemoving && "opacity-50"
                            )}
                            onClick={() => onSelectStock?.(item.ticker, item.exchange)}
                        >
                            {/* Left: Stock Info */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-brand-blue/20 to-brand-violet/20">
                                    <Star className="h-4 w-4 text-brand-violet" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-lg">
                                            {item.ticker}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                                            {item.exchange}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {item.stock_name || item.ticker}
                                    </p>
                                </div>
                            </div>

                            {/* Center: Price */}
                            <div className="text-right mx-4">
                                {item.last_price !== null ? (
                                    <>
                                        <div className="text-lg font-semibold text-white">
                                            {getCurrencySymbol(item.currency)}{item.last_price?.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            })}
                                        </div>
                                        <div className={cn("flex items-center justify-end gap-1 text-sm", getChangeColor(item.change_percent))}>
                                            {getChangeIcon(item.change_percent)}
                                            <span>
                                                {item.change_percent !== null
                                                    ? `${item.change_percent > 0 ? '+' : ''}${item.change_percent.toFixed(2)}%`
                                                    : '--'
                                                }
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">--</span>
                                )}
                            </div>

                            {/* Signal Toggle + AI Signal */}
                            <div onClick={(e) => e.stopPropagation()}>
                                <SignalToggle
                                    ticker={item.ticker}
                                    exchange={item.exchange}
                                    instrumentType={item.instrument_type}
                                    isActive={item.signal_active}
                                    signal={activeSignals[`${item.ticker}:${item.exchange}`] || null}
                                />
                            </div>

                            {/* Right: Remove Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "opacity-0 group-hover:opacity-100 transition-opacity",
                                    "hover:bg-red-500/20 hover:text-red-400"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove(item.ticker, item.exchange);
                                }}
                                disabled={isRemoving}
                            >
                                {isRemoving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </Button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

export default MyPicksList;
