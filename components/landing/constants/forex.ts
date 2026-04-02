import {
  DollarSign,
  BarChart3,
  GitBranch,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';

// ── Accent config ──
export const FOREX_ACCENT = {
  primary: 'blue',
  gradient: 'from-sky-300 via-blue-400 to-blue-500',
  glow: 'rgba(96,165,250,0.06)',
  blob1: 'bg-brand-blue/[0.05]',
  blob2: 'bg-sky-400/[0.04]',
  blob3: 'bg-brand-emerald/[0.03]',
  buttonBg: 'bg-brand-blue',
  buttonHoverShadow: 'hover:shadow-[0_0_50px_rgba(96,165,250,0.3)]',
  buttonShadow: 'shadow-[0_0_30px_rgba(96,165,250,0.2)]',
} as const;

// ── Hero ──
export const FOREX_HERO = {
  headlineBold: 'Read the Market',
  headlineSerif: 'Before the Move',
  sub: '42 global forex pairs across 17 currencies. Real-time technicals, volatility analysis, carry trade metrics, and AI-curated news intelligence across every major session.',
  primaryCta: { label: 'Open the Dashboard', href: '/login' },
  secondaryCta: { label: 'See How It Works', href: '#showcase' },
  video: {
    webm: '/landing/videos/forex-hero.webm',
    mp4: '/landing/videos/forex-hero.mp4',
    poster: '/landing/forex-hero.png',
  },
};

// ── Trust Bar Stats ──
export const FOREX_STATS = [
  { value: '42', suffix: '', label: 'Forex Pairs', icon: 'currency' as const },
  { value: '3', suffix: '', label: 'Global Sessions', icon: 'globe' as const },
  { value: '17', suffix: '', label: 'Currencies', icon: 'chart' as const },
  { value: '2', suffix: '', label: 'AI Agents', icon: 'agents' as const },
  { value: '5', suffix: 'min', label: 'Refresh Rate', icon: 'refresh' as const },
];

// ── Showcase Panels (raw data for ForexModules grid + showcases) ──
export interface ForexShowcasePanel {
  id: string;
  icon: LucideIcon;
  label: string;
  headline: string;
  description: string;
  features: string[];
  video: { webm: string; mp4: string };
}

export const FOREX_SHOWCASE_PANELS: ForexShowcasePanel[] = [
  {
    id: 'heatmap',
    icon: DollarSign,
    label: 'FOREX HEATMAP',
    headline: '42 Pairs, Three Matrix Modes',
    description:
      'Cross-pair performance across all 42 forex pairs with G10, Full, and Exotics matrix views. Spot momentum shifts and outliers before they become consensus',
    features: [
      'Color-coded performance grid across all tracked pairs',
      'Top movers and gainers/losers at a glance',
      'Intraday, daily, and weekly timeframe toggling',
      'One-click drill-down into any pair',
    ],
    video: { webm: '/landing/videos/forex-heatmap.webm', mp4: '/landing/videos/forex-heatmap.mp4' },
  },
  {
    id: 'strength',
    icon: BarChart3,
    label: 'CURRENCY STRENGTH',
    headline: 'Who\'s Leading, Who\'s Lagging',
    description:
      'Currency strength meter scoring all 17 currencies — G10, INR, SGD, CNH, MXN, ZAR, TRY — against their basket. Carry trade differentials and interest rate context baked in.',
    features: [
      'Strength index for each major currency',
      'Carry trade yield differentials by pair',
      'Central bank rate dashboard (Fed, ECB, BOJ, RBI)',
      'Momentum and trend alignment across currency baskets',
    ],
    video: { webm: '/landing/videos/forex-strength.webm', mp4: '/landing/videos/forex-strength.mp4' },
  },
  {
    id: 'technicals',
    icon: GitBranch,
    label: 'MULTI-TIMEFRAME TECHNICALS',
    headline: 'Full Technical Stack',
    description:
      'RSI, MACD, Bollinger Bands, ADX, Stochastic across 5-minute to weekly timeframes. Pivot points, support/resistance levels, and Fibonacci retracements.',
    features: [
      'Multi-timeframe technicals: 5m, 15m, 1h, 4h, 1d, 1w',
      'RSI, MACD, Bollinger, ADX, Stochastic for all pairs',
      'Automated pivot point and S/R level detection',
      'Interactive candlestick charts with drawing tools',
    ],
    video: { webm: '/landing/videos/forex-technicals.webm', mp4: '/landing/videos/forex-technicals.mp4' },
  },
  {
    id: 'sessions',
    icon: Newspaper,
    label: 'SESSION TRACKING',
    headline: 'Asia, London, New York',
    description:
      'Live session awareness showing which markets are active, session-specific volume patterns, and overlap windows where liquidity peaks.',
    features: [
      'Live session status: Tokyo, London, New York',
      'Session overlap windows with peak liquidity alerts',
      'Economic calendar with high-impact event markers',
      'AI-curated news impact scoring per pair per session',
    ],
    video: { webm: '/landing/videos/forex-sessions.webm', mp4: '/landing/videos/forex-sessions.mp4' },
  },
];

// ── Module Cards (for ForexModules grid) ──
export interface ForexModule {
  id: string;
  icon: LucideIcon;
  label: string;
  headline: string;
  description: string;
  features: string[];
  href: string;
  cta: string;
  glowColor: 'blue' | 'emerald' | 'amber';
  video: { webm: string; mp4: string };
}

export const FOREX_MODULES: ForexModule[] = FOREX_SHOWCASE_PANELS.map((panel) => ({
  ...panel,
  href: '/login',
  cta: panel.id === 'heatmap' ? 'Explore Heatmap'
    : panel.id === 'strength' ? 'Explore Strength'
    : panel.id === 'technicals' ? 'Explore Technicals'
    : 'Explore Sessions',
  glowColor: panel.id === 'strength' ? 'emerald' as const
    : panel.id === 'technicals' ? 'amber' as const
    : 'blue' as const,
}));

// ── Heatmap Showcase (deep-dive section) ──
export const FOREX_HEATMAP_SHOWCASE = {
  label: 'FOREX HEATMAP',
  headline: '42 Pairs, Three Matrix Modes',
  sub: 'Cross-pair performance across all 42 forex pairs, color-coded by change. Filter by session, timeframe, or pair group. Spot momentum shifts and outliers before they become consensus.',
  features: [
    { title: 'Performance Grid', description: 'Color-coded cells showing real-time % change across all pairs' },
    { title: 'Top Movers', description: 'Instant visibility into gainers, losers, and volatility spikes' },
    { title: 'Multi-Timeframe', description: 'Toggle between intraday, daily, and weekly views' },
    { title: 'One-Click Drill', description: 'Click any pair to open full technicals and news context' },
  ],
  video: { webm: '/landing/videos/forex-heatmap.webm', mp4: '/landing/videos/forex-heatmap.mp4' },
};

// ── Strength Showcase (deep-dive section) ──
export const FOREX_STRENGTH_SHOWCASE = {
  label: 'CURRENCY STRENGTH',
  headline: 'Who\'s Leading, Who\'s Lagging',
  sub: 'Relative strength scoring for all 17 tracked currencies against their basket. Carry trade yield differentials and central bank rate context help you identify the strongest trends.',
  features: [
    { title: 'Strength Index', description: 'Real-time scoring for all 17 currencies — G10, INR, SGD, CNH, MXN, ZAR, TRY' },
    { title: 'Carry Trade', description: 'Yield differentials and interest rate spreads by pair' },
    { title: 'Central Banks', description: 'Rate dashboard tracking Fed, ECB, BOJ, RBI policy' },
    { title: 'Momentum Overlay', description: 'Rate-of-change and trend alignment across all currency baskets' },
  ],
  video: { webm: '/landing/videos/forex-strength.webm', mp4: '/landing/videos/forex-strength.mp4' },
};

// ── Technicals Showcase (deep-dive section) ──
export const FOREX_TECHNICALS_SHOWCASE = {
  label: 'MULTI-TIMEFRAME TECHNICALS',
  headline: 'Full Technical Stack',
  sub: 'RSI, MACD, Bollinger Bands, ADX, and Stochastic across 5-minute to weekly timeframes. Automated pivot points, support/resistance detection, and interactive charts with drawing tools.',
  features: [
    { title: '6 Timeframes', description: '5m, 15m, 1h, 4h, daily, and weekly analysis for every pair' },
    { title: '5 Indicators', description: 'RSI, MACD, Bollinger Bands, ADX, Stochastic oscillator' },
    { title: 'S/R Detection', description: 'Automated pivot point and support/resistance level identification' },
    { title: 'Drawing Tools', description: 'Trendlines, Fibonacci, horizontal levels, and rectangles' },
  ],
  video: { webm: '/landing/videos/forex-technicals.webm', mp4: '/landing/videos/forex-technicals.mp4' },
};

// ── Coverage Map ──
export const FOREX_COVERAGE = {
  headline: 'Built for Forex Traders',
  headlineSerif: 'Powered by Global Data',
  body: '42 forex pairs tracking every major session — Asia, London, New York. Plus 260+ stocks across NSE, NASDAQ, NYSE, LSE, and HKSE with sector analytics, fundamentals, and earnings calendars.',
  features: [
    '42 forex pairs with carry trade metrics and session tracking',
    '260+ stocks across 6 global exchanges',
    '5 MCX commodities (Gold, Silver, Crude, Copper, Natural Gas)',
    '20+ news sources across 6 global regions curated for forex impact and macro events',
  ],
  sessions: [
    { id: 'asia', label: 'Asia-Pacific', city: 'Tokyo', time: '00:00 – 09:00 UTC' },
    { id: 'london', label: 'London', city: 'London', time: '07:00 – 16:00 UTC' },
    { id: 'newyork', label: 'New York', city: 'New York', time: '12:00 – 21:00 UTC' },
  ],
  exchanges: [
    { id: 'NSE', label: 'NSE', city: 'Mumbai', x: 68, y: 42 },
    { id: 'NASDAQ', label: 'NASDAQ', city: 'New York', x: 25, y: 35 },
    { id: 'NYSE', label: 'NYSE', city: 'New York', x: 27, y: 37 },
    { id: 'LSE', label: 'LSE', city: 'London', x: 47, y: 30 },
    { id: 'HKSE', label: 'HKSE', city: 'Hong Kong', x: 80, y: 40 },
  ],
};

// ── Final CTA ──
export const FOREX_CTA = {
  headline: 'The Forex Terminal You Actually Want',
  sub: '42 pairs. 17 currencies. Three sessions. Two AI agents. Free to start',
  cta: { label: 'Open the Dashboard', href: '/login' },
  video: {
    webm: '/landing/videos/forex-cta.webm',
    mp4: '/landing/videos/forex-cta.mp4',
  },
};
