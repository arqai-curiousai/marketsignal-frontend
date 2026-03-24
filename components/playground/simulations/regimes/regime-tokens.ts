/**
 * Regime Detection Design Tokens
 *
 * Colorblind-safe palette: Growth (amber), Neutral (slate), Contraction (blue).
 * Extends the Pyramid design token pattern.
 */

import type { RegimeLabel } from '@/types/simulation';

// ─── Regime Colors (colorblind-safe) ──────────────────────────────
// Avoids red/green — uses amber / slate / blue scale

export const REGIME_COLORS = {
  growth: {
    hex: '#FBBF24',
    rgb: '251, 191, 36',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: '0 0 20px rgba(251, 191, 36, 0.15)',
    label: 'Growth',
  },
  neutral: {
    hex: '#64748B',
    rgb: '100, 116, 139',
    text: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    glow: '0 0 20px rgba(100, 116, 139, 0.15)',
    label: 'Neutral',
  },
  contraction: {
    hex: '#3B82F6',
    rgb: '59, 130, 246',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: '0 0 20px rgba(59, 130, 246, 0.15)',
    label: 'Contraction',
  },
} as const;

export type RegimeColorConfig = (typeof REGIME_COLORS)[RegimeLabel];

// ─── Helpers ──────────────────────────────────────────────────────

export function getRegimeColor(label: RegimeLabel): RegimeColorConfig {
  return REGIME_COLORS[label] ?? REGIME_COLORS.neutral;
}

export function fmtReturn(value: number | null | undefined): string {
  if (value == null) return '\u2014';
  const pct = value * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function fmtProb(value: number | null | undefined): string {
  if (value == null) return '\u2014';
  return `${(value * 100).toFixed(1)}%`;
}

export function fmtDays(value: number | null | undefined): string {
  if (value == null) return '\u2014';
  return `${Math.round(value)} days`;
}
