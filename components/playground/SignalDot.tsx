'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PlaygroundSignal } from '@/types/playground';

interface SignalDotProps {
  signal: PlaygroundSignal;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3.5 w-3.5',
  lg: 'h-5 w-5',
};

const colorMap: Record<PlaygroundSignal, string> = {
  buy: 'bg-green-400 shadow-green-400/50',
  sell: 'bg-red-400 shadow-red-400/50',
  hold: 'bg-white shadow-white/30',
};

const pulseColorMap: Record<PlaygroundSignal, string> = {
  buy: 'bg-green-400/40',
  sell: 'bg-red-400/40',
  hold: 'bg-white/30',
};

export function SignalDot({ signal, size = 'md', pulse = true, className }: SignalDotProps) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {pulse && (
        <motion.span
          className={cn(
            'absolute inline-flex rounded-full opacity-75',
            sizeMap[size],
            pulseColorMap[signal]
          )}
          animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span
        className={cn(
          'relative inline-flex rounded-full shadow-lg',
          sizeMap[size],
          colorMap[signal]
        )}
      />
    </span>
  );
}
