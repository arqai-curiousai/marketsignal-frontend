export type ExchangeCode = 'NSE' | 'NASDAQ' | 'NYSE' | 'LSE' | 'HKSE' | 'FX';

export interface ExchangeConfig {
  code: ExchangeCode;
  name: string;
  fullName: string;
  country: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  timezone: string;
  indexName: string;
  stockCount: number;
  sectorTaxonomy: 'indian' | 'gics' | 'icb';
  hasFnO: boolean;
  defaultTicker: string;
  marketCapUnit: string;
  marketOpen: string;
  marketClose: string;
}

export const EXCHANGES: Record<ExchangeCode, ExchangeConfig> = {
  NSE: {
    code: 'NSE',
    name: 'NSE',
    fullName: 'National Stock Exchange of India',
    country: 'IN',
    flag: '\ud83c\uddee\ud83c\uddf3',
    currency: 'INR',
    currencySymbol: '\u20b9',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    indexName: 'NIFTY 50',
    stockCount: 50,
    sectorTaxonomy: 'indian',
    hasFnO: true,
    defaultTicker: 'RELIANCE',
    marketCapUnit: 'Cr',
    marketOpen: '09:15',
    marketClose: '15:30',
  },
  NASDAQ: {
    code: 'NASDAQ',
    name: 'NASDAQ',
    fullName: 'NASDAQ Stock Market',
    country: 'US',
    flag: '\ud83c\uddfa\ud83c\uddf8',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    timezone: 'America/New_York',
    indexName: 'NASDAQ 100',
    stockCount: 50,
    sectorTaxonomy: 'gics',
    hasFnO: false,
    defaultTicker: 'AAPL',
    marketCapUnit: 'B',
    marketOpen: '09:30',
    marketClose: '16:00',
  },
  NYSE: {
    code: 'NYSE',
    name: 'NYSE',
    fullName: 'New York Stock Exchange',
    country: 'US',
    flag: '\ud83c\uddfa\ud83c\uddf8',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    timezone: 'America/New_York',
    indexName: 'S&P 500 Top 50',
    stockCount: 50,
    sectorTaxonomy: 'gics',
    hasFnO: false,
    defaultTicker: 'JPM',
    marketCapUnit: 'B',
    marketOpen: '09:30',
    marketClose: '16:00',
  },
  LSE: {
    code: 'LSE',
    name: 'LSE',
    fullName: 'London Stock Exchange',
    country: 'GB',
    flag: '\ud83c\uddec\ud83c\udde7',
    currency: 'GBP',
    currencySymbol: '\u00a3',
    locale: 'en-GB',
    timezone: 'Europe/London',
    indexName: 'FTSE 100',
    stockCount: 50,
    sectorTaxonomy: 'icb',
    hasFnO: false,
    defaultTicker: 'SHEL',
    marketCapUnit: 'B',
    marketOpen: '08:00',
    marketClose: '16:30',
  },
  HKSE: {
    code: 'HKSE',
    name: 'HKSE',
    fullName: 'Hong Kong Stock Exchange',
    country: 'HK',
    flag: '\ud83c\udded\ud83c\uddf0',
    currency: 'HKD',
    currencySymbol: 'HK$',
    locale: 'en-HK',
    timezone: 'Asia/Hong_Kong',
    indexName: 'Hang Seng',
    stockCount: 50,
    sectorTaxonomy: 'gics',
    hasFnO: false,
    defaultTicker: '0700',
    marketCapUnit: 'B',
    marketOpen: '09:30',
    marketClose: '16:00',
  },
  FX: {
    code: 'FX',
    name: 'Forex',
    fullName: 'Global Currency Markets',
    country: 'GLOBAL',
    flag: '\ud83c\udf0d',
    currency: 'Multi',
    currencySymbol: '',
    locale: 'en-US',
    timezone: 'UTC',
    indexName: '42 Pairs',
    stockCount: 42,
    sectorTaxonomy: 'gics',
    hasFnO: false,
    defaultTicker: 'EUR/USD',
    marketCapUnit: '',
    marketOpen: '17:00 Sun',
    marketClose: '17:00 Fri',
  },
};

export const EXCHANGE_CODES: ExchangeCode[] = ['NSE', 'NASDAQ', 'NYSE', 'LSE', 'HKSE', 'FX'];

/** Exchanges currently active for data. */
export const ACTIVE_EXCHANGES: Set<ExchangeCode> = new Set<ExchangeCode>([
  'NSE', 'NASDAQ', 'NYSE', 'LSE', 'HKSE', 'FX',
]);

export function getExchangeConfig(code: string): ExchangeConfig {
  return EXCHANGES[code as ExchangeCode] ?? EXCHANGES.NSE;
}

export function isValidExchange(code: string): code is ExchangeCode {
  return code in EXCHANGES;
}

/**
 * Update exchange configs with live market hours from the backend
 * market-status endpoint response. Call once on app init.
 *
 * @param exchangeStatuses - The `exchanges` object from GET /api/signals/market-status
 */
export function updateMarketHours(
  exchangeStatuses: Record<string, { market_open?: string; market_close?: string; timezone?: string }>,
): void {
  for (const [code, status] of Object.entries(exchangeStatuses)) {
    const config = EXCHANGES[code as ExchangeCode];
    if (!config) continue;
    if (status.market_open) config.marketOpen = status.market_open;
    if (status.market_close) config.marketClose = status.market_close;
    if (status.timezone) config.timezone = status.timezone;
  }
}
