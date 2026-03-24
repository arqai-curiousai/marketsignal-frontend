/**
 * Monte Carlo Simulation Design Tokens
 *
 * Colorblind-safe palette: indigo fan bands, amber current price, pink target.
 * Extends the Pyramid design token pattern.
 */

// ─── Fan Chart Colors ────────────────────────────────────────────

export const MC_COLORS = {
  /** P5-P95 outermost band (lightest indigo) */
  fanBand90: 'rgba(99, 102, 241, 0.06)',
  /** P10-P90 mid band */
  fanBand75: 'rgba(99, 102, 241, 0.12)',
  /** P25-P75 innermost band (darkest indigo) */
  fanBand50: 'rgba(99, 102, 241, 0.20)',
  /** P50 median line */
  median: '#818CF8',
  /** Current price reference line (amber) */
  currentPrice: '#FBBF24',
  /** Target price reference line (pink) */
  target: '#EC4899',
  /** Ghost sample paths */
  ghostPath: 'rgba(255, 255, 255, 0.05)',
} as const;

// ─── Horizon Labels ──────────────────────────────────────────────

export const HORIZON_LABELS: Record<number, string> = {
  63: '3M',
  126: '6M',
  252: '1Y',
  504: '2Y',
};

export const HORIZON_OPTIONS = [63, 126, 252, 504] as const;
export type HorizonDays = (typeof HORIZON_OPTIONS)[number];

// ─── Formatters ──────────────────────────────────────────────────

export function fmtPrice(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtPct(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  const pct = value * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

export function fmtProb(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

/**
 * Convert probability to natural language "X in Y" fraction.
 * e.g. 0.75 → "3 in 4", 0.5 → "1 in 2", 0.33 → "1 in 3"
 */
export function fmtProbWords(value: number | null | undefined): string {
  if (value == null) return 'N/A';

  // Common fraction lookup for clean results
  const fractions: Array<[number, string]> = [
    [1.0, '1 in 1'],
    [0.95, '19 in 20'],
    [0.9, '9 in 10'],
    [0.875, '7 in 8'],
    [0.833, '5 in 6'],
    [0.8, '4 in 5'],
    [0.75, '3 in 4'],
    [0.667, '2 in 3'],
    [0.6, '3 in 5'],
    [0.5, '1 in 2'],
    [0.4, '2 in 5'],
    [0.333, '1 in 3'],
    [0.25, '1 in 4'],
    [0.2, '1 in 5'],
    [0.167, '1 in 6'],
    [0.125, '1 in 8'],
    [0.1, '1 in 10'],
    [0.05, '1 in 20'],
    [0.0, '0 in 1'],
  ];

  let bestMatch = fractions[0];
  let bestDiff = Math.abs(value - bestMatch[0]);

  for (const entry of fractions) {
    const diff = Math.abs(value - entry[0]);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestMatch = entry;
    }
  }

  return bestMatch[1];
}

// ─── Verdict Colors (for SimulationGauge hero) ──────────────────

export const MC_VERDICT = {
  bullish: {
    hex: '#4ADE80',
    rgb: '74, 222, 128',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: '0 0 20px rgba(74,222,128,0.15)',
    label: 'Bullish',
    particles: 10,
    particleSpeed: 0.8,
  },
  neutral: {
    hex: '#FBBF24',
    rgb: '251, 191, 36',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: '0 0 20px rgba(251,191,36,0.15)',
    label: 'Neutral',
    particles: 5,
    particleSpeed: 0.5,
  },
  bearish: {
    hex: '#FB7185',
    rgb: '251, 113, 133',
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: '0 0 24px rgba(251,113,133,0.2)',
    label: 'Bearish',
    particles: 12,
    particleSpeed: 1.2,
  },
} as const;

export type MCVerdictLevel = keyof typeof MC_VERDICT;

export function getVerdictConfig(verdict: string) {
  return MC_VERDICT[verdict as MCVerdictLevel] ?? MC_VERDICT.neutral;
}

// ─── Chart-Specific Colors ──────────────────────────────────────

export const DRAWDOWN_COLORS = {
  band: 'rgba(251,113,133,0.10)',
  median: '#FB7185',
  zero: 'rgba(255,255,255,0.06)',
} as const;

export const RISK_EVO_COLORS = {
  var: '#FBBF24',
  cvar: '#FB7185',
  probProfit: '#4ADE80',
  fill: 'rgba(251,113,133,0.08)',
} as const;

export const DIST_COLORS = {
  histogram: 'rgba(99,102,241,0.30)',
  kde: '#818CF8',
  normal: 'rgba(255,255,255,0.20)',
} as const;

export const HEATMAP_COLORS = {
  zero: 'transparent',
  low: 'rgba(99,102,241,0.1)',
  mid: 'rgba(99,102,241,0.4)',
  high: 'rgba(99,102,241,0.8)',
} as const;

// ─── Quality Formatters ─────────────────────────────────────────

export function fmtQuality(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Low';
}

export function qualityColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-indigo-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-rose-400';
}
