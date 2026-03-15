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

export const STOCK_ASSETS: Asset[] = [
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

export const ALL_ASSETS: Asset[] = [...STOCK_ASSETS, ...CURRENCY_ASSETS, ...COMMODITY_ASSETS];

export const ASSET_MAP = new Map(ALL_ASSETS.map((a) => [a.ticker, a]));

// ═══════════════════════════════════════════════════════════════
// Presets
// ═══════════════════════════════════════════════════════════════

export const QUICK_GROUPS = [
  { label: 'Banking', tickers: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK'] },
  { label: 'IT', tickers: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'] },
  { label: 'Oil & FX', tickers: ['ONGC', 'BPCL', 'RELIANCE', 'Crude Oil', 'USD/INR'] },
  { label: 'Metals', tickers: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'Gold', 'Silver'] },
];

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
