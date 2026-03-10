/** Analytics dashboard TypeScript types. */

// ─── Sector Heatmap ─────────────────────────────────────────

export interface ISectorStock {
  ticker: string;
  name: string;
  market_cap: number | null;
  change_pct: number;
  last_price: number | null;
}

export interface ISectorAggregate {
  sector: string;
  avg_change_pct: number;
  total_market_cap: number | null;
  stock_count: number;
  top_gainer: { ticker: string; name: string; change_pct: number };
  top_loser: { ticker: string; name: string; change_pct: number };
  stocks: ISectorStock[];
  computed_at: string;
}

// ─── Enhanced Sector Analytics ──────────────────────────────

export interface ISectorPerformance {
  '1d': number;
  '1w': number;
  '1m': number;
  '3m': number;
  '6m': number;
  ytd: number;
}

export type SectorTimeframe = keyof ISectorPerformance;

export interface ISectorRRGPoint {
  rs_ratio: number;
  rs_momentum: number;
  date: string;
}

export interface ISectorRRG {
  rs_ratio: number;
  rs_momentum: number;
  quadrant: 'leading' | 'weakening' | 'lagging' | 'improving';
  trail: ISectorRRGPoint[];
}

export interface ISectorBreadth {
  above_20dma_pct: number;
  above_50dma_pct: number;
  above_200dma_pct: number;
  advancing: number;
  declining: number;
  unchanged: number;
  ad_ratio: number;
  new_52w_highs: number;
  new_52w_lows: number;
}

export interface ISectorVolatility {
  avg_hv_20d: number | null;
  avg_hv_60d: number | null;
  avg_beta: number | null;
  avg_sharpe: number | null;
  avg_max_drawdown: number | null;
}

export interface ISectorStockEnriched extends ISectorStock {
  volume: number | null;
  avg_volume_10d: number | null;
  volume_ratio: number | null;
  pos_52w: number | null;
  high_52w: number | null;
  low_52w: number | null;
  sparkline_7d: number[];
}

export interface ISectorDispersion {
  dispersion_1d: number;
  dispersion_20d: number;
  hhi: number;
  hhi_label: 'concentrated' | 'moderate' | 'diversified';
}

export interface ISectorAnalytics {
  sector: string;
  avg_change_pct: number;
  total_market_cap: number | null;
  stock_count: number;
  top_gainer: { ticker: string; name: string; change_pct: number };
  top_loser: { ticker: string; name: string; change_pct: number };
  performance: ISectorPerformance;
  momentum_score: number;
  rrg: ISectorRRG;
  breadth: ISectorBreadth;
  volatility: ISectorVolatility;
  dispersion: ISectorDispersion;
  volume_flow_score: number;
  volume_flow_label: string;
  stocks: ISectorStockEnriched[];
  computed_at: string;
}

// ─── Sector Detail (on-demand) ─────────────────────────────

export interface ISectorRiskScorecard {
  sector: string;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown: number;
  max_dd_duration_days: number;
  ulcer_index: number;
  benchmark_sharpe: number;
  benchmark_sortino: number;
  annualized_return: number;
  annualized_vol: number;
}

export interface ISectorHistory {
  sector: string;
  dates: string[];
  sector_cumulative: number[];
  benchmark_cumulative: number[];
  sector_drawdown: number[];
  active_return: number;
  days: number;
}

export interface ISectorSeasonality {
  sector: string;
  months: Array<{
    month: number;
    avg_return: number;
    hit_rate: number;
    z_score: number;
    sample_size: number;
  }>;
  overall_stats: {
    avg_monthly: number;
    std_monthly: number;
    best_month: number;
    worst_month: number;
  };
}

export interface ISectorMansfieldRS {
  sector: string;
  dates: string[];
  mansfield_rs: number[];
  rs_sma: number[];
  stage: 'Basing' | 'Advancing' | 'Topping' | 'Declining';
  stage_duration_days: number;
}

export interface ISectorVolumeFlow {
  sector: string;
  dates: string[];
  flow_scores: number[];
  current_score: number;
  current_label: string;
  stock_flows: Array<{
    ticker: string;
    obv_trend: string;
    mfi: number;
    flow_score: number;
  }>;
  interpretation: string;
}

// ─── Correlation ────────────────────────────────────────────

export interface ICorrelationPair {
  pair: [string, string];
  correlation: number;
}

export interface ICorrelationMatrix {
  window: string;
  asset_type: string;
  tickers: string[];
  matrix_data: Record<string, number>;
  top_positive_pairs: ICorrelationPair[];
  top_negative_pairs: ICorrelationPair[];
  computed_at: string;
}

export interface IConditionalCorrelation {
  ticker_a: string;
  ticker_b: string;
  threshold_pct: number;
  occurrences: number;
  avg_b_movement_pct: number;
  median_b_movement_pct: number;
  same_direction_pct: number;
  window_days: number;
  insufficient_data?: boolean;
}

// ─── Enhanced Correlation (Correlation Explorer) ────────────

export interface IRollingCorrelation {
  ticker_a: string;
  ticker_b: string;
  dates: string[];
  rolling_20d: (number | null)[];
  rolling_60d: (number | null)[];
  rolling_90d: (number | null)[];
  current_20d: number | null;
  current_60d: number | null;
  current_90d: number | null;
  regime_alerts: Array<{
    date: string;
    type: 'breakdown' | 'spike' | 'sign_flip' | 'divergence';
    description: string;
  }>;
  lookback_days: number;
}

export interface ICorrelationStability {
  std: number | null;
  label: 'Stable' | 'Variable' | 'Unstable' | null;
  rolling_mean: number | null;
  rolling_range: number | null;
}

export interface IEnhancedCorrelation {
  ticker_a: string;
  ticker_b: string;
  pearson: { r: number; p_value: number; significant: boolean };
  spearman: { rho: number; p_value: number; significant: boolean };
  n_observations: number;
  method_divergence: number;
  divergence_flag: boolean;
  window_days: number;
  stability?: ICorrelationStability | null;
}

export interface IEnhancedMatrix extends ICorrelationMatrix {
  p_values: Record<string, number>;
  significant_pairs: number;
  method: 'pearson' | 'spearman';
}

export interface IScatterData {
  ticker_a: string;
  ticker_b: string;
  points: Array<{ date: string; return_a: number; return_b: number }>;
  regression_line: { slope: number; intercept: number; r_squared: number };
  n_observations: number;
}

export interface IPartialCorrelation {
  ticker_a: string;
  ticker_b: string;
  raw_correlation: number;
  partial_correlation: number;
  market_effect: number;
  market_effect_pct: number;
  control_ticker: string;
  n_observations: number;
  window_days: number;
}

export interface ILeadLag {
  ticker_a: string;
  ticker_b: string;
  lags: number[];
  correlations: number[];
  peak_lag: number;
  peak_correlation: number;
  contemporaneous_correlation: number;
  lead_lag_interpretation: string;
  significant_leads: Array<{
    lag: number;
    correlation: number;
    description: string;
  }>;
  window_days: number;
  max_lag: number;
}

export interface IMSTEdge {
  source: string;
  target: string;
  correlation: number;
  distance: number;
}

export interface IMST {
  edges: IMSTEdge[];
  nodes: string[];
  hub_node: string;
  total_distance: number;
  n_nodes: number;
}

export interface ICommunityDetection {
  communities: string[][];
  node_community: Record<string, number>;
  modularity: number;
  n_communities: number;
}

// ─── News Impact ────────────────────────────────────────────

export interface INewsImpact {
  news_id: string;
  news_title: string;
  news_source: string;
  sentiment: string | null;
  impact_scores: Record<string, {
    price_change_1h: number | null;
    price_change_4h: number | null;
    price_change_1d: number | null;
  }>;
  impact_type: 'macro' | 'sector' | 'stock';
  overall_impact_magnitude: number;
  published_at: string;
  computed_at: string;
}

// ─── News Article (from SearchAPI / Google News) ────────────

export interface INewsArticle {
  id: string;
  headline: string;
  summary: string | null;
  url: string;
  image_url: string | null;
  source: string;
  published_at: string | null;
  symbols: string[];
  sentiment: string | null;
  sentiment_score: number | null;
}

// ─── Cross-Asset ────────────────────────────────────────────

export interface ICrossAssetCorrelation {
  source_ticker: string;
  source_type: 'commodity' | 'currency';
  target_ticker: string;
  target_type: string;
  correlation: number;
  lag_periods: number;
  granger_pvalue: number | null;
  relationship_strength: 'strong' | 'moderate' | 'weak';
  window: string;
  computed_at: string;
}

// ─── Global Indices ─────────────────────────────────────────

export interface IGlobalIndex {
  index_name: string;
  display_name: string;
  exchange: string;
  timezone: string;
  value: number | null;
  change: number | null;
  change_pct: number | null;
  last_updated: string | null;
  market_status: string;
}

export interface IMarketTimeline {
  index: string;
  opens_ist: string;
  closes_ist: string;
}

export interface IPreMarketSignal {
  direction: 'bullish' | 'bearish' | 'neutral';
  estimated_gap_pct: number;
  confidence: 'high' | 'medium' | 'low';
  factors: Array<{
    index: string;
    display: string;
    change_pct: number;
    weight: number;
  }>;
}

export interface IGlobalEffects {
  indices: IGlobalIndex[];
  timeline: IMarketTimeline[];
  pre_market_signal: IPreMarketSignal;
}

// ─── Pattern Detection ──────────────────────────────────────

export interface IPattern {
  type: string;
  confidence: number;
  description: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  historical_success_rate: number;
}

export interface IOHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IOverlayData {
  date: string;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  sma_20: number | null;
  sma_50: number | null;
}

export interface IPatternDetection {
  ticker: string;
  exchange: string;
  patterns: IPattern[];
  indicators: {
    bollinger_bands: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
      bandwidth: number | null;
      position: number | null;
    };
    keltner_channel: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
    };
    support_levels: number[];
    resistance_levels: number[];
    sma_20: number | null;
    sma_50: number | null;
    current_price: number;
  };
  chart_data: IOHLCVBar[];
  overlay_data: IOverlayData[];
  computed_at: string;
}

// ─── Pattern Detection V2 (Enhanced) ──────────────────────────────────

export interface IQualityScore {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C';
  factors: {
    statistical_confidence: number;
    historical_win_rate: number;
    volume_confirmation: number;
    multi_tf_alignment: number;
    trend_alignment: number;
  };
}

export interface IPatternAnnotation {
  type: 'marker' | 'line' | 'zone' | 'label';
  data: Record<string, unknown>;
}

export interface IPatternV2 {
  id: string;
  type: string;
  category: 'chart' | 'momentum' | 'volatility' | 'volume' | 'regime' | 'matrix_profile' | 'seasonality';
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  historical_win_rate: number;
  quality_score: number;
  quality_grade: 'A+' | 'A' | 'B' | 'C';
  quality_factors: {
    statistical_confidence: number;
    historical_win_rate: number;
    volume_confirmation: number;
    multi_tf_alignment: number;
    trend_alignment: number;
  };
  volume_confirmed: boolean;
  trend_aligned: boolean;
  multi_tf_aligned: boolean;
  description: string;
  price_target: number | null;
  stop_loss: number | null;
  pattern_start_index: number;
  pattern_end_index: number;
  annotations: IPatternAnnotation[];
  inline_data: Record<string, unknown>;
}

export interface IRegimeZone {
  start: number;
  end: number;
  regime: 'bull' | 'bear' | 'sideways';
}

export interface IMotifMatch {
  current_start: number;
  current_end: number;
  match_start: number;
  match_end: number;
  match_date: string | null;
  similarity: number;
  outcome: {
    return_5d: number;
    return_10d: number;
    return_20d: number;
  };
}

export interface IDiscord {
  index: number;
  distance: number;
  date: string | null;
}

export interface IPatternDetectionV2 {
  ticker: string;
  exchange: string;
  timeframe: 'daily' | 'weekly';
  computed_at: string;

  overall_signal: 'bullish' | 'bearish' | 'neutral';
  overall_quality: IQualityScore;
  active_pattern_count: number;

  regime: {
    current: 'bull' | 'bear' | 'sideways';
    hurst_exponent: number;
    hurst_classification: 'trending' | 'mean_reverting' | 'random_walk';
    last_changepoint_index: number | null;
    changepoint_indices: number[];
    regime_zones: IRegimeZone[];
  };

  momentum: {
    rsi: { value: number; zone: string };
    macd: { histogram: number; signal: string; strengthening: boolean };
    adx: { value: number; trend: string; direction: string };
  };

  patterns: IPatternV2[];

  chart_data: IOHLCVBar[];
  overlay_data: IOverlayData[];

  matrix_profile: {
    values: number[];
    motifs: IMotifMatch[];
    discords: IDiscord[];
  } | null;

  indicators: {
    bollinger_bands: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
      bandwidth: number | null;
      position: number | null;
    };
    keltner_channel: {
      upper: number | null;
      middle: number | null;
      lower: number | null;
    };
    support_levels: number[];
    resistance_levels: number[];
    sma_20: number | null;
    sma_50: number | null;
    current_price: number;
    obv_trend: 'rising' | 'falling' | 'flat';
    cmf_value: number;
    squeeze_status: 'on' | 'off' | 'firing';
    garch_forecast: {
      current_vol: number;
      forecast_5d: number;
      regime: string;
    } | null;
  };

  error?: string;
}

// ─── Forecast ───────────────────────────────────────────────

export interface IForecast {
  ticker: string;
  exchange: string;
  model_name: string;
  horizon: number;
  forecast_dates: string[];
  forecast_values: number[];
  confidence_lower: number[];
  confidence_upper: number[];
  computed_at: string;
}

// ─── Volatility & Risk ──────────────────────────────────────

export interface IVolatilityMetrics {
  ticker: string;
  exchange: string;
  hv_20d: number | null;
  hv_60d: number | null;
  beta_90d: number | null;
  beta_365d: number | null;
  annualized_return: number | null;
  sharpe_proxy: number | null;
  max_drawdown: number | null;
  var_95_1d: number | null;
  computed_at: string;
}

// ─── F&O Dashboard ─────────────────────────────────────────

export interface IOptionStrike {
  strike: number;
  ce_ltp: number | null;
  ce_oi: number;
  ce_volume: number;
  ce_bid: number | null;
  ce_ask: number | null;
  ce_iv: number | null;
  ce_delta: number | null;
  ce_gamma: number | null;
  ce_theta: number | null;
  ce_vega: number | null;
  ce_vanna: number | null;
  ce_charm: number | null;
  ce_volga: number | null;
  ce_oi_change: number | null;
  ce_ltp_change: number | null;
  pe_ltp: number | null;
  pe_oi: number;
  pe_volume: number;
  pe_bid: number | null;
  pe_ask: number | null;
  pe_iv: number | null;
  pe_delta: number | null;
  pe_gamma: number | null;
  pe_theta: number | null;
  pe_vega: number | null;
  pe_vanna: number | null;
  pe_charm: number | null;
  pe_volga: number | null;
  pe_oi_change: number | null;
  pe_ltp_change: number | null;
}

export interface IFnOSnapshot {
  underlying: string;
  underlying_price: number;
  futures_price: number | null;
  expiry: string;
  available_expiries: string[];
  lot_size: number;
  chain: IOptionStrike[];
  pcr_oi: number | null;
  pcr_volume: number | null;
  max_pain_strike: number | null;
  max_ce_oi_strike: number | null;
  max_pe_oi_strike: number | null;
  total_ce_oi: number;
  total_pe_oi: number;
  total_ce_volume: number;
  total_pe_volume: number;
  atm_iv: number | null;
  iv_skew: number | null;
  futures_basis: number | null;
  futures_basis_pct: number | null;
  near_month_futures_oi: number | null;
  next_month_futures_oi: number | null;
  sentiment: FnOSentiment | null;
  // GEX analytics
  zero_gamma_level: number | null;
  call_wall_strike: number | null;
  put_wall_strike: number | null;
  dealer_regime: 'positive_gamma' | 'negative_gamma' | null;
  gex_predicted_range_low: number | null;
  gex_predicted_range_high: number | null;
  net_gex: number | null;
  net_dex: number | null;
  total_vanna_exposure: number | null;
  total_charm_exposure: number | null;
  total_vex: number | null;
  computed_at: string;
}

export interface IFnOHistory {
  timestamp: string;
  pcr_oi: number | null;
  pcr_volume: number | null;
  atm_iv: number | null;
  futures_basis: number | null;
  underlying_price: number;
  max_pain_strike: number | null;
  zero_gamma_level: number | null;
  dealer_regime: string | null;
  net_gex: number | null;
}

export type OIBuildupType = 'long_buildup' | 'short_buildup' | 'short_covering' | 'long_unwinding' | 'neutral';

export interface IOIBuildup {
  strike: number;
  ce_buildup: OIBuildupType;
  pe_buildup: OIBuildupType;
  ce_oi_change: number;
  pe_oi_change: number;
  ce_price_change: number;
  pe_price_change: number;
}

export interface IGEXLevels {
  underlying: string;
  underlying_price: number;
  zero_gamma_level: number | null;
  call_wall_strike: number | null;
  put_wall_strike: number | null;
  dealer_regime: 'positive_gamma' | 'negative_gamma' | null;
  gex_predicted_range_low: number | null;
  gex_predicted_range_high: number | null;
  net_gex: number | null;
  net_dex: number | null;
  total_vanna_exposure: number | null;
  total_charm_exposure: number | null;
  total_vex: number | null;
  computed_at: string;
}

export interface IFnOUnderlying {
  symbol: string;
  name: string;
  lot_size: number;
  type: 'index' | 'stock';
}

export type FnOSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

// ─── Bubble Chart (for /stocks page) ────────────────────────

export interface IBubbleStock {
  ticker: string;
  name: string;
  sector: string;
  lastPrice: number | null;
  change: number | null;
  changePercent: number | null;
  marketCap: number | null;
}

// ─── Sector Colors ──────────────────────────────────────────

export const SECTOR_COLORS: Record<string, string> = {
  IT: '#60A5FA',
  Banking: '#6EE7B7',
  Pharma: '#A78BFA',
  Automobile: '#F59E0B',
  FMCG: '#34D399',
  'Oil & Gas': '#EF4444',
  Metals: '#94A3B8',
  Infrastructure: '#FB923C',
  'Financial Services': '#2DD4BF',
  Telecom: '#818CF8',
  Insurance: '#F472B6',
  Power: '#FBBF24',
  Conglomerate: '#E879F9',
  'Consumer Goods': '#FB7185',
  Mining: '#78716C',
  'Cement & Building Materials': '#D4D4D8',
  Chemicals: '#4ADE80',
  Healthcare: '#22D3EE',
};

// ─── News Intelligence ─────────────────────────────────────

export interface INewsEntity {
  name: string;
  type: 'company' | 'person' | 'event' | 'sector' | 'policy';
  ticker: string | null;
}

export interface INewsCluster {
  cluster_label: string;
  cluster_summary: string;
  primary_theme: string;
  tickers: string[];
  avg_sentiment_score: number;
  article_count: number;
  latest_article_at: string;
  articles: INewsArticle[];
}

export interface INewsGraphNode {
  id: string;
  type: 'article' | 'ticker' | 'theme';
  label: string;
  sentiment: string | null;
  sentiment_score: number | null;
  published_at: string | null;
  source: string | null;
  article_count: number | null;
}

export interface INewsGraphEdge {
  source: string;
  target: string;
  relationship: 'mentions' | 'co_topic' | 'temporal' | 'co_occurrence';
  weight: number;
}

export interface INewsGraph {
  nodes: INewsGraphNode[];
  edges: INewsGraphEdge[];
}

export interface INewsMindMapNode {
  id: string;
  label: string;
  type: 'ticker' | 'theme' | 'article' | 'fact';
  sentiment: string | null;
  sentiment_score: number | null;
  source: string | null;
  published_at: string | null;
  url: string | null;
  impact: { '1h': number | null; '4h': number | null; '1d': number | null } | null;
  article_count: number | null;
  children: INewsMindMapNode[];
}

export interface INewsTimelineEvent {
  id: string;
  headline: string;
  published_at: string | null;
  sentiment: string | null;
  impact_magnitude: number | null;
  tickers: string[];
  theme: string | null;
  source: string;
  url: string;
}

export interface INewsTimeline {
  events: INewsTimelineEvent[];
  price_series: Record<string, Array<{ timestamp: string; close: number; volume: number }>>;
  impact_markers: Array<{ event_id: string; ticker: string; price_change_1d: number | null }>;
}
