/**
 * Backward-compatibility re-exports for deprecated landing components.
 * New code should import from './constants/' directly.
 */
import {
  BarChart3,
  DollarSign,
  Newspaper,
  GitBranch,
  type LucideIcon,
} from 'lucide-react';

export { DUAL_AGENT, TRUST } from './constants/shared';
export type { TrustCard } from './constants/shared';

// ── Hero (used by old HeroSection.tsx) ──
export const HERO = {
  badge: 'Forex Intelligence by arQai',
  headlineBold: 'Read the Market.',
  headlineSerif: 'Before the Move.',
  sub: '42 global forex pairs with real-time technicals, volatility analysis, and AI-curated news intelligence. Plus sector analytics and correlation analysis across 5 exchanges — institutional-grade insight without the noise.',
  primaryCta: { label: 'Explore Forex', href: '/signals?tab=currency' },
  secondaryCta: { label: 'See the Platform', href: '#platform' },
  video: {
    webm: '/landing/videos/hero-bg.webm',
    mp4: '/landing/videos/hero-bg.mp4',
    poster: '/landing/platform-hero.png',
  },
};

// ── Trust Bar ──
export const TRUST_STATS = [
  { value: '28', suffix: '', label: 'Forex Pairs', icon: 'currency' as const },
  { value: '6', suffix: '', label: 'Global Exchanges', icon: 'globe' as const },
  { value: '260', suffix: '+', label: 'Stocks Tracked', icon: 'chart' as const },
  { value: '2', suffix: '', label: 'AI Agents', icon: 'agents' as const },
  { value: '5', suffix: 'min', label: 'Refresh Rate', icon: 'refresh' as const },
];

// ── Analytics Carousel Slides (used by old AnalyticsCarousel.tsx) ──
export interface AnalyticsSlide {
  id: string;
  icon: LucideIcon;
  label: string;
  headline: string;
  description: string;
  features: string[];
  href: string;
  cta: string;
  glowColor: 'emerald' | 'blue' | 'amber' | 'violet';
  video: { webm: string; mp4: string };
}

export const ANALYTICS_SLIDES: AnalyticsSlide[] = [
  {
    id: 'forex',
    icon: DollarSign,
    label: 'FOREX ANALYTICS',
    headline: 'Every Pair. Every Session.',
    description: 'Real-time heatmaps, currency strength meters, carry trade analysis, and session tracking across 42 global forex pairs.',
    features: [
      'Heatmap overview with real-time cross-pair performance',
      'Currency strength scoring with carry trade differentials',
      'Multi-timeframe technicals: RSI, MACD, Bollinger, ADX, Stochastic',
      'Session tracking across Asia, London, and New York',
    ],
    href: '/signals?tab=currency',
    cta: 'Explore Forex',
    glowColor: 'blue',
    video: { webm: '/landing/videos/forex.webm', mp4: '/landing/videos/forex.mp4' },
  },
  {
    id: 'sectors',
    icon: BarChart3,
    label: 'SECTOR INTELLIGENCE',
    headline: 'Where Capital Flows.',
    description: 'Interactive heatmaps, relative rotation graphs, and Mansfield relative strength reveal where capital is flowing.',
    features: [
      'Market-cap weighted valuation aggregates across all tracked sectors',
      'FII/DII/Promoter/Retail quarterly ownership time series',
      'Revenue, EBITDA, PAT with YoY growth at sector level',
      'Relative Rotation Graph with equal-weight compounded returns',
    ],
    href: '/signals',
    cta: 'Explore Sectors',
    glowColor: 'emerald',
    video: { webm: '/landing/videos/sectors.webm', mp4: '/landing/videos/sectors.mp4' },
  },
  {
    id: 'correlation',
    icon: GitBranch,
    label: 'CORRELATION EXPLORER',
    headline: 'Hidden Relationships. Revealed.',
    description: 'DCC-GARCH dynamic correlations across equities, forex, and commodities.',
    features: [
      'DCC-GARCH (Engle 2002) with EWMA fallback',
      'Cross-asset matrix spanning equities, FX, and commodity instruments',
      'Colorblind-safe Blue-Orange palette for accessibility',
      'CSV matrix and PNG screenshot export',
    ],
    href: '/signals?tab=correlation',
    cta: 'Explore Correlations',
    glowColor: 'amber',
    video: { webm: '/landing/videos/correlation.webm', mp4: '/landing/videos/correlation.mp4' },
  },
  {
    id: 'fno',
    icon: Newspaper,
    label: 'F&O & PATTERN DETECTION',
    headline: 'Derivatives. Decoded.',
    description: 'Option chains with live Greeks and gamma exposure. Multi-timeframe pattern detection with candlestick confirmation.',
    features: [
      'Option chains with Delta, Gamma, Theta, Vega and GEX profiles',
      'Supertrend + multi-timeframe pattern alignment (5m to weekly)',
      'Candlestick confirmation with one-bar-ahead validation',
      'Volatility cone with IV Rank and IV Percentile context',
    ],
    href: '/signals?tab=fno',
    cta: 'Explore F&O',
    glowColor: 'violet',
    video: { webm: '/landing/videos/fno.webm', mp4: '/landing/videos/fno.mp4' },
  },
];

// ── Coverage (used by old CoverageMap.tsx) ──
export const COVERAGE = {
  label: 'GLOBAL COVERAGE',
  headline: 'Built for Forex Traders.',
  headlineSerif: 'Powered by Global Data.',
  body: '42 forex pairs tracking every major session — Asia, London, New York. Plus 260+ stocks across NSE, NASDAQ, NYSE, LSE, and HKSE with sector analytics, fundamentals, and earnings calendars.',
  features: [
    '42 forex pairs with carry trade metrics and session tracking',
    '260+ stocks across 5 global exchanges',
    '5 MCX commodities (Gold, Silver, Crude, Copper, Natural Gas)',
    '20+ news sources across 6 global regions curated for forex impact and macro events',
  ],
  exchanges: [
    { id: 'NSE', label: 'NSE', city: 'Mumbai', x: 68, y: 42 },
    { id: 'NASDAQ', label: 'NASDAQ', city: 'New York', x: 25, y: 35 },
    { id: 'NYSE', label: 'NYSE', city: 'New York', x: 27, y: 37 },
    { id: 'LSE', label: 'LSE', city: 'London', x: 47, y: 30 },
    { id: 'HKSE', label: 'HKSE', city: 'Hong Kong', x: 80, y: 40 },
  ],
};

// ── Platform (used by old PlatformShowcase.tsx) ──
export const PLATFORM = {
  label: 'THE PLATFORM',
  headline: 'Four Dashboards. One Unified View.',
  sub: 'From forex analytics to news impact, every tool a global market participant needs — in a single workspace.',
  video: {
    webm: '/landing/videos/platform-walkthrough.webm',
    mp4: '/landing/videos/platform-walkthrough.mp4',
    poster: '/landing/platform-hero.png',
  },
  tabs: [
    { label: 'Forex Analytics', href: '/signals?tab=currency' },
    { label: 'Sectors & Stocks', href: '/signals' },
    { label: 'Correlation & Patterns', href: '/signals?tab=correlation' },
  ],
};

// ── Simulation (used by old SimulationLab.tsx) ──
export const SIMULATION = {
  label: 'SIMULATION LAB',
  headline: 'Test Strategies.',
  headlineSerif: 'Trust the Math.',
  body: 'Run MACD, RSI, and SMA crossover strategies against live market data across all 6 exchanges.',
  features: [
    'Pluggable strategy architecture with auto-registration',
    'Outcome tracking compares every prediction to actual prices',
    'Volatility regime detection with fan-chart forecasts',
    'Monte Carlo simulation for portfolio stress testing',
  ],
  cta: { label: 'Open Playground', href: '/playground' },
  strategy: {
    name: 'MACD Crossover',
    params: [
      { key: 'Fast Period', value: '12' },
      { key: 'Slow Period', value: '26' },
      { key: 'Signal Period', value: '9' },
    ],
  },
  metrics: [
    { label: 'YTD', value: '+18.3%' },
    { label: 'Sharpe', value: '1.42' },
    { label: 'Max DD', value: '-8.2%' },
  ],
};

// ── Final CTA (used by old FinalCTA.tsx default) ──
export const FINAL_CTA = {
  headline: 'Your Edge in Forex Markets.',
  sub: 'Join the next generation of forex intelligence. Free to start.',
  cta: { label: 'Explore Forex Free', href: '/signals?tab=currency' },
  video: {
    webm: '/landing/videos/cta-particles.webm',
    mp4: '/landing/videos/cta-particles.mp4',
  },
};
