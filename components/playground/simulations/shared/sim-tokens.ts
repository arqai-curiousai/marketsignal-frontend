/**
 * Shared Simulation Lab Design Tokens
 *
 * Tab accent colors and animation constants for all simulation tabs.
 * Extends the Pyramid design token pattern (T, S, L).
 */

import { formatNumber, getCurrencySymbol } from '@/src/lib/exchange/formatting';

// ─── Tab Accent Colors ──────────────────────────────────────────

export const TAB_ACCENT = {
  portfolio: {
    hex: '#FBBF24',
    rgb: '251, 191, 36',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: '0 0 20px rgba(251, 191, 36, 0.15)',
  },
  backtest: {
    hex: '#818CF8',
    rgb: '129, 140, 248',
    text: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    glow: '0 0 20px rgba(129, 140, 248, 0.15)',
  },
  risk: {
    hex: '#F87171',
    rgb: '248, 113, 113',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: '0 0 20px rgba(248, 113, 113, 0.15)',
  },
  stress: {
    hex: '#FB923C',
    rgb: '251, 146, 60',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: '0 0 20px rgba(251, 146, 60, 0.15)',
  },
  factor: {
    hex: '#A78BFA',
    rgb: '167, 139, 250',
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: '0 0 20px rgba(167, 139, 250, 0.15)',
  },
  contagion: {
    hex: '#22D3EE',
    rgb: '34, 211, 238',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: '0 0 20px rgba(34, 211, 238, 0.15)',
  },
} as const;

// ─── Animation Constants ────────────────────────────────────────

export const ANIM = {
  /** Standard mount animation */
  mount: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  },
  /** Standard exit animation */
  exit: {
    opacity: 0,
    y: -8,
  },
  /** Standard spring config */
  spring: {
    stiffness: 120,
    damping: 18,
  },
  /** Snappy spring for gauges */
  springGauge: {
    stiffness: 80,
    damping: 20,
  },
  /** Wobble spring (lower damping for visible oscillation) */
  springWobble: {
    stiffness: 80,
    damping: 12,
  },
  /** Stagger delay between siblings */
  stagger: 0.05,
  /** Chart draw duration range */
  chartDraw: { min: 800, max: 1200 },
  /** Idle breathing cycle range */
  breathing: { min: 2500, max: 4000 },
} as const;

// ─── Shared Formatters ──────────────────────────────────────────

export function fmtPercentAbs(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

export function fmtDecimal(value: number | null | undefined, digits: number = 2): string {
  if (value == null) return 'N/A';
  return value.toFixed(digits);
}

export function fmtCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return `${getCurrencySymbol()}${formatNumber(value, 'NSE', { maximumFractionDigits: 0 })}`;
}

