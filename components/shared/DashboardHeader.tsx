'use client';

import React from 'react';
import { motion } from 'framer-motion';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ACCENT_STYLES = {
  sky: {
    gradient: 'from-sky-300 via-sky-200 to-white/80',
    dotColor: 'bg-sky-400',
    divider: 'via-sky-400/20',
  },
  emerald: {
    gradient: 'from-white via-white/90 to-white/50',
    dotColor: 'bg-emerald-400',
    divider: 'via-emerald-400/20',
  },
  violet: {
    gradient: 'from-violet-300 via-violet-200 to-white/80',
    dotColor: 'bg-violet-400',
    divider: 'via-violet-400/20',
  },
} as const;

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  accent: keyof typeof ACCENT_STYLES;
  /** Optional right-side slot (e.g. MarketStatusBadge, shortcuts button) */
  actions?: React.ReactNode;
  /** Show animated live dot next to title */
  liveDot?: boolean;
}

export function DashboardHeader({
  title,
  subtitle,
  accent,
  actions,
  liveDot = true,
}: DashboardHeaderProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(12px)', y: 24 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
      className="mb-8 md:mb-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span
                className={`bg-clip-text text-transparent bg-gradient-to-r ${styles.gradient}`}
              >
                {title}
              </span>
            </h1>
            {liveDot && (
              <span className="relative flex h-2.5 w-2.5 mt-1">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.dotColor} opacity-50`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${styles.dotColor}`}
                />
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground/70 tracking-wide max-w-lg">
            {subtitle}
          </p>
        </div>

        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Gradient divider */}
      <div
        className={`mt-5 h-px w-full bg-gradient-to-r from-transparent ${styles.divider} to-transparent`}
      />
    </motion.div>
  );
}
