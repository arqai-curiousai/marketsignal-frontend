/**
 * Analytics API client — correlation, news impact, patterns, forecast, etc.
 */

import apiClient, { ApiResult } from './apiClient';
import type {
  ISectorAggregate,
  ISectorAnalytics,
  ISectorStockEnriched,
  ICorrelationMatrix,
  IConditionalCorrelation,
  IRollingCorrelation,
  IEnhancedCorrelation,
  IEnhancedMatrix,
  IScatterData,
  IPartialCorrelation,
  ILeadLag,
  IMST,
  ICommunityDetection,
  INewsImpact,
  INewsArticle,
  ICrossAssetCorrelation,
  IGlobalEffects,
  IGrangerCausality,
  ICointegration,
  IDCCGarch,
  IAssetCorrelations,
  ICorrelationChanges,
  IRegimeCorrelation,
  IAutocorrelation,
  IPatternDetectionV2,
  IForecast,
  IVolatilityMetrics,
  IFnOSnapshot,
  IFnOHistory,
  IFnOUnderlying,
  IGEXLevels,
  IOIBuildup,
  IIVTermStructure,
  INewsCluster,
  INewsGraph,
  INewsMindMapNode,
  INewsTimeline,
  ISectorRiskScorecard,
  ISectorHistory,
  ISectorSeasonality,
  ISectorMansfieldRS,
  ISectorVolumeFlow,
  ISectorValuation,
  ISectorFIIFlow,
  ISectorFinancials,
  ISectorEarningsCalendar,
  IScannerResult,
  IMTFAlignment,
} from '@/types/analytics';
import type {
  IPyramidData,
  IStockFundamentals,
  IOwnershipSummary,
  IFilingSummary,
} from '@/components/analytics/pyramid/constants';

// =============================================================================
// Sector Heatmap
// =============================================================================

export async function getSectors(): Promise<ApiResult<{ items: ISectorAggregate[]; count: number }>> {
  return apiClient.get('/api/analytics/sectors');
}

// =============================================================================
// Sector Analytics (Enhanced)
// =============================================================================

export async function getSectorAnalytics(): Promise<
  ApiResult<{ items: ISectorAnalytics[]; count: number; india_vix?: number | null }>
> {
  return apiClient.get('/api/analytics/sectors/analytics');
}

export async function getSectorStocks(
  sector: string
): Promise<
  ApiResult<{
    sector: string;
    stocks: ISectorStockEnriched[];
    breadth: Record<string, number>;
    performance: Record<string, number>;
    momentum_score: number;
  }>
> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/stocks`);
}

export async function getSectorRisk(
  sector: string,
): Promise<ApiResult<ISectorRiskScorecard>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/risk`);
}

export async function getSectorHistory(
  sector: string,
  days: number = 252,
): Promise<ApiResult<ISectorHistory>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/history?days=${days}`);
}

export async function getSectorSeasonality(
  sector: string,
): Promise<ApiResult<ISectorSeasonality>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/seasonality`);
}

export async function getSectorMansfield(
  sector: string,
  days: number = 252,
): Promise<ApiResult<ISectorMansfieldRS>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/mansfield?days=${days}`);
}

export async function getSectorFlow(
  sector: string,
): Promise<ApiResult<ISectorVolumeFlow>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/flow`);
}

export async function getSectorValuation(
  sector: string,
): Promise<ApiResult<ISectorValuation>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/valuation`);
}

export async function getSectorFIIFlow(
  sector: string,
  quarters: number = 8,
): Promise<ApiResult<ISectorFIIFlow>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/fii-flow?quarters=${quarters}`);
}

export async function getSectorFinancials(
  sector: string,
  quarters: number = 4,
): Promise<ApiResult<ISectorFinancials>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/financials?quarters=${quarters}`);
}

export async function getSectorEarningsCalendar(
  sector: string,
): Promise<ApiResult<ISectorEarningsCalendar>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/earnings-calendar`);
}

// =============================================================================
// Correlation
// =============================================================================

export async function getCorrelations(
  window: string = '90d',
  assetType: string = 'equity'
): Promise<ApiResult<ICorrelationMatrix>> {
  return apiClient.get(`/api/analytics/correlations?window=${window}&asset_type=${assetType}`);
}

export async function getConditionalCorrelation(
  tickerA: string,
  tickerB: string,
  threshold: number = -2.0
): Promise<ApiResult<IConditionalCorrelation>> {
  return apiClient.get(
    `/api/analytics/correlations/conditional?ticker_a=${tickerA}&ticker_b=${tickerB}&threshold=${threshold}`
  );
}

// =============================================================================
// Correlation Explorer (Enhanced)
// =============================================================================

export async function getRollingCorrelation(
  tickerA: string,
  tickerB: string,
  exchangeA: string = 'NSE',
  exchangeB: string = 'NSE',
  lookback: number = 365
): Promise<ApiResult<IRollingCorrelation>> {
  return apiClient.get(
    `/api/analytics/correlations/rolling?ticker_a=${tickerA}&ticker_b=${tickerB}&exchange_a=${exchangeA}&exchange_b=${exchangeB}&lookback=${lookback}`
  );
}

export async function getEnhancedCorrelation(
  tickerA: string,
  tickerB: string,
  exchangeA: string = 'NSE',
  exchangeB: string = 'NSE',
  window: number = 90
): Promise<ApiResult<IEnhancedCorrelation>> {
  return apiClient.get(
    `/api/analytics/correlations/enhanced?ticker_a=${tickerA}&ticker_b=${tickerB}&exchange_a=${exchangeA}&exchange_b=${exchangeB}&window=${window}`
  );
}

export async function getEnhancedMatrix(
  window: string = '90d',
  assetType: string = 'equity',
  method: string = 'pearson'
): Promise<ApiResult<IEnhancedMatrix>> {
  return apiClient.get(
    `/api/analytics/correlations/matrix/enhanced?window=${window}&asset_type=${assetType}&method=${method}`
  );
}

export async function getScatterData(
  tickerA: string,
  tickerB: string,
  exchangeA: string = 'NSE',
  exchangeB: string = 'NSE',
  window: number = 90
): Promise<ApiResult<IScatterData>> {
  return apiClient.get(
    `/api/analytics/correlations/scatter?ticker_a=${tickerA}&ticker_b=${tickerB}&exchange_a=${exchangeA}&exchange_b=${exchangeB}&window=${window}`
  );
}

export async function getPartialCorrelation(
  tickerA: string,
  tickerB: string,
  exchangeA: string = 'NSE',
  exchangeB: string = 'NSE',
  window: number = 90
): Promise<ApiResult<IPartialCorrelation>> {
  return apiClient.get(
    `/api/analytics/correlations/partial?ticker_a=${tickerA}&ticker_b=${tickerB}&exchange_a=${exchangeA}&exchange_b=${exchangeB}&window=${window}`
  );
}

export async function getLeadLag(
  tickerA: string,
  tickerB: string,
  exchangeA: string = 'NSE',
  exchangeB: string = 'NSE',
  window: number = 365,
  maxLag: number = 5
): Promise<ApiResult<ILeadLag>> {
  return apiClient.get(
    `/api/analytics/correlations/lead-lag?ticker_a=${tickerA}&ticker_b=${tickerB}&exchange_a=${exchangeA}&exchange_b=${exchangeB}&window=${window}&max_lag=${maxLag}`
  );
}

export async function getMST(
  tickers: string[],
  window: number = 90
): Promise<ApiResult<IMST>> {
  return apiClient.get(
    `/api/analytics/correlations/mst?tickers=${tickers.join(',')}&window=${window}`
  );
}

export async function getCommunities(
  tickers: string[],
  window: number = 90
): Promise<ApiResult<ICommunityDetection>> {
  return apiClient.get(
    `/api/analytics/correlations/communities?tickers=${tickers.join(',')}&window=${window}`
  );
}

export async function getGrangerCausality(
  tickerA: string,
  tickerB: string,
  exchangeA: string = 'NSE',
  exchangeB: string = 'NSE',
  window: number = 365,
  maxLag: number = 5
): Promise<ApiResult<IGrangerCausality>> {
  return apiClient.get(
    `/api/analytics/correlations/granger?ticker_a=${tickerA}&ticker_b=${tickerB}&exchange_a=${exchangeA}&exchange_b=${exchangeB}&window=${window}&max_lag=${maxLag}`
  );
}

export async function getCointegration(
  tickerA: string,
  tickerB: string,
  exchangeA: string = 'NSE',
  exchangeB: string = 'NSE',
  window: number = 365
): Promise<ApiResult<ICointegration>> {
  return apiClient.get(
    `/api/analytics/correlations/cointegration?ticker_a=${tickerA}&ticker_b=${tickerB}&exchange_a=${exchangeA}&exchange_b=${exchangeB}&window=${window}`
  );
}

export async function getDCCGarch(
  tickerA: string,
  tickerB: string,
  exchangeA: string = 'NSE',
  exchangeB: string = 'NSE',
  window: number = 365
): Promise<ApiResult<IDCCGarch>> {
  return apiClient.get(
    `/api/analytics/correlations/dcc-garch?ticker_a=${tickerA}&ticker_b=${tickerB}&exchange_a=${exchangeA}&exchange_b=${exchangeB}&window=${window}`
  );
}

export async function getAssetCorrelations(
  ticker: string,
  window: string = '90d',
  method: string = 'pearson'
): Promise<ApiResult<IAssetCorrelations>> {
  return apiClient.get(
    `/api/analytics/correlations/asset/${encodeURIComponent(ticker)}?window=${window}&method=${method}`
  );
}

export async function getCorrelationChanges(
  window: string = '90d',
  topN: number = 5
): Promise<ApiResult<ICorrelationChanges>> {
  return apiClient.get(
    `/api/analytics/correlations/changes?window=${window}&top_n=${topN}`
  );
}

export async function getRegimeCorrelations(
  tickerA: string,
  tickerB: string,
  exchangeA: string = 'NSE',
  exchangeB: string = 'NSE',
  window: number = 365
): Promise<ApiResult<IRegimeCorrelation>> {
  return apiClient.get(
    `/api/analytics/correlations/regime?ticker_a=${tickerA}&ticker_b=${tickerB}&exchange_a=${exchangeA}&exchange_b=${exchangeB}&window=${window}`
  );
}

export async function getAutocorrelation(
  ticker: string,
  exchange: string = 'NSE',
  window: number = 365,
  maxLag: number = 20
): Promise<ApiResult<IAutocorrelation>> {
  return apiClient.get(
    `/api/analytics/correlations/autocorrelation?ticker=${ticker}&exchange=${exchange}&window=${window}&max_lag=${maxLag}`
  );
}

// =============================================================================
// News Impact
// =============================================================================

export async function getNewsImpact(
  hours: number = 24,
  impactType?: string,
  limit: number = 20
): Promise<ApiResult<{ items: INewsImpact[]; count: number }>> {
  let url = `/api/analytics/news-impact?hours=${hours}&limit=${limit}`;
  if (impactType) url += `&impact_type=${impactType}`;
  return apiClient.get(url);
}

// =============================================================================
// Cross-Asset
// =============================================================================

export async function getCrossAsset(
  sourceType?: string,
  targetTicker?: string,
  minCorrelation: number = 0.3
): Promise<ApiResult<{ items: ICrossAssetCorrelation[]; count: number }>> {
  let url = `/api/analytics/cross-asset?min_correlation=${minCorrelation}`;
  if (sourceType) url += `&source_type=${sourceType}`;
  if (targetTicker) url += `&target_ticker=${targetTicker}`;
  return apiClient.get(url);
}

// =============================================================================
// Global Indices
// =============================================================================

export async function getGlobalIndices(): Promise<ApiResult<IGlobalEffects>> {
  return apiClient.get('/api/analytics/global-indices');
}

// =============================================================================
// Pattern Detection
// =============================================================================

/** Pattern detection — full V2 response. */
export async function getPatternsV2(
  ticker: string,
  exchange: string = 'NSE',
  timeframe: string = 'daily'
): Promise<ApiResult<IPatternDetectionV2>> {
  return apiClient.get(`/api/analytics/${ticker}/patterns?exchange=${exchange}&timeframe=${timeframe}`);
}

/** Multi-timeframe pattern alignment analysis. */
export async function getPatternMTF(
  ticker: string,
  exchange: string = 'NSE'
): Promise<ApiResult<IMTFAlignment>> {
  return apiClient.get(`/api/analytics/${ticker}/patterns/mtf?exchange=${exchange}`);
}

/** Pattern scanner — scan all NIFTY 50 for active patterns. */
export async function scanPatterns(opts?: {
  categories?: string[];
  direction?: string;
  min_quality?: string;
}): Promise<ApiResult<IScannerResult>> {
  let url = '/api/analytics/scanner?';
  const params: string[] = [];
  if (opts?.categories?.length) params.push(`categories=${opts.categories.join(',')}`);
  if (opts?.direction) params.push(`direction=${opts.direction}`);
  if (opts?.min_quality) params.push(`min_quality=${opts.min_quality}`);
  url += params.join('&');
  return apiClient.get(url);
}

// =============================================================================
// Forecast
// =============================================================================

export async function getForecast(
  ticker: string,
  exchange: string = 'NSE',
  horizon: number = 30
): Promise<ApiResult<IForecast>> {
  return apiClient.get(`/api/analytics/${ticker}/forecast?exchange=${exchange}&horizon=${horizon}`);
}

// =============================================================================
// Volatility & Risk
// =============================================================================

export async function getAllVolatility(): Promise<ApiResult<{ items: IVolatilityMetrics[]; count: number }>> {
  return apiClient.get('/api/analytics/volatility');
}

export async function getTickerVolatility(
  ticker: string,
  exchange: string = 'NSE'
): Promise<ApiResult<IVolatilityMetrics>> {
  return apiClient.get(`/api/analytics/${ticker}/volatility?exchange=${exchange}`);
}

// =============================================================================
// News (SearchAPI Google News)
// =============================================================================

export async function getMarketNews(
  hours: number = 72,
  limit: number = 30
): Promise<ApiResult<{ items: INewsArticle[]; count: number }>> {
  return apiClient.get(`/api/analytics/news?hours=${hours}&limit=${limit}`);
}

export async function getStockNews(
  ticker: string,
  limit: number = 10
): Promise<ApiResult<{ items: INewsArticle[]; count: number; ticker: string }>> {
  return apiClient.get(`/api/analytics/${ticker}/news?limit=${limit}`);
}

/** Full-text search on news headlines and summaries. */
export async function searchNews(
  query: string,
  limit: number = 20
): Promise<ApiResult<{ items: INewsArticle[]; count: number; query: string }>> {
  return apiClient.get(
    `/api/analytics/news/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
}

/** Trigger an immediate news sync from all sources. Rate-limited to 3/min. */
export async function syncNewsNow(): Promise<ApiResult<{
  status: string;
  articles_fetched: number;
  articles_inserted: number;
  duplicates_skipped: number;
}>> {
  return apiClient.post('/api/analytics/news/sync');
}

// =============================================================================
// F&O Dashboard
// =============================================================================

export async function getFnOSnapshot(
  underlying: string = 'NIFTY',
  expiry?: string
): Promise<ApiResult<IFnOSnapshot>> {
  let url = `/api/analytics/fno/snapshot?underlying=${underlying}`;
  if (expiry) url += `&expiry=${expiry}`;
  return apiClient.get(url);
}

export async function getFnOHistory(
  underlying: string = 'NIFTY',
  days: number = 5
): Promise<ApiResult<{ items: IFnOHistory[]; count: number }>> {
  return apiClient.get(`/api/analytics/fno/history?underlying=${underlying}&days=${days}`);
}

export async function getFnOUnderlyings(): Promise<ApiResult<{ items: IFnOUnderlying[]; count: number }>> {
  return apiClient.get('/api/analytics/fno/underlyings');
}

export async function getFnOGEXLevels(
  underlying: string = 'NIFTY',
  expiry?: string
): Promise<ApiResult<IGEXLevels>> {
  let url = `/api/analytics/fno/gex?underlying=${underlying}`;
  if (expiry) url += `&expiry=${expiry}`;
  return apiClient.get(url);
}

export async function getFnOOIBuildup(
  underlying: string = 'NIFTY'
): Promise<ApiResult<{ underlying: string; underlying_price: number; items: IOIBuildup[]; count: number }>> {
  return apiClient.get(`/api/analytics/fno/oi-buildup?underlying=${underlying}`);
}

export async function getFnOTermStructure(
  underlying: string = 'NIFTY'
): Promise<ApiResult<IIVTermStructure>> {
  return apiClient.get(`/api/analytics/fno/term-structure?underlying=${underlying}`);
}

export async function getFnORVCone(
  ticker: string,
  window = 20
): Promise<ApiResult<{ rv_current: number | null; cone: { p10: number; p25: number; p50: number; p75: number; p90: number } | null; history_days?: number }>> {
  return apiClient.get(`/api/analytics/fno/rv-cone/${ticker}?window=${window}`);
}

export async function getFnOVRP(
  ticker: string,
  atmIv: number
): Promise<ApiResult<{ ticker: string; realized_vol: number; atm_iv: number; vrp: number; classification: string }>> {
  return apiClient.get(`/api/analytics/fno/vrp/${ticker}?atm_iv=${atmIv}`);
}

// =============================================================================
// News Intelligence — clusters, graph, mind map, timeline
// =============================================================================

export async function getNewsClusters(
  hours: number = 72,
  limit: number = 10
): Promise<ApiResult<{ clusters: INewsCluster[]; count: number }>> {
  return apiClient.get(`/api/analytics/news/clusters?hours=${hours}&limit=${limit}`);
}

export async function getNewsGraph(
  hours: number = 72,
  ticker?: string
): Promise<ApiResult<INewsGraph>> {
  let url = `/api/analytics/news/graph?hours=${hours}`;
  if (ticker) url += `&ticker=${ticker}`;
  return apiClient.get(url);
}

export async function getNewsMindMap(
  ticker: string,
  limit: number = 15
): Promise<ApiResult<{ tree: INewsMindMapNode; article_count: number; computed_at: string }>> {
  return apiClient.get(`/api/analytics/news/mindmap/${ticker}?limit=${limit}`);
}

export async function getNewsTimeline(
  hours: number = 168,
  ticker?: string
): Promise<ApiResult<INewsTimeline>> {
  let url = `/api/analytics/news/timeline?hours=${hours}`;
  if (ticker) url += `&ticker=${ticker}`;
  return apiClient.get(url);
}

export async function getNewsEntity(
  newsId: string
): Promise<ApiResult<{ entities: Array<{ name: string; type: string; ticker: string | null }>; themes: string[]; key_facts: string[] }>> {
  return apiClient.get(`/api/analytics/news/entities/${newsId}`);
}

// =============================================================================
// Market Pyramid
// =============================================================================

export async function getPyramidData(
  timeframe: string = '1d'
): Promise<ApiResult<IPyramidData>> {
  return apiClient.get(`/api/analytics/pyramid?timeframe=${timeframe}`);
}

// =============================================================================
// Company Intelligence (Fundamentals, Ownership, Filings)
// =============================================================================

export async function getStockFundamentals(
  ticker: string,
  exchange: string = 'NSE'
): Promise<ApiResult<IStockFundamentals>> {
  return apiClient.get(`/api/analytics/${ticker}/fundamentals?exchange=${exchange}`);
}

export async function getStockOwnership(
  ticker: string
): Promise<ApiResult<IOwnershipSummary>> {
  return apiClient.get(`/api/analytics/${ticker}/ownership`);
}

export async function getStockFilings(
  ticker: string,
  days: number = 90
): Promise<ApiResult<IFilingSummary>> {
  return apiClient.get(`/api/analytics/${ticker}/filings?days=${days}`);
}
