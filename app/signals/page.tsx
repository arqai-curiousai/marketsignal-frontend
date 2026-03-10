'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Star,
  RefreshCw,
  Lock,
  Grid3X3,
  Newspaper,
  ArrowRightLeft,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/src/hooks/useWatchlist';
import { MyPicksList } from '@/components/signals/MyPicksList';
import { MarketStatusBadge } from '@/components/signals/MarketStatusBadge';
import { getActiveSignals } from '@/src/lib/api/signalApi';
import type { IAISignal } from '@/types/stock';
import Link from 'next/link';

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
const SectorDashboard = dynamic(
  () => import('@/components/analytics/sectors/SectorDashboard').then(m => ({ default: m.SectorDashboard })),
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

/**
 * Markets Hub — India-first analytics dashboard
 *
 * 6 tabs:
 * - Portfolio: user's watchlist with signal toggle + AI signals
 * - Sectors: Finviz-style sector heatmap
 * - News: News feed + impact analysis
 * - Correlation: Interactive correlation explorer (stocks, currencies, commodities, global)
 * - Statistical Patterns: Technical pattern detection
 * - F&O: Volatility, risk, and futures & options metrics
 */

const ANALYTICS_TABS = [
  { id: 'my-portfolio', label: 'Portfolio', icon: Star, premium: false },
  { id: 'sectors', label: 'Sectors', icon: Grid3X3, premium: false },
  { id: 'news', label: 'News', icon: Newspaper, premium: false },
  { id: 'correlation', label: 'Correlation', icon: ArrowRightLeft, premium: false },
  { id: 'patterns', label: 'Statistical Patterns', icon: Activity, premium: false },
  { id: 'fno', label: 'F&O', icon: BarChart3, premium: false },
];

export default function MarketsHub() {
  const [activeTab, setActiveTab] = useState('my-portfolio');
  const [activeSignalsMap, setActiveSignalsMap] = useState<Record<string, IAISignal>>({});
  const router = useRouter();

  const {
    items: watchlistItems,
    count: watchlistCount,
    maxSize: watchlistMaxSize,
    isLoading: isLoadingWatchlist,
    isAuthenticated,
    removeStock,
    refresh: refreshWatchlist,
  } = useWatchlist();

  const handleStockSelect = (ticker: string, exchange: string = 'NSE') => {
    router.push(`/stocks/${encodeURIComponent(ticker)}?exchange=${exchange}`);
  };

  const fetchActiveSignals = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const result = await getActiveSignals();
      if (result.success && result.data?.items) {
        const map: Record<string, IAISignal> = {};
        for (const item of result.data.items) {
          if (item.signal) {
            map[`${item.ticker}:${item.exchange}`] = item.signal;
          }
        }
        setActiveSignalsMap(map);
      }
    } catch {
      // Silently fail
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'my-portfolio' && isAuthenticated && watchlistItems.length > 0) {
      fetchActiveSignals();
    }
  }, [activeTab, isAuthenticated, watchlistItems.length, fetchActiveSignals]);

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
              India-first analytics powered by dual AI agents
            </p>
          </div>

          <div className="flex items-center gap-3">
            <MarketStatusBadge market="nse" />
            <MarketStatusBadge market="forex" />
            <MarketStatusBadge market="commodity" />

            {isAuthenticated && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Star className="h-3.5 w-3.5 text-brand-violet" />
                <span className="text-xs text-muted-foreground">
                  <span className="text-white font-semibold">{watchlistCount}</span>
                  /{watchlistMaxSize}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                    tab.id === 'my-portfolio' &&
                      'data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-blue/50 data-[state=active]:to-brand-violet/50',
                    tab.premium &&
                      'data-[state=active]:bg-gradient-to-r data-[state=active]:from-brand-violet/50 data-[state=active]:to-brand-violet/30',
                    !tab.premium &&
                      tab.id !== 'my-portfolio' &&
                      'data-[state=active]:bg-white/10',
                    'data-[state=active]:text-white',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.premium && (
                    <Lock className="h-3 w-3 text-brand-violet" />
                  )}
                  {tab.id === 'my-portfolio' && isAuthenticated && watchlistCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-white/10">
                      {watchlistCount}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* ─── Tab: My Portfolio ─── */}
        <TabsContent value="my-portfolio" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <div className="p-4 bg-brand-violet/10 rounded-full mb-4">
                  <Lock className="h-8 w-8 text-brand-violet" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Login to View Your Portfolio
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Sign in to build your portfolio and activate AI-powered signals.
                </p>
                <Link href="/login?from=/signals">
                  <Button className="bg-brand-violet hover:bg-brand-violet/90 text-white">
                    Sign In / Register
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <MyPicksList
                  items={watchlistItems}
                  isLoading={isLoadingWatchlist}
                  onRemove={removeStock}
                  onSelectStock={(ticker, exchange) => handleStockSelect(ticker, exchange)}
                  activeSignals={activeSignalsMap}
                />
                {watchlistItems.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshWatchlist}
                      className="text-muted-foreground hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh prices
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </TabsContent>

        {/* ─── Tab: Sectors ─── */}
        <TabsContent value="sectors" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="Sectors">
              <SectorDashboard />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: News ─── */}
        <TabsContent value="news" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="News">
              <NewsIntelligence />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: Correlation Explorer ─── */}
        <TabsContent value="correlation" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="Correlation">
              <CorrelationExplorer />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: Statistical Patterns ─── */}
        <TabsContent value="patterns" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="Statistical Patterns">
              <PatternDashboard />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>

        {/* ─── Tab: F&O ─── */}
        <TabsContent value="fno" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabErrorBoundary tabName="F&amp;O">
              <FnODashboard />
            </TabErrorBoundary>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
