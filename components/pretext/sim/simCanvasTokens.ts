/**
 * Shared color and font tokens for simulation dashboard canvases.
 * All canvas drawing functions should reference these instead of inline values.
 */

/* ── Canvas colors (designed for dark backgrounds) ── */

export const SIM_COLORS = {
  emerald: 'rgba(110, 231, 183, 1)',   // positive / growth / profit
  rose: 'rgba(248, 113, 113, 1)',      // negative / risk / loss
  violet: 'rgba(167, 139, 250, 1)',    // primary accent / selected
  blue: 'rgba(129, 140, 248, 1)',      // secondary / info
  amber: 'rgba(251, 191, 36, 1)',      // warning / caution / neutral
  indigo: 'rgba(99, 102, 241, 1)',     // deep secondary
  orange: 'rgba(251, 146, 60, 1)',     // warm accent
  white: 'rgba(255, 255, 255, 1)',
} as const;

/* ── Text hierarchy on canvas ── */

export const SIM_TEXT = {
  primary: 'rgba(255, 255, 255, 0.85)',
  secondary: 'rgba(255, 255, 255, 0.50)',
  muted: 'rgba(255, 255, 255, 0.25)',
  ghost: 'rgba(255, 255, 255, 0.10)',
} as const;

/* ── Canvas backgrounds ── */

export const SIM_BG = {
  card: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.06)',
  cardHover: 'rgba(255, 255, 255, 0.05)',
} as const;

/* ── Canvas fonts (Sora for display, JetBrains Mono for numbers) ── */

export const SIM_FONTS = {
  hero: '700 48px Sora, system-ui, sans-serif',
  heroMobile: '700 36px Sora, system-ui, sans-serif',
  value: '700 16px Sora, system-ui, sans-serif',
  valueSm: '700 12px Sora, system-ui, sans-serif',
  label: '500 9px Sora, system-ui, sans-serif',
  labelLg: '600 10px Sora, system-ui, sans-serif',
  body: '400 11px Sora, system-ui, sans-serif',
  tiny: '400 8px Sora, system-ui, sans-serif',
  mono: '500 10px JetBrains Mono, monospace',
  monoLg: '600 14px JetBrains Mono, monospace',
} as const;

/* ── Tab accent colors (mapped to playground tab IDs) ── */

export const TAB_ACCENT: Record<string, string> = {
  signals: SIM_COLORS.blue,
  volatility: SIM_COLORS.indigo,
  regimes: SIM_COLORS.orange,
  montecarlo: SIM_COLORS.rose,
  portfolio: SIM_COLORS.amber,
  backtesting: SIM_COLORS.emerald,
  riskscore: SIM_COLORS.rose,
  scenarios: SIM_COLORS.orange,
  factors: SIM_COLORS.violet,
};

/* ── Regime zone colors ── */

export const RISK_ZONE_COLORS = [
  SIM_COLORS.blue,     // 1-20 conservative
  SIM_COLORS.emerald,  // 21-40 moderate
  SIM_COLORS.amber,    // 41-60 balanced
  SIM_COLORS.orange,   // 61-80 aggressive
  SIM_COLORS.rose,     // 81-99 speculative
] as const;

/* ── Particle budgets ── */

export const PARTICLE_BUDGET = {
  desktop: 500,
  mobile: 150,
} as const;
