import { type ExchangeCode, EXCHANGES } from './config';

export function formatPrice(value: number | null | undefined, exchange: ExchangeCode = 'NSE'): string {
  if (value == null || isNaN(value)) return '--';
  const config = EXCHANGES[exchange];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMarketCap(value: number | null | undefined, exchange: ExchangeCode = 'NSE'): string {
  if (value == null) return '--';
  const config = EXCHANGES[exchange];
  const sym = config.currencySymbol;

  if (config.marketCapUnit === 'Cr') {
    if (value >= 1e12) return `${sym}${(value / 1e7 / 1e5).toFixed(1)}L Cr`;
    if (value >= 1e7) return `${sym}${(value / 1e7).toFixed(1)} Cr`;
    return `${sym}${value.toLocaleString(config.locale)}`;
  }

  if (value >= 1e12) return `${sym}${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${sym}${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${sym}${(value / 1e6).toFixed(1)}M`;
  return `${sym}${value.toLocaleString(config.locale)}`;
}

export function formatVolume(value: number | null | undefined, exchange: ExchangeCode = 'NSE'): string {
  if (value == null) return '--';
  const config = EXCHANGES[exchange];

  if (config.marketCapUnit === 'Cr') {
    if (value >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
    if (value >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
    return value.toLocaleString(config.locale);
  }

  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString(config.locale);
}

export function getCurrencySymbol(exchange: ExchangeCode = 'NSE'): string {
  return EXCHANGES[exchange].currencySymbol;
}

export function formatPriceCompact(value: number | null | undefined, exchange: ExchangeCode = 'NSE'): string {
  if (value == null || isNaN(value)) return '--';
  const config = EXCHANGES[exchange];
  return `${config.currencySymbol}${value.toFixed(2)}`;
}

/**
 * Currency code → formatting config lookup.
 * For components that receive a currency string (e.g. 'INR', 'USD')
 * instead of an ExchangeCode.
 */
const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string; unit: 'Cr' | 'B' }> = {
  INR: { symbol: '₹', locale: 'en-IN', unit: 'Cr' },
  USD: { symbol: '$', locale: 'en-US', unit: 'B' },
  GBP: { symbol: '£', locale: 'en-GB', unit: 'B' },
  SGD: { symbol: 'S$', locale: 'en-SG', unit: 'B' },
  HKD: { symbol: 'HK$', locale: 'en-HK', unit: 'B' },
};

/**
 * Format a price using a currency code string (e.g. 'INR', 'USD').
 * Falls back to USD formatting for unknown currencies.
 */
export function formatPriceByCurrency(
  value: number | null | undefined,
  currency: string = 'INR',
  options?: { compact?: boolean; decimals?: number },
): string {
  if (value == null || isNaN(value)) return '--';
  const cfg = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.USD;
  const decimals = options?.decimals ?? 2;

  if (options?.compact) {
    if (cfg.unit === 'Cr') {
      if (value >= 1e7) return `${cfg.symbol}${(value / 1e7).toFixed(1)} Cr`;
      if (value >= 1e5) return `${cfg.symbol}${(value / 1e5).toFixed(1)} L`;
    } else {
      if (value >= 1e9) return `${cfg.symbol}${(value / 1e9).toFixed(1)}B`;
      if (value >= 1e6) return `${cfg.symbol}${(value / 1e6).toFixed(1)}M`;
    }
  }

  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Get currency symbol from a currency code string.
 */
export function getCurrencySymbolByCode(currency: string = 'INR'): string {
  return (CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.USD).symbol;
}

/**
 * Exchange-aware number formatting.
 * Uses the exchange's locale for grouping separators (e.g. 1,23,456 for en-IN vs 123,456 for en-US).
 */
export function formatNumber(
  value: number | null | undefined,
  exchange: ExchangeCode = 'NSE',
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null || isNaN(value)) return '--';
  const config = EXCHANGES[exchange];
  return new Intl.NumberFormat(config.locale, options).format(value);
}

/**
 * Exchange-aware date/time formatting.
 * Uses the exchange's locale and timezone for display.
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  exchange: ExchangeCode = 'NSE',
  options?: Intl.DateTimeFormatOptions,
): string {
  if (date == null) return '--';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '--';
  const config = EXCHANGES[exchange];
  return new Intl.DateTimeFormat(config.locale, {
    timeZone: config.timezone,
    ...options,
  }).format(d);
}
