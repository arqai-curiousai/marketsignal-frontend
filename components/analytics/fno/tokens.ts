/**
 * F&O Dashboard Design Tokens
 *
 * Single source of truth for typography, surfaces, colors, layout, and
 * chart styling across all F&O components. Import from here — never
 * hard-code visual values in component files.
 */
import type { CSSProperties } from 'react';

// ─── Typography ─────────────────────────────────────────────────────
// Semantic scale replacing arbitrary text-[7px]/[9px]/[10px]/[11px]

export const T = {
  /** KPI labels, section headers */
  label: 'text-[10px] uppercase tracking-wider font-medium',
  /** Sub-values, descriptions */
  caption: 'text-[10px] text-muted-foreground',
  /** All numeric values */
  mono: 'text-[11px] font-mono tabular-nums',
  /** Compact numeric values */
  monoSm: 'text-[10px] font-mono tabular-nums',
  /** Card/section titles */
  heading: 'text-sm font-semibold',
  /** Large KPI values */
  kpi: 'text-lg font-bold font-mono tabular-nums',
  /** Status badges, tiny labels */
  badge: 'text-[9px] font-semibold',
  /** Chart legends, hints */
  legend: 'text-[9px] text-white/35',
} as const;

// ─── Surfaces ───────────────────────────────────────────────────────
// Consistent card/border/divider styles

export const S = {
  /** Primary card container */
  card: 'rounded-xl border border-white/[0.06] bg-white/[0.015]',
  /** Card hover state */
  cardHover: 'hover:border-white/[0.10] hover:bg-white/[0.025]',
  /** Inner nested container */
  inner: 'rounded-lg bg-white/[0.02] border border-white/[0.04]',
  /** Glass-morphism card */
  glass: 'rounded-xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.06]',
  /** Standard divider */
  divider: 'border-white/[0.04]',
  /** Strong divider */
  dividerStrong: 'border-white/[0.08]',
  /** Row separator */
  rowDivider: 'border-white/[0.02]',
} as const;

// ─── Signal Colors ──────────────────────────────────────────────────
// Every color carries meaning: bullish/bearish/neutral/structural

export const C = {
  bullish: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    hex: '#34D399',
    rgb: '52, 211, 153',
  },
  bearish: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    hex: '#F87171',
    rgb: '248, 113, 113',
  },
  neutral: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    hex: '#FBBF24',
    rgb: '251, 191, 36',
  },
  call: {
    text: 'text-blue-400',
    muted: 'text-blue-400/60',
    hex: '#4ADE80',
    rgb: '96, 165, 250',
    gradient: 'from-blue-500/60 to-blue-500/5',
  },
  put: {
    text: 'text-amber-400',
    muted: 'text-amber-400/60',
    hex: '#FBBF24',
    rgb: '251, 191, 36',
    gradient: 'from-amber-500/60 to-amber-500/5',
  },
  atm: {
    text: 'text-violet-400',
    border: 'border-violet-500/15',
    glow: 'bg-violet-500/[0.08]',
    hex: '#8B5CF6',
  },
  maxPain: { text: 'text-violet-400', hex: '#22C55E' },
  gammaFlip: { text: 'text-amber-400', hex: '#FBBF24' },
  spot: { text: 'text-white/60', hex: 'rgba(255,255,255,0.5)' },
  positiveGamma: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    label: 'Stabilizing',
  },
  negativeGamma: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    label: 'Amplifying',
  },
} as const;

// ─── Layout ─────────────────────────────────────────────────────────

export const L = {
  /** Secondary charts (trends panels, small charts) */
  chartSm: 'h-[200px] md:h-[240px]',
  /** Primary charts (exposure, IV smile) */
  chartMd: 'h-[260px] md:h-[320px]',
  /** Full-width hero charts */
  chartLg: 'h-[300px] md:h-[400px]',
  /** Standard gap */
  gap: 'gap-3 md:gap-4',
  /** Card padding */
  pad: 'p-4 md:p-5',
} as const;

// ─── Chart Tooltip ──────────────────────────────────────────────────
// Single shared style for all Recharts tooltips

export const TOOLTIP_STYLE: CSSProperties = {
  background: 'rgba(10, 15, 28, 0.96)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  fontSize: '11px',
  padding: '10px 14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

export const AXIS_STYLE = {
  fontSize: 10,
  fill: 'rgba(255,255,255,0.25)',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

// ─── Gradient ID Helper ─────────────────────────────────────────────
// Prevents SVG gradient ID collisions when multiple chart instances
// render simultaneously. Pass a component-level prefix + metric name.

let _gradCounter = 0;
export function gradientId(prefix: string, metric: string): string {
  _gradCounter += 1;
  return `fno-${prefix}-${metric}-${_gradCounter}`;
}

// ─── Greek Heatmap Color ────────────────────────────────────────────

type GreekKey = 'iv' | 'delta' | 'gamma' | 'theta' | 'vega' | 'vanna' | 'charm' | 'volga';

const GREEK_SCALE: Record<GreekKey, number> = {
  iv: 50,       // IV in decimal, *100 / 50 gives 0-1 for ~0-50%
  delta: 1,     // already 0-1
  gamma: 0.001, // typical gamma is 0.0001-0.001
  theta: 50,    // typical daily theta 0-50
  vega: 30,     // typical vega 0-30
  vanna: 0.2,   // typical vanna scale
  charm: 0.1,   // typical charm scale
  volga: 20,    // typical volga scale
};

export function greekHeatColor(value: number | null, greek: GreekKey): string {
  if (value == null) return 'rgba(255,255,255,0.03)';
  const scale = GREEK_SCALE[greek];
  const intensity = greek === 'delta'
    ? Math.abs(value)
    : Math.min(Math.abs(value) / scale, 1);

  if (greek === 'iv') {
    return `rgba(${C.call.rgb}, ${(0.05 + intensity * 0.4).toFixed(3)})`;
  }
  if (value >= 0) {
    return `rgba(110, 231, 183, ${(0.05 + intensity * 0.35).toFixed(3)})`;
  }
  return `rgba(${C.bearish.rgb}, ${(0.05 + intensity * 0.35).toFixed(3)})`;
}

// ─── Formatting ─────────────────────────────────────────────────────

export function fmtOI(val: number): string {
  if (val >= 10_000_000) return `${(val / 10_000_000).toFixed(1)}Cr`;
  if (val >= 100_000) return `${(val / 100_000).toFixed(1)}L`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toString();
}

export function fmtCompact(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 10_000_000) return `${(val / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `${(val / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toFixed(1);
}

export function fmtNum(val: number | null, decimals = 2): string {
  if (val == null) return '\u2014'; // em dash
  return val.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}

export function fmtStrike(val: number): string {
  return val.toLocaleString('en-IN');
}

// ─── PCR / IV / Basis Color Helpers ─────────────────────────────────

export function pcrColor(pcr: number | null): string {
  if (pcr == null) return 'text-muted-foreground';
  if (pcr > 1.3) return C.bullish.text;
  if (pcr > 1.0) return 'text-emerald-400/70';
  if (pcr < 0.7) return C.bearish.text;
  if (pcr < 1.0) return 'text-red-400/70';
  return C.neutral.text;
}

export function basisColor(basis: number | null): string {
  if (basis == null) return 'text-muted-foreground';
  return basis >= 0 ? C.bullish.text : C.bearish.text;
}

export function ivRankColor(rank: number | null): string {
  if (rank == null) return 'text-muted-foreground';
  if (rank < 20) return C.bullish.text;
  if (rank > 80) return C.bearish.text;
  return C.neutral.text;
}

export function ivColor(iv: number | null): string {
  if (iv == null) return 'text-muted-foreground';
  return iv > 0.25 ? 'text-orange-400' : C.bullish.text;
}

// ─── Interactive ────────────────────────────────────────────────────

export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent';

export const TAB_ACTIVE = 'bg-white/10 text-white border border-white/10';
export const TAB_INACTIVE = 'text-white/50 hover:text-white/70 hover:bg-white/[0.04]';
