/** RRG insight computation helpers — pure functions, no React dependency. */

import type { ISectorAnalytics } from '@/types/analytics';

export type Quadrant = 'leading' | 'weakening' | 'lagging' | 'improving';

export function getQuadrant(ratio: number, momentum: number): Quadrant {
  if (ratio >= 100 && momentum >= 100) return 'leading';
  if (ratio >= 100 && momentum < 100) return 'weakening';
  if (ratio < 100 && momentum >= 100) return 'improving';
  return 'lagging';
}

export interface QuadrantCounts {
  leading: number;
  weakening: number;
  lagging: number;
  improving: number;
}

export function countByQuadrant(sectors: ISectorAnalytics[]): QuadrantCounts {
  const counts: QuadrantCounts = { leading: 0, weakening: 0, lagging: 0, improving: 0 };
  for (const s of sectors) {
    const q = s.rrg.quadrant;
    if (q in counts) counts[q as Quadrant]++;
  }
  return counts;
}

export interface QuadrantCrossing {
  sector: string;
  from: Quadrant;
  to: Quadrant;
}

export function detectCrossings(sectors: ISectorAnalytics[]): QuadrantCrossing[] {
  const crossings: QuadrantCrossing[] = [];
  for (const s of sectors) {
    const trail = s.rrg.trail;
    if (!trail || trail.length === 0) continue;
    const prev = trail[trail.length - 1];
    const prevQ = getQuadrant(prev.rs_ratio, prev.rs_momentum);
    const curQ = s.rrg.quadrant as Quadrant;
    if (prevQ !== curQ) {
      crossings.push({ sector: s.sector, from: prevQ, to: curQ });
    }
  }
  return crossings;
}

export interface MomentumMover {
  sector: string;
  distance: number;
  direction: 'up' | 'down'; // momentum direction
}

export function fastestMover(sectors: ISectorAnalytics[]): MomentumMover | null {
  let best: MomentumMover | null = null;
  for (const s of sectors) {
    const trail = s.rrg.trail;
    if (!trail || trail.length === 0) continue;
    const prev = trail[trail.length - 1];
    const dr = s.rrg.rs_ratio - prev.rs_ratio;
    const dm = s.rrg.rs_momentum - prev.rs_momentum;
    const dist = Math.sqrt(dr * dr + dm * dm);
    if (!best || dist > best.distance) {
      best = { sector: s.sector, distance: dist, direction: dm >= 0 ? 'up' : 'down' };
    }
  }
  return best;
}

/** Group sectors by quadrant, sorted by momentum magnitude within each group. */
export function groupByQuadrant(
  sectors: ISectorAnalytics[],
): Record<Quadrant, ISectorAnalytics[]> {
  const groups: Record<Quadrant, ISectorAnalytics[]> = {
    leading: [],
    improving: [],
    weakening: [],
    lagging: [],
  };
  for (const s of sectors) {
    const q = s.rrg.quadrant as Quadrant;
    if (q in groups) groups[q].push(s);
  }
  // Sort each group by distance from center (100,100) descending
  for (const q of Object.keys(groups) as Quadrant[]) {
    groups[q].sort((a, b) => {
      const da = Math.abs(a.rrg.rs_ratio - 100) + Math.abs(a.rrg.rs_momentum - 100);
      const db = Math.abs(b.rrg.rs_ratio - 100) + Math.abs(b.rrg.rs_momentum - 100);
      return db - da;
    });
  }
  return groups;
}

/** Top N sectors by trail movement distance (for auto-focus during playback). */
export function topMovers(sectors: ISectorAnalytics[], n: number): Set<string> {
  const scored = sectors
    .map((s) => {
      const trail = s.rrg.trail ?? [];
      if (trail.length < 2) return { sector: s.sector, dist: 0 };
      let totalDist = 0;
      for (let i = 1; i < trail.length; i++) {
        const dr = trail[i].rs_ratio - trail[i - 1].rs_ratio;
        const dm = trail[i].rs_momentum - trail[i - 1].rs_momentum;
        totalDist += Math.sqrt(dr * dr + dm * dm);
      }
      return { sector: s.sector, dist: totalDist };
    })
    .sort((a, b) => b.dist - a.dist)
    .slice(0, n);
  return new Set(scored.map((s) => s.sector));
}
