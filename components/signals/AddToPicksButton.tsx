'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, StarOff, Loader2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AddToPicksButtonProps {
    ticker: string;
    exchange: string;
    isInWatchlist: boolean;
    onAdd: () => Promise<boolean>;
    onRemove: () => Promise<boolean>;
    variant?: 'icon' | 'full';
    className?: string;
}

/**
 * AddToPicksButton - Button to add/remove stocks from user's picks
 * 
 * Features:
 * - Two variants: icon-only for compact views, full for cards
 * - Animated state transitions
 * - Loading state during API calls
 */
export function AddToPicksButton({
    // These props are passed for API compatibility but used via callbacks
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ticker,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    exchange,
    isInWatchlist,
    onAdd,
    onRemove,
    variant = 'full',
    className,
}: AddToPicksButtonProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLoading(true);

        try {
            if (isInWatchlist) {
                await onRemove();
            } else {
                const success = await onAdd();
                if (success) {
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 1500);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Icon variant
    if (variant === 'icon') {
        return (
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "relative transition-all duration-200",
                    isInWatchlist
                        ? "text-brand-violet hover:text-red-400 hover:bg-red-500/10"
                        : "text-muted-foreground hover:text-brand-violet hover:bg-brand-violet/10",
                    className
                )}
                onClick={handleClick}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : showSuccess ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                        <Check className="h-4 w-4 text-green-400" />
                    </motion.div>
                ) : isInWatchlist ? (
                    <Star className="h-4 w-4 fill-current" />
                ) : (
                    <StarOff className="h-4 w-4" />
                )}
            </Button>
        );
    }

    // Full variant
    return (
        <Button
            variant={isInWatchlist ? "outline" : "default"}
            size="sm"
            className={cn(
                "gap-2 transition-all duration-200",
                isInWatchlist
                    ? "border-brand-violet/50 text-brand-violet hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400"
                    : "bg-gradient-to-r from-brand-blue to-brand-violet hover:opacity-90",
                className
            )}
            onClick={handleClick}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : showSuccess ? (
                <>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                        <Check className="h-4 w-4" />
                    </motion.div>
                    Added!
                </>
            ) : isInWatchlist ? (
                <>
                    <Star className="h-4 w-4 fill-current" />
                    In Picks
                </>
            ) : (
                <>
                    <Plus className="h-4 w-4" />
                    Add to Picks
                </>
            )}
        </Button>
    );
}

export default AddToPicksButton;
