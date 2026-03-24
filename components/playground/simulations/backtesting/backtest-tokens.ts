/**
 * Backtesting Engine Design Tokens
 *
 * Strategy palette, traffic light risk indicators, and formatters.
 * Extends the Pyramid design token pattern.
 */

// ─── Strategy Colors ─────────────────────────────────────────────

export const STRATEGY_COLORS: Record<string, { hex: string; dashed?: boolean }> = {
  momentum: { hex: '#FBBF24' },
  mean_reversion: { hex: '#60A5FA' },
  trend_following: { hex: '#A78BFA' },
  vol_target: { hex: '#34D399' },
  buy_hold: { hex: '#94A3B8', dashed: true },
};

export function strategyHex(name: string): string {
  return STRATEGY_COLORS[name]?.hex ?? '#94A3B8';
}

export function strategyDashed(name: string): boolean {
  return STRATEGY_COLORS[name]?.dashed ?? false;
}

// ─── Traffic Light (Overfitting Risk) ────────────────────────────

export const TRAFFIC_LIGHT = {
  green: {
    hex: '#4ADE80',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    label: 'Low Risk',
  },
  yellow: {
    hex: '#FBBF24',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    label: 'Moderate Risk',
  },
  red: {
    hex: '#FB7185',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    label: 'High Risk',
  },
} as const;

export type TrafficLightLevel = keyof typeof TRAFFIC_LIGHT;

export function getTrafficConfig(level: TrafficLightLevel | string) {
  return TRAFFIC_LIGHT[level as TrafficLightLevel] ?? TRAFFIC_LIGHT.yellow;
}

// ─── Formatters ──────────────────────────────────────────────────

export function fmtReturn(value: number | null | undefined): string {
  if (value == null) return '\u2014';
  const pct = value * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function fmtSharpe(value: number | null | undefined): string {
  if (value == null) return '\u2014';
  return value.toFixed(2);
}

export function fmtPct(value: number | null | undefined): string {
  if (value == null) return '\u2014';
  return `${(value * 100).toFixed(1)}%`;
}

export function fmtCurrency(value: number | null | undefined): string {
  if (value == null) return '\u2014';
  return `\u20B9${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
