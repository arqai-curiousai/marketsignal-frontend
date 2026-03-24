/**
 * Portfolio Optimization Design Tokens
 *
 * Colorblind-safe palette for strategy and sector visualization.
 * Extends the Pyramid design token pattern.
 */

// ─── Strategy Colors (5 optimization strategies) ─────────────────

export const STRATEGY_COLORS: Record<string, string> = {
  equal_weight: '#94A3B8',
  min_variance: '#60A5FA',
  max_sharpe: '#FBBF24',
  risk_parity: '#A78BFA',
  hrp: '#34D399',
};

export const STRATEGY_LABELS: Record<string, string> = {
  equal_weight: 'Equal Weight',
  min_variance: 'Min Variance',
  max_sharpe: 'Max Sharpe',
  risk_parity: 'Risk Parity',
  hrp: 'HRP',
};

// ─── Sector Colors (12 NIFTY sectors) ────────────────────────────

export const SECTOR_COLORS: Record<string, string> = {
  Banking: '#60A5FA',
  IT: '#A78BFA',
  Pharma: '#2DD4BF',
  FMCG: '#4ADE80',
  Auto: '#FB923C',
  Energy: '#FBBF24',
  Metals: '#94A3B8',
  Telecom: '#F472B6',
  Infrastructure: '#818CF8',
  Cement: '#E879F9',
  Insurance: '#38BDF8',
  Financials: '#22D3EE',
};

// ─── Formatters ──────────────────────────────────────────────────

export function fmtWeight(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

export function fmtReturn(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  const pct = value * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export function fmtSharpe(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return value.toFixed(2);
}

// ─── Color Helpers ───────────────────────────────────────────────

export function getStrategyColor(mode: string): string {
  return STRATEGY_COLORS[mode] ?? '#94A3B8';
}

export function getStrategyLabel(mode: string): string {
  return STRATEGY_LABELS[mode] ?? mode;
}

export function getSectorColor(sector: string): string {
  return SECTOR_COLORS[sector] ?? '#94A3B8';
}
