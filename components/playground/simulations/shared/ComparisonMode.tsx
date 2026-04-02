'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GlobalAssetSearch } from './GlobalAssetSearch';

interface ComparisonModeProps {
  /** Whether comparison mode is active. */
  active: boolean;
  /** The primary ticker (already selected in the main dashboard). */
  primaryTicker: string;
  /** Toggle comparison mode on/off. */
  onToggle: () => void;
  /** Called when a comparison ticker is selected. */
  onComparisonTickerChange: (ticker: string) => void;
  /** The currently selected comparison ticker. */
  comparisonTicker?: string;
  className?: string;
}

export function ComparisonMode({
  active,
  primaryTicker,
  onToggle,
  onComparisonTickerChange,
  comparisonTicker,
  className,
}: ComparisonModeProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={cn(
          'h-7 px-2.5 text-[10px] gap-1.5 rounded-lg border transition-all',
          active
            ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
            : 'text-white/30 border-white/[0.06] hover:text-white/50 hover:border-white/[0.10]',
        )}
      >
        <Columns2 className="h-3 w-3" />
        Compare
      </Button>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <span className="text-[10px] text-white/25 font-mono shrink-0">
              {primaryTicker} vs
            </span>
            <GlobalAssetSearch
              mode="single"
              value={comparisonTicker ?? ''}
              onChange={(v) => onComparisonTickerChange(v as string)}
              className="w-[200px]"
              placeholder="Pick ticker to compare..."
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-5 w-5 p-0 text-white/20 hover:text-white/50"
              title="Exit comparison"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
