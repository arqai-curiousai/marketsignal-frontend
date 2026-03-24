/**
 * Analytics API client — correlation, news impact, patterns, forecast, etc.
 */

import apiClient, { ApiResult } from './apiClient';
import type {
  ISectorAggregate,
  ISectorAnalytics,
  ISectorStockEnriched,
  ICorrelationMatrix,
  ICurrencyCorrelationMatrix,
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
  IFIIDIIDailyFlow,
  IFIIDIISummary,
  ISectorFinancials,
  ISectorEarningsCalendar,
  IScannerResult,
  IMTFAlignment,
  ICurrencyOverview,
  ICurrencyTechnicals,
  ICurrencyVolatility,
  ICurrencyStrength,
  ICurrencyCarry,
  ICurrencySessions,
  ICurrencyMeanReversion,
  IForexPairList,
  ICrossRatesMatrix,
  ITopMovers,
  IMarketClock,
  ICentralBankRates,
  IRateDifferentialMatrix,
  IUpcomingMeetings,
  IEconomicCalendar,
  ICurrencyRegime,
  IINRFIICorrelation,
  ICommodityForexCorrelation,
  IRBIReserves,
  ICotDashboard,
  IPriceAlert,
  ICommodityOverview,
  ICommoditySeasonality,
  IStoryArc,
  ISentimentBucket,
  ISentimentDivergence,
  IMorningBrief,
  IFactorExposures,
  IFactorReturns,
  IPortfolioRisk,
  IAlphaAttribution,
  IQualityScores,
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

export async function getSectors(
  exchange: string = 'NSE'
): Promise<ApiResult<{ items: ISectorAggregate[]; count: number }>> {
  return apiClient.get(`/api/analytics/sectors?exchange=${exchange}`);
}

// =============================================================================
// Sector Analytics (Enhanced)
// =============================================================================

export async function getSectorAnalytics(
  exchange: string = 'NSE'
): Promise<
  ApiResult<{ items: ISectorAnalytics[]; count: number; india_vix?: number | null }>
> {
  return apiClient.get(`/api/analytics/sectors/analytics?exchange=${exchange}`);
}

export async function getSectorStocks(
  sector: string,
  exchange: string = 'NSE'
): Promise<
  ApiResult<{
    sector: string;
    stocks: ISectorStockEnriched[];
    breadth: Record<string, number>;
    performance: Record<string, number>;
    momentum_score: number;
  }>
> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/stocks?exchange=${exchange}`);
}

export async function getSectorRisk(
  sector: string,
  exchange: string = 'NSE',
): Promise<ApiResult<ISectorRiskScorecard>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/risk?exchange=${exchange}`);
}

export async function getSectorHistory(
  sector: string,
  days: number = 252,
  exchange: string = 'NSE',
): Promise<ApiResult<ISectorHistory>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/history?days=${days}&exchange=${exchange}`);
}

export async function getSectorSeasonality(
  sector: string,
  exchange: string = 'NSE',
): Promise<ApiResult<ISectorSeasonality>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/seasonality?exchange=${exchange}`);
}

export async function getSectorMansfield(
  sector: string,
  days: number = 252,
  exchange: string = 'NSE',
): Promise<ApiResult<ISectorMansfieldRS>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/mansfield?days=${days}&exchange=${exchange}`);
}

export async function getSectorFlow(
  sector: string,
  exchange: string = 'NSE',
): Promise<ApiResult<ISectorVolumeFlow>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/flow?exchange=${exchange}`);
}

export async function getSectorValuation(
  sector: string,
  exchange: string = 'NSE',
): Promise<ApiResult<ISectorValuation>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/valuation?exchange=${exchange}`);
}

export async function getSectorFIIFlow(
  sector: string,
  quarters: number = 8,
  exchange: string = 'NSE',
): Promise<ApiResult<ISectorFIIFlow>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/fii-flow?quarters=${quarters}&exchange=${exchange}`);
}

export async function getSectorFinancials(
  sector: string,
  quarters: number = 4,
  exchange: string = 'NSE',
): Promise<ApiResult<ISectorFinancials>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/financials?quarters=${quarters}&exchange=${exchange}`);
}

export async function getSectorEarningsCalendar(
  sector: string,
  exchange: string = 'NSE',
): Promise<ApiResult<ISectorEarningsCalendar>> {
  return apiClient.get(`/api/analytics/sectors/${encodeURIComponent(sector)}/earnings-calendar?exchange=${exchange}`);
}

// =============================================================================
// Daily FII/DII Flow (NSE aggregate)
// =============================================================================

export async function getFIIDIIDaily(
  days: number = 30,
): Promise<ApiResult<IFIIDIIDailyFlow[]>> {
  return apiClient.get(`/api/analytics/fii-dii/daily?days=${days}`);
}

export async function getFIIDIISummary(): Promise<ApiResult<IFIIDIISummary>> {
  return apiClient.get('/api/analytics/fii-dii/summary');
}

// =============================================================================
// Correlation
// =============================================================================

export async function getCorrelations(
  window: string = '90d',
  assetType: string = 'equity',
  exchange: string = 'NSE',
  forceRefresh: boolean = false
): Promise<ApiResult<ICorrelationMatrix>> {
  const params = `window=${window}&asset_type=${assetType}&exchange=${exchange}${forceRefresh ? '&force_refresh=true' : ''}`;
  return apiClient.get(`/api/analytics/correlations?${params}`);
}

export async function getConditionalCorrelation(
  tickerA: string,
  tickerB: string,
  threshold: number = -2.0,
  exchange: string = 'NSE'
): Promise<ApiResult<IConditionalCorrelation>> {
  return apiClient.get(
    `/api/analytics/correlations/conditional?ticker_a=${tickerA}&ticker_b=${tickerB}&threshold=${threshold}&exchange=${exchange}`
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
  method: string = 'pearson',
  exchange: string = 'NSE'
): Promise<ApiResult<IEnhancedMatrix>> {
  return apiClient.get(
    `/api/analytics/correlations/matrix/enhanced?window=${window}&asset_type=${assetType}&method=${method}&exchange=${exchange}`
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
  method: string = 'pearson',
  exchange: string = 'NSE'
): Promise<ApiResult<IAssetCorrelations>> {
  return apiClient.get(
    `/api/analytics/correlations/asset/${encodeURIComponent(ticker)}?window=${window}&method=${method}&exchange=${exchange}`
  );
}

export async function getCorrelationChanges(
  window: string = '90d',
  topN: number = 5,
  exchange: string = 'NSE'
): Promise<ApiResult<ICorrelationChanges>> {
  return apiClient.get(
    `/api/analytics/correlations/changes?window=${window}&top_n=${topN}&exchange=${exchange}`
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
  limit: number = 20,
  exchange: string = 'NSE'
): Promise<ApiResult<{ items: INewsImpact[]; count: number }>> {
  let url = `/api/analytics/news-impact?hours=${hours}&limit=${limit}&exchange=${exchange}`;
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

/** Pattern scanner — scan stocks for active patterns. */
export async function scanPatterns(opts?: {
  categories?: string[];
  direction?: string;
  min_quality?: string;
  exchange?: string;
}): Promise<ApiResult<IScannerResult>> {
  let url = '/api/analytics/scanner?';
  const params: string[] = [];
  if (opts?.categories?.length) params.push(`categories=${opts.categories.join(',')}`);
  if (opts?.direction) params.push(`direction=${opts.direction}`);
  if (opts?.min_quality) params.push(`min_quality=${opts.min_quality}`);
  params.push(`exchange=${opts?.exchange || 'NSE'}`);
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

export async function getAllVolatility(
  exchange: string = 'NSE'
): Promise<ApiResult<{ items: IVolatilityMetrics[]; count: number }>> {
  return apiClient.get(`/api/analytics/volatility?exchange=${exchange}`);
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
  limit: number = 30,
  exchange: string = 'NSE',
  offset: number = 0,
): Promise<ApiResult<{ items: INewsArticle[]; count: number; offset: number; has_more: boolean }>> {
  return apiClient.get(`/api/analytics/news?hours=${hours}&limit=${limit}&exchange=${exchange}&offset=${offset}`);
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
  limit: number = 20,
  exchange: string = 'NSE'
): Promise<ApiResult<{ items: INewsArticle[]; count: number; query: string }>> {
  return apiClient.get(
    `/api/analytics/news/search?q=${encodeURIComponent(query)}&limit=${limit}&exchange=${exchange}`
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
  limit: number = 10,
  exchange: string = 'NSE'
): Promise<ApiResult<{ clusters: INewsCluster[]; count: number }>> {
  return apiClient.get(`/api/analytics/news/clusters?hours=${hours}&limit=${limit}&exchange=${exchange}`);
}

export async function getNewsGraph(
  hours: number = 72,
  ticker?: string,
  exchange: string = 'NSE'
): Promise<ApiResult<INewsGraph>> {
  let url = `/api/analytics/news/graph?hours=${hours}&exchange=${exchange}`;
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
  ticker?: string,
  exchange: string = 'NSE'
): Promise<ApiResult<INewsTimeline>> {
  let url = `/api/analytics/news/timeline?hours=${hours}&exchange=${exchange}`;
  if (ticker) url += `&ticker=${ticker}`;
  return apiClient.get(url);
}

export async function getNewsEntity(
  newsId: string
): Promise<ApiResult<{ entities: Array<{ name: string; type: string; ticker: string | null }>; themes: string[]; key_facts: string[] }>> {
  return apiClient.get(`/api/analytics/news/entities/${newsId}`);
}

// ─── News Intelligence: Story Arcs ──────────────────────────────

export async function getNewsStories(
  hours = 168,
  limit = 10,
  ticker?: string,
  exchange?: string
): Promise<ApiResult<{ stories: IStoryArc[]; count: number }>> {
  let url = `/api/analytics/news/stories?hours=${hours}&limit=${limit}`;
  if (ticker) url += `&ticker=${ticker}`;
  if (exchange) url += `&exchange=${exchange}`;
  return apiClient.get(url);
}

export async function getNewsStory(
  storyId: string
): Promise<ApiResult<IStoryArc>> {
  return apiClient.get(`/api/analytics/news/stories/${storyId}`);
}

// ─── News Intelligence: Sentiment Trajectory & Divergence ──────

export async function getSentimentTrajectory(
  ticker: string,
  hours = 168,
  exchange?: string
): Promise<ApiResult<{ trajectory: ISentimentBucket[]; ticker: string }>> {
  let url = `/api/analytics/news/sentiment-trajectory/${ticker}?hours=${hours}`;
  if (exchange) url += `&exchange=${exchange}`;
  return apiClient.get(url);
}

export async function getSentimentDivergence(
  ticker: string,
  exchange?: string
): Promise<ApiResult<ISentimentDivergence>> {
  let url = `/api/analytics/news/sentiment-divergence/${ticker}`;
  if (exchange) url += `?exchange=${exchange}`;
  return apiClient.get(url);
}

// ─── News Intelligence: Morning Brief ───────────────────────────

export async function getMorningBrief(
  exchange?: string
): Promise<ApiResult<IMorningBrief>> {
  let url = '/api/analytics/news/brief';
  if (exchange) url += `?exchange=${exchange}`;
  return apiClient.get(url);
}

// ─── News Intelligence: Portfolio News ──────────────────────────
// Canonical types live in @/types/analytics — re-exported here for backward compat.
export type {
  IPortfolioTickerDigest,
  IPortfolioNewsResponse,
} from '@/types/analytics';

export async function getPortfolioNews(
  exchange?: string,
  hours: number = 24
): Promise<ApiResult<IPortfolioNewsResponse>> {
  const params = new URLSearchParams();
  if (exchange) params.set('exchange', exchange);
  params.set('hours', String(hours));
  const qs = params.toString();
  return apiClient.get(`/api/analytics/news/portfolio${qs ? `?${qs}` : ''}`);
}

// =============================================================================
// Market Pyramid
// =============================================================================

export async function getPyramidData(
  timeframe: string = '1d',
  exchange: string = 'NSE'
): Promise<ApiResult<IPyramidData>> {
  return apiClient.get(`/api/analytics/pyramid?timeframe=${timeframe}&exchange=${exchange}`);
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

// =============================================================================
// Currency Dashboard
// =============================================================================

export async function getCurrencyOverview(
  category?: string
): Promise<ApiResult<ICurrencyOverview>> {
  const params = category ? `?category=${category}` : '';
  return apiClient.get(`/api/analytics/currency/overview${params}`);
}

export async function getCurrencyCorrelation(
  category?: string
): Promise<ApiResult<ICurrencyCorrelationMatrix>> {
  const params = category ? `?category=${category}` : '';
  return apiClient.get(`/api/analytics/currency/correlation${params}`);
}

export async function getCurrencyPatterns(
  pair: string,
  timeframe: string = 'daily'
): Promise<ApiResult<IPatternDetectionV2>> {
  return apiClient.get(
    `/api/analytics/currency/${encodeURIComponent(pair)}/patterns?timeframe=${timeframe}`
  );
}

export interface ICurrencyCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ICurrencyCandlesResponse {
  pair: string;
  interval: string;
  count: number;
  candles: ICurrencyCandle[];
}

export async function getCurrencyCandles(
  pair: string,
  interval: string = '5m',
  limit: number = 500
): Promise<ApiResult<ICurrencyCandlesResponse>> {
  return apiClient.get(
    `/api/analytics/currency/${encodeURIComponent(pair)}/candles?interval=${interval}&limit=${limit}`
  );
}

// =============================================================================
// Currency Dashboard — Pro Analytics
// =============================================================================

export async function getCurrencyTechnicals(
  pair: string
): Promise<ApiResult<ICurrencyTechnicals>> {
  return apiClient.get(`/api/analytics/currency/technicals?pair=${encodeURIComponent(pair)}`);
}

export async function getCurrencyVolatility(
  pair: string
): Promise<ApiResult<ICurrencyVolatility>> {
  return apiClient.get(`/api/analytics/currency/volatility?pair=${encodeURIComponent(pair)}`);
}

export async function getCurrencyStrength(): Promise<ApiResult<ICurrencyStrength>> {
  return apiClient.get('/api/analytics/currency/strength');
}

export async function getCurrencyCarry(
  category?: string
): Promise<ApiResult<ICurrencyCarry>> {
  const params = category ? `?category=${category}` : '';
  return apiClient.get(`/api/analytics/currency/carry${params}`);
}

export async function getCurrencySessions(
  pair: string
): Promise<ApiResult<ICurrencySessions>> {
  return apiClient.get(`/api/analytics/currency/sessions?pair=${encodeURIComponent(pair)}`);
}

export async function getCurrencyMeanReversion(
  pair: string
): Promise<ApiResult<ICurrencyMeanReversion>> {
  return apiClient.get(`/api/analytics/currency/mean-reversion?pair=${encodeURIComponent(pair)}`);
}

// =============================================================================
// Currency Dashboard — Global Forex Extensions
// =============================================================================

export async function getCurrencyPairs(): Promise<ApiResult<IForexPairList>> {
  return apiClient.get('/api/analytics/currency/pairs');
}

export async function getCurrencyCrossRates(
  timeframe: string = '1d'
): Promise<ApiResult<ICrossRatesMatrix>> {
  return apiClient.get(`/api/analytics/currency/cross-rates?timeframe=${timeframe}`);
}

export async function getCurrencyTopMovers(): Promise<ApiResult<ITopMovers>> {
  return apiClient.get('/api/analytics/currency/top-movers');
}

export async function getCurrencyMarketClock(): Promise<ApiResult<IMarketClock>> {
  return apiClient.get('/api/analytics/currency/market-clock');
}

export async function getCentralBankRates(): Promise<ApiResult<ICentralBankRates>> {
  return apiClient.get('/api/analytics/currency/rates');
}

export async function getRateDifferentialMatrix(): Promise<ApiResult<IRateDifferentialMatrix>> {
  return apiClient.get('/api/analytics/currency/rates/differential');
}

export async function getUpcomingMeetings(
  days: number = 60
): Promise<ApiResult<IUpcomingMeetings>> {
  return apiClient.get(`/api/analytics/currency/rates/meetings?days=${days}`);
}

export async function getCurrencyCalendar(
  days: number = 14,
  currency?: string
): Promise<ApiResult<IEconomicCalendar>> {
  let url = `/api/analytics/currency/calendar?days=${days}`;
  if (currency) url += `&currency=${currency}`;
  return apiClient.get(url);
}

export async function getCurrencyRegime(
  pair: string = 'USD/INR'
): Promise<ApiResult<ICurrencyRegime>> {
  return apiClient.get(`/api/analytics/currency/regime?pair=${encodeURIComponent(pair)}`);
}

export async function getINRFIICorrelation(
  quarters: number = 12
): Promise<ApiResult<IINRFIICorrelation>> {
  return apiClient.get(`/api/analytics/currency/inr-flows?quarters=${quarters}`);
}

export async function getCommodityForexCorrelation(
  days: number = 180
): Promise<ApiResult<ICommodityForexCorrelation>> {
  return apiClient.get(`/api/analytics/currency/commodity-forex?days=${days}`);
}

export async function getRBIReserves(
  weeks: number = 52
): Promise<ApiResult<IRBIReserves>> {
  return apiClient.get(`/api/analytics/currency/rbi-reserves?weeks=${weeks}`);
}

export async function getCotDashboard(
  weeks: number = 52
): Promise<ApiResult<ICotDashboard>> {
  return apiClient.get(`/api/analytics/currency/cot?weeks=${weeks}`);
}

export async function getPriceAlerts(
  activeOnly: boolean = true
): Promise<ApiResult<{ alerts: IPriceAlert[] }>> {
  return apiClient.get(`/api/analytics/currency/alerts?active_only=${activeOnly}`);
}

export async function createPriceAlert(
  pair: string,
  condition: string,
  targetPrice: number,
  note?: string
): Promise<ApiResult<{ alert: IPriceAlert; current_price: number | null }>> {
  return apiClient.post('/api/analytics/currency/alerts', {
    pair,
    condition,
    target_price: targetPrice,
    note: note ?? '',
  });
}

export async function deletePriceAlert(
  alertId: string
): Promise<ApiResult<{ success: boolean }>> {
  return apiClient.delete(`/api/analytics/currency/alerts/${alertId}`);
}

// =============================================================================
// Commodity Dashboard
// =============================================================================

export async function getCommodityOverview(): Promise<ApiResult<ICommodityOverview>> {
  return apiClient.get('/api/analytics/commodity/overview');
}

export async function getCommoditySeasonality(
  ticker: string
): Promise<ApiResult<ICommoditySeasonality>> {
  return apiClient.get(`/api/analytics/commodity/seasonality/${encodeURIComponent(ticker)}`);
}

export async function getCommodityPatterns(
  commodity: string,
  timeframe: string = 'daily'
): Promise<ApiResult<IPatternDetectionV2>> {
  return apiClient.get(
    `/api/analytics/${encodeURIComponent(commodity)}/patterns?exchange=CMDTY&timeframe=${timeframe}`
  );
}

// =============================================================================
// Factor Models & Risk Analytics (Phase 4)
// =============================================================================

export async function getFactorExposures(
  ticker: string,
  exchange: string = 'NSE'
): Promise<ApiResult<IFactorExposures>> {
  return apiClient.get(`/api/analytics/${encodeURIComponent(ticker)}/factors?exchange=${exchange}`);
}

export async function getFactorReturns(
  exchange: string = 'NSE',
  days: number = 365
): Promise<ApiResult<IFactorReturns>> {
  return apiClient.get(`/api/analytics/factor-returns?exchange=${exchange}&days=${days}`);
}

export async function getPortfolioRisk(
  exchange: string = 'NSE'
): Promise<ApiResult<IPortfolioRisk>> {
  return apiClient.get(`/api/analytics/portfolio/risk-decomposition?exchange=${exchange}`);
}

export async function getAlphaAttribution(
  ticker: string,
  exchange: string = 'NSE',
  period: number = 365
): Promise<ApiResult<IAlphaAttribution>> {
  return apiClient.get(
    `/api/analytics/${encodeURIComponent(ticker)}/alpha-attribution?exchange=${exchange}&period=${period}`
  );
}

export async function getQualityScores(
  ticker: string,
  exchange: string = 'NSE'
): Promise<ApiResult<IQualityScores>> {
  return apiClient.get(`/api/analytics/${encodeURIComponent(ticker)}/quality-scores?exchange=${exchange}`);
}
