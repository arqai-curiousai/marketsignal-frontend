import type { ForexSession } from './forexPairs';

export type CurrencyTier = 'major' | 'minor' | 'exotic';

export interface CurrencyNode {
  code: string;
  name: string;
  session: ForexSession; // primary session
  tier: CurrencyTier;
}

/** Desktop radii per tier */
export const TIER_RADIUS: Record<CurrencyTier, number> = {
  major: 24,
  minor: 18,
  exotic: 14,
};

/** Mobile radii per tier */
export const TIER_RADIUS_MOBILE: Record<CurrencyTier, number> = {
  major: 18,
  minor: 14,
  exotic: 10,
};

/** Ring distance from center (as fraction of viewport radius) */
export const TIER_RING: Record<CurrencyTier, number> = {
  major: 0.3,
  minor: 0.55,
  exotic: 0.75,
};

export const CURRENCIES: CurrencyNode[] = [
  // Center — USD is the gravitational anchor
  { code: 'USD', name: 'US Dollar', session: 'newyork', tier: 'major' },
  // Inner ring — majors
  { code: 'EUR', name: 'Euro', session: 'london', tier: 'major' },
  { code: 'GBP', name: 'British Pound', session: 'london', tier: 'major' },
  { code: 'JPY', name: 'Japanese Yen', session: 'asia', tier: 'major' },
  { code: 'CHF', name: 'Swiss Franc', session: 'london', tier: 'major' },
  // Middle ring — minors
  { code: 'AUD', name: 'Australian Dollar', session: 'asia', tier: 'minor' },
  { code: 'NZD', name: 'New Zealand Dollar', session: 'asia', tier: 'minor' },
  { code: 'CAD', name: 'Canadian Dollar', session: 'newyork', tier: 'minor' },
  { code: 'NOK', name: 'Norwegian Krone', session: 'london', tier: 'minor' },
  { code: 'SEK', name: 'Swedish Krona', session: 'london', tier: 'minor' },
  // Outer ring — exotics
  { code: 'INR', name: 'Indian Rupee', session: 'asia', tier: 'exotic' },
  { code: 'SGD', name: 'Singapore Dollar', session: 'asia', tier: 'exotic' },
  { code: 'CNH', name: 'Chinese Yuan', session: 'asia', tier: 'exotic' },
  { code: 'MXN', name: 'Mexican Peso', session: 'newyork', tier: 'exotic' },
  { code: 'ZAR', name: 'South African Rand', session: 'newyork', tier: 'exotic' },
  { code: 'TRY', name: 'Turkish Lira', session: 'london', tier: 'exotic' },
  { code: 'HKD', name: 'Hong Kong Dollar', session: 'asia', tier: 'exotic' },
];

/** Mobile subset — drop less liquid exotics */
export const CURRENCIES_MOBILE = CURRENCIES.filter(
  (c) => !['HKD', 'NOK', 'SEK', 'TRY', 'MXN'].includes(c.code),
);

/** Session ring colors for orbital decorations */
export const SESSION_RING_COLORS: Record<ForexSession, string> = {
  asia: 'rgba(110, 231, 183, 0.5)',
  london: 'rgba(96, 165, 250, 0.5)',
  newyork: 'rgba(251, 191, 36, 0.5)',
};
