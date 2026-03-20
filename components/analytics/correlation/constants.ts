/**
 * Shared constants, types, and helpers for the Correlation Explorer.
 */

import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { scaleLinear } from 'd3-scale';

// ═══════════════════════════════════════════════════════════════
// Asset Registry
// ═══════════════════════════════════════════════════════════════

export interface Asset {
  ticker: string;
  name: string;
  type: 'stock' | 'currency' | 'commodity';
  sector?: string;
}

export const NSE_STOCK_ASSETS: Asset[] = [
  { ticker: 'ADANIENT', name: 'Adani Enterprises', type: 'stock', sector: 'Conglomerate' },
  { ticker: 'ADANIPORTS', name: 'Adani Ports', type: 'stock', sector: 'Infrastructure' },
  { ticker: 'APOLLOHOSP', name: 'Apollo Hospitals', type: 'stock', sector: 'Healthcare' },
  { ticker: 'ASIANPAINT', name: 'Asian Paints', type: 'stock', sector: 'Consumer Goods' },
  { ticker: 'AXISBANK', name: 'Axis Bank', type: 'stock', sector: 'Banking' },
  { ticker: 'BAJAJ-AUTO', name: 'Bajaj Auto', type: 'stock', sector: 'Automobile' },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance', type: 'stock', sector: 'Financial Services' },
  { ticker: 'BAJAJFINSV', name: 'Bajaj Finserv', type: 'stock', sector: 'Financial Services' },
  { ticker: 'BPCL', name: 'BPCL', type: 'stock', sector: 'Oil & Gas' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel', type: 'stock', sector: 'Telecom' },
  { ticker: 'BRITANNIA', name: 'Britannia', type: 'stock', sector: 'FMCG' },
  { ticker: 'CIPLA', name: 'Cipla', type: 'stock', sector: 'Pharma' },
  { ticker: 'COALINDIA', name: 'Coal India', type: 'stock', sector: 'Mining' },
  { ticker: 'DIVISLAB', name: "Divi's Labs", type: 'stock', sector: 'Pharma' },
  { ticker: 'DRREDDY', name: "Dr. Reddy's", type: 'stock', sector: 'Pharma' },
  { ticker: 'EICHERMOT', name: 'Eicher Motors', type: 'stock', sector: 'Automobile' },
  { ticker: 'GRASIM', name: 'Grasim', type: 'stock', sector: 'Cement & Building Materials' },
  { ticker: 'HCLTECH', name: 'HCL Tech', type: 'stock', sector: 'IT' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank', type: 'stock', sector: 'Banking' },
  { ticker: 'HDFCLIFE', name: 'HDFC Life', type: 'stock', sector: 'Insurance' },
  { ticker: 'HINDALCO', name: 'Hindalco', type: 'stock', sector: 'Metals' },
  { ticker: 'HINDUNILVR', name: 'HUL', type: 'stock', sector: 'FMCG' },
  { ticker: 'ICICIBANK', name: 'ICICI Bank', type: 'stock', sector: 'Banking' },
  { ticker: 'ITC', name: 'ITC', type: 'stock', sector: 'FMCG' },
  { ticker: 'INDUSINDBK', name: 'IndusInd Bank', type: 'stock', sector: 'Banking' },
  { ticker: 'INFY', name: 'Infosys', type: 'stock', sector: 'IT' },
  { ticker: 'JSWSTEEL', name: 'JSW Steel', type: 'stock', sector: 'Metals' },
  { ticker: 'KOTAKBANK', name: 'Kotak Bank', type: 'stock', sector: 'Banking' },
  { ticker: 'LT', name: 'L&T', type: 'stock', sector: 'Infrastructure' },
  { ticker: 'M&M', name: 'M&M', type: 'stock', sector: 'Automobile' },
  { ticker: 'MARUTI', name: 'Maruti Suzuki', type: 'stock', sector: 'Automobile' },
  { ticker: 'NESTLEIND', name: 'Nestle India', type: 'stock', sector: 'FMCG' },
  { ticker: 'NTPC', name: 'NTPC', type: 'stock', sector: 'Power' },
  { ticker: 'ONGC', name: 'ONGC', type: 'stock', sector: 'Oil & Gas' },
  { ticker: 'POWERGRID', name: 'Power Grid', type: 'stock', sector: 'Power' },
  { ticker: 'RELIANCE', name: 'Reliance', type: 'stock', sector: 'Conglomerate' },
  { ticker: 'SBILIFE', name: 'SBI Life', type: 'stock', sector: 'Insurance' },
  { ticker: 'SBIN', name: 'SBI', type: 'stock', sector: 'Banking' },
  { ticker: 'SUNPHARMA', name: 'Sun Pharma', type: 'stock', sector: 'Pharma' },
  { ticker: 'TCS', name: 'TCS', type: 'stock', sector: 'IT' },
  { ticker: 'TATACONSUM', name: 'Tata Consumer', type: 'stock', sector: 'FMCG' },
  { ticker: 'TATAMOTORS', name: 'Tata Motors', type: 'stock', sector: 'Automobile' },
  { ticker: 'TATASTEEL', name: 'Tata Steel', type: 'stock', sector: 'Metals' },
  { ticker: 'TECHM', name: 'Tech Mahindra', type: 'stock', sector: 'IT' },
  { ticker: 'TITAN', name: 'Titan', type: 'stock', sector: 'Consumer Goods' },
  { ticker: 'ULTRACEMCO', name: 'UltraTech Cement', type: 'stock', sector: 'Cement & Building Materials' },
  { ticker: 'UPL', name: 'UPL', type: 'stock', sector: 'Chemicals' },
  { ticker: 'WIPRO', name: 'Wipro', type: 'stock', sector: 'IT' },
  { ticker: 'LTIM', name: 'LTIMindtree', type: 'stock', sector: 'IT' },
];

/** Backward-compatible alias */
export const STOCK_ASSETS = NSE_STOCK_ASSETS;

export const NASDAQ_STOCK_ASSETS: Asset[] = [
  { ticker: 'AAPL', name: 'Apple', type: 'stock', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft', type: 'stock', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon', type: 'stock', sector: 'Consumer Discretionary' },
  { ticker: 'GOOGL', name: 'Alphabet', type: 'stock', sector: 'Technology' },
  { ticker: 'META', name: 'Meta Platforms', type: 'stock', sector: 'Technology' },
  { ticker: 'NVDA', name: 'NVIDIA', type: 'stock', sector: 'Technology' },
  { ticker: 'TSLA', name: 'Tesla', type: 'stock', sector: 'Consumer Discretionary' },
  { ticker: 'AVGO', name: 'Broadcom', type: 'stock', sector: 'Technology' },
  { ticker: 'COST', name: 'Costco', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'NFLX', name: 'Netflix', type: 'stock', sector: 'Communication Services' },
  { ticker: 'AMD', name: 'AMD', type: 'stock', sector: 'Technology' },
  { ticker: 'ADBE', name: 'Adobe', type: 'stock', sector: 'Technology' },
  { ticker: 'CRM', name: 'Salesforce', type: 'stock', sector: 'Technology' },
  { ticker: 'INTC', name: 'Intel', type: 'stock', sector: 'Technology' },
  { ticker: 'QCOM', name: 'Qualcomm', type: 'stock', sector: 'Technology' },
  { ticker: 'INTU', name: 'Intuit', type: 'stock', sector: 'Technology' },
  { ticker: 'AMAT', name: 'Applied Materials', type: 'stock', sector: 'Technology' },
  { ticker: 'PYPL', name: 'PayPal', type: 'stock', sector: 'Financial Services' },
  { ticker: 'GILD', name: 'Gilead Sciences', type: 'stock', sector: 'Healthcare' },
  { ticker: 'AMGN', name: 'Amgen', type: 'stock', sector: 'Healthcare' },
];

export const NYSE_STOCK_ASSETS: Asset[] = [
  { ticker: 'JPM', name: 'JPMorgan Chase', type: 'stock', sector: 'Financials' },
  { ticker: 'V', name: 'Visa', type: 'stock', sector: 'Financials' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', type: 'stock', sector: 'Healthcare' },
  { ticker: 'WMT', name: 'Walmart', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'PG', name: 'Procter & Gamble', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'UNH', name: 'UnitedHealth', type: 'stock', sector: 'Healthcare' },
  { ticker: 'HD', name: 'Home Depot', type: 'stock', sector: 'Consumer Discretionary' },
  { ticker: 'BAC', name: 'Bank of America', type: 'stock', sector: 'Financials' },
  { ticker: 'MA', name: 'Mastercard', type: 'stock', sector: 'Financials' },
  { ticker: 'DIS', name: 'Walt Disney', type: 'stock', sector: 'Communication Services' },
  { ticker: 'XOM', name: 'Exxon Mobil', type: 'stock', sector: 'Energy' },
  { ticker: 'KO', name: 'Coca-Cola', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'PFE', name: 'Pfizer', type: 'stock', sector: 'Healthcare' },
  { ticker: 'GS', name: 'Goldman Sachs', type: 'stock', sector: 'Financials' },
  { ticker: 'CAT', name: 'Caterpillar', type: 'stock', sector: 'Industrials' },
];

const LSE_STOCK_ASSETS: Asset[] = [
  { ticker: 'SHEL', name: 'Shell', type: 'stock', sector: 'Energy' },
  { ticker: 'AZN', name: 'AstraZeneca', type: 'stock', sector: 'Healthcare' },
  { ticker: 'HSBA', name: 'HSBC', type: 'stock', sector: 'Financials' },
  { ticker: 'ULVR', name: 'Unilever', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'BP', name: 'BP', type: 'stock', sector: 'Energy' },
  { ticker: 'GSK', name: 'GSK', type: 'stock', sector: 'Healthcare' },
  { ticker: 'RIO', name: 'Rio Tinto', type: 'stock', sector: 'Materials' },
  { ticker: 'REL', name: 'RELX', type: 'stock', sector: 'Industrials' },
  { ticker: 'DGE', name: 'Diageo', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'BATS', name: 'British American Tobacco', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'LSEG', name: 'London Stock Exchange Group', type: 'stock', sector: 'Financials' },
  { ticker: 'BHP', name: 'BHP Group', type: 'stock', sector: 'Materials' },
  { ticker: 'GLEN', name: 'Glencore', type: 'stock', sector: 'Materials' },
  { ticker: 'VOD', name: 'Vodafone', type: 'stock', sector: 'Communication Services' },
  { ticker: 'LLOY', name: 'Lloyds Banking', type: 'stock', sector: 'Financials' },
  { ticker: 'BARC', name: 'Barclays', type: 'stock', sector: 'Financials' },
  { ticker: 'TSCO', name: 'Tesco', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'PRU', name: 'Prudential', type: 'stock', sector: 'Financials' },
  { ticker: 'SSE', name: 'SSE', type: 'stock', sector: 'Utilities' },
  { ticker: 'NG', name: 'National Grid', type: 'stock', sector: 'Utilities' },
];

const SGX_STOCK_ASSETS: Asset[] = [
  { ticker: 'D05', name: 'DBS Group', type: 'stock', sector: 'Financials' },
  { ticker: 'O39', name: 'OCBC Bank', type: 'stock', sector: 'Financials' },
  { ticker: 'U11', name: 'United Overseas Bank', type: 'stock', sector: 'Financials' },
  { ticker: 'Z74', name: 'Singtel', type: 'stock', sector: 'Communication Services' },
  { ticker: 'BN4', name: 'Keppel', type: 'stock', sector: 'Industrials' },
  { ticker: 'C38U', name: 'CapitaLand Integrated', type: 'stock', sector: 'Real Estate' },
  { ticker: 'A17U', name: 'CapitaLand Ascendas REIT', type: 'stock', sector: 'Real Estate' },
  { ticker: 'C09', name: 'City Developments', type: 'stock', sector: 'Real Estate' },
  { ticker: 'G13', name: 'Genting Singapore', type: 'stock', sector: 'Consumer Discretionary' },
  { ticker: 'S58', name: 'SATS', type: 'stock', sector: 'Industrials' },
  { ticker: 'S68', name: 'Singapore Exchange', type: 'stock', sector: 'Financials' },
  { ticker: 'C6L', name: 'Singapore Airlines', type: 'stock', sector: 'Industrials' },
  { ticker: 'Y92', name: 'Thai Beverage', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'F34', name: 'Wilmar International', type: 'stock', sector: 'Consumer Staples' },
  { ticker: 'BS6', name: 'Yangzijiang Shipbuilding', type: 'stock', sector: 'Industrials' },
];

const HKSE_STOCK_ASSETS: Asset[] = [
  { ticker: '0700', name: 'Tencent', type: 'stock', sector: 'Communication Services' },
  { ticker: '9988', name: 'Alibaba', type: 'stock', sector: 'Consumer Discretionary' },
  { ticker: '0005', name: 'HSBC Holdings', type: 'stock', sector: 'Financials' },
  { ticker: '1299', name: 'AIA Group', type: 'stock', sector: 'Financials' },
  { ticker: '0941', name: 'China Mobile', type: 'stock', sector: 'Communication Services' },
  { ticker: '2318', name: 'Ping An Insurance', type: 'stock', sector: 'Financials' },
  { ticker: '0388', name: 'HK Exchanges', type: 'stock', sector: 'Financials' },
  { ticker: '0001', name: 'CK Hutchison', type: 'stock', sector: 'Industrials' },
  { ticker: '1398', name: 'ICBC', type: 'stock', sector: 'Financials' },
  { ticker: '3988', name: 'Bank of China', type: 'stock', sector: 'Financials' },
  { ticker: '2628', name: 'China Life', type: 'stock', sector: 'Financials' },
  { ticker: '0883', name: 'CNOOC', type: 'stock', sector: 'Energy' },
  { ticker: '1211', name: 'BYD Company', type: 'stock', sector: 'Consumer Discretionary' },
  { ticker: '9618', name: 'JD.com', type: 'stock', sector: 'Consumer Discretionary' },
  { ticker: '9999', name: 'NetEase', type: 'stock', sector: 'Communication Services' },
  { ticker: '3690', name: 'Meituan', type: 'stock', sector: 'Consumer Discretionary' },
  { ticker: '2020', name: 'ANTA Sports', type: 'stock', sector: 'Consumer Discretionary' },
  { ticker: '0857', name: 'PetroChina', type: 'stock', sector: 'Energy' },
  { ticker: '0688', name: 'China Overseas Land', type: 'stock', sector: 'Real Estate' },
  { ticker: '0016', name: 'Sun Hung Kai Properties', type: 'stock', sector: 'Real Estate' },
];

/** Stock assets by exchange. */
export function getStockAssets(exchange: string): Asset[] {
  switch (exchange.toUpperCase()) {
    case 'NSE': return NSE_STOCK_ASSETS;
    case 'NASDAQ': return NASDAQ_STOCK_ASSETS;
    case 'NYSE': return NYSE_STOCK_ASSETS;
    case 'LSE': return LSE_STOCK_ASSETS;
    case 'SGX': return SGX_STOCK_ASSETS;
    case 'HKSE': return HKSE_STOCK_ASSETS;
    default: return [];
  }
}

export const CURRENCY_ASSETS: Asset[] = [
  { ticker: 'USD/INR', name: 'US Dollar', type: 'currency' },
  { ticker: 'EUR/INR', name: 'Euro', type: 'currency' },
  { ticker: 'GBP/INR', name: 'British Pound', type: 'currency' },
  { ticker: 'JPY/INR', name: 'Japanese Yen', type: 'currency' },
  { ticker: 'AED/INR', name: 'UAE Dirham', type: 'currency' },
];

export const COMMODITY_ASSETS: Asset[] = [
  { ticker: 'Gold', name: 'Gold', type: 'commodity' },
  { ticker: 'Silver', name: 'Silver', type: 'commodity' },
  { ticker: 'Crude Oil', name: 'Crude Oil', type: 'commodity' },
  { ticker: 'Natural Gas', name: 'Natural Gas', type: 'commodity' },
  { ticker: 'Copper', name: 'Copper', type: 'commodity' },
];

export const ALL_ASSETS: Asset[] = [...NSE_STOCK_ASSETS, ...CURRENCY_ASSETS, ...COMMODITY_ASSETS];

export const ASSET_MAP = new Map(ALL_ASSETS.map((a) => [a.ticker, a]));

/** Build the full asset list for a given exchange (stocks + currencies + commodities). */
export function getAllAssets(exchange: string): Asset[] {
  return [...getStockAssets(exchange), ...CURRENCY_ASSETS, ...COMMODITY_ASSETS];
}

// ═══════════════════════════════════════════════════════════════
// Presets
// ═══════════════════════════════════════════════════════════════

export const QUICK_GROUPS = [
  { label: 'Banking', tickers: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK'] },
  { label: 'IT', tickers: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'] },
  { label: 'Oil & FX', tickers: ['ONGC', 'BPCL', 'RELIANCE', 'Crude Oil', 'USD/INR'] },
  { label: 'Metals', tickers: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'Gold', 'Silver'] },
];

const NASDAQ_QUICK_GROUPS = [
  { label: 'Big Tech', tickers: ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN'] },
  { label: 'Semis', tickers: ['NVDA', 'AMD', 'AVGO', 'QCOM', 'AMAT'] },
  { label: 'Software', tickers: ['CRM', 'ADBE', 'INTU', 'PYPL', 'NFLX'] },
];

const NYSE_QUICK_GROUPS = [
  { label: 'Banks', tickers: ['JPM', 'BAC', 'GS', 'V', 'MA'] },
  { label: 'Healthcare', tickers: ['JNJ', 'UNH', 'PFE'] },
  { label: 'Consumer', tickers: ['WMT', 'PG', 'KO', 'HD', 'DIS'] },
];

const LSE_QUICK_GROUPS = [
  { label: 'Energy', tickers: ['SHEL', 'BP'] },
  { label: 'Banks', tickers: ['HSBA', 'LLOY', 'BARC', 'PRU'] },
  { label: 'Mining', tickers: ['RIO', 'BHP', 'GLEN', 'AAL'] },
  { label: 'Consumer', tickers: ['ULVR', 'DGE', 'BATS', 'TSCO'] },
];

const SGX_QUICK_GROUPS = [
  { label: 'Banks', tickers: ['D05', 'O39', 'U11'] },
  { label: 'REITs', tickers: ['C38U', 'A17U', 'ME8U'] },
  { label: 'Industrials', tickers: ['BN4', 'S58', 'C6L', 'BS6'] },
];

const HKSE_QUICK_GROUPS = [
  { label: 'Tech', tickers: ['0700', '9988', '9618', '9999', '3690'] },
  { label: 'Banks', tickers: ['0005', '1398', '3988', '2318'] },
  { label: 'Energy', tickers: ['0883', '0857'] },
  { label: 'Consumer', tickers: ['1211', '2020'] },
];

/** Get quick groups for a given exchange. Falls back to NSE groups for unknown exchanges. */
export function getQuickGroups(exchange: string): { label: string; tickers: string[] }[] {
  switch (exchange.toUpperCase()) {
    case 'NASDAQ': return NASDAQ_QUICK_GROUPS;
    case 'NYSE': return NYSE_QUICK_GROUPS;
    case 'LSE': return LSE_QUICK_GROUPS;
    case 'SGX': return SGX_QUICK_GROUPS;
    case 'HKSE': return HKSE_QUICK_GROUPS;
    case 'NSE':
    default: return QUICK_GROUPS;
  }
}

export const WINDOWS = [
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '180D', value: '180d' },
  { label: '1Y', value: '365d' },
];

// ═══════════════════════════════════════════════════════════════
// Colors
// ═══════════════════════════════════════════════════════════════

export const TYPE_COLORS: Record<string, string> = {
  stock: '#4ADE80',
  currency: '#6EE7B7',
  commodity: '#FBBF24',
};

export const TYPE_GLOW: Record<string, string> = {
  stock: 'rgba(74, 222, 128, 0.6)',
  currency: 'rgba(110, 231, 183, 0.6)',
  commodity: 'rgba(251, 191, 36, 0.6)',
};

export const COMMUNITY_COLORS = [
  '#4ADE80', '#6EE7B7', '#FBBF24', '#F472B6', '#A78BFA',
  '#34D399', '#FB923C', '#818CF8', '#F87171', '#22D3EE',
];

// ═══════════════════════════════════════════════════════════════
// Correlation color scale & helpers
// ═══════════════════════════════════════════════════════════════

// Blue-Orange diverging palette (colorblind-safe: accessible for deuteranopia/protanopia)
export const corrColorScale = scaleLinear<string>()
  .domain([-1, -0.5, 0, 0.5, 1])
  .range(['#2563EB', '#60A5FA', '#475569', '#FB923C', '#EA580C'])
  .clamp(true);

export function corrColor(value: number): string {
  return corrColorScale(value);
}

export function corrStrength(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 0.8) return 'Very Strong';
  if (abs >= 0.6) return 'Strong';
  if (abs >= 0.4) return 'Moderate';
  if (abs >= 0.2) return 'Weak';
  return 'Very Weak';
}

// ═══════════════════════════════════════════════════════════════
// D3 Force graph types
// ═══════════════════════════════════════════════════════════════

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  type: 'stock' | 'currency' | 'commodity';
  name: string;
  radius: number;
}

export interface GraphLink {
  sourceId: string;
  targetId: string;
  correlation: number;
}

export interface SimLink extends SimulationLinkDatum<GraphNode> {
  sourceId: string;
  targetId: string;
  correlation: number;
}

export type CorrelationMethod = 'pearson' | 'spearman' | 'kendall';
export type ViewMode = 'network' | 'heatmap' | 'explorer';

export type AssetScope = 'equity' | 'cross_asset';
