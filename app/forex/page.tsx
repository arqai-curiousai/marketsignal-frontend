'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { MarketStatusBadge } from '@/components/signals/MarketStatusBadge';

const ForexDashboard = dynamic(
  () =>
    import('@/components/analytics/currency/ForexDashboard').then(m => ({
      default: m.ForexDashboard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-sky-400/40" />
          <span className="text-xs text-white/30 tracking-wide">Loading dashboard</span>
        </div>
      </div>
    ),
  },
);

export default function ForexPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400/60" />
        </div>
      }
    >
      <div className="container py-6 md:py-10 px-4 md:px-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-sky-200 to-white/80">
                    Forex
                  </span>
                </h1>
                {/* Live dot */}
                <span className="relative flex h-2.5 w-2.5 mt-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-50" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400" />
                </span>
              </div>
              <p className="text-sm text-muted-foreground/70 tracking-wide max-w-md">
                Global currency pairs &mdash; technicals, volatility &amp; macro intelligence
              </p>
            </div>

            <div className="flex items-center gap-2">
              <MarketStatusBadge market="forex" />
            </div>
          </div>
          <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />
        </motion.div>

        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <ForexDashboard />
        </motion.div>
      </div>
    </Suspense>
  );
}
