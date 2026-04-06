export type ForexSession = 'asia' | 'london' | 'newyork';

export interface ForexPairDef {
  pair: string;
  session: ForexSession;
}

export const SESSION_COLORS: Record<ForexSession, string> = {
  asia: 'rgba(110, 231, 183, 0.7)',
  london: 'rgba(96, 165, 250, 0.7)',
  newyork: 'rgba(251, 191, 36, 0.7)',
};

export const SESSION_GLOW: Record<ForexSession, string> = {
  asia: 'rgba(110, 231, 183, 0.15)',
  london: 'rgba(96, 165, 250, 0.15)',
  newyork: 'rgba(251, 191, 36, 0.15)',
};

export const FOREX_PAIRS: ForexPairDef[] = [
  // G10 — London
  { pair: 'EUR/USD', session: 'london' },
  { pair: 'GBP/USD', session: 'london' },
  { pair: 'EUR/GBP', session: 'london' },
  { pair: 'EUR/CHF', session: 'london' },
  { pair: 'GBP/CHF', session: 'london' },
  { pair: 'EUR/NOK', session: 'london' },
  { pair: 'EUR/SEK', session: 'london' },
  { pair: 'USD/CHF', session: 'london' },
  { pair: 'USD/NOK', session: 'london' },
  { pair: 'USD/SEK', session: 'london' },
  { pair: 'GBP/JPY', session: 'london' },
  { pair: 'EUR/JPY', session: 'london' },
  { pair: 'CHF/JPY', session: 'london' },
  { pair: 'GBP/AUD', session: 'london' },
  // Asia-Pacific
  { pair: 'USD/JPY', session: 'asia' },
  { pair: 'AUD/USD', session: 'asia' },
  { pair: 'NZD/USD', session: 'asia' },
  { pair: 'AUD/NZD', session: 'asia' },
  { pair: 'AUD/JPY', session: 'asia' },
  { pair: 'NZD/JPY', session: 'asia' },
  { pair: 'USD/SGD', session: 'asia' },
  { pair: 'USD/CNH', session: 'asia' },
  { pair: 'AUD/CAD', session: 'asia' },
  { pair: 'AUD/CHF', session: 'asia' },
  { pair: 'NZD/CHF', session: 'asia' },
  { pair: 'NZD/CAD', session: 'asia' },
  { pair: 'USD/INR', session: 'asia' },
  { pair: 'EUR/INR', session: 'asia' },
  // New York
  { pair: 'USD/CAD', session: 'newyork' },
  { pair: 'USD/MXN', session: 'newyork' },
  { pair: 'USD/ZAR', session: 'newyork' },
  { pair: 'USD/TRY', session: 'newyork' },
  { pair: 'EUR/CAD', session: 'newyork' },
  { pair: 'GBP/CAD', session: 'newyork' },
  { pair: 'CAD/JPY', session: 'newyork' },
  { pair: 'CAD/CHF', session: 'newyork' },
  { pair: 'EUR/AUD', session: 'newyork' },
  { pair: 'EUR/NZD', session: 'newyork' },
  { pair: 'GBP/NZD', session: 'newyork' },
  { pair: 'EUR/TRY', session: 'newyork' },
  { pair: 'EUR/ZAR', session: 'newyork' },
  { pair: 'GBP/ZAR', session: 'newyork' },
];

/** G10 subset for mobile */
export const FOREX_PAIRS_MOBILE: ForexPairDef[] = FOREX_PAIRS.filter((p) =>
  [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD',
    'NZD/USD', 'USD/CAD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY',
    'AUD/JPY', 'USD/INR', 'EUR/CHF', 'AUD/NZD', 'USD/SGD',
    'CAD/JPY', 'NZD/JPY', 'EUR/AUD', 'USD/MXN', 'USD/ZAR',
  ].includes(p.pair),
);

/** Get shared currency between two pairs */
export function getSharedCurrency(a: string, b: string): string | null {
  const [a1, a2] = a.split('/');
  const [b1, b2] = b.split('/');
  if (a1 === b1 || a1 === b2) return a1;
  if (a2 === b1 || a2 === b2) return a2;
  return null;
}
