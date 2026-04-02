/** News Intelligence Dashboard — shared constants */

export type NewsViewMode = 'feed' | 'graph' | 'mindmap' | 'timeline';

export type NewsRegion = 'all' | 'americas' | 'europe' | 'asia_pacific' | 'india' | 'scandinavia' | 'emerging_markets';

/** @deprecated Use NewsRegion instead */
export type NewsScope = 'india' | 'global';

export const REGION_METADATA: Record<string, { displayName: string; flag: string; color: string; primaryCurrencies: string }> = {
  americas: { displayName: 'Americas', flag: '\uD83C\uDDFA\uD83C\uDDF8', color: '#3B82F6', primaryCurrencies: 'USD, CAD, MXN' },
  europe: { displayName: 'Europe', flag: '\uD83C\uDDEC\uD83C\uDDE7', color: '#8B5CF6', primaryCurrencies: 'EUR, GBP, CHF' },
  asia_pacific: { displayName: 'Asia-Pac', flag: '\uD83C\uDF0F', color: '#F59E0B', primaryCurrencies: 'JPY, SGD, HKD, AUD' },
  india: { displayName: 'India', flag: '\uD83C\uDDEE\uD83C\uDDF3', color: '#10B981', primaryCurrencies: 'INR' },
  scandinavia: { displayName: 'Scandinavia', flag: '\uD83C\uDDF8\uD83C\uDDEA', color: '#06B6D4', primaryCurrencies: 'SEK, NOK' },
  emerging_markets: { displayName: 'EM', flag: '\uD83C\uDF0D', color: '#EF4444', primaryCurrencies: 'MXN, ZAR, TRY' },
};

export const ALL_REGIONS: NewsRegion[] = ['americas', 'europe', 'asia_pacific', 'india', 'scandinavia', 'emerging_markets'];

/** Convert a set of selected regions to the API parameter string. */
export function regionsToApiParam(regions: Set<NewsRegion>): string {
  if (regions.has('all') || regions.size === 0 || regions.size === ALL_REGIONS.length) return '';
  return Array.from(regions).join(',');
}

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
  moneycontrol: 'Moneycontrol',
  ndtv_profit: 'NDTV Profit',
  google_news_rss: 'Google News',
  searchapi: 'Google News',
  eodhd: 'EODHD',
  bbc_business: 'BBC Business',
  cnbc: 'CNBC',
  guardian_business: 'The Guardian',
  abc_australia: 'ABC News AU',
  nikkei: 'Nikkei Asia',
  central_bank_rss: 'Central Banks',
  fxstreet: 'FXStreet',
  google_news_us_rss: 'Google News US',
  google_news_uk_rss: 'Google News UK',
  google_news_apac_rss: 'Google News APAC',
  google_news_em_rss: 'Google News EM',
  google_news_scandinavia_rss: 'Google News Nordic',
  forex_news_rss: 'Forex News',
  newsdata_io: 'NewsData',
};

/** Returns a user-friendly display name for a source identifier. */
export function getSourceDisplayName(source: string): string {
  return SOURCE_DISPLAY_NAMES[source] || source;
}

/** Source filter options for India scope. */
export const INDIA_SOURCE_FILTER_OPTIONS = [
  { label: 'All Sources', value: '' },
  { label: 'Economic Times', value: 'economic_times' },
  { label: 'LiveMint', value: 'livemint' },
  { label: 'Hindu BusinessLine', value: 'hindu_businessline' },
  { label: 'Moneycontrol', value: 'moneycontrol' },
  { label: 'NDTV Profit', value: 'ndtv_profit' },
  { label: 'Google News', value: 'google_news_rss' },
] as const;

/** Source filter options for Global scope. */
export const GLOBAL_SOURCE_FILTER_OPTIONS = [
  { label: 'All Sources', value: '' },
  { label: 'EODHD', value: 'eodhd' },
] as const;

/** Backward-compat alias — defaults to India sources. */
export const SOURCE_FILTER_OPTIONS = INDIA_SOURCE_FILTER_OPTIONS;

/** @deprecated Use getRegionSourceFilterOptions instead */
export function getSourceFilterOptions(scope: NewsScope) {
  return scope === 'global' ? GLOBAL_SOURCE_FILTER_OPTIONS : INDIA_SOURCE_FILTER_OPTIONS;
}

/** @deprecated Use regionsToApiParam instead */
export function scopeToExchange(scope: NewsScope): string {
  return scope === 'global' ? 'GLOBAL' : 'NSE';
}

/** Region-aware source filter options. */
const SOURCE_OPTIONS_BY_REGION: Record<string, { label: string; value: string }[]> = {
  india: [
    { label: 'Economic Times', value: 'economic_times' },
    { label: 'LiveMint', value: 'livemint' },
    { label: 'Hindu BusinessLine', value: 'hindu_businessline' },
    { label: 'NDTV Profit', value: 'ndtv_profit' },
    { label: 'Google News India', value: 'google_news_rss' },
  ],
  americas: [
    { label: 'CNBC', value: 'cnbc' },
    { label: 'Google News US', value: 'google_news_us_rss' },
    { label: 'EODHD', value: 'eodhd' },
  ],
  europe: [
    { label: 'BBC Business', value: 'bbc_business' },
    { label: 'The Guardian', value: 'guardian_business' },
    { label: 'Google News UK', value: 'google_news_uk_rss' },
    { label: 'EODHD', value: 'eodhd' },
  ],
  asia_pacific: [
    { label: 'Nikkei Asia', value: 'nikkei' },
    { label: 'ABC Australia', value: 'abc_australia' },
    { label: 'Google News APAC', value: 'google_news_apac_rss' },
    { label: 'EODHD', value: 'eodhd' },
  ],
  scandinavia: [
    { label: 'Google News Nordic', value: 'google_news_scandinavia_rss' },
  ],
  emerging_markets: [
    { label: 'Google News EM', value: 'google_news_em_rss' },
  ],
  global: [
    { label: 'Central Banks', value: 'central_bank_rss' },
    { label: 'FXStreet', value: 'fxstreet' },
    { label: 'Forex News', value: 'forex_news_rss' },
  ],
};

/** Get source filter options for the selected regions. */
export function getRegionSourceFilterOptions(regions: Set<NewsRegion>): { label: string; value: string }[] {
  const opts = new Map<string, { label: string; value: string }>();
  const regionKeys = regions.has('all') || regions.size === 0
    ? ALL_REGIONS
    : Array.from(regions);
  for (const r of regionKeys) {
    for (const opt of SOURCE_OPTIONS_BY_REGION[r] || []) {
      opts.set(opt.value, opt);
    }
  }
  // Always include global sources
  for (const opt of SOURCE_OPTIONS_BY_REGION.global || []) {
    opts.set(opt.value, opt);
  }
  return [{ label: 'All Sources', value: '' }, ...Array.from(opts.values())];
}

/** Source badge configuration — abbreviation + color for compact chips. */
export const SOURCE_BADGE_CONFIG: Record<string, { abbr: string; color: string }> = {
  economic_times: { abbr: 'ET', color: '#F59E0B' },
  moneycontrol: { abbr: 'MC', color: '#3B82F6' },
  livemint: { abbr: 'LM', color: '#10B981' },
  ndtv_profit: { abbr: 'NDTV', color: '#EF4444' },
  hindu_businessline: { abbr: 'HBL', color: '#8B5CF6' },
  google_news_rss: { abbr: 'GN', color: '#6B7280' },
  searchapi: { abbr: 'GN', color: '#6B7280' },
  eodhd: { abbr: 'EODHD', color: '#14B8A6' },
  newsdata: { abbr: 'ND', color: '#EC4899' },
  bbc_business: { abbr: 'BBC', color: '#BB1919' },
  cnbc: { abbr: 'CNBC', color: '#005594' },
  guardian_business: { abbr: 'GDN', color: '#052962' },
  abc_australia: { abbr: 'ABC', color: '#E64626' },
  nikkei: { abbr: 'NKI', color: '#003E7E' },
  central_bank_rss: { abbr: 'CB', color: '#1E3A5F' },
  fxstreet: { abbr: 'FXS', color: '#FF6600' },
  google_news_us_rss: { abbr: 'GN', color: '#4285F4' },
  google_news_uk_rss: { abbr: 'GN', color: '#4285F4' },
  google_news_apac_rss: { abbr: 'GN', color: '#4285F4' },
  google_news_em_rss: { abbr: 'GN', color: '#4285F4' },
  google_news_scandinavia_rss: { abbr: 'GN', color: '#4285F4' },
  forex_news_rss: { abbr: 'FX', color: '#22C55E' },
};

/** Known primary/trusted financial news publishers. */
export const PRIMARY_SOURCES = new Set([
  // Display names (from Google News publisher extraction)
  'Economic Times', 'LiveMint', 'Reuters', 'Bloomberg',
  'CNBC', 'Financial Express', 'Mint', 'ET',
  'The Hindu BusinessLine', 'NDTV Profit', 'Google News',
  'BBC', 'The Guardian', 'Nikkei Asia', 'ABC News',
  // Backend identifiers (from RSS sources)
  'economic_times', 'livemint', 'hindu_businessline', 'moneycontrol', 'ndtv_profit', 'searchapi',
  'bbc_business', 'cnbc', 'guardian_business', 'nikkei', 'abc_australia',
  'central_bank_rss', 'fxstreet',
]);

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
