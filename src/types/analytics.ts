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
  valuation?: ISectorValuation;
  stocks: ISectorStockEnriched[];
  computed_at: string;
}

// ─── Sector Valuation ───────────────────────────────────────

export interface ISectorValuationMetric {
  weighted_avg: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  count: number;
}

export interface ISectorValuation {
  sector: string;
  metrics: {
    pe_ratio: ISectorValuationMetric;
    price_to_book: ISectorValuationMetric;
    dividend_yield: ISectorValuationMetric;
    ev_to_ebitda: ISectorValuationMetric;
    return_on_equity: ISectorValuationMetric;
  };
  stocks: Array<{
    ticker: string;
    pe: number | null;
    pb: number | null;
    dy: number | null;
    ev_ebitda: number | null;
    roe: number | null;
    market_cap: number | null;
  }>;
  computed_at: string;
}

// ─── Sector FII Flow ───────────────────────────────────────

export interface ISectorFIIFlowQuarter {
  quarter_end: string;
  fii_pct: number;
  dii_pct: number;
  promoter_pct: number;
  retail_pct: number;
}

export interface ISectorFIIFlow {
  sector: string;
  quarters: ISectorFIIFlowQuarter[];
  current: {
    fii_pct: number;
    dii_pct: number;
    promoter_pct: number;
    retail_pct: number;
  };
  qoq_change: {
    fii_change: number;
    dii_change: number;
    promoter_change: number;
    retail_change: number;
  };
  fii_trend: 'increasing' | 'decreasing' | 'stable';
  stock_breakdown: Array<{
    ticker: string;
    fii_pct: number;
    dii_pct: number;
    promoter_pct: number;
    retail_pct: number;
    fii_change: number;
  }>;
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
  computed_at: string;
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
  computed_at: string;
}

export interface ISectorMansfieldRS {
  sector: string;
  dates: string[];
  mansfield_rs: number[];
  rs_sma: number[];
  stage: 'Basing' | 'Advancing' | 'Topping' | 'Declining';
  stage_duration_days: number;
  computed_at: string;
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
  computed_at: string;
}

// ─── Sector Financials ────────────────────────────────────────

export interface ISectorFinancialsQuarter {
  fiscal_year: number;
  fiscal_quarter: number;
  label: string;
  revenue: number;
  ebitda: number;
  pat: number;
  revenue_yoy: number | null;
  ebitda_yoy: number | null;
  pat_yoy: number | null;
}

export interface ISectorFinancials {
  sector: string;
  quarters: ISectorFinancialsQuarter[];
  computed_at: string;
}

// ─── Sector Earnings Calendar ────────────────────────────────

export interface ISectorEarningsEntry {
  ticker: string;
  name: string;
  earnings_date: string;
  days_away?: number;
  days_ago?: number;
}

export interface ISectorEarningsCalendar {
  sector: string;
  upcoming: ISectorEarningsEntry[];
  recent: ISectorEarningsEntry[];
  computed_at: string;
}

// ─── Daily FII/DII Flow (NSE aggregate) ────────────────────

export interface IFIIDIIDailyFlow {
  trade_date: string;
  fii_buy: number;
  fii_sell: number;
  fii_net: number;
  dii_buy: number;
  dii_sell: number;
  dii_net: number;
}

export interface IFIIDIISummary {
  month: string;
  trading_days: number;
  fii_net_total_cr: number;
  dii_net_total_cr: number;
  fii_streak_days: number;
  last_updated: string | null;
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
  rolling_ewma: (number | null)[];
  current_20d: number | null;
  current_60d: number | null;
  current_90d: number | null;
  current_ewma: number | null;
  confidence_lower_60d: (number | null)[];
  confidence_upper_60d: (number | null)[];
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
  kendall: { tau: number; p_value: number; significant: boolean };
  n_observations: number;
  method_divergence: number;
  divergence_flag: boolean;
  window_days: number;
  stability?: ICorrelationStability | null;
}

export interface IEnhancedMatrix extends ICorrelationMatrix {
  p_values: Record<string, number>;
  significant_pairs: number;
  method: 'pearson' | 'spearman' | 'kendall';
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

// ─── DCC-GARCH ──────────────────────────────────────────────

export interface IDCCGarch {
  ticker_a: string;
  ticker_b: string;
  dates: string[];
  dcc_correlation: number[];
  static_correlation: number;
  current_dcc: number;
  dcc_params: { a: number; b: number } | null;
  persistence: number | null;
  garch_a: { omega: number; alpha: number; beta: number; persistence: number } | null;
  garch_b: { omega: number; alpha: number; beta: number; persistence: number } | null;
  error?: string;
}

// ─── Granger Causality ──────────────────────────────────────

export interface IGrangerLagResult {
  f_statistic: number;
  p_value: number;
  significant: boolean;
}

export interface IGrangerDirection {
  per_lag: Record<number, IGrangerLagResult>;
  best_lag: number;
  best_p_value: number;
  significant: boolean;
  error?: string;
}

export interface IGrangerCausality {
  ticker_a: string;
  ticker_b: string;
  a_causes_b: IGrangerDirection;
  b_causes_a: IGrangerDirection;
  interpretation: string;
  n_observations: number;
  max_lag: number;
  window_days: number;
  error?: string;
}

// ─── Cointegration (Pairs Trading) ──────────────────────────

export interface ICointegration {
  ticker_a: string;
  ticker_b: string;
  cointegrated: boolean;
  test_statistic: number;
  p_value: number;
  critical_values: { '1%': number; '5%': number; '10%': number };
  hedge_ratio: number;
  spread_adf: { statistic: number; p_value: number; stationary: boolean };
  half_life_days: number | null;
  spread_mean: number;
  spread_std: number;
  spread_current: number;
  spread_z_score: number;
  spread_points: Array<{ date: string; value: number }>;
  n_observations: number;
  window_days: number;
  error?: string;
}

// ─── Single Asset Explorer ──────────────────────────────────

export interface IAssetCorrelationPeer {
  peer: string;
  correlation: number;
  asset_type: string;
}

export interface IAssetCorrelations {
  ticker: string;
  window: string;
  method: string;
  peers: IAssetCorrelationPeer[];
  total_peers: number;
  avg_correlation: number;
  most_correlated: IAssetCorrelationPeer | null;
  least_correlated: IAssetCorrelationPeer | null;
}

// ─── Correlation Changes ────────────────────────────────────

export interface ICorrelationMover {
  pair: [string, string];
  current: number;
  previous: number;
  change: number;
}

export interface ICorrelationChanges {
  movers: ICorrelationMover[];
  window_days: number;
}

// ─── Regime Correlation ─────────────────────────────────────

export interface IRegimeEntry {
  regime: string;
  correlation: number;
  n_observations: number;
}

export interface IRegimeCorrelation {
  ticker_a: string;
  ticker_b: string;
  window_days: number;
  regimes: IRegimeEntry[];
}

// ─── Autocorrelation ────────────────────────────────────────

export interface IAutocorrelation {
  ticker: string;
  window_days: number;
  n_observations: number;
  lags: number[];
  acf: number[];
  ci_lower: number[];
  ci_upper: number[];
  significant_lags: number[];
  interpretation: string;
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
  predicted_impact?: number | null;
  predicted_direction?: 'positive' | 'negative' | 'neutral' | null;
  prediction_confidence?: number | null;
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
  exchanges?: string[];
  sentiment: string | null;
  sentiment_score: number | null;
  sentiment_source?: 'spacy' | 'llm' | null;
  sentiment_rationale?: string | null;
  priority?: 'breaking' | 'high' | 'normal' | 'low';
  quality_score?: number | null;
  categories?: string[];
}

// ─── Story Arc (narrative across time) ─────────────────────────
export interface IStoryArc {
  id: string;
  story_label: string;
  narrative: string;
  story_phase: 'breaking' | 'developing' | 'analysis' | 'reaction' | 'concluded';
  tickers: string[];
  exchanges: string[];
  primary_theme: string;
  article_count: number;
  sentiment_trajectory: Array<{ timestamp: string; score: number; phase: string }>;
  price_context: Record<string, { price_at_start: number; price_now: number; change_pct: number }>;
  first_article_at: string;
  latest_article_at: string;
  news_ids: string[];
}

// ─── Sentiment Trajectory ──────────────────────────────────────
export interface ISentimentBucket {
  bucket_start: string;
  avg_sentiment: number;
  article_count: number;
  dominant_theme: string;
}

// ─── Sentiment Divergence ──────────────────────────────────────
export interface ISentimentDivergence {
  divergence: boolean;
  type: 'bullish_divergence' | 'bearish_divergence' | null;
  correlation: number;
  sentiment_trend: 'improving' | 'declining' | 'flat';
  price_trend: 'up' | 'down' | 'flat';
}

// ─── Morning Brief ─────────────────────────────────────────────
export interface IMorningBriefKeyNumber {
  label: string;
  value: string;
  change: string;
  direction: 'up' | 'down' | 'flat';
}

export interface IMorningBriefWatchItem {
  ticker: string;
  reason: string;
  sentiment: string;
}

export interface IMorningBrief {
  narrative: string;
  top_stories: string[];
  market_sentiment: string;
  generated_at: string;
  brief_type?: 'morning' | 'midday' | 'evening';
  key_numbers?: IMorningBriefKeyNumber[];
  sector_outlook?: Record<string, string>;
  watch_list?: IMorningBriefWatchItem[];
  theme_breakdown?: Record<string, number>;
}

// ─── News Impact (predicted) ──────────────────────────────────

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
  type: 'marker' | 'line' | 'zone' | 'label' | 'target';
  index?: number;
  from_index?: number;
  to_index?: number;
  price?: number;
  position?: 'above' | 'below';
  shape?: 'circle' | 'arrowUp' | 'arrowDown';
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  text?: string;
  label?: string;
  opacity?: number;
  start_index?: number;
  end_index?: number;
  data?: Record<string, unknown>;
}

export interface IPatternV2 {
  id: string;
  type: string;
  category: 'candlestick' | 'chart' | 'momentum' | 'volatility' | 'volume' | 'regime' | 'matrix_profile';
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

export interface ISRLevel {
  price: number;
  strength: number;
  touches: number;
  type: 'swing' | 'volume' | 'pivot';
}

export interface IPivotPoints {
  p: number;
  s1: number;
  s2: number;
  r1: number;
  r2: number;
}

export interface ISupertrend {
  series: (number | null)[];
  direction: (1 | -1)[];
  current_direction: 'bullish' | 'bearish' | 'sideways';
  atr_period: number;
  multiplier: number;
}

export interface ITrendline {
  start_idx: number;
  end_idx: number;
  start_price: number;
  end_price: number;
  slope: number;
  touches: number;
  touch_indices: number[];
  direction: 'up' | 'down';
  anchor_a: number;
  anchor_b: number;
}

export interface IFibonacciLevel {
  ratio: number;
  price: number;
  label: string;
}

export interface IFibonacci {
  swing_high: number;
  swing_low: number;
  swing_high_idx: number;
  swing_low_idx: number;
  direction: 'up' | 'down';
  levels: IFibonacciLevel[];
}

export interface IPatternDetectionV2 {
  ticker: string;
  exchange: string;
  timeframe: string;
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

  supertrend: ISupertrend | null;

  trendlines?: {
    support: ITrendline[];
    resistance: ITrendline[];
  } | null;

  fibonacci?: IFibonacci | null;

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
    support_levels_detail: ISRLevel[];
    resistance_levels_detail: ISRLevel[];
    pivot_points: IPivotPoints | null;
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

// ─── Multi-Timeframe Alignment ──────────────────────────────

export interface IMTFTimeframeResult {
  signal: 'bullish' | 'bearish' | 'neutral' | 'unavailable';
  pattern_count: number;
}

export interface IMTFAlignment {
  ticker: string;
  exchange: string;
  alignment: 'full' | 'partial' | 'conflicting' | 'insufficient_data';
  timeframes: Record<string, IMTFTimeframeResult>;
  computed_at: string;
}

// ─── Pattern Scanner ────────────────────────────────────────

export interface IScannerStockResult {
  ticker: string;
  name: string;
  exchange: string;
  current_price: number | null;
  pattern_count: number;
  top_pattern: IPatternV2 | null;
  overall_signal: 'bullish' | 'bearish' | 'neutral';
  overall_grade: string;
  patterns: IPatternV2[];
}

export interface IScannerResult {
  scanned_at: string;
  total_scanned: number;
  stocks_with_patterns: number;
  total_patterns: number;
  results: IScannerStockResult[];
  summary: {
    bullish_stocks: number;
    bearish_stocks: number;
    neutral_stocks: number;
    most_common_pattern: string | null;
    highest_quality_match: IScannerStockResult | null;
  };
  filters_applied: {
    categories: string[] | null;
    direction: string | null;
    min_quality: string;
  };
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
  // India VIX
  india_vix?: number | null;
  india_vix_change?: number | null;
  // IV Rank / Percentile
  iv_rank: number | null;
  iv_percentile: number | null;
  iv_52w_high: number | null;
  iv_52w_low: number | null;
  computed_at: string;
}

export interface IFnOHistory {
  timestamp: string;
  pcr_oi: number | null;
  pcr_volume: number | null;
  atm_iv: number | null;
  futures_basis: number | null;
  futures_basis_pct: number | null;
  underlying_price: number;
  max_pain_strike: number | null;
  zero_gamma_level: number | null;
  dealer_regime: string | null;
  net_gex: number | null;
  // Expanded fields
  net_dex: number | null;
  total_vanna: number | null;
  total_charm: number | null;
  total_vex: number | null;
  call_wall_strike: number | null;
  put_wall_strike: number | null;
  gex_predicted_range_low: number | null;
  gex_predicted_range_high: number | null;
  iv_skew: number | null;
  total_ce_oi: number | null;
  total_pe_oi: number | null;
  max_ce_oi_strike: number | null;
  max_pe_oi_strike: number | null;
  sentiment: string | null;
  futures_price: number | null;
  india_vix: number | null;
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

export interface IIVTermStructure {
  underlying: string;
  term_structure: Array<{
    expiry: string;
    days_to_expiry: number;
    atm_iv: number | null;
  }>;
  available_expiries: string[];
  volatility_cone: {
    current: number | null;
    median: number;
    p25: number;
    p75: number;
    p10: number;
    p90: number;
    min: number;
    max: number;
    history: Array<{ date: string; iv: number }>;
  } | null;
  error?: string;
}

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
  relationship: 'mentions' | 'co_topic' | 'co_occurrence';
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

// ─── Currency Dashboard ─────────────────────────────────────

export interface ICurrencyPairSnapshot {
  ticker: string;
  price: number;
  change_pct: number;
  high: number | null;
  low: number | null;
  high_52w: number | null;
  low_52w: number | null;
  sparkline: number[];
}

export interface ICurrencyOverview {
  pairs: ICurrencyPairSnapshot[];
  computed_at: string;
}

export interface ICurrencyCorrelationMatrix {
  tickers: string[];
  matrix: number[][];
  computed_at: string;
}

// ─── Currency Dashboard — Pro Analytics ──────────────────────

export interface ICurrencyTechnicals {
  pair: string;
  price: number;
  sma: { sma20: number; sma50: number; sma200: number | null };
  ema: { ema9: number; ema21: number };
  rsi: { value: number; signal: 'overbought' | 'oversold' | 'neutral' };
  macd: { macd: number; signal: number; histogram: number; crossover: string | null };
  bollinger: { upper: number; middle: number; lower: number; pctB: number; bandwidth: number };
  atr: { value: number; paise: number };
  adx: { value: number; trend_strength: 'weak' | 'moderate' | 'strong' };
  stochastic: { k: number; d: number; signal: string };
  pivots: {
    classic: Record<string, number>;
    camarilla: Record<string, number>;
    fibonacci: Record<string, number>;
  };
  summary: 'BUY' | 'SELL' | 'NEUTRAL';
  computed_at: string;
}

export interface ICurrencyVolWindow {
  window: string;
  close_to_close: number;
  parkinson: number;
  yang_zhang: number;
}

export interface ICurrencyVolatility {
  pair: string;
  windows: ICurrencyVolWindow[];
  percentile_rank: number;
  regime: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
  term_structure: Array<{ window: number; rv: number }>;
  squeeze: boolean;
  current_bandwidth: number;
  computed_at: string;
}

export interface ICurrencyStrength {
  currencies: Record<string, { '1d': number; '1w': number; '1m': number; '3m': number }>;
  computed_at: string;
}

export interface ICurrencyCarryPair {
  pair: string;
  base_currency: string;
  quote_currency: string;
  base_rate: number;
  quote_rate: number;
  differential_pct: number;
  spot: number;
  forward_1y: number | null;
  forward_premium_pct: number;
  carry_risk_ratio: number;
  breakeven_depreciation_pct: number;
}

export interface ICurrencyCarry {
  pairs: ICurrencyCarryPair[];
  computed_at: string;
}

export interface ICurrencySession {
  name: string;
  is_active: boolean;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  range_paise: number;
  return_pct: number;
  bar_count: number;
}

export interface ICurrencySessions {
  pair: string;
  sessions: ICurrencySession[];
  asian_breakout: { high: number; low: number } | null;
  hourly_returns: Array<{ hour: number; avg_return: number; bar_count: number }>;
  computed_at: string;
}

export interface ICurrencyMeanReversion {
  pair: string;
  z_score: number;
  half_life_days: number | null;
  hurst: number;
  hurst_regime: 'trending' | 'random_walk' | 'mean_reverting';
  bb_pctB: number;
  bb_bandwidth: number;
  squeeze: boolean;
  computed_at: string;
}

// ─── Currency Dashboard — Global Forex Extensions ──────────

export interface IForexPair {
  pair: string;
  base: string;
  quote: string;
  category: 'major' | 'inr' | 'cross' | 'exotic';
}

export interface IForexPairList {
  pairs: IForexPair[];
  total: number;
}

export interface ICrossRatesCell {
  rate: number | null;
  change_pct: number;
}

export interface ICrossRatesMatrix {
  currencies: string[];
  matrix: ICrossRatesCell[][];
  timeframe: string;
  computed_at: string;
}

export interface ITopMover {
  pair: string;
  price: number;
  change_pct: number;
}

export interface ITopMovers {
  gainers: ITopMover[];
  losers: ITopMover[];
  computed_at: string;
}

export interface IMarketSession {
  name: string;
  city: string;
  start_utc: string;
  end_utc: string;
  is_active: boolean;
  hours_remaining: number;
}

export interface ISessionOverlap {
  sessions: string[];
  label: string;
}

export interface IMarketClock {
  sessions: IMarketSession[];
  active_count: number;
  overlaps: ISessionOverlap[];
  is_weekend: boolean;
  current_utc: string;
  computed_at: string;
}

export interface ICentralBankRate {
  currency: string;
  bank_name: string;
  bank_code: string;
  current_rate: number;
  previous_rate: number;
  last_change_date: string | null;
  last_change_bps: number;
  next_meeting_date: string | null;
  rate_history: Array<{ date: string; rate: number }>;
}

export interface ICentralBankRates {
  rates: ICentralBankRate[];
  computed_at: string;
}

export interface IRateDifferentialMatrix {
  currencies: string[];
  matrix: (number | null)[][];
  computed_at: string;
}

export interface IUpcomingMeeting {
  date: string;
  currency: string;
  bank_name: string;
  bank_code: string;
  current_rate: number;
  days_until: number;
}

export interface IUpcomingMeetings {
  meetings: IUpcomingMeeting[];
  computed_at: string;
}

export interface IEconomicEvent {
  event_date: string;
  currency: string;
  event_name: string;
  impact: 'high' | 'medium' | 'low';
  previous: string | null;
  forecast: string | null;
  actual: string | null;
  days_until: number;
}

export interface IEconomicCalendar {
  events: IEconomicEvent[];
  computed_at: string;
}

export interface ICurrencyRegime {
  pair: string;
  current_regime: string;
  hurst_exponent: number | null;
  hurst_classification: string;
  volatility_regime: string;
  regime_zones: Array<{ start: number; end: number; regime: string }>;
  regime_duration_days: number;
  computed_at: string;
}

export interface IINRFIICorrelationPoint {
  quarter_end: string;
  fii_pct_avg: number;
  fii_change: number;
  usdinr_close: number | null;
  usdinr_change_pct: number;
  stock_count: number;
}

export interface IINRFIICorrelation {
  time_series: IINRFIICorrelationPoint[];
  correlation: number | null;
  interpretation: string | null;
  current: IINRFIICorrelationPoint | null;
  quarters_analyzed: number;
  computed_at: string;
}

export interface ICommodityForexPair {
  commodity: string;
  fx_pair: string;
  current_correlation: number | null;
  overall_correlation: number;
  rolling_series: Array<{ date: string; correlation: number }>;
  price_series: Array<{ date: string; commodity_price: number; fx_price: number }>;
  data_points: number;
  interpretation: string;
}

export interface ICommodityForexCorrelation {
  pairs: ICommodityForexPair[];
  rolling_window: number;
  lookback_days: number;
  computed_at: string;
}

export interface IRBIReservesPoint {
  date: string;
  total_reserves: number;
  fca: number;
  gold: number;
  sdr: number;
  imf_reserve_tranche: number;
  wow_change: number | null;
}

export interface IRBIReserves {
  time_series: IRBIReservesPoint[];
  trend: 'increasing' | 'decreasing' | 'stable' | null;
  current: IRBIReservesPoint | null;
  peak: number | null;
  trough: number | null;
  weeks_analyzed: number;
  usdinr_correlation: number | null;
  computed_at: string;
}

export interface ICotCurrencyData {
  currency: string;
  spec_long: number;
  spec_short: number;
  spec_net: number;
  comm_net: number;
  open_interest: number;
  cot_index: number | null;
  wow_change: number | null;
  signal: 'extreme_long' | 'extreme_short' | 'bullish' | 'bearish' | 'neutral';
  report_date: string;
  time_series: Array<{
    date: string;
    spec_net: number;
    comm_net: number;
    open_interest: number;
    cot_index: number | null;
  }>;
}

export interface ICotDashboard {
  currencies: ICotCurrencyData[];
  extremes: ICotCurrencyData[];
  data_source: string;
  computed_at: string;
}

export interface IPriceAlert {
  id: string;
  pair: string;
  condition: 'above' | 'below' | 'cross_above' | 'cross_below';
  target_price: number;
  note: string;
  is_active: boolean;
  created_price: number | null;
  triggered_at: string | null;
  triggered_price: number | null;
  created_at: string;
}

// ─── Commodity Dashboard ────────────────────────────────────

export interface ICommoditySnapshot {
  ticker: string;
  price_usd: number;
  price_inr: number | null;
  change_pct: number;
  high_52w: number | null;
  low_52w: number | null;
  sparkline: number[];
}

export interface ICommodityOverview {
  commodities: ICommoditySnapshot[];
  computed_at: string;
}

export interface IMonthlyReturn {
  month: number;
  avg_1y: number;
  avg_3y: number;
  avg_5y: number;
  win_rate_5y: number;
}

export interface ICommoditySeasonality {
  ticker: string;
  monthly_returns: IMonthlyReturn[];
}

// =============================================================================
// Factor Models (Phase 4A)
// =============================================================================

export interface IFactorExposures {
  ticker: string;
  exchange: string;
  alpha_annualized: number;
  r_squared: number;
  betas: Record<string, number>;
  window_days: number;
  factor_stats: Record<string, { annualized_return: number; annualized_vol: number }>;
  sector: string;
  error?: string;
}

export interface IFactorReturns {
  dates: string[];
  series: Record<string, number[]>;
  rf_annual: number;
  error?: string;
}

// =============================================================================
// Portfolio Risk (Phase 4B)
// =============================================================================

export interface IStressTest {
  scenario_id: string;
  label: string;
  description: string;
  portfolio_loss_pct: number;
  stressed_daily_vol: number;
  per_stock_impact: Record<string, number>;
}

export interface IPortfolioRisk {
  tickers: string[];
  weights: Record<string, number>;
  var_95_1d: number;
  cvar_95_1d: number;
  portfolio_vol_daily: number;
  portfolio_vol_annual: number;
  historical_var_95: number;
  historical_cvar_95: number;
  cornish_fisher_var_95: number;
  skewness: number;
  excess_kurtosis: number;
  marginal_var: Record<string, number>;
  component_var: Record<string, number>;
  component_var_pct: Record<string, number>;
  incremental_var: Record<string, number>;
  stress_tests: IStressTest[];
  observation_days: number;
  error?: string;
}

// =============================================================================
// Alpha Attribution (Phase 4C)
// =============================================================================

export interface IAlphaAttribution {
  ticker: string;
  exchange: string;
  period_days: number;
  beta: number;
  jensens_alpha: number;
  information_ratio: number;
  treynor_ratio: number;
  m_squared: number;
  sharpe_ratio: number;
  active_share: number;
  tracking_error: number;
  tracking_error_factor: number;
  tracking_error_specific: number;
  annualized_return: number;
  annualized_vol: number;
  benchmark_return: number;
  benchmark_vol: number;
  risk_free_rate: number;
  error?: string;
}

// =============================================================================
// Quality Scores (Phase 4D)
// =============================================================================

export interface IPiotroskiScore {
  score: number | null;
  max_score: number;
  label: string;
  signals?: Record<string, number>;
  error?: string;
}

export interface IAltmanZScore {
  score: number | null;
  label: string;
  components?: Record<string, number>;
  error?: string;
}

export interface IBeneishMScore {
  score: number | null;
  threshold: number;
  label: string;
  components?: Record<string, number>;
  error?: string;
}

export interface IQualityScores {
  ticker: string;
  exchange: string;
  piotroski: IPiotroskiScore;
  altman_z: IAltmanZScore;
  beneish_m: IBeneishMScore;
}

// ─── News Intelligence: Portfolio News ──────────────────────────

export interface IPortfolioTickerDigest {
  ticker: string;
  article_count: number;
  avg_sentiment: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  latest_headline: string | null;
  latest_published_at: string | null;
}

export interface IPortfolioNewsResponse {
  tickers: IPortfolioTickerDigest[];
  articles: INewsArticle[];
  count: number;
}

// ─── News Intelligence: Entity Data ─────────────────────────────

export interface EntityData {
  entities: Array<{ name: string; type: string; ticker: string | null }>;
  themes: string[];
  key_facts: string[];
}
