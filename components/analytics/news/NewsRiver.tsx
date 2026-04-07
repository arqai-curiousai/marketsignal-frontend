'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getAllAssets } from '@/components/analytics/correlation/constants';
import type { INewsArticle, INewsCluster } from '@/types/analytics';

// Hooks
import { useNewsData } from './hooks/useNewsData';
import { useNewsFilters } from './hooks/useNewsFilters';
import { useMarketIntelligence } from './hooks/useMarketIntelligence';

// Command & filter components
import { RegionCommandBar } from './RegionCommandBar';
import { MarketPulseBar } from './MarketPulseBar';
import { NewsFilterBar } from './NewsFilterBar';
import type { ViewMode } from './NewsFilterBar';

// Canvas-powered components (pretext)
import { BreakingWireCanvas } from './canvas/BreakingWireCanvas';
import { SentimentPulseCanvas } from './canvas/SentimentPulseCanvas';
import { PulseGlobeCanvas } from './canvas/PulseGlobeCanvas';
import { StoryArcCanvas } from './canvas/StoryArcCanvas';

// Feed & detail components
import { RiverFlow } from './RiverFlow';
import { ArticleExpansion } from './ArticleExpansion';

// Intelligence components
import { GlobalBriefCard } from './GlobalBriefCard';
import { DivergenceRow } from './DivergenceRow';
import { PortfolioNewsPanel } from './PortfolioNewsPanel';
import { StoryThread } from './StoryThread';

// Explore mode components
import { MultiRegionDeck } from './MultiRegionDeck';
import { NewsNetworkGraph } from './NewsNetworkGraph';
import { NewsMindMap } from './NewsMindMap';
import { NewsTimeline } from './NewsTimeline';

// Export
import { ExportButton } from '@/components/ui/ExportButton';
import { FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { downloadCSV, downloadPNG } from '@/src/lib/utils/export';
import { getSourceDisplayName } from './constants';
import { getGeoSentiment } from '@/src/lib/api/analyticsApi';
import type { IGeoSentiment } from '@/types/analytics';

interface NewsRiverProps {
  exchange: string;
}

type ExploreView = 'constellation' | 'mindmap' | 'timeline';

/**
 * NewsRiver — Market Intelligence Command Center.
 *
 * Two scopes: India (RSS feeds) | Global (EODHD)
 * Two views: Feed (reading) | Explore (visualizations)
 *
 * Keyboard: 1/2 switch views, / search, Esc close
 */
export function NewsRiver({ exchange: _parentExchange }: NewsRiverProps) {
  // ── Hooks ──────────────────────────────────────────────────────
  const filters = useNewsFilters();
  // Use region-derived params instead of parent exchange for news data
  const data = useNewsData(filters.timeRange, filters.regionParam, filters.exchange, null);

  const tickerOptions = useMemo(
    () => getAllAssets(filters.exchange === 'GLOBAL' ? 'NASDAQ' : filters.exchange).map((a) => a.ticker),
    [filters.exchange]
  );

  // Extract top tickers from clusters for divergence fetching
  const topTickers = useMemo(() => {
    const tickers = new Set<string>();
    for (const c of data.clusters) {
      for (const t of c.tickers) {
        tickers.add(t);
        if (tickers.size >= 5) break;
      }
      if (tickers.size >= 5) break;
    }
    return Array.from(tickers);
  }, [data.clusters]);

  const intel = useMarketIntelligence(filters.exchange, topTickers);

  // ── View state ─────────────────────────────────────────────────
  const [view, setView] = useState<ViewMode>('feed');
  const [exploreView, setExploreView] = useState<ExploreView>('constellation');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<INewsArticle | null>(null);

  // Track previous cluster counts for "developing story" whisper
  const prevClusterCounts = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const map = new Map<string, number>();
    for (const c of data.clusters) {
      map.set(c.cluster_label, c.article_count);
    }
    const timer = setTimeout(() => {
      prevClusterCounts.current = map;
    }, 500);
    return () => clearTimeout(timer);
  }, [data.clusters]);

  const riverRef = useRef<HTMLDivElement>(null);

  // ── Derived data ───────────────────────────────────────────────
  const filteredClusters = filters.filterClusters(data.clusters);
  const filteredFeedArticles = filters.filterArticles(data.fallbackArticles);

  // When the flat /news endpoint returns empty but clusters have embedded
  // articles, extract them so MarketPulseBar and export still work.
  const filteredArticles = useMemo(() => {
    if (filteredFeedArticles.length > 0) return filteredFeedArticles;
    if (filteredClusters.length === 0) return filteredFeedArticles;
    const seen = new Set<string>();
    const merged: INewsArticle[] = [];
    for (const c of filteredClusters) {
      for (const a of c.articles) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          merged.push(a);
        }
      }
    }
    return merged;
  }, [filteredFeedArticles, filteredClusters]);

  const baseClusters: INewsCluster[] =
    filteredClusters.length > 0
      ? filteredClusters
      : filteredFeedArticles.length > 0
        ? [
            {
              cluster_label: 'Latest News',
              cluster_summary: '',
              primary_theme: 'general',
              tickers: Array.from(
                new Set(filteredFeedArticles.flatMap((a) => a.symbols))
              ),
              avg_sentiment_score: 0,
              article_count: filteredFeedArticles.length,
              latest_article_at: filteredFeedArticles[0]?.published_at || '',
              articles: filteredFeedArticles,
            },
          ]
        : [];

  // ── Stable refs for data methods (avoid dependency lint warnings) ──
  const fetchEntityDataRef = useRef(data.fetchEntityData);
  const fetchMindMapRef = useRef(data.fetchMindMap);
  const clearNewArticlesFlagRef = useRef(data.clearNewArticlesFlag);
  useEffect(() => { fetchEntityDataRef.current = data.fetchEntityData; }, [data.fetchEntityData]);
  useEffect(() => { fetchMindMapRef.current = data.fetchMindMap; }, [data.fetchMindMap]);
  useEffect(() => { clearNewArticlesFlagRef.current = data.clearNewArticlesFlag; }, [data.clearNewArticlesFlag]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSelectArticle = useCallback(
    (article: INewsArticle) => {
      setSelectedArticle(article);
      fetchEntityDataRef.current(article.id);
    },
    []
  );

  const handleCloseArticle = useCallback(() => {
    setSelectedArticle(null);
  }, []);

  const handleTickerClick = useCallback(
    (ticker: string) => {
      setSelectedTicker(ticker);
      setView('explore');
      setExploreView('mindmap');
      fetchMindMapRef.current(ticker);
    },
    []
  );

  const handleScrollToTop = useCallback(() => {
    riverRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    clearNewArticlesFlagRef.current();
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      )
        return;

      switch (e.key) {
        case '1':
          setView('feed');
          break;
        case '2':
          setView('deck');
          break;
        case '3':
          setView('explore');
          break;
        case 's':
          if (intel.storyOpen) intel.closeStory();
          break;
        case 'Escape':
          if (intel.storyOpen) {
            intel.closeStory();
          } else if (selectedArticle) {
            handleCloseArticle();
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [intel, selectedArticle, handleCloseArticle]);

  // ── Impact data for selected article ───────────────────────────
  const selectedImpact = selectedArticle
    ? data.impactMap.get(selectedArticle.id)?.impact_scores ?? null
    : null;

  // ── Explore mode: auto-fetch on enter ──────────────────────────
  const fetchGraphRef = useRef(data.fetchGraph);
  useEffect(() => { fetchGraphRef.current = data.fetchGraph; }, [data.fetchGraph]);

  useEffect(() => {
    if (view === 'explore' && exploreView === 'constellation') {
      fetchGraphRef.current();
    }
  }, [view, exploreView]);

  // ── Export handlers ─────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    const rows = filteredArticles.map((a) => ({
      headline: a.headline,
      source: getSourceDisplayName(a.source),
      sentiment: a.sentiment || '',
      sentiment_score: a.sentiment_score ?? '',
      tickers: a.symbols?.join(', ') || '',
      published_at: a.published_at || '',
      url: a.url,
    }));
    const regionLabel = filters.regions.size === 0 ? 'all' : Array.from(filters.regions).sort().join('-');
    downloadCSV(rows, `news-${regionLabel}-${new Date().toISOString().slice(0, 10)}`);
  }, [filteredArticles, filters.regions]);

  const handleExportPNG = useCallback(async () => {
    if (riverRef.current) {
      const regionLabel = filters.regions.size === 0 ? 'all' : Array.from(filters.regions).sort().join('-');
      await downloadPNG(riverRef.current, `news-${view}-${regionLabel}`);
    }
  }, [view, filters.regions]);

  const exportOptions = useMemo(() => [
    { label: 'CSV (articles)', icon: <FileSpreadsheet className="h-3 w-3" />, onClick: handleExportCSV },
    { label: 'PNG (screenshot)', icon: <ImageIcon className="h-3 w-3" />, onClick: handleExportPNG },
  ], [handleExportCSV, handleExportPNG]);

  // ── Geo sentiment for RegionCommandBar badges ──────────────────
  const [geoSentiment, setGeoSentiment] = useState<IGeoSentiment[]>([]);
  useEffect(() => {
    let cancelled = false;
    getGeoSentiment(filters.timeRange).then((res) => {
      if (!cancelled && res && res.success && res.data) setGeoSentiment(res.data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [filters.timeRange]);

  return (
    <div className="space-y-3" ref={riverRef}>
      {/* ═══ COMMAND BAR ═══ */}
      <div className="flex items-center justify-between gap-3">
        <RegionCommandBar
          regions={filters.regions}
          onToggle={filters.toggleRegion}
          geoSentiment={geoSentiment}
        />
        <ExportButton options={exportOptions} className="export-exclude shrink-0" />
      </div>

      {/* ═══ HERO ZONE — Canvas-powered live data strips ═══ */}
      <div className="space-y-2">
        {/* Breaking Wire — pretext-measured scrolling ticker tape */}
        <BreakingWireCanvas
          articles={data.breakingArticles}
          onSelect={handleSelectArticle}
          onDismiss={data.dismissBreaking}
        />

        {/* Sentiment Pulse — EKG heartbeat per region */}
        <SentimentPulseCanvas
          geoSentiment={geoSentiment}
          breakingArticles={data.breakingArticles}
          activeRegions={filters.regions}
        />
      </div>

      {/* ═══ INTELLIGENCE ZONE — Globe + Story Arcs side by side ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-3">
        {/* Pulse Globe — geographic news flow with animated connections */}
        <PulseGlobeCanvas
          geoSentiment={geoSentiment}
          activeRegions={filters.regions}
          breakingArticles={data.breakingArticles}
          onRegionClick={filters.toggleRegion}
        />

        {/* Story Arcs — flowing narrative streams */}
        <StoryArcCanvas
          stories={intel.stories}
          onSelectStory={intel.openStory}
        />
      </div>

      {/* ═══ MARKET PULSE — KPI cards (DOM) ═══ */}
      <MarketPulseBar
        articles={filteredArticles}
        clusters={baseClusters}
        onTickerClick={handleTickerClick}
        geoSentiment={geoSentiment}
      />

      {/* ═══ FILTER BAR ═══ */}
      <NewsFilterBar
        view={view}
        onViewChange={setView}
        regions={filters.regions}
        timeRange={filters.timeRange}
        sentimentFilter={filters.sentimentFilter}
        sourceFilter={filters.sourceFilter}
        activeFilterCount={filters.activeFilterCount}
        onTimeRangeChange={filters.setTimeRange}
        onSentimentChange={filters.setSentimentFilter}
        onSourceChange={filters.setSourceFilter}
        onClearAll={filters.clearAllFilters}
        onSearch={data.handleSearch}
        searchResults={data.searchResults}
        searchLoading={data.searchLoading}
        onSelectArticle={handleSelectArticle}
        hasNewArticles={data.hasNewArticles}
        onScrollToTop={handleScrollToTop}
        onRefresh={data.handleRefresh}
        refreshing={data.refreshing}
        secondsAgo={data.secondsAgo}
      />

      {/* Error state */}
      {data.feedError && !data.feedLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
          Failed to load news. Auto-retrying in 5 minutes.
        </div>
      )}

      {/* ═══ FEED VIEW ═══ */}
      {view === 'feed' && (
        <div className="space-y-4">
          {/* Portfolio News */}
          <PortfolioNewsPanel exchange={filters.exchange} />

          {/* Global Brief — region-aware morning brief */}
          <GlobalBriefCard
            brief={intel.brief}
            loading={intel.briefLoading}
            dismissed={intel.briefDismissed}
            onDismiss={intel.dismissBrief}
            geoSentiment={geoSentiment}
          />

          {/* Divergence Row — contrarian signals */}
          <DivergenceRow
            divergences={intel.divergences}
            loading={intel.divergenceLoading}
          />

          {/* River flow — cluster-based feed */}
          <RiverFlow
            clusters={baseClusters}
            articles={filteredArticles}
            loading={data.feedLoading}
            onSelectArticle={handleSelectArticle}
            onTickerClick={handleTickerClick}
            selectedArticle={selectedArticle}
            previousClusterCounts={prevClusterCounts}
            hasMore={data.hasMore}
            loadingMore={data.loadingMore}
            onLoadMore={data.loadMore}
          />
        </div>
      )}

      {/* ═══ DECK VIEW — Bloomberg multi-column layout ═══ */}
      {view === 'deck' && (
        <MultiRegionDeck
          articles={filteredArticles}
          regions={filters.regions}
          onSelectArticle={handleSelectArticle}
          onTickerClick={handleTickerClick}
        />
      )}

      {/* ═══ EXPLORE VIEW ═══ */}
      {view === 'explore' && (
        <div className="space-y-3">
          {/* Sub-tab selector */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {(['constellation', 'mindmap', 'timeline'] as const).map((ev) => (
              <button
                key={ev}
                onClick={() => {
                  setExploreView(ev);
                  if (ev === 'constellation') data.fetchGraph();
                  if (ev === 'timeline') data.fetchTimeline();
                }}
                className={`px-3 py-2 sm:py-1.5 rounded-md text-[11px] font-medium transition-colors shrink-0 min-h-[36px] sm:min-h-0 ${
                  exploreView === ev
                    ? 'bg-white/[0.08] text-white/70'
                    : 'text-white/25 hover:text-white/40'
                }`}
              >
                {ev === 'constellation' ? 'Network' : ev === 'mindmap' ? 'Mind Map' : 'Timeline'}
              </button>
            ))}
          </div>

          {/* Visualization area */}
          <div className="min-h-[300px] sm:min-h-[500px] rounded-lg border border-white/[0.06] bg-white/[0.01] overflow-hidden">
            {exploreView === 'constellation' && !data.graphError && (
              <NewsNetworkGraph
                nodes={data.graph?.nodes ?? []}
                edges={data.graph?.edges ?? []}
                loading={data.graphLoading}
                onSelectArticle={(id) => {
                  const found = data.fallbackArticles.find((a) => a.id === id);
                  if (found) handleSelectArticle(found);
                }}
                onSelectTicker={(ticker) => {
                  setSelectedTicker(ticker);
                  setExploreView('mindmap');
                  data.fetchMindMap(ticker);
                }}
              />
            )}
            {exploreView === 'constellation' && data.graphError && !data.graphLoading && (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center space-y-2">
                  <p className="text-xs text-red-400/80">Failed to load network graph</p>
                  <button
                    onClick={() => data.fetchGraph()}
                    className="text-[11px] text-white/40 hover:text-white/60 underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {exploreView === 'mindmap' && !data.mindmapError && (
              <NewsMindMap
                tree={data.mindMapTree}
                loading={data.mindmapLoading}
                ticker={selectedTicker}
                onSelectTicker={(ticker) => {
                  setSelectedTicker(ticker);
                  data.fetchMindMap(ticker);
                }}
                onSelectArticle={(id) => {
                  const found = data.fallbackArticles.find((a) => a.id === id);
                  if (found) handleSelectArticle(found);
                }}
                tickerOptions={tickerOptions}
              />
            )}
            {exploreView === 'mindmap' && data.mindmapError && !data.mindmapLoading && (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center space-y-2">
                  <p className="text-xs text-red-400/80">Failed to load mind map</p>
                  <button
                    onClick={() => { if (selectedTicker) data.fetchMindMap(selectedTicker); }}
                    className="text-[11px] text-white/40 hover:text-white/60 underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {exploreView === 'timeline' && !data.timelineError && (
              <div className="p-4 h-full">
                <NewsTimeline
                  data={data.timeline}
                  loading={data.timelineLoading}
                  ticker={selectedTicker}
                  onSelectArticle={(id) => {
                    const found = data.fallbackArticles.find((a) => a.id === id);
                    if (found) handleSelectArticle(found);
                  }}
                  onTickerClick={(ticker) => {
                    setSelectedTicker(ticker);
                  }}
                />
              </div>
            )}
            {exploreView === 'timeline' && data.timelineError && !data.timelineLoading && (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center space-y-2">
                  <p className="text-xs text-red-400/80">Failed to load timeline</p>
                  <button
                    onClick={() => data.fetchTimeline()}
                    className="text-[11px] text-white/40 hover:text-white/60 underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* StoryThread slide-over (shared across views) */}
      <StoryThread
        story={intel.selectedStory}
        open={intel.storyOpen}
        onClose={intel.closeStory}
      />

      {/* Article expansion overlay — inline detail */}
      <ArticleExpansion
        article={selectedArticle}
        onClose={handleCloseArticle}
        onTickerClick={handleTickerClick}
        entityData={data.entityData}
        entityLoading={data.entityLoading}
        impactData={selectedImpact}
      />
    </div>
  );
}
