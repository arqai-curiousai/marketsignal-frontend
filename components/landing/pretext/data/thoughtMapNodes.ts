/**
 * Thought map node hierarchy for the Pulse landing page.
 * Central "PULSE" node radiates to 3 L1 modules, each with L2 micro-nodes.
 */

export interface ThoughtMapL2 {
  label: string;
  /** Angle offset from parent (radians) — spread around the L1 node */
  angleOffset: number;
  /** Distance from parent node (px, desktop) */
  distance: number;
}

export interface ThoughtMapL1 {
  label: string;
  /** Angle from center (radians) */
  angle: number;
  /** Accent color */
  color: string;
  /** Glow color */
  glow: string;
  children: ThoughtMapL2[];
}

export const PULSE_CENTER = {
  label: 'PULSE',
  color: 'rgba(110, 231, 183, 0.9)',
  glow: 'rgba(110, 231, 183, 0.3)',
  radiusDesktop: 40,
  radiusMobile: 28,
};

const NEWS_COLOR = 'rgba(251, 191, 36, 0.8)';
const NEWS_GLOW = 'rgba(251, 191, 36, 0.2)';
const SECTOR_COLOR = 'rgba(110, 231, 183, 0.8)';
const SECTOR_GLOW = 'rgba(110, 231, 183, 0.2)';
const CORR_COLOR = 'rgba(96, 165, 250, 0.8)';
const CORR_GLOW = 'rgba(96, 165, 250, 0.2)';

export const THOUGHT_MAP_L1: ThoughtMapL1[] = [
  {
    label: 'News',
    angle: -Math.PI / 2 - 0.4, // top-left
    color: NEWS_COLOR,
    glow: NEWS_GLOW,
    children: [
      { label: 'Sentiment', angleOffset: -0.6, distance: 80 },
      { label: 'Impact', angleOffset: -0.2, distance: 90 },
      { label: 'Stories', angleOffset: 0.2, distance: 85 },
      { label: 'Regions', angleOffset: 0.6, distance: 75 },
      { label: 'Briefs', angleOffset: 1.0, distance: 82 },
      { label: 'Network', angleOffset: -1.0, distance: 78 },
    ],
  },
  {
    label: 'Sectors',
    angle: -Math.PI / 2 + 0.4, // top-right
    color: SECTOR_COLOR,
    glow: SECTOR_GLOW,
    children: [
      { label: 'IT', angleOffset: -0.7, distance: 75 },
      { label: 'BANK', angleOffset: -0.3, distance: 85 },
      { label: 'PHARMA', angleOffset: 0.1, distance: 80 },
      { label: 'ENERGY', angleOffset: 0.5, distance: 78 },
      { label: 'AUTO', angleOffset: 0.9, distance: 82 },
      { label: 'FMCG', angleOffset: -1.1, distance: 76 },
      { label: 'METAL', angleOffset: 1.3, distance: 74 },
    ],
  },
  {
    label: 'Correlations',
    angle: Math.PI / 2, // bottom-center
    color: CORR_COLOR,
    glow: CORR_GLOW,
    children: [
      { label: 'NIFTY-SPX', angleOffset: -0.8, distance: 88 },
      { label: 'GOLD-DXY', angleOffset: -0.3, distance: 82 },
      { label: 'CRUDE-INR', angleOffset: 0.2, distance: 86 },
      { label: 'DCC-GARCH', angleOffset: 0.7, distance: 80 },
      { label: 'Regimes', angleOffset: -1.2, distance: 76 },
      { label: 'MST', angleOffset: 1.1, distance: 78 },
    ],
  },
];

/** Mobile: fewer L2 nodes per L1 */
export const THOUGHT_MAP_L1_MOBILE: ThoughtMapL1[] = THOUGHT_MAP_L1.map((l1) => ({
  ...l1,
  children: l1.children.slice(0, 4),
}));
