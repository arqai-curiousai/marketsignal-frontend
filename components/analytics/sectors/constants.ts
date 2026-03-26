/** Sector dashboard shared constants, colors, and configuration. */

import { type ExchangeCode } from '@/lib/exchange/config';
import { formatMarketCap as exchangeFormatMarketCap } from '@/lib/exchange/formatting';

export { SECTOR_COLORS } from '@/types/analytics';

export type SectorViewMode = 'treemap' | 'heatmap' | 'table' | 'flow' | 'pyramid';

export const TIMEFRAMES = [
  { label: '1D', value: '1d' as const },
  { label: '1W', value: '1w' as const },
  { label: '1M', value: '1m' as const },
  { label: '3M', value: '3m' as const },
  { label: '6M', value: '6m' as const },
  { label: 'YTD', value: 'ytd' as const },
] as const;

export const SORT_OPTIONS = [
  { label: 'Performance', value: 'performance' as const },
  { label: 'Market Cap', value: 'market_cap' as const },
  { label: 'Momentum', value: 'momentum' as const },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

/** Standardized decimal precision for consistent number display. */
export const PRECISION = {
  pe: 1,
  pb: 1,
  dy: 2,
  roe: 1,
  ev_ebitda: 1,
  change_pct: 2,
  momentum: 0,
  correlation: 3,
  sharpe: 2,
  beta: 2,
  market_cap_cr: 0,
} as const;

export const RRG_QUADRANT_COLORS: Record<string, string> = {
  leading: '#10B981',
  weakening: '#F59E0B',
  lagging: '#EF4444',
  improving: '#3B82F6',
};

export const RRG_QUADRANT_LABELS: Record<string, string> = {
  leading: 'Leading',
  weakening: 'Weakening',
  lagging: 'Lagging',
  improving: 'Improving',
};

/** Check if colorblind mode is active (persisted in localStorage). */
export function isColorblindMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('sector-colorblind') === '1';
}

export function toggleColorblindMode(): boolean {
  if (typeof window === 'undefined') return false;
  const next = !isColorblindMode();
  localStorage.setItem('sector-colorblind', next ? '1' : '0');
  return next;
}

/** Diverging color scale: red → gray → green (or orange → gray → blue in CB mode). */
export function perfColor(pct: number, alpha: number = 1): string {
  const cb = isColorblindMode();
  if (pct > 0) {
    const intensity = Math.min(pct / 3, 1);
    // Green (default) or Blue (colorblind)
    return cb
      ? `rgba(59, 130, 246, ${(0.15 + intensity * 0.6) * alpha})`
      : `rgba(16, 185, 129, ${(0.15 + intensity * 0.6) * alpha})`;
  }
  if (pct < 0) {
    const intensity = Math.min(Math.abs(pct) / 3, 1);
    // Red (default) or Orange (colorblind)
    return cb
      ? `rgba(249, 115, 22, ${(0.15 + intensity * 0.6) * alpha})`
      : `rgba(239, 68, 68, ${(0.15 + intensity * 0.6) * alpha})`;
  }
  return `rgba(148, 163, 184, ${0.15 * alpha})`;
}

/** Text color class for performance values. */
export function perfTextClass(pct: number): string {
  const cb = isColorblindMode();
  if (pct > 0.01) return cb ? 'text-blue-400' : 'text-emerald-400';
  if (pct < -0.01) return cb ? 'text-orange-400' : 'text-red-400';
  return 'text-muted-foreground';
}

/** Format market cap values compactly, exchange-aware. */
export function formatMarketCap(val: number | null, exchange: ExchangeCode = 'NSE'): string {
  if (val == null) return '—';
  return exchangeFormatMarketCap(val, exchange);
}

/** Format volume compactly. */
export function formatVolume(val: number | null): string {
  if (val == null) return '—';
  if (val >= 1e7) return `${(val / 1e7).toFixed(1)}Cr`;
  if (val >= 1e5) return `${(val / 1e5).toFixed(1)}L`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toLocaleString();
}

/** Mansfield RS stage colors and labels. */
export const MANSFIELD_STAGE_COLORS: Record<string, string> = {
  Basing: '#3B82F6',
  Advancing: '#10B981',
  Topping: '#F59E0B',
  Declining: '#EF4444',
};

export const MANSFIELD_STAGE_LABELS: Record<string, string> = {
  Basing: 'Stage 1 — Basing',
  Advancing: 'Stage 2 — Advancing',
  Topping: 'Stage 3 — Topping',
  Declining: 'Stage 4 — Declining',
};

/** Flow gauge color: red (distribution) → gray (neutral) → green (accumulation). */
export function flowColor(score: number): string {
  const cb = isColorblindMode();
  if (score > 30) return cb ? '#3B82F6' : '#10B981';
  if (score < -30) return cb ? '#F97316' : '#EF4444';
  return '#94A3B8';
}

/** Seasonality cell color: diverging red-white-green for monthly returns. */
export function seasonalityColor(pct: number): string {
  if (pct > 0) {
    const intensity = Math.min(Math.abs(pct) / 4, 1);
    return `rgba(16, 185, 129, ${0.15 + intensity * 0.55})`;
  }
  if (pct < 0) {
    const intensity = Math.min(Math.abs(pct) / 4, 1);
    return `rgba(239, 68, 68, ${0.15 + intensity * 0.55})`;
  }
  return 'rgba(148, 163, 184, 0.1)';
}

/** Month name abbreviation. */
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
