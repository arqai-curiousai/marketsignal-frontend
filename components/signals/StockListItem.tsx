'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SignalOrb, SignalType } from './SignalOrb';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StockListItemProps {
    ticker: string;
    name: string;
    exchange: string;
    signal: SignalType;
    price?: number | null;
    change?: number | null;
    changePercent?: number | null;
    confidence?: number;
    onSelect?: () => void;
    className?: string;
}

/**
 * StockListItem - Zen-styled list row for stock display
 * 
 * Detailed list view offering more precision and scannability.
 */
export function StockListItem({
    ticker,
    name,
    exchange,
    signal,
    price,
    change,
    changePercent,
    confidence,
    onSelect,
    className,
}: StockListItemProps) {
    const isPositive = (change ?? 0) > 0;
    const isNegative = (change ?? 0) < 0;

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    const signalBorderClass = {
        buy: 'border-l-4 border-l-green-500',
        hold: 'border-l-4 border-l-slate-300',
        sell: 'border-l-4 border-l-red-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.005, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            transition={{ duration: 0.2 }}
            onClick={onSelect}
            className={cn(
                "group flex items-center justify-between p-4 mb-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer transition-all",
                signalBorderClass[signal],
                className
            )}
        >
            {/* Left: Signal & Info */}
            <div className="flex items-center gap-4 flex-1">
                <SignalOrb signal={signal} size="sm" />

                <div className="w-16">
                    <span className="font-bold text-white tracking-tight">{ticker}</span>
                </div>

                <div className="hidden sm:block flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground truncate block">{name}</span>
                </div>

                <div className="w-16">
                    <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">
                        {exchange}
                    </span>
                </div>
            </div>

            {/* Right: Price & Stats */}
            <div className="flex items-center gap-4 md:gap-8">
                {/* Confidence Bar */}
                {confidence != null && (
                    <div className="hidden md:flex flex-col w-24 justify-center" title="Signal Strength">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${confidence * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn(
                                    "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                                    confidence >= 0.75 ? "bg-emerald-500 shadow-emerald-500/50" :
                                        confidence >= 0.4 ? "bg-white shadow-white/50" :
                                            "bg-red-500 shadow-red-500/50"
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* Price Data */}
                <div className="text-right w-24">
                    {price != null ? (
                        <>
                            <div className="font-mono font-medium text-white text-base">
                                ${price.toFixed(2)}
                            </div>
                            <div className={cn(
                                "flex items-center justify-end gap-1 text-xs font-medium",
                                isPositive && "text-emerald-400",
                                isNegative && "text-red-400",
                                !isPositive && !isNegative && "text-slate-400"
                            )}>
                                <TrendIcon className="w-3 h-3" />
                                <span>{changePercent?.toFixed(2) ?? '0.00'}%</span>
                            </div>
                        </>
                    ) : (
                        <span className="text-sm text-muted-foreground">--</span>
                    )}
                </div>

                {/* Analytics Action */}
                <div className="pl-4 border-l border-white/10 hidden sm:block">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to analytics (placeholder for now)
                            window.location.href = `/stocks/${ticker}`;
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        title="View Analytics"
                    >
                        <TrendingUp className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default StockListItem;
