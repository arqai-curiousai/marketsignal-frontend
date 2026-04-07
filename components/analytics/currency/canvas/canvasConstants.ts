/**
 * Shared constants for all forex dashboard canvas components.
 * Colors, fonts, and sizing that maintain zen aesthetic consistency.
 */

/* ── Session Colors (matching landing page) ── */
export const SESSION_COLORS = {
  sydney: 'rgba(167, 139, 250, 1)',    // purple
  tokyo: 'rgba(248, 113, 113, 1)',      // red
  asia: 'rgba(110, 231, 183, 1)',       // emerald (generic Asia)
  london: 'rgba(96, 165, 250, 1)',      // blue
  newyork: 'rgba(251, 191, 36, 1)',     // amber
  nse: 'rgba(251, 191, 36, 0.6)',       // amber faint
} as const;

export const SESSION_FAINT = {
  sydney: 'rgba(167, 139, 250, 0.15)',
  tokyo: 'rgba(248, 113, 113, 0.15)',
  asia: 'rgba(110, 231, 183, 0.15)',
  london: 'rgba(96, 165, 250, 0.15)',
  newyork: 'rgba(251, 191, 36, 0.15)',
} as const;

/* ── Strength / Change Colors (colorblind-safe blue-orange) ── */
export const POSITIVE_COLOR = 'rgba(96, 165, 250, 1)';   // sky-400
export const NEGATIVE_COLOR = 'rgba(251, 146, 60, 1)';    // orange-400
export const NEUTRAL_COLOR = 'rgba(148, 163, 184, 1)';    // slate-400
export const BULLISH_COLOR = 'rgba(52, 211, 153, 1)';     // emerald-400
export const BEARISH_COLOR = 'rgba(248, 113, 113, 1)';    // red-400

/* ── Canvas Fonts (must match loaded web fonts) ── */
export const FONT_CODE = '600 11px Sora, system-ui, sans-serif';
export const FONT_CODE_SM = '600 9px Sora, system-ui, sans-serif';
export const FONT_LABEL = '500 9px Sora, system-ui, sans-serif';
export const FONT_VALUE = '400 10px Inter, system-ui, sans-serif';
export const FONT_VALUE_SM = '400 8px Inter, system-ui, sans-serif';
export const FONT_HEADER = '600 10px Sora, system-ui, sans-serif';
export const FONT_TICKER = '500 10px Inter, system-ui, sans-serif';

/* ── Canvas Fonts for mobile ── */
export const FONT_CODE_MOBILE = '600 8px Sora, system-ui, sans-serif';
export const FONT_VALUE_MOBILE = '400 8px Inter, system-ui, sans-serif';

/* ── Panel surface / glow ── */
export const PANEL_BG = 'rgba(255, 255, 255, 0.03)';
export const PANEL_BORDER = 'rgba(255, 255, 255, 0.06)';
export const GLOW_AMBIENT = 0.04;
export const GLOW_FOCUS = 0.12;

/* ── Animation rates ── */
export const BREATHE_SPEED = 0.002;
export const PARTICLE_BASE_SPEED = 0.003;
export const SONAR_CYCLE_MS = 5000;

/* ── Currency tiers (for constellation layout) ── */
export const TIER_RADIUS = { major: 14, minor: 10, exotic: 7 } as const;
export const TIER_RADIUS_MOBILE = { major: 10, minor: 7, exotic: 5 } as const;
export const TIER_RING = { major: 0.35, minor: 0.6, exotic: 0.85 } as const;

/* ── Currency definitions for constellation ── */
export type CurrencyTier = 'major' | 'minor' | 'exotic';
export type SessionKey = 'asia' | 'london' | 'newyork';

export interface CurrencyDef {
  code: string;
  name: string;
  tier: CurrencyTier;
  session: SessionKey;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'USD', name: 'US Dollar', tier: 'major', session: 'newyork' },
  { code: 'EUR', name: 'Euro', tier: 'major', session: 'london' },
  { code: 'GBP', name: 'British Pound', tier: 'major', session: 'london' },
  { code: 'JPY', name: 'Japanese Yen', tier: 'major', session: 'asia' },
  { code: 'CHF', name: 'Swiss Franc', tier: 'major', session: 'london' },
  { code: 'AUD', name: 'Australian Dollar', tier: 'major', session: 'asia' },
  { code: 'CAD', name: 'Canadian Dollar', tier: 'major', session: 'newyork' },
  { code: 'NZD', name: 'New Zealand Dollar', tier: 'minor', session: 'asia' },
  { code: 'INR', name: 'Indian Rupee', tier: 'minor', session: 'asia' },
  { code: 'SEK', name: 'Swedish Krona', tier: 'minor', session: 'london' },
  { code: 'NOK', name: 'Norwegian Krone', tier: 'minor', session: 'london' },
  { code: 'SGD', name: 'Singapore Dollar', tier: 'minor', session: 'asia' },
  { code: 'HKD', name: 'Hong Kong Dollar', tier: 'minor', session: 'asia' },
  { code: 'CNH', name: 'Chinese Yuan', tier: 'exotic', session: 'asia' },
  { code: 'MXN', name: 'Mexican Peso', tier: 'exotic', session: 'newyork' },
  { code: 'ZAR', name: 'South African Rand', tier: 'exotic', session: 'london' },
  { code: 'TRY', name: 'Turkish Lira', tier: 'exotic', session: 'london' },
];

export const CURRENCIES_MOBILE: CurrencyDef[] = CURRENCIES.filter(
  c => c.tier === 'major' || c.code === 'INR',
);

/* ── Heatmap color mapping (matches existing changePctToColor) ── */
export function changePctToHsl(changePct: number): string {
  const clamped = Math.max(-2, Math.min(2, changePct));
  const intensity = Math.abs(clamped) / 2;
  if (Math.abs(clamped) < 0.001) return 'hsl(0, 0%, 20%)';
  const lightness = 85 - intensity * 50;
  return clamped > 0 ? `hsl(210, 80%, ${lightness}%)` : `hsl(30, 80%, ${lightness}%)`;
}

/* ── Pattern radar categories ── */
export const RADAR_CATEGORIES = [
  'Majors', 'INR', 'EUR Crosses', 'GBP Crosses',
  'Commodity', 'Scandinavian', 'Asia-Pac', 'Emerging',
] as const;
