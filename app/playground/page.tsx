'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, RefreshCw, Wifi, WifiOff, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignalPyramid } from '@/components/playground/pyramid/SignalPyramid';
import { SignalPyramidMobile } from '@/components/playground/pyramid/SignalPyramidMobile';
import { LiveSignalPanel } from '@/components/playground/pyramid/LiveSignalPanel';
import { LayerDetailCard } from '@/components/playground/pyramid/LayerDetailCard';
import { SignalTimeline } from '@/components/playground/pyramid/SignalTimeline';
import { AccuracyDashboard } from '@/components/playground/pyramid/AccuracyDashboard';
import { FeatureInspector } from '@/components/playground/pyramid/FeatureInspector';
import { LAYERS, REFRESH_INTERVAL_MS } from '@/components/playground/pyramid/constants';
import { strategyApi } from '@/lib/api/strategyApi';
import { useExchange } from '@/context/ExchangeContext';
import type {
  IStrategyDashboard,
  IStrategySignal,
  IFeatureInspection,
  ILayerResult,
  ILayerDefinition,
} from '@/types/strategy';

// ─── Main Page Component ───────────────────────────────────────────

export default function PlaygroundPage() {
  const { exchangeConfig } = useExchange();
  const [dashboard, setDashboard] = useState<IStrategyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTicker, setSelectedTicker] = useState(exchangeConfig.defaultTicker);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [featureData, setFeatureData] = useState<IFeatureInspection | null>(null);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');

  // ── Dashboard fetch ────────────────────────────────────────────

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const result = await strategyApi.getDashboard();
      if (result.success) {
        setDashboard(result.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Feature fetch ──────────────────────────────────────────────

  const fetchFeatures = useCallback(async (ticker: string) => {
    setFeatureLoading(true);
    try {
      const result = await strategyApi.getFeatures(ticker);
      if (result.success) {
        setFeatureData(result.data);
      }
    } catch {
      console.error(`Failed to fetch features for ${ticker}`);
    } finally {
      setFeatureLoading(false);
    }
  }, []);

  // ── Effects ────────────────────────────────────────────────────

  useEffect(() => {
    setSelectedTicker(exchangeConfig.defaultTicker);
  }, [exchangeConfig.defaultTicker]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  useEffect(() => {
    fetchFeatures(selectedTicker);
  }, [selectedTicker, fetchFeatures]);

  // ── Derived data ───────────────────────────────────────────────

  const currentSignal: IStrategySignal | null = useMemo(() => {
    if (!dashboard) return null;
    return dashboard.latestSignals.find((s) => s.ticker === selectedTicker) ?? null;
  }, [dashboard, selectedTicker]);

  const layerOutputs: Record<string, ILayerResult> = useMemo(() => {
    return currentSignal?.layerOutputs ?? {};
  }, [currentSignal]);

  const selectedLayerDef: ILayerDefinition | null = useMemo(() => {
    if (!selectedLayer) return null;
    return LAYERS.find((l) => l.id === selectedLayer) ?? null;
  }, [selectedLayer]);

  const selectedLayerResult: ILayerResult | null = useMemo(() => {
    if (!selectedLayer) return null;
    return layerOutputs[selectedLayer] ?? null;
  }, [selectedLayer, layerOutputs]);

  const currentPrice = useMemo(() => {
    const latest = dashboard?.latestSignals?.find(s => s.ticker === selectedTicker);
    return latest?.priceAtSignal ?? null;
  }, [dashboard, selectedTicker]);

  const timelineSignals = useMemo(() => {
    const seen = new Set<string>();
    return [...(dashboard?.latestSignals ?? []), ...(dashboard?.recentOutcomes ?? [])]
      .filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
  }, [dashboard]);

  // ── Handlers ───────────────────────────────────────────────────

  const handleTickerChange = useCallback(
    (ticker: string) => {
      setSelectedTicker(ticker);
      setSelectedLayer(null);
    },
    [],
  );

  const handleLayerClick = useCallback((layerId: string) => {
    setSelectedLayer((prev) => (prev === layerId ? null : layerId));
  }, []);

  // ── Loading state ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container py-12 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading AI Signal Lab...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────

  if (error && !dashboard) {
    return (
      <div className="container py-12 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => fetchDashboard()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────

  return (
    <div className="container py-12 px-6 max-w-7xl mx-auto space-y-8">
      {/* ============================================================ */}
      {/* Header                                                       */}
      {/* ============================================================ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-violet/20 border border-brand-blue/20">
                <FlaskConical className="h-6 w-6 text-brand-blue" />
              </div>
              <Badge
                variant="outline"
                className="border-brand-blue/30 text-brand-blue text-xs"
              >
                Multi-Layer Pipeline
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              AI Signal Lab
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Multi-layer intelligence pipeline combining technical analysis, fundamentals,
              sentiment, and risk management into unified trading signals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {dashboard ? (
                  <Wifi className="h-3 w-3 text-green-400" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-400" />
                )}
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="border-white/10"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* Main Grid: Pyramid + Side Panel                              */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Pyramid (3 cols) */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="h-4 w-4 text-brand-blue" />
                <span className="text-sm font-semibold text-white">Signal Pyramid</span>
                {currentSignal && (
                  <Badge
                    variant="outline"
                    className="ml-auto border-white/10 text-[10px] text-muted-foreground"
                  >
                    {selectedTicker}
                  </Badge>
                )}
              </div>

              {/* Desktop pyramid */}
              <div className="hidden md:block">
                <SignalPyramid
                  layers={layerOutputs}
                  finalSignal={currentSignal?.signal ?? 'hold'}
                  finalConfidence={currentSignal?.confidence ?? 0}
                  selectedLayer={selectedLayer}
                  onLayerClick={handleLayerClick}
                />
              </div>

              {/* Mobile pyramid */}
              <div className="md:hidden">
                <SignalPyramidMobile
                  layers={layerOutputs}
                  finalSignal={currentSignal?.signal ?? 'hold'}
                  finalConfidence={currentSignal?.confidence ?? 0}
                  selectedLayer={selectedLayer}
                  onLayerClick={handleLayerClick}
                />
              </div>
            </div>
          </div>

          {/* Right: Live Signal + Layer Detail (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <LiveSignalPanel
              ticker={selectedTicker}
              signal={currentSignal?.signal ?? null}
              confidence={currentSignal?.confidence ?? 0}
              positionSizePct={currentSignal?.positionSizePct ?? 0}
              priceAtSignal={currentSignal?.priceAtSignal ?? null}
              currentPrice={currentPrice}
              reasoning={currentSignal?.reasoning ?? ''}
              riskMetrics={currentSignal?.riskMetrics ?? {}}
              generatedAt={currentSignal?.generatedAt ?? null}
              pipelineHealth={dashboard?.pipelineHealth ?? {}}
              onTickerChange={handleTickerChange}
            />

            <AnimatePresence mode="wait">
              {selectedLayer && (
                <motion.div
                  key={selectedLayer}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <LayerDetailCard
                    layer={selectedLayerResult}
                    layerDef={selectedLayerDef}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* Tabs: Timeline | Accuracy | Features                         */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/[0.03] border border-white/[0.06]">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <SignalTimeline signals={timelineSignals} />
          </TabsContent>

          <TabsContent value="accuracy" className="mt-4">
            <AccuracyDashboard
              performance={dashboard?.performance ?? []}
              signals={timelineSignals}
            />
          </TabsContent>

          <TabsContent value="features" className="mt-4">
            <FeatureInspector inspection={featureData} loading={featureLoading} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
