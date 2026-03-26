'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Activity, User } from 'lucide-react';

interface MessageProps {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function Message({ role, content, timestamp }: MessageProps) {
    const isAssistant = role === 'assistant';

    return (
        <div className={cn(
            "flex w-full gap-4 p-6 transition-colors",
            isAssistant ? "bg-white/5" : "bg-transparent"
        )}>
            <div className="flex-shrink-0">
                <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    isAssistant
                        ? "bg-gradient-to-br from-brand-emerald via-brand-blue to-brand-violet text-white"
                        : "bg-white/10 text-white/70"
                )}>
                    {isAssistant ? <Activity className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-hidden">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                        {isAssistant ? 'MarketSignal AI' : 'You'}
                    </span>
                    <span className="text-[10px] text-white/30">
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap">
                    {content}
                </div>
            </div>
        </div>
    );
}
