/**
 * Scenario Stress Lab design tokens and helpers.
 */

import { TAB_ACCENT } from '@/components/playground/simulations/shared/sim-tokens';

export const ACCENT = TAB_ACCENT.stress;

// ── Severity color for delta values ──

export function deltaColor(value: number): string {
  if (value < -0.05) return 'text-red-400';
  if (value < -0.01) return 'text-orange-400';
  if (value > 0.05) return 'text-emerald-400';
  if (value > 0.01) return 'text-green-400';
  return 'text-white/50';
}

export function deltaSign(value: number): string {
  return value >= 0 ? '+' : '';
}

export function fmtPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
}

export function fmtPctAbs(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
