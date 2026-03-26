export type ExchangeCode = 'NSE' | 'NASDAQ' | 'NYSE' | 'LSE' | 'SGX' | 'HKSE';

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
    indexName: 'Dow Jones 30',
    stockCount: 30,
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
  SGX: {
    code: 'SGX',
    name: 'SGX',
    fullName: 'Singapore Exchange',
    country: 'SG',
    flag: '\ud83c\uddf8\ud83c\uddec',
    currency: 'SGD',
    currencySymbol: 'S$',
    locale: 'en-SG',
    timezone: 'Asia/Singapore',
    indexName: 'STI 30',
    stockCount: 30,
    sectorTaxonomy: 'gics',
    hasFnO: false,
    defaultTicker: 'D05',
    marketCapUnit: 'B',
    marketOpen: '09:00',
    marketClose: '17:00',
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
};

export const EXCHANGE_CODES: ExchangeCode[] = ['NSE', 'NASDAQ', 'NYSE', 'LSE', 'SGX', 'HKSE'];

/** Exchanges currently active for data. Others show "Coming Soon". */
export const ACTIVE_EXCHANGES: Set<ExchangeCode> = new Set<ExchangeCode>(['NSE']);

export function getExchangeConfig(code: string): ExchangeConfig {
  return EXCHANGES[code as ExchangeCode] ?? EXCHANGES.NSE;
}

export function isValidExchange(code: string): code is ExchangeCode {
  return code in EXCHANGES;
}
