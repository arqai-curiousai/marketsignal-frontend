import { type ExchangeCode } from './config';

export const SECTOR_COLORS_INDIAN: Record<string, string> = {
  'IT': '#3b82f6',
  'Banking': '#10b981',
  'Pharma': '#ef4444',
  'Automobile': '#f59e0b',
  'FMCG': '#8b5cf6',
  'Oil & Gas': '#06b6d4',
  'Metals': '#6366f1',
  'Infrastructure': '#ec4899',
  'Financial Services': '#14b8a6',
  'Telecom': '#f97316',
  'Insurance': '#84cc16',
  'Power': '#eab308',
  'Conglomerate': '#a855f7',
  'Consumer Goods': '#22d3ee',
  'Mining': '#78716c',
  'Cement & Building Materials': '#94a3b8',
  'Chemicals': '#fb923c',
  'Healthcare': '#f43f5e',
};

export const SECTOR_COLORS_GICS: Record<string, string> = {
  'Technology': '#3b82f6',
  'Healthcare': '#ef4444',
  'Financials': '#10b981',
  'Consumer Discretionary': '#f59e0b',
  'Communication Services': '#8b5cf6',
  'Industrials': '#6366f1',
  'Consumer Staples': '#14b8a6',
  'Energy': '#f97316',
  'Materials': '#78716c',
  'Utilities': '#eab308',
  'Real Estate': '#ec4899',
};

export const SECTOR_COLORS_ICB: Record<string, string> = {
  'Technology': '#3b82f6',
  'Healthcare': '#ef4444',
  'Financials': '#10b981',
  'Consumer Discretionary': '#f59e0b',
  'Communication Services': '#8b5cf6',
  'Industrials': '#6366f1',
  'Consumer Staples': '#14b8a6',
  'Energy': '#f97316',
  'Materials': '#78716c',
  'Utilities': '#eab308',
  'Real Estate': '#ec4899',
};

export function getSectorColors(exchange: ExchangeCode): Record<string, string> {
  switch (exchange) {
    case 'NSE':
      return SECTOR_COLORS_INDIAN;
    case 'LSE':
      return SECTOR_COLORS_ICB;
    default:
      return SECTOR_COLORS_GICS;
  }
}

export function getSectorColor(sector: string, exchange: ExchangeCode): string {
  const colors = getSectorColors(exchange);
  return colors[sector] ?? '#94a3b8';
}
