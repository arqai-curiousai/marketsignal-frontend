/**
 * Types for Simulation Lab — Volatility Intelligence (Phase 1).
 */

// ---------------------------------------------------------------------------
// Volatility regime levels
// ---------------------------------------------------------------------------

export type VolRegimeLevel = 'calm' | 'moderate' | 'storm' | 'hurricane';

// ---------------------------------------------------------------------------
// Estimator result
// ---------------------------------------------------------------------------

export interface IEstimatorResult {
  name: string;
  label: string;
  currentValue: number | null;
  description: string;
  efficiency: number;
}

// ---------------------------------------------------------------------------
// Rolling volatility series
// ---------------------------------------------------------------------------

export interface IRollingVolSeries {
  dates: string[];
  values: number[];
}

// ---------------------------------------------------------------------------
// Volatility cone
// ---------------------------------------------------------------------------

export interface IVolatilityConePoint {
  window: number;
  windowLabel: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  current: number;
}

// ---------------------------------------------------------------------------
// GARCH forecast
// ---------------------------------------------------------------------------

export interface IGARCHForecastPoint {
  day: number;
  meanVol: number;
  lower68: number;
  upper68: number;
  lower95: number;
  upper95: number;
}

export interface IGARCHForecast {
  currentVol: number;
  forecastSeries: IGARCHForecastPoint[];
  persistence: number;
  halfLifeDays: number | null;
  longRunVol: number | null;
  params: { omega: number; alpha: number; beta: number };
}

// ---------------------------------------------------------------------------
// Volatility regime
// ---------------------------------------------------------------------------

export interface IVolRegime {
  regime: VolRegimeLevel;
  percentile: number;
  currentVol: number | null;
  medianVol: number | null;
  description: string;
}

// ---------------------------------------------------------------------------
// Full volatility analysis (main endpoint response)
// ---------------------------------------------------------------------------

export interface IVolatilityAnalysis {
  ticker: string;
  exchange: string;
  estimators: IEstimatorResult[];
  recommendedEstimator: string;
  rollingSeries: Record<string, IRollingVolSeries>;
  cone: IVolatilityConePoint[];
  garch: IGARCHForecast | null;
  garchUnavailable: boolean;
  regime: IVolRegime;
  computedAt: string;
  dataPoints: number;
  tradingDaysPerYear: number;
}

// ---------------------------------------------------------------------------
// Volatility compare
// ---------------------------------------------------------------------------

export interface IVolatilityCompareItem {
  ticker: string;
  exchange: string;
  currentVol: number | null;
  regime: VolRegimeLevel | null;
  percentile: number | null;
}

// ---------------------------------------------------------------------------
// Regime Detection (HMM)
// ---------------------------------------------------------------------------

export type RegimeLabel = 'growth' | 'neutral' | 'contraction';

export interface IRegimeState {
  index: number;
  label: RegimeLabel;
  displayName: string;
  meanReturn: number;
  volatility: number;
  color: string;
}

export interface IRegimeTimelinePoint {
  date: string;
  regime: RegimeLabel;
  probability: number;
}

export interface IRegimeStreak {
  start: string;
  end: string;
  regime: RegimeLabel;
  durationDays: number;
}

export interface IRegimeTransitionCell {
  fromLabel: RegimeLabel;
  toLabel: RegimeLabel;
  probability: number;
  description: string;
}

export interface IRegimeForecast {
  horizon: number;
  probabilities: Record<RegimeLabel, number>;
}

export interface IRegimeCurrentState {
  label: RegimeLabel;
  probability: number;
  durationDays: number;
}

export interface IRegimeStatistic {
  label: RegimeLabel;
  avgDailyReturn: number;
  avgVolatility: number;
  typicalDurationDays: number;
  maxDurationDays: number;
  frequency: number;
  totalDays: number;
  sharpeProxy: number;
  samplePeriods: Array<{ start: string; end: string }>;
}

export interface IRegimeAnalysis {
  ticker: string;
  exchange: string;
  nStates: number;
  selectedModelBic: number;
  states: IRegimeState[];
  timeline: IRegimeTimelinePoint[];
  transitionMatrix: IRegimeTransitionCell[][];
  forecast: IRegimeForecast[];
  currentState: IRegimeCurrentState;
  stateStatistics: IRegimeStatistic[];
  description: string;
  computedAt: string;
  dataPoints: number;
}

// ---------------------------------------------------------------------------
// Monte Carlo Simulation
// ---------------------------------------------------------------------------

export interface IPercentileBandPoint {
  day: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

export interface IDistributionBin {
  priceLow: number;
  priceHigh: number;
  count: number;
  density: number;
}

export interface IDistributionStats {
  mean: number;
  median: number;
  std: number;
  skew: number;
  kurtosis: number;
}

export interface IFinalDistribution {
  bins: IDistributionBin[];
  stats: IDistributionStats;
}

export interface IRiskMetrics {
  var5: number;
  cvar5: number;
  varPct: number;
  cvarPct: number;
  probProfit: number;
  expectedReturn: number;
  maxDrawdownMedian: number;
  descriptionVar: string;
  descriptionCvar: string;
}

export interface IRegimeParam {
  state: string;
  muAnnual: number;
  sigmaAnnual: number;
}

export interface IMonteCarloResult {
  percentileBands: IPercentileBandPoint[];
  finalDistribution: IFinalDistribution;
  riskMetrics: IRiskMetrics;
  samplePaths?: number[][];
  regimeParams?: IRegimeParam[];
}

export interface ITargetProbability {
  probability: number;
  probabilityFinal: number;
  medianTimeToTarget: number | null;
  direction: 'above' | 'below';
}

export interface IMonteCarloAnalysis {
  ticker: string;
  exchange: string;
  horizon: number;
  nPaths: number;
  currentPrice: number;
  regimeAware: IMonteCarloResult;
  constant: IMonteCarloResult;
  target: ITargetProbability | null;
  drawdownAnalysis: IDrawdownAnalysis | null;
  riskEvolution: IRiskEvolutionPoint[];
  returnDistribution: IReturnDistribution | null;
  convergence: IConvergencePoint[];
  pathDensity: IPathDensity | null;
  qualityScore: IQualityScore | null;
  verdict: ISimulationVerdict | null;
  narrative: string | null;
  computedAt: string;
  dataPoints: number;
}

export interface ITargetProbabilityResult extends ITargetProbability {
  ticker: string;
  exchange: string;
  currentPrice: number;
  targetPrice: number;
  horizon: number;
}

// ---------------------------------------------------------------------------
// Monte Carlo Enhanced Types
// ---------------------------------------------------------------------------

export interface IUnderwaterPoint {
  day: number;
  p25: number;
  p50: number;
  p75: number;
}

export interface IDrawdownDistStats {
  mean: number;
  median: number;
  std: number;
  p5: number;
  p95: number;
}

export interface IDrawdownAnalysis {
  underwaterChart: IUnderwaterPoint[];
  maxDrawdownDistribution: {
    bins: IDistributionBin[];
    stats: IDrawdownDistStats;
  };
  recoveryStats: {
    medianRecoveryDays: number | null;
    p25RecoveryDays: number | null;
    p75RecoveryDays: number | null;
    avgEpisodesPerPath: number;
  };
}

export interface IRiskEvolutionPoint {
  day: number;
  var5: number;
  cvar5: number;
  probProfit: number;
}

export interface INormalityTest {
  jarqueBera: number;
  pValue: number;
  isNormal: boolean;
  description: string;
}

export interface ICDFPoint {
  x: number;
  empirical: number;
  normal: number;
}

export interface IKDEPoint {
  x: number;
  density: number;
}

export interface IReturnDistribution {
  normalityTest: INormalityTest;
  tailRatio: number;
  tailDescription: string;
  cdfComparison: ICDFPoint[];
  kdeCurve: IKDEPoint[];
}

export interface IConvergencePoint {
  nPaths: number;
  mean: number;
  std: number;
}

export interface IPathDensity {
  timeSteps: number[];
  priceBins: number[];
  density: number[][];
  maxDensity: number;
}

export interface IQualityComponent {
  score: number;
  description: string;
}

export interface IQualityScore {
  compositeScore: number;
  components: Record<string, IQualityComponent>;
  verdict: string;
}

export interface ISimulationVerdict {
  verdict: 'bullish' | 'neutral' | 'bearish';
  score: number;
  confidence: number;
  description: string;
}

// ---------------------------------------------------------------------------
// Portfolio Optimization
// ---------------------------------------------------------------------------

export interface IPortfolioMetrics {
  annualReturn: number;
  annualVolatility: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
}

export interface IEquityCurvePoint {
  date: string;
  value: number;
}

export interface IRiskContribution {
  ticker: string;
  sector: string;
  weight: number;
  riskContribution: number;
}

export interface ISectorRisk {
  weight: number;
  riskContribution: number;
}

export interface IPortfolioStrategy {
  mode: string;
  label: string;
  weights: Record<string, number>;
  metrics: IPortfolioMetrics;
  equityCurve: IEquityCurvePoint[];
  drawdownSeries: IEquityCurvePoint[];
  totalReturn: number;
  riskContribution: IRiskContribution[];
  riskBySector: Record<string, ISectorRisk>;
}

export interface IEfficientFrontierPoint {
  return: number;
  volatility: number;
  sharpe: number;
}

export interface IIndividualStock {
  ticker: string;
  sector: string;
  annualReturn: number;
  annualVolatility: number;
}

export interface IPortfolioOptimization {
  tickers: string[];
  sectors: Record<string, string>;
  exchange: string;
  lookbackDays: number;
  riskFreeRate: number;
  maxWeight: number;
  strategies: IPortfolioStrategy[];
  efficientFrontier: IEfficientFrontierPoint[];
  individualStocks: IIndividualStock[];
  bestStrategy: string;
  naturalLanguage: string;
  computedAt: string;
  dataPoints: number;
}

export interface IPresetBasket {
  id: string;
  label: string;
  description: string;
  tickers: string[];
}

// ---------------------------------------------------------------------------
// Backtesting Engine
// ---------------------------------------------------------------------------

export interface IBacktestAggregate {
  totalReturnGross: number;
  totalReturnNet: number;
  annualReturn: number;
  annualVolatility: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  totalCostPct: number;
  nTradingDays: number;
}

export interface IBacktestResult {
  equityCurve: IEquityCurvePoint[];
  drawdownSeries: IEquityCurvePoint[];
  rollingSharpe: IEquityCurvePoint[];
  aggregate: IBacktestAggregate;
}

export interface IOverfittingResult {
  pbo: number;
  nSplits: number;
  nProfitable: number;
  nTotal: number;
  splitSharpes: number[];
  trafficLight: 'green' | 'yellow' | 'red';
  description: string;
}

export interface IDeflatedSharpe {
  rawSharpe: number;
  deflatedSharpe: number;
  haircutPct: number;
  pValue: number;
  isSignificant: boolean;
}

export interface ITransactionImpact {
  grossReturn: number;
  netReturn: number;
  totalCostPct: number;
  costPerLakh: number;
  description: string;
}

export interface IBacktestStrategy {
  name: string;
  label: string;
  description: string;
  params: Record<string, number>;
  rebalance: string;
  backtest: IBacktestResult;
  overfitting: IOverfittingResult;
  deflatedSharpe: IDeflatedSharpe;
  transactionImpact: ITransactionImpact;
}

export interface IBacktestAnalysis {
  tickers: string[];
  exchange: string;
  period: {
    start: string;
    end: string;
    tradingDays: number;
  };
  strategies: IBacktestStrategy[];
  bestStrategy: string;
  naturalLanguage: string;
  computedAt: string;
}

export interface IStrategyCatalogItem {
  name: string;
  label: string;
  description: string;
  params: Record<string, number>;
  rebalance: string;
}

// ---------------------------------------------------------------------------
// Risk Score
// ---------------------------------------------------------------------------

export interface IRiskSubScore {
  name: string;
  label: string;
  score: number;
  weight: number;
  description: string;
  detail: Record<string, unknown>;
}

export interface IRiskSuggestion {
  action: string;
  impactDescription: string;
  estimatedChange: number;
}

export interface IRiskZone {
  name: string;
  label: string;
  hex: string;
  rangeStart: number;
  rangeEnd: number;
}

export interface IRiskScoreResult {
  tickers: string[];
  weights: number[];
  exchange: string;
  compositeScore: number;
  zone: IRiskZone;
  subScores: IRiskSubScore[];
  suggestions: IRiskSuggestion[];
  benchmarks: Record<string, { label: string; score: number; description: string }>;
  naturalLanguage: string;
  computedAt: string;
}

export interface IRiskQuizAnswer {
  questionId: number;
  answer: number;
}

export interface IRiskQuizResult {
  totalScore: number;
  recommendedZone: IRiskZone;
  recommendedRange: [number, number];
  description: string;
}

// ---------------------------------------------------------------------------
// Scenario Stress Lab
// ---------------------------------------------------------------------------

export interface IScenarioInfo {
  id: string;
  label: string;
  description: string;
  isCustom: boolean;
}

export interface IScenarioParams {
  volMultiplier: number;
  driftShock: number;
  correlationShift: number;
  sectorBetas: Record<string, number>;
}

export interface IScenarioMetrics {
  annualReturn: number;
  annualVol: number;
  sharpe: number;
  var95: number;
  cvar95: number;
  maxDrawdown: number;
}

export interface IScenarioStockImpact {
  ticker: string;
  sector: string;
  weight: number;
  baselineReturn: number;
  stressedReturn: number;
  deltaReturn: number;
  baselineVol: number;
  stressedVol: number;
  deltaVol: number;
  sectorBeta: number;
}

export interface IScenarioPreset {
  id: string;
  label: string;
  description: string;
  volMultiplier: number;
  driftShock: number;
  correlationShift: number;
  sectorBetas: Record<string, number>;
}

export interface IScenarioResult {
  scenario: IScenarioInfo;
  scenarioParams: IScenarioParams;
  tickers: string[];
  weights: Record<string, number>;
  exchange: string;
  baselineMetrics: IScenarioMetrics;
  stressedMetrics: IScenarioMetrics;
  deltaMetrics: IScenarioMetrics;
  perStockImpact: IScenarioStockImpact[];
  naturalLanguage: string;
  computedAt: string;
  dataPoints: number;
}

// ---------------------------------------------------------------------------
// Factor Lens
// ---------------------------------------------------------------------------

export interface IFactorDefinition {
  id: string;
  label: string;
  description: string;
}

export interface IStockFactorScores {
  ticker: string;
  sector: string;
  scores: Record<string, number>;
}

export interface IFactorAttribution {
  factorId: string;
  label: string;
  contribution: number;
  portfolioTilt: number;
  benchmarkTilt: number;
}

export interface IFactorDecomposition {
  tickers: string[];
  weights: Record<string, number>;
  exchange: string;
  factors: IFactorDefinition[];
  perStockScores: IStockFactorScores[];
  portfolioTilts: Record<string, number>;
  benchmarkTilts: Record<string, number>;
  factorAttribution: IFactorAttribution[];
  naturalLanguage: string;
  computedAt: string;
  dataPoints: number;
}
