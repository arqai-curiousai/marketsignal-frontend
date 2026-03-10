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
  IPatternDetection,
  IPatternDetectionV2,
  IForecast,
  IVolatilityMetrics,
  IFnOSnapshot,
  IFnOHistory,
  IFnOUnderlying,
  IGEXLevels,
  IOIBuildup,
  INewsCluster,
  INewsGraph,
  INewsMindMapNode,
  INewsTimeline,
  ISectorRiskScorecard,
  ISectorHistory,
  ISectorSeasonality,
  ISectorMansfieldRS,
  ISectorVolumeFlow,
} from '@/types/analytics';

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
  ApiResult<{ items: ISectorAnalytics[]; count: number }>
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

export async function getPatterns(
  ticker: string,
  exchange: string = 'NSE'
): Promise<ApiResult<IPatternDetection>> {
  return apiClient.get(`/api/analytics/${ticker}/patterns?exchange=${exchange}`);
}

/** V2 pattern detection — same endpoint, broader response. */
export async function getPatternsV2(
  ticker: string,
  exchange: string = 'NSE'
): Promise<ApiResult<IPatternDetectionV2>> {
  return apiClient.get(`/api/analytics/${ticker}/patterns?exchange=${exchange}`);
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
