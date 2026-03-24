/**
 * Factor Lens design tokens.
 */

import { TAB_ACCENT } from '@/components/playground/simulations/shared/sim-tokens';

export const ACCENT = TAB_ACCENT.factor;

// ── Factor colors for charts and badges ──

export const FACTOR_COLORS: Record<string, string> = {
  value: '#60A5FA',       // blue-400
  momentum: '#34D399',    // emerald-400
  quality: '#A78BFA',     // violet-400
  size: '#FBBF24',        // amber-400
  low_volatility: '#F87171', // red-400
};

export const FACTOR_TEXT_COLORS: Record<string, string> = {
  value: 'text-blue-400',
  momentum: 'text-emerald-400',
  quality: 'text-violet-400',
  size: 'text-amber-400',
  low_volatility: 'text-red-400',
};

export function tiltDelta(portfolio: number, benchmark: number): string {
  const diff = portfolio - benchmark;
  if (diff > 10) return 'text-emerald-400';
  if (diff > 5) return 'text-green-400';
  if (diff < -10) return 'text-red-400';
  if (diff < -5) return 'text-orange-400';
  return 'text-white/50';
}
