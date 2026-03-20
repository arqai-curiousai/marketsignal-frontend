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
