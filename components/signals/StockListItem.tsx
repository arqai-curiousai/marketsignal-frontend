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
    signal: SignalType | null;
    price?: number | null;
    change?: number | null;
    changePercent?: number | null;
    confidence?: number;
    sector?: string;
    currency?: string;
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
    exchange: _exchange,
    signal,
    price,
    change,
    changePercent,
    confidence,
    sector,
    currency = 'INR',
    onSelect,
    className,
}: StockListItemProps) {
    const isPositive = (change ?? 0) > 0;
    const isNegative = (change ?? 0) < 0;

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    const signalBorderClass: Record<string, string> = {
        buy: 'border-l-4 border-l-green-500',
        hold: 'border-l-4 border-l-slate-300',
        sell: 'border-l-4 border-l-red-500',
    };

    const getCurrencySymbol = (curr: string) => {
        switch (curr?.toUpperCase()) {
            case 'INR': return '₹';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'JPY': return '¥';
            default: return '$';
        }
    };

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(p);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.002, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            transition={{ duration: 0.15 }}
            onClick={onSelect}
            className={cn(
                "group flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] cursor-pointer transition-all hover:border-white/10",
                signal ? signalBorderClass[signal] : 'border-l-4 border-l-transparent',
                className
            )}
        >
            {/* Left: Ticker, Name, Sector */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {signal && <SignalOrb signal={signal} size="sm" />}

                <div className="min-w-[56px]">
                    <span className="font-semibold text-white text-sm tracking-tight">{ticker}</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-muted-foreground truncate">{name}</span>
                    {sector && (
                        <span className="text-[10px] text-muted-foreground/60 bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0">
                            {sector}
                        </span>
                    )}
                </div>
            </div>

            {/* Right: Price & Change */}
            <div className="flex items-center gap-3 md:gap-6">
                {/* Confidence Bar */}
                {confidence != null && confidence > 0 && (
                    <div className="hidden lg:flex flex-col w-20 justify-center" title="Signal Strength">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${confidence * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn(
                                    "h-full rounded-full",
                                    confidence >= 0.75 ? "bg-emerald-500" :
                                        confidence >= 0.4 ? "bg-white/60" :
                                            "bg-red-500"
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* Price */}
                <div className="text-right min-w-[100px]">
                    {price != null ? (
                        <>
                            <div className="font-mono font-medium text-white text-sm">
                                {getCurrencySymbol(currency)}{formatPrice(price)}
                            </div>
                            <div className={cn(
                                "flex items-center justify-end gap-1 text-xs font-medium",
                                isPositive && "text-emerald-400",
                                isNegative && "text-red-400",
                                !isPositive && !isNegative && "text-slate-400"
                            )}>
                                <TrendIcon className="w-3 h-3" />
                                <span>
                                    {isPositive && '+'}
                                    {changePercent?.toFixed(2) ?? '0.00'}%
                                </span>
                            </div>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                    )}
                </div>

                {/* Chart action */}
                <div className="pl-3 border-l border-white/[0.06] hidden sm:block">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.();
                        }}
                        className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        title="View Chart"
                    >
                        <TrendingUp className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default StockListItem;
