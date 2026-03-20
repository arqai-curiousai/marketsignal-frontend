/** News Intelligence Dashboard — shared constants */

export type NewsViewMode = 'feed' | 'graph' | 'mindmap' | 'timeline';

/** Unified sentiment thresholds — use these everywhere instead of magic numbers */
export const SENTIMENT_THRESHOLDS = {
  BULLISH: 0.15,
  BEARISH: -0.15,
} as const;

export const SENTIMENT_COLORS: Record<string, string> = {
  very_bullish: '#10B981',
  bullish: '#6EE7B7',
  neutral: '#64748B',
  bearish: '#F87171',
  very_bearish: '#EF4444',
};

export const THEME_COLORS: Record<string, string> = {
  earnings: '#4ADE80',
  merger_acquisition: '#A78BFA',
  regulatory: '#F59E0B',
  product_launch: '#6EE7B7',
  partnerships: '#34D399',
  market_movement: '#FB923C',
  economic_policy: '#EF4444',
  sector_rotation: '#818CF8',
  insider_activity: '#22D3EE',
  analyst_update: '#F472B6',
  global_impact: '#E879F9',
  commodity_impact: '#FBBF24',
  currency_impact: '#2DD4BF',
  ipo: '#FB7185',
  general: '#94A3B8',
};

export const THEME_LABELS: Record<string, string> = {
  earnings: 'Earnings & Results',
  merger_acquisition: 'Mergers & Acquisitions',
  regulatory: 'Regulatory & Policy',
  product_launch: 'Product Launches',
  partnerships: 'Partnerships & Deals',
  market_movement: 'Market Movement',
  economic_policy: 'Economic Policy',
  sector_rotation: 'Sector Rotation',
  insider_activity: 'Insider Activity',
  analyst_update: 'Analyst Updates',
  global_impact: 'Global Impact',
  commodity_impact: 'Commodity Impact',
  currency_impact: 'Currency Impact',
  ipo: 'IPO & Listings',
  general: 'General News',
};

export const NODE_TYPE_COLORS: Record<string, string> = {
  article: '#4ADE80',
  ticker: '#6EE7B7',
  theme: '#FBBF24',
};

export const EDGE_STYLES: Record<string, { dash: string; opacity: number; color: string; label: string }> = {
  mentions: { dash: '', opacity: 0.3, color: '#6EE7B7', label: 'Article mentions ticker' },
  co_topic: { dash: '4 2', opacity: 0.2, color: '#A78BFA', label: 'Articles share a theme' },
  co_occurrence: { dash: '', opacity: 0.35, color: '#FB923C', label: 'Tickers appear together' },
};

export const TIME_RANGES = [
  { label: '6H', value: 6 },
  { label: '24H', value: 24 },
  { label: '3D', value: 72 },
  { label: '7D', value: 168 },
] as const;

/** Maps backend source identifiers → user-friendly display names. */
export const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  economic_times: 'Economic Times',
  livemint: 'LiveMint',
  hindu_businessline: 'The Hindu BusinessLine',
  google_news_rss: 'Google News',
  searchapi: 'Google News',
  eodhd: 'EODHD',
};

/** Returns a user-friendly display name for a source identifier. */
export function getSourceDisplayName(source: string): string {
  return SOURCE_DISPLAY_NAMES[source] || source;
}

/** Source filter options for toolbar dropdown. */
export const SOURCE_FILTER_OPTIONS = [
  { label: 'All Sources', value: '' },
  { label: 'Economic Times', value: 'economic_times' },
  { label: 'LiveMint', value: 'livemint' },
  { label: 'Hindu BusinessLine', value: 'hindu_businessline' },
  { label: 'Google News', value: 'google_news_rss' },
] as const;

/** Known primary/trusted financial news publishers. */
export const PRIMARY_SOURCES = new Set([
  // Display names (from Google News publisher extraction)
  'Economic Times', 'LiveMint', 'Reuters', 'Bloomberg',
  'CNBC', 'Financial Express', 'Mint', 'ET',
  'The Hindu BusinessLine', 'NDTV Profit', 'Google News',
  // Backend identifiers (from RSS sources)
  'economic_times', 'livemint', 'hindu_businessline', 'searchapi',
]);

/** Maps a numeric sentiment score (-1 to +1) to a color from the sentiment palette. */
export function sentimentScoreToColor(score: number): string {
  if (score > 0.6) return SENTIMENT_COLORS.very_bullish;
  if (score > SENTIMENT_THRESHOLDS.BULLISH) return SENTIMENT_COLORS.bullish;
  if (score > SENTIMENT_THRESHOLDS.BEARISH) return SENTIMENT_COLORS.neutral;
  if (score > -0.6) return SENTIMENT_COLORS.bearish;
  return SENTIMENT_COLORS.very_bearish;
}

export function getSentimentColor(sentiment: string | null, score?: number | null): string {
  if (!sentiment) return SENTIMENT_COLORS.neutral;
  const key = sentiment.toLowerCase().replace(' ', '_');
  if (SENTIMENT_COLORS[key]) return SENTIMENT_COLORS[key];
  if (score != null) {
    if (score > 0.6) return SENTIMENT_COLORS.very_bullish;
    if (score > SENTIMENT_THRESHOLDS.BULLISH) return SENTIMENT_COLORS.bullish;
    if (score < -0.6) return SENTIMENT_COLORS.very_bearish;
    if (score < SENTIMENT_THRESHOLDS.BEARISH) return SENTIMENT_COLORS.bearish;
  }
  return SENTIMENT_COLORS.neutral;
}

/** Classify a score as bullish/bearish/neutral using unified thresholds */
export function classifySentiment(score: number | null): 'bullish' | 'bearish' | 'neutral' {
  if (score == null) return 'neutral';
  if (score > SENTIMENT_THRESHOLDS.BULLISH) return 'bullish';
  if (score < SENTIMENT_THRESHOLDS.BEARISH) return 'bearish';
  return 'neutral';
}

export function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function getTimeGroup(dateStr: string | null): 'breaking' | 'today' | 'this_week' | 'older' {
  if (!dateStr) return 'older';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 3600000) return 'breaking';
  if (diff < 86400000) return 'today';
  if (diff < 604800000) return 'this_week';
  return 'older';
}
