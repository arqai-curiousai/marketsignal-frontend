'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type { INewsArticle, INewsCluster } from '@/types/analytics';
import { SENTIMENT_THRESHOLDS, regionsToApiParam, ALL_REGIONS, getRegionSourceFilterOptions } from '../constants';
import type { NewsRegion } from '../constants';

export type SentimentFilterValue = 'all' | 'bullish' | 'bearish';

export interface UseNewsFiltersReturn {
  // Region state
  regions: Set<NewsRegion>;
  regionParam: string;  // comma-separated for API calls, empty string = all
  exchange: string;     // backward compat — derived from regions

  // Filter state
  timeRange: number;
  sentimentFilter: SentimentFilterValue;
  sourceFilter: string;
  searchQuery: string;
  activeFilterCount: number;

  // Setters
  toggleRegion: (region: NewsRegion) => void;
  setRegions: (regions: Set<NewsRegion>) => void;
  setTimeRange: (range: number) => void;
  setSentimentFilter: (filter: SentimentFilterValue) => void;
  setSourceFilter: (source: string) => void;
  setSearchQuery: (query: string) => void;
  clearAllFilters: () => void;

  // Derived
  matchesSource: (source: string) => boolean;
  filterClusters: (clusters: INewsCluster[]) => INewsCluster[];
  filterArticles: (articles: INewsArticle[]) => INewsArticle[];
}

const VALID_TIME_RANGES = new Set([6, 24, 72, 168]);
const VALID_SENTIMENTS = new Set<SentimentFilterValue>(['all', 'bullish', 'bearish']);

function syncFilterParams(
  regions: Set<NewsRegion>,
  timeRange: number,
  sentimentFilter: SentimentFilterValue,
  sourceFilter: string,
  searchQuery: string,
) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const regionStr = Array.from(regions).sort().join(',');
  if (regionStr) url.searchParams.set('regions', regionStr); else url.searchParams.delete('regions');
  if (timeRange !== 24) url.searchParams.set('hours', String(timeRange)); else url.searchParams.delete('hours');
  if (sentimentFilter !== 'all') url.searchParams.set('sentiment', sentimentFilter); else url.searchParams.delete('sentiment');
  if (sourceFilter) url.searchParams.set('source', sourceFilter); else url.searchParams.delete('source');
  if (searchQuery) url.searchParams.set('q', searchQuery); else url.searchParams.delete('q');
  // Clean up legacy scope param
  url.searchParams.delete('scope');
  window.history.replaceState({}, '', url.toString());
}

export function useNewsFilters(): UseNewsFiltersReturn {
  const searchParams = useSearchParams();
  const isInitRef = useRef(true);

  const [regions, setRegionsState] = useState<Set<NewsRegion>>(() => {
    const v = searchParams.get('regions');
    if (v) {
      const parsed = v.split(',').filter(r => ALL_REGIONS.includes(r as NewsRegion)) as NewsRegion[];
      return new Set(parsed);
    }
    // Backward compat: check for old ?scope= param
    const scope = searchParams.get('scope');
    if (scope === 'global') return new Set<NewsRegion>(ALL_REGIONS.filter(r => r !== 'india'));
    if (scope === 'india') return new Set<NewsRegion>(['india']);
    return new Set<NewsRegion>();  // empty = all
  });
  const [timeRange, setTimeRange] = useState(() => {
    const v = parseInt(searchParams.get('hours') || '', 10);
    return VALID_TIME_RANGES.has(v) ? v : 24;
  });
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilterValue>(() => {
    const v = searchParams.get('sentiment') as SentimentFilterValue;
    return VALID_SENTIMENTS.has(v) ? v : 'all';
  });
  const [sourceFilter, setSourceFilter] = useState(() => searchParams.get('source') || '');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');

  // Toggle a single region on/off; 'all' resets to empty set
  const toggleRegion = useCallback((region: NewsRegion) => {
    setRegionsState(prev => {
      const next = new Set(prev);
      if (region === 'all') {
        return new Set<NewsRegion>();  // empty = all
      }
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
    setSourceFilter('');  // Reset source filter when regions change
  }, []);

  // Bulk-set regions (for programmatic use)
  const setRegions = useCallback((newRegions: Set<NewsRegion>) => {
    setRegionsState(newRegions);
    setSourceFilter('');
  }, []);

  // Derive regionParam for API calls
  const regionParam = useMemo(() => regionsToApiParam(regions), [regions]);

  // Derive exchange for backward compat
  const exchange = useMemo(() => {
    if (regions.size === 0) return '';  // all
    if (regions.size === 1 && regions.has('india')) return 'NSE';
    return 'GLOBAL';
  }, [regions]);

  // Validate source filter against available options when regions change
  useEffect(() => {
    if (!sourceFilter) return;
    const available = getRegionSourceFilterOptions(regions);
    const isValid = available.some(o => o.value === sourceFilter);
    if (!isValid) setSourceFilter('');
  }, [regions, sourceFilter]);

  // Sync filter state -> URL (skip first render to avoid overwriting on mount)
  useEffect(() => {
    if (isInitRef.current) { isInitRef.current = false; return; }
    syncFilterParams(regions, timeRange, sentimentFilter, sourceFilter, searchQuery);
  }, [regions, timeRange, sentimentFilter, sourceFilter, searchQuery]);

  const matchesSource = useCallback(
    (source: string) => {
      if (!sourceFilter) return true;
      if (sourceFilter === 'google_news_rss')
        return source === 'google_news_rss' || source === 'searchapi';
      return source === sourceFilter;
    },
    [sourceFilter]
  );

  const filterArticles = useCallback(
    (articles: INewsArticle[]) =>
      articles
        .filter((a) => matchesSource(a.source))
        .filter((a) => {
          if (sentimentFilter === 'all') return true;
          const score = a.sentiment_score ?? 0;
          if (sentimentFilter === 'bullish') return score > SENTIMENT_THRESHOLDS.BULLISH;
          if (sentimentFilter === 'bearish') return score < SENTIMENT_THRESHOLDS.BEARISH;
          return true;
        }),
    [matchesSource, sentimentFilter]
  );

  const filterClusters = useCallback(
    (clusters: INewsCluster[]) =>
      clusters
        .map((c) => {
          if (!sourceFilter) return c;
          const filtered = c.articles.filter((a) => matchesSource(a.source));
          if (filtered.length === 0) return null;
          return { ...c, articles: filtered, article_count: filtered.length };
        })
        .filter((c): c is INewsCluster => c !== null)
        .filter((c) => {
          if (sentimentFilter === 'bullish')
            return c.avg_sentiment_score > SENTIMENT_THRESHOLDS.BULLISH;
          if (sentimentFilter === 'bearish')
            return c.avg_sentiment_score < SENTIMENT_THRESHOLDS.BEARISH;
          return true;
        }),
    [sourceFilter, matchesSource, sentimentFilter]
  );

  const clearAllFilters = useCallback(() => {
    setSentimentFilter('all');
    setSourceFilter('');
    setSearchQuery('');
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sentimentFilter !== 'all') count++;
    if (sourceFilter) count++;
    if (timeRange !== 24) count++;
    return count;
  }, [sentimentFilter, sourceFilter, timeRange]);

  return {
    regions,
    regionParam,
    exchange,
    timeRange,
    sentimentFilter,
    sourceFilter,
    searchQuery,
    activeFilterCount,
    toggleRegion,
    setRegions,
    setTimeRange,
    setSentimentFilter,
    setSourceFilter,
    setSearchQuery,
    clearAllFilters,
    matchesSource,
    filterClusters,
    filterArticles,
  };
}
