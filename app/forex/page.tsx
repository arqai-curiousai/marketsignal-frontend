'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { MarketStatusBadge } from '@/components/signals/MarketStatusBadge';
import { DashboardAmbient } from '@/components/shared/DashboardAmbient';
import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { TabLoadingFallback } from '@/components/shared/DashboardSkeleton';

const ForexDashboard = dynamic(
  () =>
    import('@/components/analytics/currency/ForexDashboard').then(m => ({
      default: m.ForexDashboard,
    })),
  {
    ssr: false,
    loading: () => <TabLoadingFallback accent="sky" />,
  },
);

export default function ForexPage() {
  return (
    <Suspense
      fallback={<TabLoadingFallback accent="sky" />}
    >
      <DashboardAmbient accent="sky" />
      <div className="relative z-[1] container py-6 md:py-10 px-4 md:px-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <DashboardHeader
          title="Forex"
          subtitle="Global currency pairs — technicals, volatility & macro intelligence"
          accent="sky"
          actions={<MarketStatusBadge market="forex" />}
        />

        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <ForexDashboard />
        </motion.div>
      </div>
    </Suspense>
  );
}
