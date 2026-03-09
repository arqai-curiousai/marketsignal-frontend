/** News Intelligence Dashboard — shared constants */

export type NewsViewMode = 'feed' | 'graph' | 'mindmap' | 'timeline';

export const SENTIMENT_COLORS: Record<string, string> = {
  very_bullish: '#10B981',
  bullish: '#6EE7B7',
  neutral: '#64748B',
  bearish: '#F87171',
  very_bearish: '#EF4444',
};

export const THEME_COLORS: Record<string, string> = {
  earnings: '#60A5FA',
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
  article: '#60A5FA',
  ticker: '#6EE7B7',
  theme: '#FBBF24',
};

export const EDGE_STYLES: Record<string, { dash: string; opacity: number }> = {
  mentions: { dash: '', opacity: 0.3 },
  co_topic: { dash: '4 2', opacity: 0.2 },
  temporal: { dash: '2 2', opacity: 0.15 },
  co_occurrence: { dash: '', opacity: 0.35 },
};

export const TIME_RANGES = [
  { label: '6H', value: 6 },
  { label: '24H', value: 24 },
  { label: '3D', value: 72 },
  { label: '7D', value: 168 },
] as const;

export const PRIMARY_SOURCES = new Set([
  'Economic Times',
  'Moneycontrol',
  'LiveMint',
  'Reuters',
  'Bloomberg',
  'CNBC',
  'Business Standard',
  'Financial Express',
  'Mint',
  'ET',
]);

export function getSentimentColor(sentiment: string | null, score?: number | null): string {
  if (!sentiment) return SENTIMENT_COLORS.neutral;
  const key = sentiment.toLowerCase().replace(' ', '_');
  if (SENTIMENT_COLORS[key]) return SENTIMENT_COLORS[key];
  if (score != null) {
    if (score > 0.5) return SENTIMENT_COLORS.very_bullish;
    if (score > 0.1) return SENTIMENT_COLORS.bullish;
    if (score < -0.5) return SENTIMENT_COLORS.very_bearish;
    if (score < -0.1) return SENTIMENT_COLORS.bearish;
  }
  return SENTIMENT_COLORS.neutral;
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
