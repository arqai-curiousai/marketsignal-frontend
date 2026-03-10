'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getSectorAnalytics } from '@/src/lib/api/analyticsApi';
import type { ISectorAnalytics, SectorTimeframe } from '@/types/analytics';
import type { SectorViewMode, SortOption } from './constants';
import { SectorToolbar } from './SectorToolbar';
import { SectorKPICards } from './SectorKPICards';
import { SectorTreemap } from './SectorTreemap';
import { SectorHeatmapGrid } from './SectorHeatmapGrid';
import { SectorPerformanceTable } from './SectorPerformanceTable';
import { SectorFlowView } from './SectorFlowView';
import { SectorDetailPanel } from './SectorDetailPanel';
import { SectorDrillSheet } from './SectorDrillSheet';

export function SectorDashboard() {
  const [sectors, setSectors] = useState<ISectorAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<SectorViewMode>('treemap');
  const [timeframe, setTimeframe] = useState<SectorTimeframe>('1d');
  const [sortBy, setSortBy] = useState<SortOption>('performance');
  const [selectedSector, setSelectedSector] = useState<ISectorAnalytics | null>(null);
  const [drillSector, setDrillSector] = useState<ISectorAnalytics | null>(null);
  const [drillOpen, setDrillOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      const result = await getSectorAnalytics();
      if (!cancelled && result.success && result.data?.items) {
        setSectors(result.data.items);
      }
      if (!cancelled) setLoading(false);
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedSectors = useMemo(() => {
    const copy = [...sectors];
    switch (sortBy) {
      case 'performance':
        return copy.sort(
          (a, b) => (b.performance[timeframe] ?? 0) - (a.performance[timeframe] ?? 0),
        );
      case 'market_cap':
        return copy.sort(
          (a, b) => (b.total_market_cap ?? 0) - (a.total_market_cap ?? 0),
        );
      case 'momentum':
        return copy.sort((a, b) => b.momentum_score - a.momentum_score);
      default:
        return copy;
    }
  }, [sectors, sortBy, timeframe]);

  const handleSectorClick = useCallback((sector: ISectorAnalytics) => {
    setSelectedSector(sector);
  }, []);

  const handleDrillOpen = useCallback((sector: ISectorAnalytics) => {
    setDrillSector(sector);
    setDrillOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (sectors.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Sector analytics not yet available. Data is computed every 5 minutes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <SectorKPICards sectors={sectors} timeframe={timeframe} />

      {/* Toolbar */}
      <SectorToolbar
        viewMode={viewMode}
        timeframe={timeframe}
        sortBy={sortBy}
        onViewModeChange={setViewMode}
        onTimeframeChange={setTimeframe}
        onSortChange={setSortBy}
      />

      {/* Main Content: View + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
        {/* Active View */}
        <div className="min-w-0">
          {viewMode === 'treemap' && (
            <SectorTreemap
              sectors={sortedSectors}
              timeframe={timeframe}
              onSectorClick={handleSectorClick}
            />
          )}
          {viewMode === 'heatmap' && (
            <SectorHeatmapGrid
              sectors={sortedSectors}
              timeframe={timeframe}
              onSectorClick={handleSectorClick}
            />
          )}
          {viewMode === 'table' && (
            <SectorPerformanceTable
              sectors={sortedSectors}
              timeframe={timeframe}
              onSectorClick={handleSectorClick}
            />
          )}
          {viewMode === 'flow' && (
            <SectorFlowView
              sectors={sortedSectors}
              timeframe={timeframe}
              onSectorClick={handleSectorClick}
            />
          )}
        </div>

        {/* Context-Aware Detail Panel */}
        <SectorDetailPanel
          selectedSector={selectedSector}
          allSectors={sectors}
          timeframe={timeframe}
          onSectorSelect={setSelectedSector}
          onDrillOpen={handleDrillOpen}
        />
      </div>

      {/* Drill-down Sheet */}
      <SectorDrillSheet
        sector={drillSector}
        open={drillOpen}
        onOpenChange={setDrillOpen}
        timeframe={timeframe}
      />
    </div>
  );
}
