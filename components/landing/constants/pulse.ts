import {
  BarChart3,
  GitBranch,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';

// ── Accent config ──
export const PULSE_ACCENT = {
  primary: 'emerald',
  gradient: 'from-emerald-300 via-emerald-400 to-amber-400',
  glow: 'rgba(110,231,183,0.06)',
  blob1: 'bg-brand-emerald/[0.05]',
  blob2: 'bg-brand-amber/[0.04]',
  blob3: 'bg-brand-blue/[0.03]',
  buttonBg: 'bg-brand-emerald',
  buttonTextColor: 'text-brand-slate',
  buttonHoverShadow: 'hover:shadow-[0_0_50px_rgba(110,231,183,0.3)]',
  buttonShadow: 'shadow-[0_0_30px_rgba(110,231,183,0.2)]',
} as const;

// ── Hero ──
export const PULSE_HERO = {
  headlineBold: 'News Decoded',
  headlineSerif: 'Markets Connected',
  sub: 'AI-curated news intelligence from 25 sources across 6 global regions \u2014 with sentiment scoring, impact detection, and story threading. Backed by sector analytics and dynamic correlations across 260+ instruments.',
  primaryCta: { label: 'Open the Dashboard', href: '/login' },
  secondaryCta: { label: 'Explore Modules', href: '#modules' },
  video: {
    webm: '/landing/videos/pulse-hero.webm',
    mp4: '/landing/videos/pulse-hero.mp4',
    poster: '/landing/pulse-hero.png',
  },
};

// ── Trust Bar Stats ──
export const PULSE_STATS = [
  { value: '260', suffix: '+', label: 'Stocks Tracked', icon: 'chart' as const },
  { value: '12', suffix: '', label: 'Sectors', icon: 'globe' as const },
  { value: '6', suffix: '', label: 'Global Exchanges', icon: 'currency' as const },
  { value: '2', suffix: '', label: 'AI Agents', icon: 'agents' as const },
  { value: '5', suffix: 'min', label: 'Refresh Rate', icon: 'refresh' as const },
];

// ── Module Cards ──
export interface PulseModule {
  id: string;
  icon: LucideIcon;
  label: string;
  headline: string;
  description: string;
  features: string[];
  href: string;
  cta: string;
  glowColor: 'emerald' | 'amber' | 'blue';
  video: { webm: string; mp4: string };
}

export const PULSE_MODULES: PulseModule[] = [
  {
    id: 'news',
    icon: Newspaper,
    label: 'NEWS INTELLIGENCE',
    headline: 'Intelligence From Every Source',
    description:
      'AI-curated news feed from 20+ sources across 6 global regions with real-time sentiment scoring, impact detection, and story threading. Morning briefs, trend alerts, and network graph visualization.',
    features: [
      'AI sentiment scoring per article (Bullish/Bearish/Neutral)',
      'Impact detection linking news events to market price movements',
      'Story threading — follow narratives across sources',
      'Morning brief synthesis for rapid catch-up',
      'News network graph revealing topic connections',
    ],
    href: '/signals?tab=news',
    cta: 'Explore News',
    glowColor: 'emerald',
    video: { webm: '/landing/videos/pulse-news.webm', mp4: '/landing/videos/pulse-news.mp4' },
  },
  {
    id: 'sectors',
    icon: BarChart3,
    label: 'SECTOR INTELLIGENCE',
    headline: 'Follow the Money',
    description:
      'Interactive heatmaps, relative rotation graphs, and Mansfield relative strength reveal where capital is flowing. FII/DII ownership trends, valuation aggregates, and earnings calendars give you the institutional edge.',
    features: [
      'Market-cap weighted valuation aggregates (PE/PB/DY/EV-EBITDA)',
      'FII/DII/Promoter/Retail quarterly ownership time series',
      'Revenue, EBITDA, PAT with YoY growth at sector level',
      'Relative Rotation Graph with equal-weight compounded returns',
      'Upcoming earnings calendar with surprise history',
    ],
    href: '/signals',
    cta: 'Explore Sectors',
    glowColor: 'amber',
    video: { webm: '/landing/videos/pulse-sectors.webm', mp4: '/landing/videos/pulse-sectors.mp4' },
  },
  {
    id: 'correlation',
    icon: GitBranch,
    label: 'CORRELATION EXPLORER',
    headline: 'Hidden Relationships, Revealed',
    description:
      'DCC-GARCH dynamic correlations across equities, forex, and commodities. Cross-asset matrices reveal hidden relationships that static analysis misses.',
    features: [
      'DCC-GARCH (Engle 2002) with EWMA fallback',
      'Cross-asset matrix spanning equities, FX, and commodities',
      'Regime-conditional correlation filtering',
      'Colorblind-safe Blue-Orange palette for accessibility',
      'CSV matrix and PNG screenshot export',
    ],
    href: '/signals?tab=correlation',
    cta: 'Explore Correlations',
    glowColor: 'blue',
    video: { webm: '/landing/videos/pulse-correlation.webm', mp4: '/landing/videos/pulse-correlation.mp4' },
  },
];

// ── Sector Showcase ──
export const PULSE_SECTOR_SHOWCASE = {
  label: 'SECTOR ANALYSIS',
  headline: 'From Macro to Micro',
  sub: 'Sectors across 5 global exchanges dissected — from market-cap weighted valuations to ownership trends, earnings calendars, and Mansfield relative strength charting.',
  features: [
    { title: 'Heatmap Grid', description: 'Market-cap weighted sector performance at a glance' },
    { title: 'Relative Rotation', description: 'RRG quadrants showing momentum and relative strength cycles' },
    { title: 'FII Flow Tracker', description: 'Quarterly institutional ownership changes over time' },
    { title: 'Earnings Calendar', description: 'Upcoming and recent results with surprise tracking' },
  ],
  video: { webm: '/landing/videos/pulse-rrg.webm', mp4: '/landing/videos/pulse-rrg.mp4' },
};

// ── Correlation Showcase ──
export const PULSE_CORRELATION_SHOWCASE = {
  label: 'CORRELATION ENGINE',
  headline: 'Dynamic, Not Static',
  sub: 'Static correlations lie. Markets are regime-dependent. DCC-GARCH captures the time-varying relationship between any two assets — equities, forex, or commodities.',
  features: [
    { title: 'DCC-GARCH', description: 'Dynamic conditional correlation that adapts to volatility regimes' },
    { title: 'Cross-Asset', description: 'Equities × Forex × Commodities in a single matrix' },
    { title: 'Regime Detection', description: 'Spot correlation breaks as they form, not after' },
    { title: 'Export', description: 'Download the full matrix as CSV or PNG screenshot' },
  ],
  video: { webm: '/landing/videos/pulse-correlation.webm', mp4: '/landing/videos/pulse-correlation.mp4' },
};

// ── News Showcase ──
export const PULSE_NEWS_SHOWCASE = {
  label: 'NEWS INTELLIGENCE',
  headline: 'AI-Curated, Impact-Scored',
  sub: 'Every article tagged with sentiment, impact, and relevance scores. Story threads connect related events. Morning briefs synthesize what matters.',
  features: [
    { title: 'Sentiment Engine', description: 'Bullish, Bearish, or Neutral — scored per article' },
    { title: 'Impact Detection', description: 'Correlates news events with market price movements' },
    { title: 'Story Threads', description: 'Follow narratives as they evolve across sources' },
    { title: 'Network Graph', description: 'Visualize connections between topics, tickers, and events' },
  ],
  video: { webm: '/landing/videos/pulse-news.webm', mp4: '/landing/videos/pulse-news.mp4' },
};

// ── Final CTA ──
export const PULSE_CTA = {
  headline: 'Read Markets, Not Tickers',
  sub: 'Sectors, correlations, and news intelligence — unified. Free to start',
  cta: { label: 'Open the Dashboard', href: '/login' },
  video: {
    webm: '/landing/videos/pulse-cta.webm',
    mp4: '/landing/videos/pulse-cta.mp4',
  },
};
