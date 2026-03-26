/**
 * Data shape adapters for the unified Sector + Pyramid dashboard.
 *
 * Converts ISectorAnalytics[] (richer, from /sectors/analytics endpoint)
 * into IPyramidSector[] (the shape PyramidView expects) so we can reuse
 * PyramidView without modification.
 */
import type { ISectorAnalytics } from '@/types/analytics';
import type { IPyramidSector, IPyramidStock, IPyramidKPI } from '../pyramid/constants';

/**
 * Convert sector analytics array to pyramid sector array.
 * Computes weights from market cap totals.
 */
export function sectorAnalyticsToPyramidSectors(
  sectors: ISectorAnalytics[],
): IPyramidSector[] {
  const totalMcap = sectors.reduce((sum, s) => sum + (s.total_market_cap ?? 0), 0) || 1;

  return sectors.map((s) => {
    const sectorMcap = s.total_market_cap ?? 0;

    const stocks: IPyramidStock[] = (s.stocks || []).map((st) => ({
      ticker: st.ticker,
      name: st.name ?? st.ticker,
      sector: s.sector,
      market_cap: st.market_cap ?? 0,
      weight_in_sector: sectorMcap > 0 ? (st.market_cap ?? 0) / sectorMcap : 0,
      weight_in_nifty: totalMcap > 0 ? (st.market_cap ?? 0) / totalMcap : 0,
      last_price: st.last_price ?? 0,
      change_pct: st.change_pct ?? 0,
      change: 0,
    }));

    return {
      sector: s.sector,
      total_market_cap: sectorMcap,
      weight_pct: (sectorMcap / totalMcap) * 100,
      avg_change_pct: s.avg_change_pct,
      momentum_score: s.momentum_score,
      performance: { ...s.performance },
      stock_count: s.stock_count,
      stocks,
    };
  });
}

/**
 * Derive pyramid KPI data from sector analytics array.
 */
export function derivePyramidKPI(
  sectors: ISectorAnalytics[],
  indiaVix: number | null = null,
): IPyramidKPI {
  let advancing = 0;
  let declining = 0;
  let unchanged = 0;

  for (const s of sectors) {
    for (const st of s.stocks ?? []) {
      const chg = st.change_pct ?? 0;
      if (chg > 0.01) advancing++;
      else if (chg < -0.01) declining++;
      else unchanged++;
    }
  }

  const sorted = [...sectors].sort(
    (a, b) => (a.avg_change_pct ?? 0) - (b.avg_change_pct ?? 0),
  );

  const niftyChangePct = sectors.length > 0
    ? sectors.reduce((sum, s) => sum + (s.avg_change_pct ?? 0) * (s.total_market_cap ?? 0), 0)
      / sectors.reduce((sum, s) => sum + (s.total_market_cap ?? 0), 0)
    : 0;

  return {
    nifty_change_pct: niftyChangePct,
    advancing,
    declining,
    unchanged,
    top_sector: sorted.length > 0
      ? { name: sorted[sorted.length - 1].sector, change_pct: sorted[sorted.length - 1].avg_change_pct }
      : null,
    bottom_sector: sorted.length > 0
      ? { name: sorted[0].sector, change_pct: sorted[0].avg_change_pct }
      : null,
    india_vix: indiaVix,
  };
}
