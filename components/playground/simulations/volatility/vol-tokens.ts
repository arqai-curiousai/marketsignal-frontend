/**
 * Volatility Intelligence Design Tokens
 *
 * Colorblind-safe regime palette (no red/green).
 * Extends the Pyramid design token pattern.
 */

// ─── Regime Colors (colorblind-safe) ──────────────────────────────
// Avoid red/green — uses emerald → amber → orange → rose scale

export const VOL_REGIME = {
  calm: {
    hex: '#4ADE80',
    rgb: '74, 222, 128',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: '0 0 20px rgba(74, 222, 128, 0.15)',
    label: 'Calm Seas',
    particles: 3,
    particleSpeed: 0.3,
  },
  moderate: {
    hex: '#FBBF24',
    rgb: '251, 191, 36',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: '0 0 20px rgba(251, 191, 36, 0.15)',
    label: 'Choppy Waters',
    particles: 6,
    particleSpeed: 0.6,
  },
  storm: {
    hex: '#F97316',
    rgb: '249, 115, 22',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: '0 0 20px rgba(249, 115, 22, 0.15)',
    label: 'Storm Warning',
    particles: 10,
    particleSpeed: 1.0,
  },
  hurricane: {
    hex: '#FB7185',
    rgb: '251, 113, 133',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: '0 0 24px rgba(251, 113, 133, 0.2)',
    label: 'Hurricane Alert',
    particles: 14,
    particleSpeed: 1.5,
  },
} as const;

import type { VolRegimeLevel } from '@/types/simulation';
export type { VolRegimeLevel };

// ─── Cone / Chart Colors ──────────────────────────────────────────

export const CONE_COLORS = {
  /** P10-P90 outermost band */
  outer: 'rgba(99, 102, 241, 0.06)',
  /** P25-P75 inner band */
  inner: 'rgba(99, 102, 241, 0.14)',
  /** P50 median line */
  median: 'rgba(148, 163, 184, 0.5)',
  /** Current vol line / dots */
  current: '#818CF8',
  /** Current vol glow when outside normal */
  currentGlow: '0 0 8px rgba(129, 140, 248, 0.5)',
} as const;

// ─── Estimator Colors (for comparison bars) ───────────────────────

export const ESTIMATOR_COLORS: Record<string, string> = {
  close_to_close: '#94A3B8',
  parkinson: '#60A5FA',
  garman_klass: '#818CF8',
  rogers_satchell: '#A78BFA',
  yang_zhang: '#C084FC',
};

// ─── GARCH Forecast Colors ────────────────────────────────────────

export const GARCH_COLORS = {
  meanLine: '#818CF8',
  band68: 'rgba(129, 140, 248, 0.18)',
  band95: 'rgba(129, 140, 248, 0.07)',
} as const;

// ─── Shared formatters ───────────────────────────────────────────

export function fmtVol(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

export function fmtPctl(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return `P${Math.round(value * 100)}`;
}

export function getRegimeConfig(regime: VolRegimeLevel | string) {
  return VOL_REGIME[regime as VolRegimeLevel] ?? VOL_REGIME.moderate;
}
