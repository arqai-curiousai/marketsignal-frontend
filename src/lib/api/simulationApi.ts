/**
 * Simulation Lab API — All Simulations.
 */

import apiClient from './apiClient';
import type { ApiResult } from './apiClient';
import type {
  IVolatilityAnalysis,
  IVolatilityConePoint,
  IGARCHForecast,
  IGARCHForecastPoint,
  IEstimatorResult,
  IVolRegime,
  IRollingVolSeries,
  IVolatilityCompareItem,
  VolRegimeLevel,
  RegimeLabel,
  IRegimeAnalysis,
  IMonteCarloAnalysis,
  IMonteCarloResult,
  ITargetProbabilityResult,
  IPortfolioOptimization,
  IPresetBasket,
  IBacktestAnalysis,
  IStrategyCatalogItem,
  IRiskScoreResult,
  IRiskQuizResult,
  IRiskSubScore,
  IRiskSuggestion,
  IRiskZone,
  IScenarioResult,
  IScenarioPreset,
  IScenarioMetrics,
  IScenarioStockImpact,
  IFactorDecomposition,
  IFactorDefinition,
  IFactorAttribution,
} from '@/types/simulation';

// =============================================================================
// Raw snake_case types from backend
// =============================================================================

interface RawEstimator {
  name: string;
  label: string;
  current_value: number | null;
  description: string;
  efficiency: number;
}

interface RawConePoint {
  window: number;
  window_label: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  current: number;
}

interface RawGARCHPoint {
  day: number;
  mean_vol: number;
  lower_68: number;
  upper_68: number;
  lower_95: number;
  upper_95: number;
}

interface RawGARCH {
  current_vol: number;
  forecast_series: RawGARCHPoint[];
  persistence: number;
  half_life_days: number | null;
  long_run_vol: number | null;
  params: { omega: number; alpha: number; beta: number };
}

interface RawRegime {
  regime: string;
  percentile: number;
  current_vol: number | null;
  median_vol: number | null;
  description: string;
}

interface RawRollingSeries {
  dates: string[];
  values: number[];
}

interface RawVolatilityAnalysis {
  ticker: string;
  exchange: string;
  estimators: RawEstimator[];
  recommended_estimator: string;
  rolling_series: Record<string, RawRollingSeries>;
  cone: RawConePoint[];
  garch: RawGARCH | null;
  garch_unavailable: boolean;
  regime: RawRegime;
  computed_at: string;
  data_points: number;
  trading_days_per_year: number;
}

interface RawCompareItem {
  ticker: string;
  exchange: string;
  current_vol: number | null;
  regime: string | null;
  percentile: number | null;
}

// =============================================================================
// Transform functions
// =============================================================================

function transformEstimator(raw: RawEstimator): IEstimatorResult {
  return {
    name: raw.name,
    label: raw.label,
    currentValue: raw.current_value,
    description: raw.description,
    efficiency: raw.efficiency,
  };
}

function transformConePoint(raw: RawConePoint): IVolatilityConePoint {
  return {
    window: raw.window,
    windowLabel: raw.window_label,
    p10: raw.p10,
    p25: raw.p25,
    p50: raw.p50,
    p75: raw.p75,
    p90: raw.p90,
    current: raw.current,
  };
}

function transformGARCHPoint(raw: RawGARCHPoint): IGARCHForecastPoint {
  return {
    day: raw.day,
    meanVol: raw.mean_vol,
    lower68: raw.lower_68,
    upper68: raw.upper_68,
    lower95: raw.lower_95,
    upper95: raw.upper_95,
  };
}

function transformGARCH(raw: RawGARCH | null): IGARCHForecast | null {
  if (!raw) return null;
  return {
    currentVol: raw.current_vol,
    forecastSeries: raw.forecast_series.map(transformGARCHPoint),
    persistence: raw.persistence,
    halfLifeDays: raw.half_life_days,
    longRunVol: raw.long_run_vol,
    params: raw.params,
  };
}

function transformRegime(raw: RawRegime): IVolRegime {
  return {
    regime: raw.regime as VolRegimeLevel,
    percentile: raw.percentile,
    currentVol: raw.current_vol,
    medianVol: raw.median_vol,
    description: raw.description,
  };
}

function transformAnalysis(raw: RawVolatilityAnalysis): IVolatilityAnalysis {
  const rollingSeries: Record<string, IRollingVolSeries> = {};
  for (const [key, val] of Object.entries(raw.rolling_series)) {
    rollingSeries[key] = { dates: val.dates, values: val.values };
  }

  return {
    ticker: raw.ticker,
    exchange: raw.exchange,
    estimators: raw.estimators.map(transformEstimator),
    recommendedEstimator: raw.recommended_estimator,
    rollingSeries,
    cone: raw.cone.map(transformConePoint),
    garch: transformGARCH(raw.garch),
    garchUnavailable: raw.garch_unavailable ?? false,
    regime: transformRegime(raw.regime),
    computedAt: raw.computed_at,
    dataPoints: raw.data_points,
    tradingDaysPerYear: raw.trading_days_per_year,
  };
}

function transformCompareItem(raw: RawCompareItem): IVolatilityCompareItem {
  return {
    ticker: raw.ticker,
    exchange: raw.exchange,
    currentVol: raw.current_vol,
    regime: raw.regime as VolRegimeLevel | null,
    percentile: raw.percentile,
  };
}

// =============================================================================
// API functions
// =============================================================================

export const simulationApi = {
  async getVolatility(
    ticker: string,
    exchange = 'NSE',
    estimator = 'yang_zhang',
    options?: { signal?: AbortSignal; includeAi?: boolean },
  ): Promise<ApiResult<IVolatilityAnalysis>> {
    const params: Record<string, string> = { exchange, estimator };
    if (options?.includeAi) params.include_ai = 'true';
    const result = await apiClient.get<RawVolatilityAnalysis>(
      `/api/simulations/volatility/${encodeURIComponent(ticker)}`,
      params,
      { signal: options?.signal },
    );
    if (result.success) {
      return { success: true, data: transformAnalysis(result.data) };
    }
    return result as ApiResult<IVolatilityAnalysis>;
  },

  async getVolatilityCone(
    ticker: string,
    exchange = 'NSE',
    estimator = 'yang_zhang',
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IVolatilityConePoint[]>> {
    const result = await apiClient.get<{ cone: RawConePoint[] }>(
      `/api/simulations/volatility/${encodeURIComponent(ticker)}/cone`,
      { exchange, estimator },
      { signal: options?.signal },
    );
    if (result.success) {
      return { success: true, data: result.data.cone.map(transformConePoint) };
    }
    return result as ApiResult<IVolatilityConePoint[]>;
  },

  async getGARCHForecast(
    ticker: string,
    exchange = 'NSE',
    horizon = 21,
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IGARCHForecast>> {
    const result = await apiClient.get<{ forecast: RawGARCH }>(
      `/api/simulations/volatility/${encodeURIComponent(ticker)}/forecast`,
      { exchange, horizon },
      { signal: options?.signal },
    );
    if (result.success && result.data.forecast) {
      const transformed = transformGARCH(result.data.forecast);
      if (transformed) {
        return { success: true, data: transformed };
      }
    }
    return { success: false, error: { message: 'GARCH forecast unavailable', status: 422 } } as ApiResult<IGARCHForecast>;
  },

  async compareVolatility(
    tickers: string[],
    exchange = 'NSE',
    estimator = 'yang_zhang',
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IVolatilityCompareItem[]>> {
    const result = await apiClient.get<{ items: RawCompareItem[] }>(
      '/api/simulations/volatility/compare',
      { tickers: tickers.join(','), exchange, estimator },
      { signal: options?.signal },
    );
    if (result.success) {
      return { success: true, data: result.data.items.map(transformCompareItem) };
    }
    return result as ApiResult<IVolatilityCompareItem[]>;
  },

  // ─── Regime Detection ──────────────────────────────────────────

  async getRegimeAnalysis(
    ticker: string,
    exchange = 'NSE',
    maxStates = 3,
    options?: { signal?: AbortSignal; includeAi?: boolean },
  ): Promise<ApiResult<IRegimeAnalysis>> {
    const params: Record<string, string | number> = { exchange, max_states: maxStates };
    if (options?.includeAi) (params as Record<string, string>).include_ai = 'true';
    const result = await apiClient.get<RawRegimeAnalysis>(
      `/api/simulations/regimes/${encodeURIComponent(ticker)}`,
      params,
      { signal: options?.signal },
    );
    if (result.success) {
      return { success: true, data: transformRegimeAnalysis(result.data) };
    }
    return result as ApiResult<IRegimeAnalysis>;
  },

  // ─── Monte Carlo ───────────────────────────────────────────────

  async getMonteCarloAnalysis(
    ticker: string,
    exchange = 'NSE',
    horizon = 252,
    nPaths = 10000,
    target?: number,
    options?: { signal?: AbortSignal; includeAi?: boolean },
  ): Promise<ApiResult<IMonteCarloAnalysis>> {
    const params: Record<string, string | number | boolean | undefined> = { exchange, horizon, n_paths: nPaths };
    if (target != null) params.target = target;
    if (options?.includeAi) params.include_ai = true;
    const result = await apiClient.get<RawMonteCarloAnalysis>(
      `/api/simulations/montecarlo/${encodeURIComponent(ticker)}`,
      params,
      { signal: options?.signal },
    );
    if (result.success) {
      return { success: true, data: transformMonteCarloAnalysis(result.data) };
    }
    return result as ApiResult<IMonteCarloAnalysis>;
  },

  async getTargetProbability(
    ticker: string,
    target: number,
    exchange = 'NSE',
    horizon = 252,
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<ITargetProbabilityResult>> {
    const result = await apiClient.get<RawTargetProbabilityResult>(
      `/api/simulations/montecarlo/${encodeURIComponent(ticker)}/target`,
      { target, exchange, horizon },
      { signal: options?.signal },
    );
    if (result.success) {
      return { success: true, data: transformTargetProbability(result.data) };
    }
    return result as ApiResult<ITargetProbabilityResult>;
  },

  // ─── Portfolio ─────────────────────────────────────────────────

  async optimizePortfolio(
    tickers: string[],
    exchange = 'NSE',
    lookbackDays = 756,
    maxWeight = 0.30,
    riskFreeRate = 0.065,
    modes?: string[],
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IPortfolioOptimization>> {
    const body: Record<string, unknown> = {
      tickers,
      exchange,
      lookback_days: lookbackDays,
      max_weight: maxWeight,
      risk_free_rate: riskFreeRate,
    };
    if (modes) body.modes = modes;
    const result = await apiClient.post<RawPortfolioOptimization>(
      '/api/simulations/portfolio/optimize',
      body,
      { signal: options?.signal },
    );
    if (result.success) {
      try {
        return { success: true, data: transformPortfolioOptimization(result.data) };
      } catch (err) {
        console.warn('Portfolio transform failed:', err);
        return { success: false, error: { message: 'Failed to parse portfolio data' } } as ApiResult<IPortfolioOptimization>;
      }
    }
    return result as ApiResult<IPortfolioOptimization>;
  },

  async getPresets(
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IPresetBasket[]>> {
    const result = await apiClient.get<{ presets: Array<Record<string, unknown>> }>(
      '/api/simulations/portfolio/presets',
      undefined,
      { signal: options?.signal },
    );
    if (result.success) {
      return {
        success: true,
        data: result.data.presets.map((p) => ({
          id: p.id as string,
          label: p.label as string,
          description: p.description as string,
          tickers: p.tickers as string[],
        })),
      };
    }
    return result as ApiResult<IPresetBasket[]>;
  },

  async runPresetPortfolio(
    presetId: string,
    exchange = 'NSE',
    lookbackDays = 756,
    maxWeight = 0.30,
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IPortfolioOptimization>> {
    const result = await apiClient.get<RawPortfolioOptimization>(
      `/api/simulations/portfolio/presets/${encodeURIComponent(presetId)}`,
      { exchange, lookback_days: lookbackDays, max_weight: maxWeight },
      { signal: options?.signal },
    );
    if (result.success) {
      return { success: true, data: transformPortfolioOptimization(result.data) };
    }
    return result as ApiResult<IPortfolioOptimization>;
  },

  // ─── Backtesting ───────────────────────────────────────────────

  async runBacktest(
    tickers: string[],
    exchange = 'NSE',
    strategies?: string[],
    lookbackYears = 3,
    paramsOverride?: Record<string, Record<string, number>>,
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IBacktestAnalysis>> {
    const body: Record<string, unknown> = {
      tickers,
      exchange,
      lookback_years: lookbackYears,
    };
    if (strategies) body.strategies = strategies;
    if (paramsOverride) body.params_override = paramsOverride;
    const result = await apiClient.post<RawBacktestAnalysis>(
      '/api/simulations/backtest/run',
      body,
      { signal: options?.signal },
    );
    if (result.success) {
      try {
        return { success: true, data: transformBacktestAnalysis(result.data) };
      } catch (err) {
        console.warn('Backtest transform failed:', err);
        return { success: false, error: { message: 'Failed to parse backtest data' } } as ApiResult<IBacktestAnalysis>;
      }
    }
    return result as ApiResult<IBacktestAnalysis>;
  },

  async getBacktestStrategies(
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IStrategyCatalogItem[]>> {
    const result = await apiClient.get<{ strategies: Array<Record<string, unknown>> }>(
      '/api/simulations/backtest/strategies',
      undefined,
      { signal: options?.signal },
    );
    if (result.success) {
      return {
        success: true,
        data: result.data.strategies.map((s) => ({
          name: s.name as string,
          label: s.label as string,
          description: s.description as string,
          params: s.params as Record<string, number>,
          rebalance: s.rebalance as string,
        })),
      };
    }
    return result as ApiResult<IStrategyCatalogItem[]>;
  },

  // ─── Risk Score ─────────────────────────────────────────────

  async computeRiskScore(
    tickers: string[],
    weights?: number[],
    exchange = 'NSE',
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IRiskScoreResult>> {
    const body: Record<string, unknown> = { tickers, exchange };
    if (weights) body.weights = weights;
    const result = await apiClient.post<RawRiskScoreResult>(
      '/api/simulations/risk-score',
      body,
      { signal: options?.signal },
    );
    if (result.success) {
      try {
        return { success: true, data: transformRiskScoreResult(result.data) };
      } catch (err) {
        console.warn('Risk score transform failed:', err);
        return { success: false, error: { message: 'Failed to parse risk score data' } } as ApiResult<IRiskScoreResult>;
      }
    }
    return result as ApiResult<IRiskScoreResult>;
  },

  async getRiskSuggestions(
    tickers: string[],
    weights?: number[],
    exchange = 'NSE',
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IRiskSuggestion[]>> {
    const body: Record<string, unknown> = { tickers, exchange };
    if (weights) body.weights = weights;
    const result = await apiClient.post<{ suggestions: RawRiskSuggestion[] }>(
      '/api/simulations/risk-score/suggest',
      body,
      { signal: options?.signal },
    );
    if (result.success) {
      return {
        success: true,
        data: result.data.suggestions.map(transformRiskSuggestion),
      };
    }
    return result as ApiResult<IRiskSuggestion[]>;
  },

  async getRiskBenchmarks(
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<Record<string, { label: string; score: number; description: string }>>> {
    const result = await apiClient.get<{ benchmarks: Record<string, Record<string, unknown>> }>(
      '/api/simulations/risk-score/benchmarks',
      undefined,
      { signal: options?.signal },
    );
    if (result.success) {
      const benchmarks: Record<string, { label: string; score: number; description: string }> = {};
      for (const [key, val] of Object.entries(result.data.benchmarks)) {
        benchmarks[key] = {
          label: val.label as string,
          score: val.score as number,
          description: val.description as string,
        };
      }
      return { success: true, data: benchmarks };
    }
    return result as ApiResult<Record<string, { label: string; score: number; description: string }>>;
  },

  async submitRiskQuiz(
    answers: Array<{ questionId: number; answer: number }>,
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IRiskQuizResult>> {
    const body = {
      answers: answers.map((a) => ({
        question_id: a.questionId,
        answer: a.answer,
      })),
    };
    const result = await apiClient.post<RawRiskQuizResult>(
      '/api/simulations/risk-score/quiz',
      body,
      { signal: options?.signal },
    );
    if (result.success) {
      return { success: true, data: transformRiskQuizResult(result.data) };
    }
    return result as ApiResult<IRiskQuizResult>;
  },

  // ── Scenario Stress Lab ──

  async runScenario(
    tickers: string[],
    scenarioId?: string,
    customParams?: Record<string, unknown>,
    weights?: number[],
    exchange: string = 'NSE',
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IScenarioResult>> {
    const res = await apiClient.post<RawScenarioResult>('/api/simulations/scenarios/run', {
      tickers,
      weights: weights ?? null,
      exchange,
      scenario_id: scenarioId ?? null,
      custom_params: customParams ?? null,
    }, { signal: options?.signal });
    if (res.success) {
      try {
        return { ...res, data: transformScenarioResult(res.data) };
      } catch (err) {
        console.warn('Scenario transform failed:', err);
        return { success: false, error: { message: 'Failed to parse scenario data' } } as ApiResult<IScenarioResult>;
      }
    }
    return res;
  },

  async getScenarioPresets(
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IScenarioPreset[]>> {
    const res = await apiClient.get<{ presets: RawScenarioPreset[] }>(
      '/api/simulations/scenarios/presets',
      undefined,
      { signal: options?.signal },
    );
    if (res.success) {
      return { ...res, data: res.data.presets.map(transformScenarioPreset) };
    }
    return res as ApiResult<IScenarioPreset[]>;
  },

  // ── Factor Lens ──

  async analyzeFactors(
    tickers: string[],
    weights?: number[],
    exchange: string = 'NSE',
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IFactorDecomposition>> {
    const res = await apiClient.post<RawFactorDecomposition>('/api/simulations/factors/analyze', {
      tickers,
      weights: weights ?? null,
      exchange,
    }, { signal: options?.signal });
    if (res.success) {
      try {
        return { ...res, data: transformFactorDecomposition(res.data) };
      } catch (err) {
        console.warn('Factor transform failed:', err);
        return { success: false, error: { message: 'Failed to parse factor data' } } as ApiResult<IFactorDecomposition>;
      }
    }
    return res;
  },

  async getFactorUniverse(
    options?: { signal?: AbortSignal },
  ): Promise<ApiResult<IFactorDefinition[]>> {
    const res = await apiClient.get<{ factors: RawFactorDefinition[] }>(
      '/api/simulations/factors/universe',
      undefined,
      { signal: options?.signal },
    );
    if (res.success) {
      return { ...res, data: res.data.factors };
    }
    return res as ApiResult<IFactorDefinition[]>;
  },
};

// =============================================================================
// Transform functions for new simulations
// =============================================================================

// =============================================================================
// Raw snake_case types — Regime Detection
// =============================================================================

interface RawRegimeState {
  index: number;
  label: string;
  display_name: string;
  mean_return: number;
  volatility: number;
  color: string;
}

interface RawRegimeTimelinePoint {
  date: string;
  regime: string;
  probability: number;
}

interface RawRegimeTransitionCell {
  from_label: string;
  to_label: string;
  probability: number;
  description: string;
}

interface RawRegimeForecast {
  horizon: number;
  probabilities: Record<string, number>;
}

interface RawRegimeCurrentState {
  label: string;
  probability: number;
  duration_days: number;
}

interface RawRegimeStatistic {
  label: string;
  avg_daily_return: number;
  avg_volatility: number;
  typical_duration_days: number;
  max_duration_days: number;
  frequency: number;
  total_days: number;
  sharpe_proxy: number;
  sample_periods: Array<{ start: string; end: string }>;
}

interface RawRegimeAnalysis {
  ticker: string;
  exchange: string;
  n_states: number;
  selected_model_bic: number;
  states: RawRegimeState[];
  timeline: RawRegimeTimelinePoint[];
  transition_matrix: RawRegimeTransitionCell[][];
  forecast: RawRegimeForecast[];
  current_state: RawRegimeCurrentState;
  state_statistics: RawRegimeStatistic[];
  description: string;
  computed_at: string;
  data_points: number;
}

// =============================================================================
// Raw snake_case types — Monte Carlo
// =============================================================================

interface RawPercentileBandPoint {
  day: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

interface RawDistributionBin {
  price_low: number;
  price_high: number;
  count: number;
  density: number;
}

interface RawDistributionStats {
  mean: number;
  median: number;
  std: number;
  skew: number;
  kurtosis: number;
}

interface RawMCRiskMetrics {
  var_5: number;
  cvar_5: number;
  var_pct: number;
  cvar_pct: number;
  prob_profit: number;
  expected_return: number;
  max_drawdown_median: number;
  description_var: string;
  description_cvar: string;
}

interface RawRegimeParam {
  state: string;
  mu_annual: number;
  sigma_annual: number;
}

interface RawMCResult {
  percentile_bands: RawPercentileBandPoint[];
  final_distribution: { bins: RawDistributionBin[]; stats: RawDistributionStats };
  risk_metrics: RawMCRiskMetrics;
  sample_paths?: number[][];
  regime_params?: RawRegimeParam[];
}

interface RawTargetResult {
  probability: number;
  probability_final: number;
  median_time_to_target: number | null;
  direction: 'above' | 'below';
}

interface RawUnderwaterPoint {
  day: number;
  p25: number;
  p50: number;
  p75: number;
}

interface RawDrawdownAnalysis {
  underwater_chart: RawUnderwaterPoint[];
  max_drawdown_distribution: {
    bins: RawDistributionBin[];
    stats: { mean: number; median: number; std: number; p5: number; p95: number };
  };
  recovery_stats: {
    median_recovery_days: number | null;
    p25_recovery_days: number | null;
    p75_recovery_days: number | null;
    avg_episodes_per_path: number;
  };
}

interface RawRiskEvolutionPoint {
  day: number;
  var_5: number;
  cvar_5: number;
  prob_profit: number;
}

interface RawNormalityTest {
  jarque_bera: number;
  p_value: number;
  is_normal: boolean;
  description: string;
}

interface RawReturnDistribution {
  normality_test: RawNormalityTest;
  tail_ratio: number;
  tail_description: string;
  cdf_comparison: Array<{ x: number; empirical: number; normal: number }>;
  kde_curve: Array<{ x: number; density: number }>;
}

interface RawConvergencePoint {
  n_paths: number;
  mean: number;
  std: number;
}

interface RawPathDensity {
  time_steps: number[];
  price_bins: number[];
  density: number[][];
  max_density: number;
}

interface RawQualityComponent {
  score: number;
  description: string;
}

interface RawQualityScore {
  composite_score: number;
  components: Record<string, RawQualityComponent>;
  verdict: string;
}

interface RawVerdict {
  verdict: 'bullish' | 'neutral' | 'bearish';
  score: number;
  confidence: number;
  description: string;
}

interface RawMonteCarloAnalysis {
  ticker: string;
  exchange: string;
  horizon: number;
  n_paths: number;
  current_price: number;
  regime_aware: RawMCResult;
  constant: RawMCResult;
  target: RawTargetResult | null;
  drawdown_analysis: RawDrawdownAnalysis | null;
  risk_evolution: RawRiskEvolutionPoint[];
  return_distribution: RawReturnDistribution | null;
  convergence: RawConvergencePoint[];
  path_density: RawPathDensity | null;
  quality_score: RawQualityScore | null;
  verdict: RawVerdict | null;
  narrative: string | null;
  computed_at: string;
  data_points: number;
}

interface RawTargetProbabilityResult extends RawTargetResult {
  ticker: string;
  exchange: string;
  current_price: number;
  target_price: number;
  horizon: number;
}

// =============================================================================
// Raw snake_case types — Portfolio
// =============================================================================

interface RawPortfolioMetrics {
  annual_return: number;
  annual_volatility: number;
  sharpe: number;
  sortino: number;
  max_drawdown: number;
}

interface RawEquityCurvePoint {
  date: string;
  value: number;
}

interface RawRiskContribution {
  ticker: string;
  sector: string;
  weight: number;
  risk_contribution: number;
}

interface RawSectorRisk {
  weight: number;
  risk_contribution: number;
}

interface RawPortfolioStrategy {
  mode: string;
  label: string;
  weights: Record<string, number>;
  metrics: RawPortfolioMetrics;
  equity_curve: RawEquityCurvePoint[];
  drawdown_series: RawEquityCurvePoint[];
  total_return: number;
  risk_contribution: RawRiskContribution[];
  risk_by_sector: Record<string, RawSectorRisk>;
}

interface RawEfficientFrontierPoint {
  return: number;
  volatility: number;
  sharpe: number;
}

interface RawIndividualStock {
  ticker: string;
  sector: string;
  annual_return: number;
  annual_volatility: number;
}

interface RawPortfolioOptimization {
  tickers: string[];
  sectors: Record<string, string>;
  exchange: string;
  lookback_days: number;
  risk_free_rate: number;
  max_weight: number;
  strategies: RawPortfolioStrategy[];
  efficient_frontier: RawEfficientFrontierPoint[];
  individual_stocks: RawIndividualStock[];
  best_strategy: string;
  natural_language: string;
  computed_at: string;
  data_points: number;
}

// =============================================================================
// Raw snake_case types — Backtesting
// =============================================================================

interface RawBacktestAggregate {
  total_return_gross: number;
  total_return_net: number;
  annual_return: number;
  annual_volatility: number;
  sharpe: number;
  max_drawdown: number;
  win_rate: number;
  total_cost_pct: number;
  n_trading_days: number;
}

interface RawBacktestResult {
  equity_curve: RawEquityCurvePoint[];
  drawdown_series: RawEquityCurvePoint[];
  rolling_sharpe: RawEquityCurvePoint[];
  aggregate: RawBacktestAggregate;
}

interface RawOverfitting {
  pbo: number;
  n_splits: number;
  n_profitable: number;
  n_total: number;
  split_sharpes: number[];
  traffic_light: 'green' | 'yellow' | 'red';
  description: string;
}

interface RawDeflatedSharpe {
  raw_sharpe: number;
  deflated_sharpe: number;
  haircut_pct: number;
  p_value: number;
  is_significant: boolean;
}

interface RawTransactionImpact {
  gross_return: number;
  net_return: number;
  total_cost_pct: number;
  cost_per_lakh: number;
  description: string;
}

interface RawBacktestStrategy {
  name: string;
  label: string;
  description: string;
  params: Record<string, number>;
  rebalance: string;
  backtest: RawBacktestResult;
  overfitting: RawOverfitting;
  deflated_sharpe: RawDeflatedSharpe;
  transaction_impact: RawTransactionImpact;
}

interface RawBacktestAnalysis {
  tickers: string[];
  exchange: string;
  period: { start: string; end: string; trading_days: number };
  strategies: RawBacktestStrategy[];
  best_strategy: string;
  natural_language: string;
  computed_at: string;
}

// =============================================================================
// Raw snake_case types — Risk Score
// =============================================================================

interface RawRiskZone {
  name: string;
  label: string;
  hex: string;
  range_start: number;
  range_end: number;
}

interface RawRiskSubScore {
  name: string;
  label: string;
  score: number;
  weight: number;
  description: string;
  detail: Record<string, unknown>;
}

interface RawRiskSuggestion {
  action: string;
  impact_description: string;
  estimated_change: number;
}

interface RawBenchmarkEntry {
  label: string;
  score: number;
  description: string;
}

interface RawRiskScoreResult {
  tickers: string[];
  weights: number[];
  exchange: string;
  composite_score: number;
  zone: RawRiskZone;
  sub_scores: RawRiskSubScore[];
  suggestions: RawRiskSuggestion[];
  benchmarks: Record<string, RawBenchmarkEntry>;
  natural_language: string;
  computed_at: string;
}

interface RawRiskQuizResult {
  total_score: number;
  recommended_zone: RawRiskZone;
  recommended_range: [number, number];
  description: string;
}

// =============================================================================
// Transform functions — Regime Detection
// =============================================================================

function transformRegimeAnalysis(raw: RawRegimeAnalysis): IRegimeAnalysis {
  return {
    ticker: raw.ticker,
    exchange: raw.exchange,
    nStates: raw.n_states,
    selectedModelBic: raw.selected_model_bic,
    states: (raw.states || []).map((s: RawRegimeState) => ({
      index: s.index,
      label: s.label as RegimeLabel,
      displayName: s.display_name,
      meanReturn: s.mean_return,
      volatility: s.volatility,
      color: s.color,
    })),
    timeline: (raw.timeline || []).map((t: RawRegimeTimelinePoint) => ({
      date: t.date,
      regime: t.regime as RegimeLabel,
      probability: t.probability,
    })),
    transitionMatrix: (raw.transition_matrix || []).map((row: RawRegimeTransitionCell[]) =>
      row.map((cell: RawRegimeTransitionCell) => ({
        fromLabel: cell.from_label as RegimeLabel,
        toLabel: cell.to_label as RegimeLabel,
        probability: cell.probability,
        description: cell.description,
      })),
    ),
    forecast: (raw.forecast || []).map((f: RawRegimeForecast) => ({
      horizon: f.horizon,
      probabilities: f.probabilities as Record<RegimeLabel, number>,
    })),
    currentState: {
      label: raw.current_state?.label as RegimeLabel,
      probability: raw.current_state?.probability,
      durationDays: raw.current_state?.duration_days,
    },
    stateStatistics: (raw.state_statistics || []).map((s: RawRegimeStatistic) => ({
      label: s.label as RegimeLabel,
      avgDailyReturn: s.avg_daily_return,
      avgVolatility: s.avg_volatility,
      typicalDurationDays: s.typical_duration_days,
      maxDurationDays: s.max_duration_days,
      frequency: s.frequency,
      totalDays: s.total_days,
      sharpeProxy: s.sharpe_proxy,
      samplePeriods: s.sample_periods || [],
    })),
    description: raw.description,
    computedAt: raw.computed_at,
    dataPoints: raw.data_points,
  };
}

// =============================================================================
// Transform functions — Monte Carlo
// =============================================================================

function transformMCResult(raw: RawMCResult): IMonteCarloResult {
  return {
    percentileBands: (raw.percentile_bands || []).map((b: RawPercentileBandPoint) => ({
      day: b.day,
      p5: b.p5,
      p10: b.p10,
      p25: b.p25,
      p50: b.p50,
      p75: b.p75,
      p90: b.p90,
      p95: b.p95,
    })),
    finalDistribution: {
      bins: (raw.final_distribution?.bins || []).map((b: RawDistributionBin) => ({
        priceLow: b.price_low,
        priceHigh: b.price_high,
        count: b.count,
        density: b.density,
      })),
      stats: {
        mean: raw.final_distribution?.stats?.mean,
        median: raw.final_distribution?.stats?.median,
        std: raw.final_distribution?.stats?.std,
        skew: raw.final_distribution?.stats?.skew,
        kurtosis: raw.final_distribution?.stats?.kurtosis,
      },
    },
    riskMetrics: {
      var5: raw.risk_metrics?.var_5,
      cvar5: raw.risk_metrics?.cvar_5,
      varPct: raw.risk_metrics?.var_pct,
      cvarPct: raw.risk_metrics?.cvar_pct,
      probProfit: raw.risk_metrics?.prob_profit,
      expectedReturn: raw.risk_metrics?.expected_return,
      maxDrawdownMedian: raw.risk_metrics?.max_drawdown_median,
      descriptionVar: raw.risk_metrics?.description_var,
      descriptionCvar: raw.risk_metrics?.description_cvar,
    },
    samplePaths: raw.sample_paths,
    regimeParams: raw.regime_params?.map((p: RawRegimeParam) => ({
      state: p.state,
      muAnnual: p.mu_annual,
      sigmaAnnual: p.sigma_annual,
    })),
  };
}

function transformMonteCarloAnalysis(raw: RawMonteCarloAnalysis): IMonteCarloAnalysis {
  return {
    ticker: raw.ticker,
    exchange: raw.exchange,
    horizon: raw.horizon,
    nPaths: raw.n_paths,
    currentPrice: raw.current_price,
    regimeAware: transformMCResult(raw.regime_aware),
    constant: transformMCResult(raw.constant),
    target: raw.target
      ? {
          probability: raw.target.probability,
          probabilityFinal: raw.target.probability_final,
          medianTimeToTarget: raw.target.median_time_to_target,
          direction: raw.target.direction,
        }
      : null,
    drawdownAnalysis: raw.drawdown_analysis
      ? {
          underwaterChart: raw.drawdown_analysis.underwater_chart,
          maxDrawdownDistribution: {
            bins: (raw.drawdown_analysis.max_drawdown_distribution?.bins || []).map(
              (b: RawDistributionBin) => ({
                priceLow: b.price_low,
                priceHigh: b.price_high,
                count: b.count,
                density: b.density,
              }),
            ),
            stats: raw.drawdown_analysis.max_drawdown_distribution?.stats ?? {
              mean: 0,
              median: 0,
              std: 0,
              p5: 0,
              p95: 0,
            },
          },
          recoveryStats: {
            medianRecoveryDays: raw.drawdown_analysis.recovery_stats?.median_recovery_days ?? null,
            p25RecoveryDays: raw.drawdown_analysis.recovery_stats?.p25_recovery_days ?? null,
            p75RecoveryDays: raw.drawdown_analysis.recovery_stats?.p75_recovery_days ?? null,
            avgEpisodesPerPath:
              raw.drawdown_analysis.recovery_stats?.avg_episodes_per_path ?? 0,
          },
        }
      : null,
    riskEvolution: (raw.risk_evolution || []).map((p: RawRiskEvolutionPoint) => ({
      day: p.day,
      var5: p.var_5,
      cvar5: p.cvar_5,
      probProfit: p.prob_profit,
    })),
    returnDistribution: raw.return_distribution
      ? {
          normalityTest: {
            jarqueBera: raw.return_distribution.normality_test?.jarque_bera ?? 0,
            pValue: raw.return_distribution.normality_test?.p_value ?? 0,
            isNormal: raw.return_distribution.normality_test?.is_normal ?? true,
            description: raw.return_distribution.normality_test?.description ?? '',
          },
          tailRatio: raw.return_distribution.tail_ratio ?? 1,
          tailDescription: raw.return_distribution.tail_description ?? '',
          cdfComparison: raw.return_distribution.cdf_comparison ?? [],
          kdeCurve: raw.return_distribution.kde_curve ?? [],
        }
      : null,
    convergence: (raw.convergence || []).map((c: RawConvergencePoint) => ({
      nPaths: c.n_paths,
      mean: c.mean,
      std: c.std,
    })),
    pathDensity: raw.path_density
      ? {
          timeSteps: raw.path_density.time_steps,
          priceBins: raw.path_density.price_bins,
          density: raw.path_density.density,
          maxDensity: raw.path_density.max_density,
        }
      : null,
    qualityScore: raw.quality_score
      ? {
          compositeScore: raw.quality_score.composite_score,
          components: Object.fromEntries(
            Object.entries(raw.quality_score.components || {}).map(
              ([k, v]: [string, RawQualityComponent]) => [k, { score: v.score, description: v.description }],
            ),
          ),
          verdict: raw.quality_score.verdict,
        }
      : null,
    verdict: raw.verdict
      ? {
          verdict: raw.verdict.verdict,
          score: raw.verdict.score,
          confidence: raw.verdict.confidence,
          description: raw.verdict.description,
        }
      : null,
    narrative: raw.narrative ?? null,
    computedAt: raw.computed_at,
    dataPoints: raw.data_points,
  };
}

function transformTargetProbability(raw: RawTargetProbabilityResult): ITargetProbabilityResult {
  return {
    probability: raw.probability,
    probabilityFinal: raw.probability_final,
    medianTimeToTarget: raw.median_time_to_target,
    direction: raw.direction,
    ticker: raw.ticker,
    exchange: raw.exchange,
    currentPrice: raw.current_price,
    targetPrice: raw.target_price,
    horizon: raw.horizon,
  };
}

// =============================================================================
// Transform functions — Portfolio
// =============================================================================

function transformEquityCurve(raw: RawEquityCurvePoint[]): Array<{ date: string; value: number }> {
  return (raw || []).map((p: RawEquityCurvePoint) => ({ date: p.date, value: p.value }));
}

function transformPortfolioOptimization(raw: RawPortfolioOptimization): IPortfolioOptimization {
  return {
    tickers: raw.tickers,
    sectors: raw.sectors,
    exchange: raw.exchange,
    lookbackDays: raw.lookback_days,
    riskFreeRate: raw.risk_free_rate,
    maxWeight: raw.max_weight,
    strategies: (raw.strategies || []).map((s: RawPortfolioStrategy) => ({
      mode: s.mode,
      label: s.label,
      weights: s.weights,
      metrics: {
        annualReturn: s.metrics?.annual_return,
        annualVolatility: s.metrics?.annual_volatility,
        sharpe: s.metrics?.sharpe,
        sortino: s.metrics?.sortino,
        maxDrawdown: s.metrics?.max_drawdown,
      },
      equityCurve: transformEquityCurve(s.equity_curve),
      drawdownSeries: transformEquityCurve(s.drawdown_series),
      totalReturn: s.total_return,
      riskContribution: (s.risk_contribution || []).map((r: RawRiskContribution) => ({
        ticker: r.ticker,
        sector: r.sector,
        weight: r.weight,
        riskContribution: r.risk_contribution,
      })),
      riskBySector: Object.fromEntries(
        Object.entries(s.risk_by_sector || {}).map(([k, v]: [string, RawSectorRisk]) => [
          k,
          { weight: v.weight, riskContribution: v.risk_contribution },
        ]),
      ),
    })),
    efficientFrontier: (raw.efficient_frontier || []).map((p: RawEfficientFrontierPoint) => ({
      return: p.return,
      volatility: p.volatility,
      sharpe: p.sharpe,
    })),
    individualStocks: (raw.individual_stocks || []).map((s: RawIndividualStock) => ({
      ticker: s.ticker,
      sector: s.sector,
      annualReturn: s.annual_return,
      annualVolatility: s.annual_volatility,
    })),
    bestStrategy: raw.best_strategy,
    naturalLanguage: raw.natural_language,
    computedAt: raw.computed_at,
    dataPoints: raw.data_points,
  };
}

// =============================================================================
// Transform functions — Backtesting
// =============================================================================

function transformBacktestAnalysis(raw: RawBacktestAnalysis): IBacktestAnalysis {
  return {
    tickers: raw.tickers,
    exchange: raw.exchange,
    period: {
      start: raw.period?.start,
      end: raw.period?.end,
      tradingDays: raw.period?.trading_days,
    },
    strategies: (raw.strategies || []).map((s: RawBacktestStrategy) => ({
      name: s.name,
      label: s.label,
      description: s.description,
      params: s.params,
      rebalance: s.rebalance,
      backtest: {
        equityCurve: transformEquityCurve(s.backtest?.equity_curve),
        drawdownSeries: transformEquityCurve(s.backtest?.drawdown_series),
        rollingSharpe: transformEquityCurve(s.backtest?.rolling_sharpe),
        aggregate: {
          totalReturnGross: s.backtest?.aggregate?.total_return_gross,
          totalReturnNet: s.backtest?.aggregate?.total_return_net,
          annualReturn: s.backtest?.aggregate?.annual_return,
          annualVolatility: s.backtest?.aggregate?.annual_volatility,
          sharpe: s.backtest?.aggregate?.sharpe,
          maxDrawdown: s.backtest?.aggregate?.max_drawdown,
          winRate: s.backtest?.aggregate?.win_rate,
          totalCostPct: s.backtest?.aggregate?.total_cost_pct,
          nTradingDays: s.backtest?.aggregate?.n_trading_days,
        },
      },
      overfitting: {
        pbo: s.overfitting?.pbo,
        nSplits: s.overfitting?.n_splits,
        nProfitable: s.overfitting?.n_profitable,
        nTotal: s.overfitting?.n_total,
        splitSharpes: s.overfitting?.split_sharpes,
        trafficLight: s.overfitting?.traffic_light,
        description: s.overfitting?.description,
      },
      deflatedSharpe: {
        rawSharpe: s.deflated_sharpe?.raw_sharpe,
        deflatedSharpe: s.deflated_sharpe?.deflated_sharpe,
        haircutPct: s.deflated_sharpe?.haircut_pct,
        pValue: s.deflated_sharpe?.p_value,
        isSignificant: s.deflated_sharpe?.is_significant,
      },
      transactionImpact: {
        grossReturn: s.transaction_impact?.gross_return,
        netReturn: s.transaction_impact?.net_return,
        totalCostPct: s.transaction_impact?.total_cost_pct,
        costPerLakh: s.transaction_impact?.cost_per_lakh,
        description: s.transaction_impact?.description,
      },
    })),
    bestStrategy: raw.best_strategy,
    naturalLanguage: raw.natural_language,
    computedAt: raw.computed_at,
  };
}

// =============================================================================
// Transform functions — Risk Score
// =============================================================================

function transformRiskZone(raw: RawRiskZone): IRiskZone {
  return {
    name: raw.name,
    label: raw.label,
    hex: raw.hex,
    rangeStart: raw.range_start,
    rangeEnd: raw.range_end,
  };
}

function transformRiskSubScore(raw: RawRiskSubScore): IRiskSubScore {
  return {
    name: raw.name,
    label: raw.label,
    score: raw.score,
    weight: raw.weight,
    description: raw.description,
    detail: raw.detail ?? {},
  };
}

function transformRiskSuggestion(raw: RawRiskSuggestion): IRiskSuggestion {
  return {
    action: raw.action,
    impactDescription: raw.impact_description,
    estimatedChange: raw.estimated_change,
  };
}

function transformRiskScoreResult(raw: RawRiskScoreResult): IRiskScoreResult {
  const benchmarks: Record<string, { label: string; score: number; description: string }> = {};
  if (raw.benchmarks) {
    for (const [key, val] of Object.entries(raw.benchmarks)) {
      benchmarks[key] = {
        label: val.label,
        score: val.score,
        description: val.description,
      };
    }
  }

  return {
    tickers: raw.tickers,
    weights: raw.weights,
    exchange: raw.exchange,
    compositeScore: raw.composite_score,
    zone: transformRiskZone(raw.zone),
    subScores: (raw.sub_scores || []).map(transformRiskSubScore),
    suggestions: (raw.suggestions || []).map(transformRiskSuggestion),
    benchmarks,
    naturalLanguage: raw.natural_language,
    computedAt: raw.computed_at,
  };
}

function transformRiskQuizResult(raw: RawRiskQuizResult): IRiskQuizResult {
  return {
    totalScore: raw.total_score,
    recommendedZone: transformRiskZone(raw.recommended_zone),
    recommendedRange: raw.recommended_range,
    description: raw.description,
  };
}


// =============================================================================
// Scenario Stress Lab — Raw types & transforms
// =============================================================================

interface RawScenarioMetrics {
  annual_return: number;
  annual_vol: number;
  sharpe: number;
  var_95: number;
  cvar_95: number;
  max_drawdown: number;
}

interface RawScenarioStockImpact {
  ticker: string;
  sector: string;
  weight: number;
  baseline_return: number;
  stressed_return: number;
  delta_return: number;
  baseline_vol: number;
  stressed_vol: number;
  delta_vol: number;
  sector_beta: number;
}

interface RawScenarioResult {
  scenario: { id: string; label: string; description: string; is_custom: boolean };
  scenario_params: { vol_multiplier: number; drift_shock: number; correlation_shift: number; sector_betas: Record<string, number> };
  tickers: string[];
  weights: Record<string, number>;
  exchange: string;
  baseline_metrics: RawScenarioMetrics;
  stressed_metrics: RawScenarioMetrics;
  delta_metrics: RawScenarioMetrics;
  per_stock_impact: RawScenarioStockImpact[];
  natural_language: string;
  computed_at: string;
  data_points: number;
}

interface RawScenarioPreset {
  id: string;
  label: string;
  description: string;
  vol_multiplier: number;
  drift_shock: number;
  correlation_shift: number;
  sector_betas: Record<string, number>;
}

function transformScenarioMetrics(raw: RawScenarioMetrics): IScenarioMetrics {
  return {
    annualReturn: raw.annual_return,
    annualVol: raw.annual_vol,
    sharpe: raw.sharpe,
    var95: raw.var_95,
    cvar95: raw.cvar_95,
    maxDrawdown: raw.max_drawdown,
  };
}

function transformScenarioStockImpact(raw: RawScenarioStockImpact): IScenarioStockImpact {
  return {
    ticker: raw.ticker,
    sector: raw.sector,
    weight: raw.weight,
    baselineReturn: raw.baseline_return,
    stressedReturn: raw.stressed_return,
    deltaReturn: raw.delta_return,
    baselineVol: raw.baseline_vol,
    stressedVol: raw.stressed_vol,
    deltaVol: raw.delta_vol,
    sectorBeta: raw.sector_beta,
  };
}

function transformScenarioResult(raw: RawScenarioResult): IScenarioResult {
  return {
    scenario: {
      id: raw.scenario.id,
      label: raw.scenario.label,
      description: raw.scenario.description,
      isCustom: raw.scenario.is_custom,
    },
    scenarioParams: {
      volMultiplier: raw.scenario_params.vol_multiplier,
      driftShock: raw.scenario_params.drift_shock,
      correlationShift: raw.scenario_params.correlation_shift,
      sectorBetas: raw.scenario_params.sector_betas,
    },
    tickers: raw.tickers,
    weights: raw.weights,
    exchange: raw.exchange,
    baselineMetrics: transformScenarioMetrics(raw.baseline_metrics),
    stressedMetrics: transformScenarioMetrics(raw.stressed_metrics),
    deltaMetrics: transformScenarioMetrics(raw.delta_metrics),
    perStockImpact: (raw.per_stock_impact || []).map(transformScenarioStockImpact),
    naturalLanguage: raw.natural_language,
    computedAt: raw.computed_at,
    dataPoints: raw.data_points,
  };
}

function transformScenarioPreset(raw: RawScenarioPreset): IScenarioPreset {
  return {
    id: raw.id,
    label: raw.label,
    description: raw.description,
    volMultiplier: raw.vol_multiplier,
    driftShock: raw.drift_shock,
    correlationShift: raw.correlation_shift,
    sectorBetas: raw.sector_betas,
  };
}


// =============================================================================
// Factor Lens — Raw types & transforms
// =============================================================================

interface RawFactorDefinition {
  id: string;
  label: string;
  description: string;
}

interface RawStockFactorScores {
  ticker: string;
  sector: string;
  scores: Record<string, number>;
}

interface RawFactorAttribution {
  factor_id: string;
  label: string;
  contribution: number;
  portfolio_tilt: number;
  benchmark_tilt: number;
}

interface RawFactorDecomposition {
  tickers: string[];
  weights: Record<string, number>;
  exchange: string;
  factors: RawFactorDefinition[];
  per_stock_scores: RawStockFactorScores[];
  portfolio_tilts: Record<string, number>;
  benchmark_tilts: Record<string, number>;
  factor_attribution: RawFactorAttribution[];
  natural_language: string;
  computed_at: string;
  data_points: number;
}

function transformFactorAttribution(raw: RawFactorAttribution): IFactorAttribution {
  return {
    factorId: raw.factor_id,
    label: raw.label,
    contribution: raw.contribution,
    portfolioTilt: raw.portfolio_tilt,
    benchmarkTilt: raw.benchmark_tilt,
  };
}

function transformFactorDecomposition(raw: RawFactorDecomposition): IFactorDecomposition {
  // Defense-in-depth: if backend returns factor_attribution as a dict (legacy
  // shape {factor_id: contribution}), convert to the expected array format.
  let attribution: IFactorAttribution[] = [];
  const rawAttr = raw.factor_attribution;
  if (Array.isArray(rawAttr)) {
    attribution = rawAttr.map(transformFactorAttribution);
  } else if (rawAttr && typeof rawAttr === 'object') {
    // Legacy dict format — convert to array
    attribution = Object.entries(rawAttr as Record<string, number>).map(
      ([factorId, contribution]) => ({
        factorId,
        label: factorId.charAt(0).toUpperCase() + factorId.slice(1),
        contribution: contribution as number,
        portfolioTilt: raw.portfolio_tilts?.[factorId] ?? 0,
        benchmarkTilt: raw.benchmark_tilts?.[factorId] ?? 0,
      }),
    );
  }

  return {
    tickers: raw.tickers,
    weights: raw.weights,
    exchange: raw.exchange,
    factors: raw.factors,
    perStockScores: raw.per_stock_scores,
    portfolioTilts: raw.portfolio_tilts,
    benchmarkTilts: raw.benchmark_tilts,
    factorAttribution: attribution,
    naturalLanguage: raw.natural_language,
    computedAt: raw.computed_at,
    dataPoints: raw.data_points,
  };
}


