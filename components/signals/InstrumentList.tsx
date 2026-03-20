'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getInstruments } from '@/src/lib/api/signalApi';
import type { IInstrument } from '@/types/stock';
import type { IRealtimePrice } from '@/types/websocket';

type InstrumentType = 'nse' | 'nasdaq' | 'nyse' | 'lse' | 'sgx' | 'hkse' | 'currency' | 'commodity';

interface InstrumentListProps {
    type: InstrumentType;
    onAddToPortfolio?: (ticker: string, exchange: string, instrumentType: string) => void;
    /** Real-time prices keyed by symbol (e.g. "FX:USDINR"). When present, overlays REST data. */
    realtimePrices?: Record<string, IRealtimePrice>;
}

export function InstrumentList({ type, onAddToPortfolio, realtimePrices }: InstrumentListProps) {
    const [instruments, setInstruments] = useState<IInstrument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            const result = await getInstruments(type);
            if (result.success) {
                setInstruments(result.data);
            }
            setLoading(false);
        }
        fetch();
    }, [type]);

    /** Build the WS symbol key for an instrument, e.g. FX:USDINR or CMDTY:Gold */
    const getWsSymbol = (inst: IInstrument): string => {
        if (inst.instrumentType === 'currency') {
            return 'FX:' + inst.ticker.replace('/', '');
        }
        if (inst.instrumentType === 'commodity') {
            return 'CMDTY:' + inst.name;
        }
        // Map exchange-specific prefixes
        const exchangePrefix = inst.exchange?.toUpperCase() ?? 'NSE';
        switch (exchangePrefix) {
            case 'NASDAQ': return 'NASDAQ:' + inst.ticker;
            case 'NYSE': return 'NYSE:' + inst.ticker;
            case 'LSE': return 'LSE:' + inst.ticker;
            case 'SGX': return 'SGX:' + inst.ticker;
            case 'HKSE': return 'HKSE:' + inst.ticker;
            default: return 'NSE:' + inst.ticker;
        }
    };

    /** Overlay WS price onto an instrument if available. */
    const withRealtimePrice = (inst: IInstrument): IInstrument => {
        if (!realtimePrices) return inst;
        const wsKey = getWsSymbol(inst);
        const rt = realtimePrices[wsKey];
        if (!rt) return inst;
        return {
            ...inst,
            price: rt.price,
            change: rt.change ?? inst.change,
            changePercent: rt.changePercent ?? inst.changePercent,
        };
    };

    const getCurrencySymbol = (curr: string) => {
        switch (curr) {
            case 'INR': return '₹';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'JPY': return '¥';
            default: return '$';
        }
    };

    const getChangeIcon = (change?: number) => {
        if (!change) return <Minus className="h-3 w-3 text-muted-foreground" />;
        if (change > 0) return <TrendingUp className="h-3 w-3 text-green-400" />;
        return <TrendingDown className="h-3 w-3 text-red-400" />;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-brand-blue mb-4" />
                <p className="text-muted-foreground">Loading instruments...</p>
            </div>
        );
    }

    if (instruments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl">
                <p className="text-muted-foreground">No instruments available</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-[600px] overflow-y-auto scroll-smooth pr-2 custom-scrollbar">
            <AnimatePresence>
                {instruments.map((rawInst, index) => {
                    const inst = withRealtimePrice(rawInst);
                    return (
                    <motion.div
                        key={inst.ticker}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                            'flex items-center justify-between p-4 rounded-xl',
                            'bg-white/5 border border-white/10 hover:bg-white/10',
                            'transition-all duration-200',
                        )}
                    >
                        {/* Left: Instrument info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-lg">{inst.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                                    {inst.exchange}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{inst.ticker}</p>
                        </div>

                        {/* Center: Price */}
                        <div className="text-right mx-4">
                            {inst.price != null ? (
                                <>
                                    <div className="text-lg font-semibold text-white">
                                        {getCurrencySymbol(inst.currency)}
                                        {inst.price.toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </div>
                                    <div className={cn(
                                        'flex items-center justify-end gap-1 text-sm',
                                        inst.changePercent && inst.changePercent > 0 ? 'text-green-400' :
                                        inst.changePercent && inst.changePercent < 0 ? 'text-red-400' :
                                        'text-muted-foreground',
                                    )}>
                                        {getChangeIcon(inst.changePercent)}
                                        <span>
                                            {inst.changePercent != null
                                                ? `${inst.changePercent > 0 ? '+' : ''}${inst.changePercent.toFixed(2)}%`
                                                : '--'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <span className="text-muted-foreground">--</span>
                            )}
                        </div>

                        {/* Right: Add to portfolio */}
                        {onAddToPortfolio && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onAddToPortfolio(inst.ticker, inst.exchange, inst.instrumentType)}
                                className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-full"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                        )}
                    </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

export default InstrumentList;
