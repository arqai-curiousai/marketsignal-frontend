import {
  Activity,
  TrendingUp,
  BarChart3,
  Zap,
  Target,
  Shield,
  Brain,
  Layers,
  Gauge,
  type LucideIcon,
} from 'lucide-react';

// ── Accent config ──
export const SIM_ACCENT = {
  primary: 'violet',
  gradient: 'from-violet-300 via-violet-400 to-indigo-500',
  glow: 'rgba(167,139,250,0.06)',
  blob1: 'bg-brand-violet/[0.05]',
  blob2: 'bg-indigo-400/[0.04]',
  blob3: 'bg-brand-blue/[0.03]',
  buttonBg: 'bg-brand-violet',
  buttonTextColor: 'text-white',
  buttonHoverShadow: 'hover:shadow-[0_0_50px_rgba(167,139,250,0.3)]',
  buttonShadow: 'shadow-[0_0_30px_rgba(167,139,250,0.2)]',
} as const;

// ── Hero ──
export const SIM_HERO = {
  headlineBold: 'Trust',
  headlineSerif: 'the Math',
  sub: 'GARCH volatility. HMM regimes. Monte Carlo paths. Portfolio optimization. Backtesting. Risk scoring. Nine modules, one lab',
  primaryCta: { label: 'Start Simulating', href: '/login' },
  secondaryCta: { label: 'See 9 Modules', href: '#grid' },
  video: {
    webm: '/landing/videos/sim-hero.webm',
    mp4: '/landing/videos/sim-hero.mp4',
    poster: '/landing/sim-hero.png',
  },
};

// ── Trust Bar Stats ──
export const SIM_STATS = [
  { value: '9', suffix: '', label: 'Simulations', icon: 'chart' as const },
  { value: '5', suffix: '', label: 'Vol Estimators', icon: 'currency' as const },
  { value: '8', suffix: '', label: 'Stress Scenarios', icon: 'globe' as const },
  { value: '2', suffix: '', label: 'AI Agents', icon: 'agents' as const },
  { value: '5', suffix: 'min', label: 'Refresh Rate', icon: 'refresh' as const },
];

// ── Simulation Grid (3x3 bento) ──
export interface SimGridItem {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  video: { webm: string; mp4: string };
}

export const SIM_GRID: SimGridItem[] = [
  {
    id: 'signals',
    icon: Activity,
    title: 'AI Signals',
    subtitle: 'Dual-Agent Pipeline',
    description: '5-layer AI signal pipeline with XGBoost/LightGBM ensemble scoring.',
    video: { webm: '/landing/videos/sim-grid-preview.webm', mp4: '/landing/videos/sim-grid-preview.mp4' },
  },
  {
    id: 'volatility',
    icon: Zap,
    title: 'Volatility',
    subtitle: 'GARCH Forecasts',
    description: '5 range-based estimators (Parkinson, GK, RS, EWMA, GARCH) with regime detection.',
    video: { webm: '/landing/videos/sim-volatility.webm', mp4: '/landing/videos/sim-volatility.mp4' },
  },
  {
    id: 'regimes',
    icon: Layers,
    title: 'Regimes',
    subtitle: 'Hidden Markov Models',
    description: 'HMM-based regime compass with transition matrices and state forecasts.',
    video: { webm: '/landing/videos/sim-grid-preview.webm', mp4: '/landing/videos/sim-grid-preview.mp4' },
  },
  {
    id: 'montecarlo',
    icon: TrendingUp,
    title: 'Monte Carlo',
    subtitle: 'Path Simulation',
    description: 'Thousands of price paths with probability cones, convergence plots, and drawdown analysis.',
    video: { webm: '/landing/videos/sim-hero.webm', mp4: '/landing/videos/sim-hero.mp4' },
  },
  {
    id: 'portfolio',
    icon: BarChart3,
    title: 'Portfolio',
    subtitle: 'Mean-Variance & HRP',
    description: 'Efficient frontier optimization, risk parity, and hierarchical risk parity allocation.',
    video: { webm: '/landing/videos/sim-portfolio.webm', mp4: '/landing/videos/sim-portfolio.mp4' },
  },
  {
    id: 'backtesting',
    icon: Target,
    title: 'Backtesting',
    subtitle: 'Walk-Forward Validation',
    description: 'CPCV overfitting detection, equity curve racing, and rolling metrics analysis.',
    video: { webm: '/landing/videos/sim-backtest.webm', mp4: '/landing/videos/sim-backtest.mp4' },
  },
  {
    id: 'riskscore',
    icon: Gauge,
    title: 'Risk Score',
    subtitle: 'Quiz-Based Profiling',
    description: 'Personalized risk compass (1-99), decomposition by factor, and zone-based guidance.',
    video: { webm: '/landing/videos/sim-risk.webm', mp4: '/landing/videos/sim-risk.mp4' },
  },
  {
    id: 'scenarios',
    icon: Shield,
    title: 'Scenarios',
    subtitle: 'India Macro Stress',
    description: '8 India-specific scenarios: Rate hike, INR crisis, oil shock, and more.',
    video: { webm: '/landing/videos/sim-grid-preview.webm', mp4: '/landing/videos/sim-grid-preview.mp4' },
  },
  {
    id: 'factors',
    icon: Brain,
    title: 'Factors',
    subtitle: 'Multi-Factor Attribution',
    description: 'Value, Momentum, Quality, Size, Low Vol — decompose returns by factor exposure.',
    video: { webm: '/landing/videos/sim-grid-preview.webm', mp4: '/landing/videos/sim-grid-preview.mp4' },
  },
];

// ── Volatility Showcase ──
export const SIM_VOLATILITY_SHOWCASE = {
  label: 'VOLATILITY INTELLIGENCE',
  headline: 'Calm, Storm, or Hurricane',
  sub: '5 range-based estimators converge into a unified volatility view. GARCH forecasts fan out into probability cones. Regime detection tells you which volatility state the market is in.',
  features: [
    { title: 'Storm Gauge', description: 'Visual severity indicator from Calm to Hurricane' },
    { title: 'Fan Chart', description: 'GARCH-powered probability cones with confidence bands' },
    { title: 'Regime Detection', description: 'Automatic volatility state classification' },
    { title: '5 Estimators', description: 'Parkinson, Garman-Klass, Rogers-Satchell, EWMA, GARCH' },
  ],
  video: { webm: '/landing/videos/sim-volatility.webm', mp4: '/landing/videos/sim-volatility.mp4' },
};

// ── Portfolio + Backtest Showcase ──
export const SIM_PORTFOLIO_SHOWCASE = {
  label: 'PORTFOLIO & BACKTESTING',
  headline: 'Optimize, Then Prove It',
  sub: 'Build optimal portfolios on the efficient frontier. Then validate with walk-forward backtesting and CPCV overfitting detection — because past performance is only useful when properly tested.',
  features: [
    { title: 'Efficient Frontier', description: 'Mean-variance optimization with constraint support' },
    { title: 'Risk Parity', description: 'Equal risk contribution allocation' },
    { title: 'Walk-Forward', description: 'Out-of-sample validation with rolling windows' },
    { title: 'Overfitting Guard', description: 'CPCV detects when a strategy is curve-fit to noise' },
  ],
  video: { webm: '/landing/videos/sim-portfolio.webm', mp4: '/landing/videos/sim-portfolio.mp4' },
};

// ── Risk + Scenarios Showcase ──
export const SIM_RISK_SHOWCASE = {
  label: 'RISK & SCENARIOS',
  headline: 'Know Your Exposure',
  sub: 'Quiz-based risk profiling generates a personalized risk compass. Then stress-test against 8 India-specific macro scenarios — rate hikes, INR crises, oil shocks, and global contagion.',
  features: [
    { title: 'Risk Compass', description: 'Personalized score (1-99) with decomposition by factor' },
    { title: 'India Scenarios', description: '8 curated macro stress tests specific to Indian markets' },
    { title: 'Shockwave Gauge', description: 'Visual portfolio impact severity per scenario' },
    { title: 'Actionable Zones', description: 'Green/Yellow/Red guidance with hedging suggestions' },
  ],
  video: { webm: '/landing/videos/sim-risk.webm', mp4: '/landing/videos/sim-risk.mp4' },
};

// ── Final CTA ──
export const SIM_CTA = {
  headline: 'Run the Numbers, Then Decide',
  sub: 'Nine simulation modules. Zero guesswork. Free to start',
  cta: { label: 'Start Simulating', href: '/login' },
  video: {
    webm: '/landing/videos/sim-cta.webm',
    mp4: '/landing/videos/sim-cta.mp4',
  },
};
