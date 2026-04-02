import type { LucideIcon } from 'lucide-react';
import { Globe, LineChart, Landmark, Wrench, Radar } from 'lucide-react';

/**
 * 7 NSE SEBI-approved forex pairs (India jurisdiction).
 */
export const NSE_FOREX_PAIRS = [
  'USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR',
  'EUR/USD', 'GBP/USD', 'USD/JPY',
] as const;

/**
 * All 42 forex pairs — global coverage across 17 currencies.
 */
export const ALL_FOREX_PAIRS = [
  // INR
  'USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR',
  // Majors
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'NZD/USD',
  // EUR crosses
  'EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD',
  // GBP crosses
  'GBP/JPY', 'GBP/CHF', 'GBP/AUD', 'GBP/CAD', 'GBP/NZD',
  // Other crosses
  'AUD/JPY', 'AUD/NZD', 'AUD/CAD', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY',
  // Scandinavian
  'USD/SEK', 'USD/NOK', 'EUR/SEK', 'EUR/NOK',
  // Asia-Pacific
  'USD/SGD', 'USD/HKD', 'USD/CNH', 'EUR/SGD', 'GBP/SGD', 'SGD/JPY',
  // Emerging markets
  'USD/MXN', 'USD/ZAR', 'USD/TRY', 'EUR/TRY',
] as const;

export const FOREX_PAIR_CATEGORIES = {
  inr: ['USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR'],
  majors: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'NZD/USD'],
  crosses_eur: ['EUR/GBP', 'EUR/JPY', 'EUR/CHF', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD'],
  crosses_gbp: ['GBP/JPY', 'GBP/CHF', 'GBP/AUD', 'GBP/CAD', 'GBP/NZD'],
  crosses_other: ['AUD/JPY', 'AUD/NZD', 'AUD/CAD', 'CAD/JPY', 'CHF/JPY', 'NZD/JPY'],
  scandinavian: ['USD/SEK', 'USD/NOK', 'EUR/SEK', 'EUR/NOK'],
  asia_pacific: ['USD/SGD', 'USD/HKD', 'USD/CNH', 'EUR/SGD', 'GBP/SGD', 'SGD/JPY'],
  emerging: ['USD/MXN', 'USD/ZAR', 'USD/TRY', 'EUR/TRY'],
} as const;

/**
 * Simplified filter categories for UI pills (ticker strip, pair selector).
 */
export type ForexFilterCategory = 'all' | 'majors' | 'inr' | 'crosses' | 'exotics';

export const FOREX_FILTER_CATEGORIES: { id: ForexFilterCategory; label: string; count: number }[] = [
  { id: 'all', label: 'All', count: 42 },
  { id: 'majors', label: 'Majors', count: 7 },
  { id: 'inr', label: 'INR', count: 4 },
  { id: 'crosses', label: 'Crosses', count: 17 },
  { id: 'exotics', label: 'Exotics', count: 14 },
];

/** Map filter category → pairs */
export function getPairsForCategory(cat: ForexFilterCategory): readonly string[] {
  switch (cat) {
    case 'majors':
      return FOREX_PAIR_CATEGORIES.majors;
    case 'inr':
      return FOREX_PAIR_CATEGORIES.inr;
    case 'crosses':
      return [
        ...FOREX_PAIR_CATEGORIES.crosses_eur,
        ...FOREX_PAIR_CATEGORIES.crosses_gbp,
        ...FOREX_PAIR_CATEGORIES.crosses_other,
      ];
    case 'exotics':
      return [
        ...FOREX_PAIR_CATEGORIES.scandinavian,
        ...FOREX_PAIR_CATEGORIES.asia_pacific,
        ...FOREX_PAIR_CATEGORIES.emerging,
      ];
    default:
      return ALL_FOREX_PAIRS;
  }
}

/** Pair → human-readable sub-group label (for categorized pair selector) */
export const PAIR_CATEGORY_LABELS: Record<string, string> = {
  ...Object.fromEntries(FOREX_PAIR_CATEGORIES.inr.map(p => [p, 'INR'])),
  ...Object.fromEntries(FOREX_PAIR_CATEGORIES.majors.map(p => [p, 'Majors'])),
  ...Object.fromEntries(FOREX_PAIR_CATEGORIES.crosses_eur.map(p => [p, 'EUR Crosses'])),
  ...Object.fromEntries(FOREX_PAIR_CATEGORIES.crosses_gbp.map(p => [p, 'GBP Crosses'])),
  ...Object.fromEntries(FOREX_PAIR_CATEGORIES.crosses_other.map(p => [p, 'Commodity Crosses'])),
  ...Object.fromEntries(FOREX_PAIR_CATEGORIES.scandinavian.map(p => [p, 'Scandinavian'])),
  ...Object.fromEntries(FOREX_PAIR_CATEGORIES.asia_pacific.map(p => [p, 'Asia-Pacific'])),
  ...Object.fromEntries(FOREX_PAIR_CATEGORIES.emerging.map(p => [p, 'Emerging Markets'])),
};

/** Heatmap matrix modes */
export type HeatmapMode = 'g10' | 'full' | 'exotics';
export const HEATMAP_MODES: { id: HeatmapMode; label: string; tooltip: string }[] = [
  { id: 'g10', label: 'G10', tooltip: '10 G10 currencies' },
  { id: 'full', label: 'Full', tooltip: 'All 17 currencies' },
  { id: 'exotics', label: 'Exotics', tooltip: 'USD vs exotic currencies' },
];

export const FOREX_TIMEFRAMES = ['1m', '5m', '15m', '1h', '1D'] as const;

export const FOREX_DISCLAIMER =
  '42 global OTC indicative rates across 17 currencies via EODHD. Not sourced from any exchange. For reference and educational purposes only.';

/* ─── Module System (Tableau-quality dashboard) ─────────────────────────── */

export interface ForexModule {
  id: string;
  label: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accentFrom: string;
  accentTo: string;
  glowColor: string;
  borderColor: string;
}

export const FOREX_MODULES: ForexModule[] = [
  {
    id: 'markets',
    label: 'Markets',
    tagline: 'Live Overview',
    description: 'Cross-rates heatmap, currency strength & session activity',
    icon: Globe,
    accentFrom: '#7DD3FC',
    accentTo: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  {
    id: 'analysis',
    label: 'Analysis',
    tagline: 'Deep Technicals',
    description: 'Candlestick charts, indicators, volatility & session breakdown',
    icon: LineChart,
    accentFrom: '#A78BFA',
    accentTo: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.35)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  {
    id: 'macro',
    label: 'Macro',
    tagline: 'Rates & Calendar',
    description: 'Central bank policy rates, carry trade & economic events',
    icon: Landmark,
    accentFrom: '#FDE68A',
    accentTo: '#FBBF24',
    glowColor: 'rgba(251, 191, 36, 0.35)',
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  {
    id: 'patterns',
    label: 'Patterns',
    tagline: 'Scanner',
    description: 'Cross-pair pattern scanner with confluence grading',
    icon: Radar,
    accentFrom: '#F0ABFC',
    accentTo: '#D946EF',
    glowColor: 'rgba(217, 70, 239, 0.35)',
    borderColor: 'rgba(217, 70, 239, 0.2)',
  },
  {
    id: 'tools',
    label: 'Tools',
    tagline: 'Pip & Sizing',
    description: 'Pip value calculator, position size & risk management',
    icon: Wrench,
    accentFrom: '#6EE7B7',
    accentTo: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
];

export const FOREX_VALID_MODULE_IDS = new Set(FOREX_MODULES.map(m => m.id));
