/**
 * Unified data hook for the merged Sector + Pyramid dashboard.
 *
 * Single API call to getSectorAnalytics(), derives pyramid layout client-side.
 * Eliminates the duplicate getPyramidData() call.
 */
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ISectorAnalytics } from '@/types/analytics';
import type { IPyramidSector, IPyramidKPI } from '../../pyramid/constants';
import { getSectorAnalytics } from '@/src/lib/api/analyticsApi';
import { sectorAnalyticsToPyramidSectors, derivePyramidKPI } from '../adapters';

interface UnifiedSectorData {
  sectors: ISectorAnalytics[];
  pyramidSectors: IPyramidSector[];
  kpi: IPyramidKPI;
  totalMarketCap: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  computedAt: string | null;
  refetch: () => void;
}

export function useUnifiedSectorData(): UnifiedSectorData {
  const [sectors, setSectors] = useState<ISectorAnalytics[]>([]);
  const [indiaVix, setIndiaVix] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [computedAt, setComputedAt] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const fetchData = useCallback(() => {
    if (hasLoaded.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    getSectorAnalytics()
      .then((res) => {
        if (res.success && res.data) {
          setSectors(res.data.items);
          setIndiaVix(res.data.india_vix ?? null);
          setComputedAt(new Date().toISOString());
          hasLoaded.current = true;
        } else {
          setError('Failed to load sector data');
        }
      })
      .catch(() => setError('Network error'))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pyramidSectors = useMemo(
    () => sectorAnalyticsToPyramidSectors(sectors),
    [sectors],
  );

  const kpi = useMemo(
    () => derivePyramidKPI(sectors, indiaVix),
    [sectors, indiaVix],
  );

  const totalMarketCap = useMemo(
    () => sectors.reduce((sum, s) => sum + (s.total_market_cap ?? 0), 0),
    [sectors],
  );

  return {
    sectors,
    pyramidSectors,
    kpi,
    totalMarketCap,
    loading,
    refreshing,
    error,
    computedAt,
    refetch: fetchData,
  };
}
