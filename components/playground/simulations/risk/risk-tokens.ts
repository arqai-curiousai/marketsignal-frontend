/**
 * Risk Score Design Tokens
 *
 * 5-zone colorblind-safe risk palette.
 * Extends the Pyramid + Simulation shared design token pattern.
 */

// ─── Risk Zone Colors ─────────────────────────────────────────

export const RISK_ZONES = {
  conservative: {
    hex: '#60A5FA',
    rgb: '96, 165, 250',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: '0 0 20px rgba(96, 165, 250, 0.15)',
    label: 'Conservative',
    rangeStart: 1,
    rangeEnd: 20,
  },
  moderate: {
    hex: '#34D399',
    rgb: '52, 211, 153',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: '0 0 20px rgba(52, 211, 153, 0.15)',
    label: 'Moderate',
    rangeStart: 21,
    rangeEnd: 40,
  },
  balanced: {
    hex: '#FBBF24',
    rgb: '251, 191, 36',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: '0 0 20px rgba(251, 191, 36, 0.15)',
    label: 'Balanced',
    rangeStart: 41,
    rangeEnd: 60,
  },
  aggressive: {
    hex: '#FB923C',
    rgb: '251, 146, 60',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: '0 0 20px rgba(251, 146, 60, 0.15)',
    label: 'Aggressive',
    rangeStart: 61,
    rangeEnd: 80,
  },
  speculative: {
    hex: '#F87171',
    rgb: '248, 113, 113',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: '0 0 24px rgba(248, 113, 113, 0.2)',
    label: 'Speculative',
    rangeStart: 81,
    rangeEnd: 99,
  },
} as const;

export type RiskZoneKey = keyof typeof RISK_ZONES;

// ─── Formatters ──────────────────────────────────────────────

export function fmtScore(score: number): string {
  return `${Math.round(score)}`;
}

export function fmtScoreFull(score: number): string {
  return `${Math.round(score)}/99`;
}

// ─── Lookup ──────────────────────────────────────────────────

export function getZoneConfig(zone: string): (typeof RISK_ZONES)[RiskZoneKey] {
  return RISK_ZONES[zone as RiskZoneKey] ?? RISK_ZONES.balanced;
}

export function getZoneForScore(score: number): (typeof RISK_ZONES)[RiskZoneKey] {
  const clamped = Math.max(1, Math.min(99, Math.round(score)));
  for (const zone of Object.values(RISK_ZONES)) {
    if (clamped >= zone.rangeStart && clamped <= zone.rangeEnd) {
      return zone;
    }
  }
  return RISK_ZONES.balanced;
}

// ─── Gauge Zone Configs ──────────────────────────────────────
// Particle counts and speeds per zone (scale with risk)

export const ZONE_PARTICLES: Record<RiskZoneKey, { count: number; speed: number }> = {
  conservative: { count: 3, speed: 0.3 },
  moderate: { count: 6, speed: 0.5 },
  balanced: { count: 8, speed: 0.7 },
  aggressive: { count: 12, speed: 1.0 },
  speculative: { count: 18, speed: 1.4 },
};

// ─── Sub-Score Colors ────────────────────────────────────────

export const SUB_SCORE_COLORS: Record<string, string> = {
  market_risk: '#60A5FA',
  concentration: '#A78BFA',
  volatility: '#FBBF24',
  tail_risk: '#F87171',
  liquidity: '#34D399',
  correlation: '#FB923C',
};

// ─── Benchmark Defaults ──────────────────────────────────────

export const DEFAULT_BENCHMARKS: Array<{ key: string; label: string; score: number }> = [
  { key: 'fd', label: 'FD', score: 5 },
  { key: 'ppf', label: 'PPF', score: 8 },
  { key: 'nifty50', label: 'NIFTY50', score: 42 },
  { key: 'midcap', label: 'Midcap', score: 58 },
  { key: 'smallcap', label: 'Smallcap', score: 72 },
  { key: 'btc', label: 'BTC', score: 88 },
];
