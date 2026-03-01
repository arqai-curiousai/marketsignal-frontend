'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, RefreshCw, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/components/playground/DashboardStats';
import { SignalGrid } from '@/components/playground/SignalGrid';
import { OutcomeList } from '@/components/playground/OutcomeCard';
import { AlgoPerformanceCard } from '@/components/playground/AlgoPerformanceCard';
import { playgroundApi } from '@/lib/api/playgroundApi';
import type { IPlaygroundDashboard } from '@/types/playground';

const REFRESH_INTERVAL_MS = 30_000;

export default function PlaygroundPage() {
  const [dashboard, setDashboard] = useState<IPlaygroundDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const result = await playgroundApi.getDashboard();
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

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="container py-12 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading Playground...</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="container py-12 px-6 max-w-7xl mx-auto space-y-8">
      {/* ================================================================ */}
      {/* Header */}
      {/* ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-violet/20 border border-brand-blue/20">
                <FlaskConical className="h-6 w-6 text-brand-blue" />
              </div>
              <Badge variant="outline" className="border-brand-blue/30 text-brand-blue text-xs">
                Algo Trading Lab
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Playground</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Test trading algorithms on live market data. See predictions, track outcomes, and
              compare algo performance in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wifi className="h-3 w-3 text-green-400" />
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
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ================================================================ */}
      {/* Section A: Hero Stats */}
      {/* ================================================================ */}
      {dashboard && (
        <DashboardStats
          algos={dashboard.algos}
          signals={dashboard.latestSignals}
          performance={dashboard.performance}
        />
      )}

      {/* ================================================================ */}
      {/* Section B: Live Signal Grid */}
      {/* ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Live Signals</h2>
          <Badge variant="outline" className="border-white/10 text-xs text-muted-foreground">
            Auto-refreshes every 30s
          </Badge>
        </div>
        <SignalGrid signals={dashboard?.latestSignals ?? []} />
      </motion.div>

      {/* ================================================================ */}
      {/* Section C: Prediction vs Outcome */}
      {/* ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Prediction vs Outcome</h2>
        <OutcomeList outcomes={dashboard?.recentOutcomes ?? []} />
      </motion.div>

      {/* ================================================================ */}
      {/* Section D: Algo Performance */}
      {/* ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Algorithm Performance</h2>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <AlgoPerformanceCard performance={dashboard?.performance ?? []} />
        </div>
      </motion.div>
    </div>
  );
}
