/** Market Pyramid shared constants, types, colors, and helpers. */

import { getCurrencySymbolByCode } from '@/lib/exchange/formatting';

export { SECTOR_COLORS } from '@/types/analytics';
export { perfColor, formatMarketCap, perfTextClass } from '../sectors/constants';

// ─── Types ───────────────────────────────────────────────────

export type PyramidTimeframe = '1d' | '1w' | '1m' | '3m' | '6m' | 'ytd';
export type PyramidColorMode = 'performance' | 'sector' | 'momentum';
export type DetailPanelMode = 'overview' | 'sector' | 'stock';

export interface IPyramidStock {
  ticker: string;
  name: string;
  sector: string;
  market_cap: number;
  weight_in_sector: number;
  weight_in_nifty: number;
  last_price: number;
  change_pct: number;
  change: number;
}

export interface IPyramidSector {
  sector: string;
  total_market_cap: number;
  weight_pct: number;
  avg_change_pct: number;
  momentum_score: number;
  performance: Record<string, number>;
  stock_count: number;
  stocks: IPyramidStock[];
}

export interface IPyramidKPI {
  nifty_change_pct: number;
  advancing: number;
  declining: number;
  unchanged: number;
  top_sector: { name: string; change_pct: number } | null;
  bottom_sector: { name: string; change_pct: number } | null;
  india_vix: number | null;
}

export interface IPyramidData {
  sectors: IPyramidSector[];
  kpi: IPyramidKPI;
  total_market_cap: number;
  timeframe: string;
  computed_at: string;
}

// ─── Fundamentals (Company Intelligence Panel) ───────────────

export interface IKeyStatistics {
  pe_ratio: number | null;
  forward_pe: number | null;
  peg_ratio: number | null;
  price_to_book: number | null;
  price_to_sales: number | null;
  ev_to_ebitda: number | null;
  ev_to_revenue: number | null;
  market_cap: number | null;
  enterprise_value: number | null;
  profit_margin: number | null;
  operating_margin: number | null;
  return_on_equity: number | null;
  return_on_assets: number | null;
  revenue_growth_yoy: number | null;
  earnings_growth_yoy: number | null;
  dividend_yield: number | null;
  dividend_rate: number | null;
  payout_ratio: number | null;
  beta: number | null;
  shares_outstanding: number | null;
  next_earnings_date: string | null;
  last_updated: string | null;
}

export interface IQuarterlyFinancial {
  fiscal_year: number;
  fiscal_quarter: number | null;
  period_end_date: string | null;
  currency: string;
  data: Record<string, number | string | null>;
}

export interface IDividendRecord {
  ex_date: string;
  payment_date: string | null;
  amount: number | null;
  currency: string;
  dividend_type: string;
  frequency: string | null;
}

export interface ISectorMedians {
  pe_ratio: number | null;
  price_to_book: number | null;
  return_on_equity: number | null;
  profit_margin: number | null;
  dividend_yield: number | null;
  ev_to_ebitda: number | null;
}

export interface IStockFundamentals {
  ticker: string;
  name: string;
  sector: string | null;
  exchange: string;
  last_price: number | null;
  change: number | null;
  change_percent: number | null;
  market_cap: number | null;
  key_statistics: IKeyStatistics | null;
  quarterly_financials: {
    income_statement: IQuarterlyFinancial[];
    balance_sheet: IQuarterlyFinancial[];
    cash_flow: IQuarterlyFinancial[];
  };
  dividends: IDividendRecord[];
  sector_medians: ISectorMedians;
  computed_at: string;
}

// ─── Ownership ───────────────────────────────────────────────

export interface IShareholdingPattern {
  quarter_end: string;
  promoter_pct: number;
  fii_pct: number;
  dii_pct: number;
  retail_pct: number;
  others_pct: number;
  promoter_pledged_pct: number;
  promoter_change: number | null;
  fii_change: number | null;
  dii_change: number | null;
  retail_change: number | null;
}

export interface IInsiderTrade {
  trade_date: string;
  insider_name: string;
  designation: string;
  relation: string;
  action: 'buy' | 'sell';
  quantity: number;
  avg_price: number;
  value: number;
}

export interface IBulkDeal {
  deal_date: string;
  client_name: string;
  deal_type: 'bulk' | 'block';
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
}

export interface IOwnershipSummary {
  ticker: string;
  shareholding: IShareholdingPattern[];
  insider_trades: IInsiderTrade[];
  bulk_deals: IBulkDeal[];
  insider_summary: {
    net_buy_value: number;
    net_sell_value: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    total_trades: number;
  };
  computed_at: string;
}

// ─── Corporate Filings ──────────────────────────────────────

export interface ICorporateFiling {
  filing_date: string;
  category: string;
  subcategory: string;
  title: string;
  description: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  pdf_url: string | null;
  attachment_name: string | null;
  source: string;
}

export interface IFilingSummary {
  ticker: string;
  total_filings: number;
  category_counts: Record<string, number>;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  filings: ICorporateFiling[];
  period_days: number;
  computed_at: string;
}

// ─── Pyramid Layout Constants ────────────────────────────────

export const TIMEFRAMES = [
  { label: '1D', value: '1d' as const },
  { label: '1W', value: '1w' as const },
  { label: '1M', value: '1m' as const },
  { label: '3M', value: '3m' as const },
  { label: '6M', value: '6m' as const },
  { label: 'YTD', value: 'ytd' as const },
] as const;

export const COLOR_MODES = [
  { label: 'Performance', value: 'performance' as const },
  { label: 'Sector', value: 'sector' as const },
  { label: 'Momentum', value: 'momentum' as const },
] as const;

/** Pyramid SVG dimensions */
export const PYRAMID = {
  MIN_WIDTH_PCT: 8,   // Top layer width %
  MAX_WIDTH_PCT: 96,  // Bottom layer width %
  MIN_LAYER_HEIGHT: 28,
  PADDING: 2,
  LABEL_MIN_WIDTH: 45, // Min segment width to show ticker label
} as const;

/** Filing category display config */
export const FILING_CATEGORIES: Record<string, { label: string; color: string }> = {
  board_meeting: { label: 'Board Meeting', color: '#4ADE80' },
  financial_results: { label: 'Results', color: '#34D399' },
  dividend: { label: 'Dividend', color: '#FBBF24' },
  agm: { label: 'AGM', color: '#A78BFA' },
  egm: { label: 'EGM', color: '#818CF8' },
  insider_trading: { label: 'Insider', color: '#F472B6' },
  corporate_action: { label: 'Corp Action', color: '#FB923C' },
  rights_issue: { label: 'Rights', color: '#2DD4BF' },
  buyback: { label: 'Buyback', color: '#E879F9' },
  other: { label: 'Other', color: '#94A3B8' },
};

/** Ownership donut colors */
export const OWNERSHIP_COLORS = {
  promoter: '#3B82F6',
  fii: '#10B981',
  dii: '#F59E0B',
  retail: '#94A3B8',
  others: '#6B7280',
} as const;

/** Valuation traffic light thresholds (ratio vs sector median) */
export function valuationColor(ratio: number): { bg: string; text: string; label: string } {
  if (ratio < 0.8) return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Cheap' };
  if (ratio <= 1.2) return { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Fair' };
  return { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Expensive' };
}

/** Format currency values compactly (defaults to INR) */
export function formatINR(val: number | null, currency: string = 'INR'): string {
  if (val == null) return '—';
  const sym = getCurrencySymbolByCode(currency);
  if (val >= 1e7) return `${sym}${(val / 1e7).toFixed(1)}Cr`;
  if (val >= 1e5) return `${sym}${(val / 1e5).toFixed(1)}L`;
  if (val >= 1e3) return `${sym}${(val / 1e3).toFixed(0)}`;
  return `${sym}${val.toFixed(2)}`;
}

/** Format percentage */
export function formatPct(val: number | null, decimals: number = 2): string {
  if (val == null) return '—';
  return `${val >= 0 ? '+' : ''}${val.toFixed(decimals)}%`;
}

/** Format ratio (PE, PB, etc.) */
export function formatRatio(val: number | null): string {
  if (val == null) return '—';
  return val.toFixed(2);
}

/** Momentum score color */
export function momentumColor(score: number): string {
  if (score >= 70) return '#10B981';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}
