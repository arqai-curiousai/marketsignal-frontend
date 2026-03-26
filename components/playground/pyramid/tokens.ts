import { formatNumber as fmtNumberExchange } from '@/src/lib/exchange/formatting';

/**
 * Playground Pyramid Design Tokens
 *
 * Single source of truth for typography, surfaces, colors, layout, and
 * chart styling across all Pyramid components. Import from here — never
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

// ─── Layout ─────────────────────────────────────────────────────────

export const L = {
  /** Secondary charts (trends panels, small charts) */
  chartSm: 'h-[200px] md:h-[240px]',
  /** Primary charts (exposure, feature importance) */
  chartMd: 'h-[260px] md:h-[320px]',
  /** Full-width hero charts */
  chartLg: 'h-[300px] md:h-[400px]',
  /** Standard gap */
  gap: 'gap-3 md:gap-4',
  /** Card padding */
  pad: 'p-4 md:p-5',
} as const;

// ─── Signal Colors ──────────────────────────────────────────────────

export const SIGNAL = {
  buy: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'rgba(52, 211, 153, 0.4)',
    hex: '#34D399',
    rgb: '52, 211, 153',
  },
  sell: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'rgba(248, 113, 113, 0.4)',
    hex: '#F87171',
    rgb: '248, 113, 113',
  },
  hold: {
    text: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    glow: 'rgba(148, 163, 184, 0.3)',
    hex: '#94A3B8',
    rgb: '148, 163, 184',
  },
} as const;

// ─── Layer Accent Colors ────────────────────────────────────────────

export const LAYER = {
  technical: {
    hex: '#22D3EE',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    rgb: '34, 211, 238',
  },
  fundamental: {
    hex: '#FBBF24',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    rgb: '251, 191, 36',
  },
  sentiment: {
    hex: '#A78BFA',
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    rgb: '167, 139, 250',
  },
  ensemble: {
    hex: '#60A5FA',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    rgb: '96, 165, 250',
  },
  risk: {
    hex: '#F472B6',
    text: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    rgb: '244, 114, 182',
  },
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

// ─── Color Helpers ──────────────────────────────────────────────────

type SignalKey = keyof typeof SIGNAL;
type LayerKey = keyof typeof LAYER;

export function signalColor(signal: string): (typeof SIGNAL)[SignalKey] {
  const key = signal.toLowerCase();
  return (key in SIGNAL ? SIGNAL[key as SignalKey] : SIGNAL.hold);
}

export function layerColor(layerName: string): (typeof LAYER)[LayerKey] {
  const key = layerName.toLowerCase();
  return (key in LAYER ? LAYER[key as LayerKey] : LAYER.ensemble);
}

// ─── Formatting ─────────────────────────────────────────────────────

export function fmtPct(val: number | null, decimals = 1): string {
  if (val == null) return '\u2014'; // em dash
  return `${(val * 100).toFixed(decimals)}%`;
}

export function fmtNum(val: number | null, decimals = 2): string {
  if (val == null) return '\u2014'; // em dash
  return fmtNumberExchange(val, 'NSE', { maximumFractionDigits: decimals });
}

