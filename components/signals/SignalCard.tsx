'use client';

import React from 'react';
import { ISignal } from '@/types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, TrendingUp, Zap, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface SignalCardProps {
    signal: ISignal;
    className?: string;
}

const severityColors = {
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const typeIcons = {
    MACRO: Zap,
    SECTOR: Activity,
    CORRELATION: TrendingUp,
    VOLATILITY: AlertTriangle,
    EVENT: Activity,
    EARNINGS: Activity,
};

export function SignalCard({ signal, className }: SignalCardProps) {
    const Icon = typeIcons[signal.type] || Activity;

    return (
        <Link href={`/signals/${signal.id}`}>
            <Card className={cn(
                "group relative overflow-hidden transition-all hover:bg-white/5 border-white/10 bg-white/5 backdrop-blur-sm",
                className
            )}>
                {/* Impact Bar */}
                <div
                    className="absolute top-0 left-0 h-1 bg-gradient-to-r from-brand-emerald via-brand-blue to-brand-violet transition-all group-hover:h-1.5"
                    style={{ width: `${signal.impactScore}%` }}
                />

                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 text-brand-blue">
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white group-hover:text-brand-blue transition-colors leading-tight">
                                    {signal.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0", severityColors[signal.severity])}>
                                        {signal.severity}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(signal.timestamp)} ago
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white leading-none">{signal.impactScore}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Impact</div>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {signal.summary}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex gap-2">
                            {signal.correlatedInstruments?.slice(0, 3).map(inst => (
                                <Badge key={inst} variant="secondary" className="bg-white/5 text-white/70 hover:text-white text-[10px]">
                                    {inst}
                                </Badge>
                            ))}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-all transform group-hover:translate-x-1" />
                    </div>
                </div>
            </Card>
        </Link>
    );
}
