'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { activateSignal, deactivateSignal } from '@/src/lib/api/signalApi';
import type { IAISignal } from '@/types/stock';

interface SignalToggleProps {
    ticker: string;
    exchange: string;
    instrumentType?: string;
    isActive: boolean;
    signal?: IAISignal | null;
    onToggle?: (active: boolean) => void;
}

const NARRATIVE_COLORS: Record<string, string> = {
    divergence: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    alignment: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    quiet: 'text-slate-400 border-slate-400/30 bg-slate-400/10',
};

const NARRATIVE_LABELS: Record<string, string> = {
    divergence: 'Smart Money Divergence',
    alignment: 'Trend Alignment',
    quiet: 'Low Conviction',
};

export function SignalToggle({
    ticker,
    exchange,
    instrumentType = 'equity',
    isActive,
    signal,
    onToggle,
}: SignalToggleProps) {
    const [loading, setLoading] = useState(false);
    const [active, setActive] = useState(isActive);
    const pendingRef = useRef(false);

    useEffect(() => {
        setActive(isActive);
    }, [isActive]);

    const handleToggle = async () => {
        if (pendingRef.current) return;
        pendingRef.current = true;
        setLoading(true);
        try {
            if (active) {
                const result = await deactivateSignal(ticker, exchange);
                if (result.success) {
                    setActive(false);
                    onToggle?.(false);
                }
            } else {
                const result = await activateSignal(ticker, exchange, instrumentType);
                if (result.success) {
                    setActive(true);
                    onToggle?.(true);
                }
            }
        } catch {
            setActive(isActive);
            console.warn('Signal toggle failed');
        } finally {
            pendingRef.current = false;
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* Signal display when active */}
            {active && signal && (
                <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium',
                    NARRATIVE_COLORS[signal.narrativeType] || NARRATIVE_COLORS.quiet,
                )}>
                    {signal.narrativeType === 'divergence' && <span className="animate-pulse">●</span>}
                    {signal.narrativeType === 'alignment' && <span className="animate-pulse">●</span>}
                    {signal.narrativeType === 'quiet' && <span>○</span>}
                    <span className="capitalize">{signal.narrativeType}</span>
                    <span className="text-xs opacity-70">
                        {Math.round(signal.conviction * 100)}%
                    </span>
                </div>
            )}

            {/* Narrative label */}
            {active && signal && (
                <span className="text-xs text-muted-foreground hidden md:inline">
                    {NARRATIVE_LABELS[signal.narrativeType] || signal.narrativeType}
                </span>
            )}

            {/* Toggle button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                }}
                disabled={loading}
                aria-label="Toggle signal"
                className={cn(
                    'rounded-full px-3 transition-all',
                    active
                        ? 'bg-brand-violet/20 text-brand-violet hover:bg-brand-violet/30'
                        : 'text-muted-foreground hover:text-white hover:bg-white/10',
                )}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : active ? (
                    <Zap className="h-4 w-4" />
                ) : (
                    <ZapOff className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}

export default SignalToggle;
