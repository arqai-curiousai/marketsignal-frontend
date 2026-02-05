'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type SignalType = 'buy' | 'hold' | 'sell';

interface SignalOrbProps {
    signal: SignalType;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

/**
 * SignalOrb - Zen-inspired signal indicator
 * 
 * A soft, breathing orb that indicates trading signals:
 * - 🟢 Buy (green): Growth opportunity
 * - ⚪ Hold (white): Peace, wait
 * - 🔴 Sell (red): Caution, exit
 * 
 * The orb "breathes" with a gentle animation,
 * embodying the Zen concept of 間 (Ma) - purposeful space.
 */
export function SignalOrb({
    signal,
    size = 'md',
    showLabel = false,
    className
}: SignalOrbProps) {
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-6 h-6',
    };

    const colors = {
        buy: {
            bg: 'bg-green-400',
            glow: 'rgba(74, 222, 128, 0.5)',
            label: 'Buy',
        },
        hold: {
            bg: 'bg-slate-200',
            glow: 'rgba(226, 232, 240, 0.3)',
            label: 'Hold',
        },
        sell: {
            bg: 'bg-red-400',
            glow: 'rgba(248, 113, 113, 0.5)',
            label: 'Sell',
        },
    };

    const config = colors[signal];

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <motion.div
                className={cn(
                    "relative rounded-full",
                    sizeClasses[size],
                    config.bg
                )}
                animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                        `0 0 20px ${config.glow}`,
                        `0 0 35px ${config.glow}`,
                        `0 0 20px ${config.glow}`,
                    ],
                }}
                transition={{
                    duration: 3,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
            />
            {showLabel && (
                <span className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    signal === 'buy' && "text-green-400",
                    signal === 'hold' && "text-slate-300",
                    signal === 'sell' && "text-red-400",
                )}>
                    {config.label}
                </span>
            )}
        </div>
    );
}

export default SignalOrb;
