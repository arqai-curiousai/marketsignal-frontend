'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Grid3X3,
  Newspaper,
  ArrowRightLeft,
  Activity,
  BarChart3,
  DollarSign,
  Diamond,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useExchange } from '@/context/ExchangeContext';
import { MarketStatusBadge } from '@/components/signals/MarketStatusBadge';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { TabErrorBoundary } from '@/components/ui/TabErrorBoundary';

// Loading fallback for lazy-loaded analytics tabs
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
  </div>
);

// Lazy-loaded analytics tab components (ssr: false — all use browser APIs)
const UnifiedSectorDashboard = dynamic(
  () => import('@/components/analytics/sectors/UnifiedSectorDashboard').then(m => ({ default: m.UnifiedSectorDashboard })),
  { ssr: false, loading: TabLoadingFallback },
);

const CorrelationExplorer = dynamic(
  () => import('@/components/analytics/CorrelationExplorer').then(m => ({ default: m.CorrelationExplorer })),
  { ssr: false, loading: TabLoadingFallback },
);

const NewsIntelligence = dynamic(
  () => import('@/components/analytics/news/NewsIntelligence').then(m => ({ default: m.NewsIntelligence })),
  { ssr: false, loading: TabLoadingFallback },
);

const PatternDashboard = dynamic(
  () => import('@/components/analytics/patterns/PatternDashboard').then(m => ({ default: m.PatternDashboard })),
  { ssr: false, loading: TabLoadingFallback },
);

const FnODashboard = dynamic(
  () => import('@/components/analytics/fno/FnODashboard').then(m => ({ default: m.FnODashboard })),
  { ssr: false, loading: TabLoadingFallback },
);

const CurrencyDashboard = dynamic(
  () => import('@/components/analytics/currency/CurrencyDashboard').then(m => ({ default: m.CurrencyDashboard })),
  { ssr: false, loading: TabLoadingFallback },
);

const CommodityDashboard = dynamic(
  () => import('@/components/analytics/commodity/CommodityDashboard').then(m => ({ default: m.CommodityDashboard })),
  { ssr: false, loading: TabLoadingFallback },
);

/**
 * Markets Hub — AI-powered analytics dashboard
 *
 * 7 tabs:
 * - Sectors: Finviz-style sector heatmap
 * - News: News feed + impact analysis
 * - Correlation: Interactive correlation explorer (stocks, currencies, commodities, global)
 * - Statistical Patterns: Technical pattern detection
 * - Currency: Forex pairs dashboard
 * - Commodity: Commodities dashboard
 * - F&O: Volatility, risk, and futures & options metrics
 */

const ANALYTICS_TABS = [
  { id: 'sectors', label: 'Sectors', icon: Grid3X3, premium: false },
  { id: 'news', label: 'News', icon: Newspaper, premium: false },
  { id: 'correlation', label: 'Correlation', icon: ArrowRightLeft, premium: false },
  { id: 'patterns', label: 'Patterns', icon: Activity, premium: false },
  { id: 'currency', label: 'Currency', icon: DollarSign, premium: false },
  { id: 'commodity', label: 'Commodity', icon: Diamond, premium: false },
  { id: 'fno', label: 'F&O', icon: BarChart3, premium: false },
];

const VALID_TAB_IDS = new Set(ANALYTICS_TABS.map((t) => t.id));

export default function MarketsHub() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-blue" /></div>}>
      <MarketsHubInner />
    </Suspense>
  );
}

function MarketsHubInner() {
  const { selectedExchange, exchangeConfig } = useExchange();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab') || 'sectors';
  // Redirect legacy tab values to sectors
  const initialTab = rawTab === 'pyramid' || rawTab === 'my-portfolio' ? 'sectors' : rawTab;
  const [activeTab, setActiveTab] = useState(
    VALID_TAB_IDS.has(initialTab) ? initialTab : 'sectors'
  );

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  }, []);

  return (
    <div className="container py-8 md:py-12 px-4 md:px-6 max-w-[1440px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Markets</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered analytics driven by dual AI agents
            </p>
          </div>

          <div className="flex items-center gap-3">
            <MarketStatusBadge market={selectedExchange.toLowerCase()} />
            <MarketStatusBadge market="forex" />
            <MarketStatusBadge market="commodity" />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <ScrollArea className="w-full mb-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 inline-flex w-auto min-w-full gap-0.5">
            {ANALYTICS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all',
                    'data-[state=active]:bg-white/10',
                    'data-[state=active]:text-white',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* ─── Tab: Sectors (unified — includes Pyramid as view mode) ─── */}
        <TabsContent value="sectors" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="Sectors">
              <UnifiedSectorDashboard exchange={selectedExchange} />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: News ─── */}
        <TabsContent value="news" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="News">
              <NewsIntelligence exchange={selectedExchange} />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: Correlation Explorer ─── */}
        <TabsContent value="correlation" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="Correlation">
              <CorrelationExplorer exchange={selectedExchange} />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: Statistical Patterns ─── */}
        <TabsContent value="patterns" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="Patterns">
              <PatternDashboard exchange={selectedExchange} />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: Currency ─── */}
        <TabsContent value="currency" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="Currency">
              <CurrencyDashboard />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: Commodity ─── */}
        <TabsContent value="commodity" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="Commodity">
              <CommodityDashboard />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: F&O ─── */}
        <TabsContent value="fno" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="F&amp;O">
              {exchangeConfig.hasFnO ? (
                <FnODashboard />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-lg font-medium text-muted-foreground">
                    F&O analytics are currently available for NSE only.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Switch to NSE to access Futures & Options data.
                  </p>
                </div>
              )}
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
