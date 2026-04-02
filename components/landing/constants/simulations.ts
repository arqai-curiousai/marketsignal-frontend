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
  headlineBold: 'Invest',
  headlineSerif: 'with Proof',
  sub: 'Test any strategy before you risk real money. Simulate thousands of outcomes. Stress-test against crashes. Find the right portfolio mix. Nine powerful tools — built for professionals, now free for everyone.',
  primaryCta: { label: 'Start Free', href: '/login' },
  secondaryCta: { label: 'See All 9 Tools', href: '#grid' },
  video: {
    webm: '/landing/videos/sim-hero.webm',
    mp4: '/landing/videos/sim-hero.mp4',
    poster: '/landing/sim-hero.png',
  },
};

// ── Trust Bar Stats ──
export const SIM_STATS = [
  { value: '9', suffix: '', label: 'Free Tools', icon: 'chart' as const },
  { value: '5', suffix: '', label: 'Risk Models', icon: 'currency' as const },
  { value: '8', suffix: '', label: 'Crash Scenarios', icon: 'globe' as const },
  { value: '6', suffix: '', label: 'Exchanges', icon: 'agents' as const },
  { value: '5', suffix: 'min', label: 'Live Updates', icon: 'refresh' as const },
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
    title: 'AI Patterns',
    subtitle: 'Multi-Model Pattern Detection',
    description: 'AI analyzes price action, volume, volatility, and market context to surface recurring patterns — so you focus on what matters, not noise.',
    video: { webm: '/landing/videos/sim-grid-preview.webm', mp4: '/landing/videos/sim-grid-preview.mp4' },
  },
  {
    id: 'volatility',
    icon: Zap,
    title: 'Volatility',
    subtitle: 'Stock Volatility Checker',
    description: 'See how wildly a stock actually moves — not just what it did yesterday, but what it is likely to do next. A storm gauge tells you if markets are calm, choppy, or dangerous.',
    video: { webm: '/landing/videos/sim-volatility.webm', mp4: '/landing/videos/sim-volatility.mp4' },
  },
  {
    id: 'regimes',
    icon: Layers,
    title: 'Regimes',
    subtitle: 'Market Regime Detector',
    description: 'Markets shift between calm rallies, choppy sideways drifts, and sharp selloffs. This tool detects which mode the market is in right now and where it is heading next.',
    video: { webm: '/landing/videos/sim-grid-preview.webm', mp4: '/landing/videos/sim-grid-preview.mp4' },
  },
  {
    id: 'montecarlo',
    icon: TrendingUp,
    title: 'Monte Carlo',
    subtitle: 'Future Price Simulator',
    description: 'Simulate thousands of possible price paths for any stock. See the best case, worst case, and most likely outcome — so you stop relying on gut feelings.',
    video: { webm: '/landing/videos/sim-hero.webm', mp4: '/landing/videos/sim-hero.mp4' },
  },
  {
    id: 'portfolio',
    icon: BarChart3,
    title: 'Portfolio',
    subtitle: 'Portfolio Optimizer',
    description: 'Find the ideal mix of stocks for your goals. Balance risk and return automatically — the same method pension funds and endowments use to manage billions.',
    video: { webm: '/landing/videos/sim-portfolio.webm', mp4: '/landing/videos/sim-portfolio.mp4' },
  },
  {
    id: 'backtesting',
    icon: Target,
    title: 'Backtesting',
    subtitle: 'Strategy Tester',
    description: 'Test any investment strategy against years of real market data before you commit real money. Built-in safeguards catch strategies that only look good on paper.',
    video: { webm: '/landing/videos/sim-backtest.webm', mp4: '/landing/videos/sim-backtest.mp4' },
  },
  {
    id: 'riskscore',
    icon: Gauge,
    title: 'Risk Score',
    subtitle: 'Investment Risk Calculator',
    description: 'Answer a few simple questions and get a personal risk score from 1 to 99. Then see exactly which parts of your portfolio are adding the most risk.',
    video: { webm: '/landing/videos/sim-risk.webm', mp4: '/landing/videos/sim-risk.mp4' },
  },
  {
    id: 'scenarios',
    icon: Shield,
    title: 'Scenarios',
    subtitle: 'Crash Stress Tests',
    description: 'What happens to your portfolio if interest rates spike? If crude oil doubles? If a currency crisis hits? Run 8 real-world disaster scenarios and find out before it happens.',
    video: { webm: '/landing/videos/sim-grid-preview.webm', mp4: '/landing/videos/sim-grid-preview.mp4' },
  },
  {
    id: 'factors',
    icon: Brain,
    title: 'Factors',
    subtitle: 'Return Breakdown',
    description: 'Understand why your stocks move. Is it value? Momentum? Quality? See which invisible forces are driving your returns — and which ones are dragging them down.',
    video: { webm: '/landing/videos/sim-grid-preview.webm', mp4: '/landing/videos/sim-grid-preview.mp4' },
  },
];

// ── Volatility Showcase ──
export const SIM_VOLATILITY_SHOWCASE = {
  label: 'KNOW BEFORE THE STORM HITS',
  headline: 'See the Risk Others Miss',
  sub: 'Most investors check if a stock went up or down. This tool shows you how violently it could move tomorrow. Five different models measure risk from every angle, then a single storm gauge tells you whether conditions are calm, brewing, or dangerous — so you can act before the crowd reacts.',
  features: [
    { title: 'Storm Gauge', description: 'One visual that instantly tells you if markets are calm, brewing, or in a full storm' },
    { title: 'Forecast Cones', description: 'See the range of likely prices over the next days and weeks, not just a single guess' },
    { title: 'Regime Alert', description: 'Automatically detects whether you are in a low-risk, medium-risk, or high-risk environment' },
    { title: '5 Risk Lenses', description: 'Five independent models cross-check each other so no single method can fool you' },
  ],
  video: { webm: '/landing/videos/sim-volatility.webm', mp4: '/landing/videos/sim-volatility.mp4' },
};

// ── Portfolio + Backtest Showcase ──
export const SIM_PORTFOLIO_SHOWCASE = {
  label: 'BUILD SMARTER, TEST FIRST',
  headline: 'Build It. Then Prove It Works.',
  sub: 'Find the best combination of stocks for your money — the same mathematical approach that manages trillions globally. Then test your strategy against years of real crashes, rallies, and sideways markets. If it only works on paper, the backtest will catch it before your money does.',
  features: [
    { title: 'Optimal Mix', description: 'Automatically find the portfolio balance that gives you the most return for the risk you are comfortable with' },
    { title: 'Equal Risk', description: 'Spread risk evenly across your holdings so no single stock can sink your portfolio' },
    { title: 'Reality Check', description: 'Test strategies against actual market history — including 2008, 2020, and every crash in between' },
    { title: 'Overfitting Guard', description: 'Catches strategies that are accidentally fine-tuned to the past but will fail in the future' },
  ],
  video: { webm: '/landing/videos/sim-portfolio.webm', mp4: '/landing/videos/sim-portfolio.mp4' },
};

// ── Risk + Scenarios Showcase ──
export const SIM_RISK_SHOWCASE = {
  label: 'PREPARE FOR ANYTHING',
  headline: 'Sleep Better at Night',
  sub: 'Take a quick quiz and get your personal risk score — a single number from 1 to 99 that tells you if your portfolio matches your comfort level. Then stress-test it against real disaster scenarios: central bank rate hikes, oil shocks, currency crises, and global contagion. Know what could happen before it does.',
  features: [
    { title: 'Your Risk Score', description: 'A personal score from 1 to 99 that shows whether your portfolio matches how much risk you can handle' },
    { title: 'Global Crash Tests', description: '8 scenarios spanning rate hikes, currency crises, commodity shocks, and global selloffs' },
    { title: 'Impact Meter', description: 'See exactly how much your portfolio could lose in each scenario — in your local currency, not just percentages' },
    { title: 'Clear Next Steps', description: 'Green, yellow, and red zones with plain-language guidance on what to do about your risk level' },
  ],
  video: { webm: '/landing/videos/sim-risk.webm', mp4: '/landing/videos/sim-risk.mp4' },
};

// ── Final CTA ──
export const SIM_CTA = {
  headline: 'Stop Guessing. Start Simulating.',
  sub: 'Nine institutional-grade tools. Zero cost. Built for the everyday investor.',
  cta: { label: 'Get Started Free', href: '/login' },
  video: {
    webm: '/landing/videos/sim-cta.webm',
    mp4: '/landing/videos/sim-cta.mp4',
  },
};
