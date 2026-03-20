import {
  BarChart3,
  TrendingUp,
  Newspaper,
  Target,
  GitBranch,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

// -- Hero Section --
export const HERO = {
  badge: 'arQai Intelligence',
  headline: ['Global Markets,', 'Decoded by AI'],
  sub: 'Dual-agent intelligence pipeline spanning 6 global exchanges, Forex, and Commodities. Real-time signals, pattern detection, and institutional-grade research — without the noise.',
  primaryCta: { label: 'Start Exploring', href: '/signals' },
  secondaryCta: { label: 'See the Platform', href: '#dashboards' },
};

// -- Proof Bar --
export const PROOF_STATS = [
  { value: '6', suffix: '', label: 'Global Exchanges' },
  { value: '260', suffix: '+', label: 'Stocks Tracked' },
  { value: '5', suffix: '', label: 'Commodities' },
  { value: '2', suffix: '', label: 'AI Agents' },
  { value: '5', suffix: 'min', label: 'Refresh Rate' },
];

// -- Product Showcase --
export const SHOWCASE = {
  label: 'THE PLATFORM',
  headline: 'Six dashboards. One unified view.',
  sub: 'From sector intelligence to options Greeks, every tool a global market participant needs — in a single workspace.',
  image: '/landing/platform-hero.png',
  fallbackImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1400&q=80',
};

// -- Dashboard Showcases --
export interface DashboardShowcase {
  id: string;
  icon: LucideIcon;
  label: string;
  headline: string;
  headlineAccent: string;
  description: string;
  features: string[];
  href: string;
  visual: 'sectors' | 'patterns' | 'news' | 'fno' | 'correlation' | 'research';
  glowColor: 'emerald' | 'blue' | 'violet';
}

export const DASHBOARDS: DashboardShowcase[] = [
  {
    id: 'sectors',
    icon: BarChart3,
    label: 'SECTOR INTELLIGENCE',
    headline: 'Every sector.',
    headlineAccent: 'Every angle.',
    description: 'Interactive heatmaps, relative rotation graphs, and Mansfield relative strength reveal where capital is flowing. FII/DII ownership trends, valuation aggregates (PE/PB/DY/EV-EBITDA), and earnings calendars give you the institutional edge.',
    features: [
      'Market-cap weighted valuation aggregates across all tracked sectors',
      'FII/DII/Promoter/Retail quarterly ownership time series',
      'Revenue, EBITDA, PAT with YoY growth at sector level',
      'Relative Rotation Graph with equal-weight compounded returns',
    ],
    href: '/signals',
    visual: 'sectors',
    glowColor: 'emerald',
  },
  {
    id: 'patterns',
    icon: TrendingUp,
    label: 'PATTERN DETECTION',
    headline: 'Patterns spotted.',
    headlineAccent: 'Across every timeframe.',
    description: 'Candlestick formations, chart patterns, and Supertrend overlays detected automatically from 5-minute bars to weekly charts. Multi-timeframe alignment tells you when signals converge. Built-in drawing tools let you annotate freely.',
    features: [
      'Multi-timeframe support: 5m, 15m, 30m, 1h, daily, weekly',
      'Candlestick confirmation with one-bar-ahead validation',
      'Quality scoring based on Bulkowski win rates + regional market adjustments',
      'Trendline, Fibonacci, horizontal, rectangle drawing tools with keyboard shortcuts',
    ],
    href: '/signals',
    visual: 'patterns',
    glowColor: 'blue',
  },
  {
    id: 'news',
    icon: Newspaper,
    label: 'NEWS INTELLIGENCE',
    headline: 'News that moves',
    headlineAccent: 'markets. Not noise.',
    description: 'AI-curated market news with sentiment scoring and impact analysis. Every story is evaluated for relevance to your tracked instruments. Sentiment trends surface emerging narratives before they become consensus.',
    features: [
      'RSS feeds + Google News for Indian markets, EODHD for global',
      'Per-ticker sentiment scoring with impact magnitude',
      'Automatic 30-minute cache to conserve API credits',
      'Cross-reference with price action for event-driven signals',
    ],
    href: '/signals',
    visual: 'news',
    glowColor: 'violet',
  },
  {
    id: 'fno',
    icon: Target,
    label: 'F&O ARENA',
    headline: 'Options intelligence.',
    headlineAccent: 'From chain to payoff.',
    description: 'Full option chain visualization with Greeks computation, GEX analysis, and volatility cone. Build strategies with the interactive payoff diagram builder — Bull Call, Bear Put, Iron Condor, Straddle, Strangle — all with real-time P&L curves.',
    features: [
      'Auto-refreshing option chain with 60-second polling',
      'IV Rank and IV Percentile with 400-day historical context',
      'GEX regime detection, wall migration tracking, futures basis',
      'Strategy builder with 5 presets and custom leg construction',
    ],
    href: '/signals',
    visual: 'fno',
    glowColor: 'emerald',
  },
  {
    id: 'correlation',
    icon: GitBranch,
    label: 'CORRELATION EXPLORER',
    headline: 'See how assets',
    headlineAccent: 'move together.',
    description: 'DCC-GARCH dynamic correlations across equities, forex, and commodities. Cross-asset matrices reveal hidden relationships. Spot regime changes as they form — before the correlation break leads to opportunity or risk.',
    features: [
      'DCC-GARCH (Engle 2002) with EWMA fallback',
      'Cross-asset matrix spanning equities, FX, and commodity instruments',
      'Colorblind-safe Blue-Orange palette for accessibility',
      'CSV matrix and PNG screenshot export',
    ],
    href: '/signals',
    visual: 'correlation',
    glowColor: 'blue',
  },
  {
    id: 'research',
    icon: MessageSquare,
    label: 'AI RESEARCH',
    headline: 'Ask anything.',
    headlineAccent: 'Get sourced answers.',
    description: 'RAG-powered research assistant backed by Qdrant vector search. Every answer cites its sources with relevance scores. Stream responses in real-time via SSE. No hallucinated facts — just verifiable, sourced intelligence.',
    features: [
      'Retrieval-augmented generation with Qdrant Cloud vectors',
      'SSE streaming for real-time response delivery',
      'Source citations with relevance confidence scores',
      'Compliance-filtered: no buy/sell recommendations in output',
    ],
    href: '/assistant',
    visual: 'research',
    glowColor: 'violet',
  },
];

// -- Market Coverage --
export const COVERAGE = {
  label: 'COVERAGE',
  headline: 'Built for global markets.',
  headlineLine2: 'Tuned for serious traders.',
  cards: [
    {
      title: '6 Global Exchanges',
      bigNumber: '260+',
      description: 'NSE, NASDAQ, NYSE, LSE, SGX, and HKSE — sector analytics, fundamentals aggregation, and earnings calendars across all exchanges.',
      color: 'emerald' as const,
    },
    {
      title: 'Forex Pairs',
      bigNumber: '5',
      description: 'Major currency pairs with 5-minute OHLCV and cross-asset correlation tracking.',
      color: 'blue' as const,
    },
    {
      title: 'Commodities',
      bigNumber: '5',
      description: 'Gold, Silver, Crude Oil, Natural Gas, Copper with real-time price sync and cross-asset analysis.',
      color: 'violet' as const,
    },
  ],
};

// -- Algo Playground --
export const ALGO = {
  label: 'ALGO PLAYGROUND',
  headline: 'Test strategies.',
  headlineLine2: 'Trust the math.',
  body: 'Run MACD, RSI, and SMA crossover strategies against live market data across 6 global exchanges. Circuit breaker protection auto-disables failing strategies. Outcome tracking compares every prediction to reality.',
  cta: { label: 'Open Playground', href: '/playground' },
  codeBlock: [
    { key: 'Strategy', value: 'MACD Crossover' },
    { key: 'Fast Period', value: '12' },
    { key: 'Slow Period', value: '26' },
    { key: 'Signal Period', value: '9' },
    { key: 'Market', value: '6 Global Exchanges' },
    { key: 'Status', value: 'Active' },
  ],
};

// -- Final CTA --
export const FINAL_CTA = {
  headline: 'Your edge in global markets.',
  sub: 'Join the next generation of market intelligence.',
  cta: { label: 'Get Started Free', href: '/login' },
};
