import {
  BarChart3,
  DollarSign,
  Newspaper,
  GitBranch,
  type LucideIcon,
} from 'lucide-react';

// -- Hero Section --
export const HERO = {
  badge: 'Forex Intelligence by arQai',
  headline: ['Forex Analytics,', 'Powered by AI'],
  sub: '28 global currency pairs with real-time technicals, volatility analysis, and AI-curated news impact scoring. Plus sector intelligence and correlation analysis across 6 exchanges — institutional-grade insight without the noise.',
  primaryCta: { label: 'Explore Forex', href: '/signals?tab=currency' },
  secondaryCta: { label: 'See the Platform', href: '#dashboards' },
};

// -- Proof Bar --
export const PROOF_STATS = [
  { value: '28', suffix: '', label: 'Forex Pairs' },
  { value: '6', suffix: '', label: 'Global Exchanges' },
  { value: '260', suffix: '+', label: 'Stocks Tracked' },
  { value: '2', suffix: '', label: 'AI Agents' },
  { value: '5', suffix: 'min', label: 'Refresh Rate' },
];

// -- Product Showcase --
export const SHOWCASE = {
  label: 'THE PLATFORM',
  headline: 'Four dashboards. One unified view.',
  sub: 'From forex analytics to news impact, every tool a global market participant needs — in a single workspace.',
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
  visual: 'sectors' | 'currency' | 'news' | 'correlation';
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
    id: 'currency',
    icon: DollarSign,
    label: 'FOREX ANALYTICS',
    headline: 'Every currency pair.',
    headlineAccent: 'Every angle.',
    description: 'Real-time heatmaps, currency strength meters, carry trade analysis, and session tracking across 28 global forex pairs. Multi-timeframe technicals from 5-minute to weekly with volatility regime detection and mean reversion scoring.',
    features: [
      'Heatmap overview with real-time cross-pair performance',
      'Currency strength scoring with carry trade differentials',
      'Multi-timeframe technicals: RSI, MACD, Bollinger, ADX, Stochastic',
      'Session tracking across Asia, London, and New York',
    ],
    href: '/signals?tab=currency',
    visual: 'currency',
    glowColor: 'blue',
  },
  {
    id: 'news',
    icon: Newspaper,
    label: 'NEWS INTELLIGENCE',
    headline: 'News that moves',
    headlineAccent: 'markets. Not noise.',
    description: 'AI-curated market news with sentiment scoring and impact analysis. Every story is evaluated for relevance to your tracked instruments — equities, forex, and commodities. Sentiment trends surface emerging narratives before they become consensus.',
    features: [
      'Google News + RSS feeds for Indian markets, EODHD for global coverage',
      'Per-ticker and per-pair sentiment scoring with impact magnitude',
      'Forex-specific news filtering for central bank decisions and macro events',
      'Cross-reference with price action for event-driven signals',
    ],
    href: '/signals',
    visual: 'news',
    glowColor: 'violet',
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
];

// -- Market Coverage --
export const COVERAGE = {
  label: 'COVERAGE',
  headline: 'Built for forex traders.',
  headlineLine2: 'Powered by global data.',
  cards: [
    {
      title: 'Forex Pairs',
      bigNumber: '28',
      description: 'Major, minor, and INR crosses with 5-minute OHLCV, technicals, volatility analysis, carry trade metrics, and session tracking.',
      color: 'blue' as const,
    },
    {
      title: '6 Global Exchanges',
      bigNumber: '260+',
      description: 'NSE, NASDAQ, NYSE, LSE, SGX, and HKSE — sector analytics, fundamentals aggregation, and earnings calendars across all exchanges.',
      color: 'emerald' as const,
    },
    {
      title: 'News Sources',
      bigNumber: '10+',
      description: 'Google News, RSS feeds, and EODHD — curated for forex impact, central bank decisions, and macro events that move currency markets.',
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
  headline: 'Your edge in forex markets.',
  sub: 'Join the next generation of forex intelligence.',
  cta: { label: 'Get Started Free', href: '/login' },
};
