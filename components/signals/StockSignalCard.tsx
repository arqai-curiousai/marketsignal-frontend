'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SignalOrb, SignalType } from './SignalOrb';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatPriceByCurrency } from '@/lib/exchange/formatting';

interface StockSignalCardProps {
    ticker: string;
    name: string;
    exchange: string;
    signal: SignalType | null;
    price?: number | null;
    change?: number | null;
    changePercent?: number | null;
    confidence?: number;
    currency?: string;
    onSelect?: () => void;
    className?: string;
}

/**
 * StockSignalCard - A Zen-styled stock card with algo signal indicator
 * 
 * Embodies the principle of 侘寂 (Wabi-sabi):
 * Beauty in simplicity, showing only what matters.
 */
export const StockSignalCard = React.memo(function StockSignalCard({
    ticker,
    name,
    exchange,
    signal,
    price,
    change,
    changePercent,
    confidence,
    currency = 'INR',
    onSelect,
    className,
}: StockSignalCardProps) {
    const isPositive = (change ?? 0) > 0;
    const isNegative = (change ?? 0) < 0;

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    const signalBorderClass: Record<string, string> = {
        buy: 'signal-card--buy',
        hold: 'signal-card--hold',
        sell: 'signal-card--sell',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
        >
            <Card
                role="button"
                tabIndex={0}
                className={cn(
                    "relative overflow-hidden cursor-pointer transition-all duration-300",
                    "hover:bg-white/5 hover:shadow-lg hover:shadow-white/5",
                    signal ? signalBorderClass[signal] : '',
                    className
                )}
                onClick={onSelect}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } }}
            >
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    {/* Left: Ticker & Signal */}
                    <div className="flex items-center gap-3">
                        {signal && <SignalOrb signal={signal} size="md" />}
                        <div>
                            <h3 className="font-semibold text-lg tracking-tight">{ticker}</h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                {exchange}
                            </p>
                        </div>
                    </div>

                    {/* Right: Price */}
                    <div className="text-right">
                        {price != null ? (
                            <>
                                <p className="font-mono text-lg font-semibold">
                                    {formatPriceByCurrency(price, currency)}
                                </p>
                                <div className={cn(
                                    "flex items-center justify-end gap-1 text-xs",
                                    isPositive && "text-green-400",
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
                            <p className="text-sm text-muted-foreground">--</p>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground truncate">{name}</p>

                    {/* Confidence bar */}
                    {confidence != null && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Confidence</span>
                                <span>{Math.round(confidence * 100)}%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className={cn(
                                        "h-full rounded-full",
                                        signal === 'buy' ? "bg-green-400" :
                                        signal === 'sell' ? "bg-red-400" :
                                        "bg-slate-300"
                                    )}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidence * 100}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
});

export default StockSignalCard;
