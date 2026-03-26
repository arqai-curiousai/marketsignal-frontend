import type { LucideIcon } from 'lucide-react';
import { Globe, LineChart, Landmark, Wrench } from 'lucide-react';

/**
 * 7 NSE SEBI-approved forex pairs.
 * Data sourced from EODHD global OTC feed (not NSE exchange data).
 */
export const NSE_FOREX_PAIRS = [
  'USD/INR', 'EUR/INR', 'GBP/INR', 'JPY/INR',
  'EUR/USD', 'GBP/USD', 'USD/JPY',
] as const;

export const FOREX_TIMEFRAMES = ['1m', '5m', '15m', '1h', '1D'] as const;

export const FOREX_DISCLAIMER =
  'Global OTC indicative rates via EODHD. Not sourced from NSE exchange data. For reference only.';

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
