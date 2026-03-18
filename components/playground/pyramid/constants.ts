/**
 * Playground Pyramid Constants
 *
 * Layer definitions, static configuration, and geometry constants
 * for the multi-layer strategy pipeline visualization.
 */

import type { ILayerDefinition } from '@/types/strategy';

// ─── Layer Definitions ──────────────────────────────────────────────

export const LAYERS: ILayerDefinition[] = [
  {
    id: 'technical',
    name: 'Technical Intelligence',
    shortName: 'Technical',
    description: 'Pattern detection, order flow, regime classification',
    order: 1,
    featureCount: 35,
  },
  {
    id: 'fundamental',
    name: 'Fundamental & Macro',
    shortName: 'Fundamental',
    description: 'F&O analytics, earnings, sector analysis, FII/DII',
    order: 2,
    featureCount: 25,
  },
  {
    id: 'sentiment',
    name: 'Sentiment & News',
    shortName: 'Sentiment',
    description: 'News sentiment, market mood, impact analysis',
    order: 3,
    featureCount: 10,
  },
  {
    id: 'ensemble',
    name: 'Signal Ensemble',
    shortName: 'Ensemble',
    description: 'XGBoost + LightGBM combining all features',
    order: 4,
    featureCount: 72,
  },
  {
    id: 'risk',
    name: 'Risk & Position Sizing',
    shortName: 'Risk',
    description: 'Quarter-Kelly sizing, regime adjustment, confidence',
    order: 5,
    featureCount: 0,
  },
];

// ─── Timing ─────────────────────────────────────────────────────────

export const REFRESH_INTERVAL_MS = 30_000;
export const PIPELINE_INTERVAL_MS = 300_000; // 5 minutes

// ─── Pyramid Geometry ───────────────────────────────────────────────
// Proportional widths and heights for SVG rendering (bottom to top)

export const PYRAMID_LAYER_WIDTHS = [0.90, 0.72, 0.56, 0.40, 0.24];
export const PYRAMID_LAYER_HEIGHTS = [0.24, 0.22, 0.20, 0.18, 0.16];

// ─── NIFTY 50 Tickers ──────────────────────────────────────────────

export const NIFTY50_TICKERS = [
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
  'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BEL', 'BPCL',
  'BHARTIARTL', 'BRITANNIA', 'CIPLA', 'COALINDIA', 'DRREDDY',
  'EICHERMOT', 'ETERNAL', 'GRASIM', 'HCLTECH', 'HDFCBANK',
  'HDFCLIFE', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'ITC',
  'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LT',
  'M&M', 'MARUTI', 'NTPC', 'NESTLEIND', 'ONGC',
  'POWERGRID', 'RELIANCE', 'SBILIFE', 'SHRIRAMFIN', 'SBIN',
  'SUNPHARMA', 'TCS', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL',
  'TECHM', 'TITAN', 'TRENT', 'ULTRACEMCO', 'WIPRO',
];
