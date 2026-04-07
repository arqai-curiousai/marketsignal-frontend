'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MarketStatusBadge } from '@/components/signals/MarketStatusBadge';
import { DashboardAmbient } from '@/components/shared/DashboardAmbient';
import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { TabLoadingFallback } from '@/components/shared/DashboardSkeleton';

const ForexIntelligence = dynamic(
  () =>
    import('@/components/analytics/currency/ForexIntelligence').then(m => ({
      default: m.ForexIntelligence,
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
          title="Forex Intelligence"
          subtitle="42 pairs across 17 currencies — live constellation, cross-rates & macro intelligence"
          accent="sky"
          actions={<MarketStatusBadge market="forex" />}
        />

        {/* Intelligence Dashboard */}
        <ForexIntelligence />
      </div>
    </Suspense>
  );
}
