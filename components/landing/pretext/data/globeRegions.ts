/**
 * Globe data for the Pulse landing hero.
 *
 * Three data layers:
 *   1. Landmass dots — ~180 points tracing continent coastlines, rendered as
 *      faint dots to create recognisable land shapes on the orthographic globe.
 *   2. Financial centres — 20 major cities with labels and accent colours.
 *   3. News-flow arcs — connections between cities showing data movement.
 */

/* ── Colours ── */

const EMERALD = 'rgba(110, 231, 183, 0.9)';
const EMERALD_GLOW = 'rgba(110, 231, 183, 0.25)';
const BLUE = 'rgba(96, 165, 250, 0.9)';
const BLUE_GLOW = 'rgba(96, 165, 250, 0.25)';
const AMBER = 'rgba(251, 191, 36, 0.9)';
const AMBER_GLOW = 'rgba(251, 191, 36, 0.25)';
const VIOLET = 'rgba(167, 139, 250, 0.9)';
const VIOLET_GLOW = 'rgba(167, 139, 250, 0.25)';
const ROSE = 'rgba(248, 113, 113, 0.9)';
const ROSE_GLOW = 'rgba(248, 113, 113, 0.25)';
const TEAL = 'rgba(45, 212, 191, 0.9)';
const TEAL_GLOW = 'rgba(45, 212, 191, 0.25)';
const CYAN = 'rgba(34, 211, 238, 0.9)';
const CYAN_GLOW = 'rgba(34, 211, 238, 0.25)';

/* ═══ 1. Landmass dots ═══ */

/**
 * ~180 [lat, lon] pairs scattered along continent coastlines.
 * Not cartographically precise — just enough to make continents
 * recognisable as a dot-matrix on a small canvas globe.
 */
export const LANDMASS_DOTS: [number, number][] = [
  /* ── North America ── */
  [64, -165], [62, -150], [60, -140], [58, -135], [55, -130],
  [50, -127], [48, -124], [45, -124], [40, -124], [37, -122],
  [34, -118], [32, -117], [30, -115], [28, -110], [25, -100],
  [28, -97], [30, -90], [29, -85], [26, -80], [25, -80],
  [30, -81], [33, -79], [36, -76], [39, -74], [41, -72],
  [43, -70], [45, -67], [47, -63], [50, -60], [53, -56],
  [55, -60], [58, -65], [60, -70], [62, -75], [65, -85],
  [68, -95], [70, -100], [72, -115], [70, -130], [68, -145],
  // Interior points for fill
  [45, -95], [42, -88], [38, -85], [35, -90], [40, -100],
  [45, -110], [50, -105], [48, -90], [44, -78],
  /* ── Central America & Caribbean ── */
  [22, -100], [20, -97], [18, -95], [16, -90], [14, -88],
  [10, -84], [8, -80], [20, -75], [19, -72],
  /* ── South America ── */
  [10, -68], [8, -63], [5, -55], [0, -50], [-3, -42],
  [-8, -35], [-13, -39], [-18, -40], [-23, -43], [-25, -48],
  [-30, -51], [-34, -54], [-38, -57], [-42, -63], [-46, -68],
  [-50, -70], [-52, -70], [-45, -72], [-40, -73], [-35, -72],
  [-30, -71], [-25, -70], [-20, -70], [-15, -75], [-10, -77],
  [-5, -80], [0, -78], [5, -75],
  // Interior
  [-15, -55], [-10, -50], [-5, -60], [-20, -58], [-25, -55],
  /* ── Europe ── */
  [70, 25], [68, 15], [65, 12], [63, 10], [60, 5],
  [58, -5], [55, -8], [53, -10], [51, -5], [50, -4],
  [48, -5], [44, -8], [42, -9], [37, -8], [36, -5],
  [38, 0], [40, 3], [43, 5], [44, 8], [42, 12],
  [40, 15], [38, 15], [37, 22], [39, 24], [41, 28],
  [44, 28], [46, 30], [50, 20], [52, 14], [54, 10],
  [56, 12], [58, 15], [60, 20], [64, 22],
  // Interior
  [48, 8], [46, 15], [50, 8], [52, 5], [47, 2],
  /* ── Africa ── */
  [35, -5], [32, 0], [30, 10], [32, 32], [28, 33],
  [22, 37], [15, 42], [12, 44], [8, 40], [5, 38],
  [0, 35], [-5, 38], [-10, 40], [-15, 40], [-20, 35],
  [-25, 33], [-30, 30], [-34, 27], [-34, 18],
  [-30, 17], [-25, 15], [-18, 12], [-12, 14], [-8, 12],
  [-5, 10], [0, 8], [5, 2], [8, -2], [12, -15],
  [15, -17], [20, -17], [25, -15], [30, -10],
  // Interior
  [10, 25], [5, 20], [0, 25], [-5, 25], [-10, 28],
  [-20, 25], [15, 30], [20, 28], [25, 20],
  /* ── Middle East ── */
  [33, 35], [30, 38], [25, 45], [23, 50], [25, 55],
  [28, 55], [30, 50], [35, 45], [38, 42],
  /* ── India subcontinent ── */
  [30, 70], [28, 72], [24, 72], [22, 70], [20, 73],
  [18, 73], [15, 74], [12, 77], [10, 78], [8, 77],
  [10, 80], [13, 80], [16, 82], [20, 87], [22, 88],
  [24, 90], [27, 88], [30, 80], [32, 75], [35, 72],
  // Interior
  [22, 78], [25, 80], [18, 80], [15, 78], [20, 82],
  /* ── East Asia ── */
  [40, 80], [42, 90], [45, 100], [48, 105], [50, 110],
  [52, 120], [50, 130], [48, 135], [45, 132], [42, 130],
  [40, 125], [38, 120], [35, 118], [30, 122], [25, 120],
  [22, 114], [20, 110], [18, 106], [15, 105], [10, 105],
  [5, 103], [1, 104],
  // Japan
  [33, 132], [35, 135], [37, 137], [39, 140], [42, 142], [44, 145],
  // Interior
  [35, 105], [40, 110], [30, 110], [45, 120],
  /* ── Australia ── */
  [-15, 130], [-13, 135], [-15, 140], [-20, 148],
  [-25, 152], [-28, 153], [-33, 152], [-37, 150],
  [-38, 145], [-35, 138], [-32, 134], [-28, 128],
  [-23, 120], [-18, 122], [-15, 125],
  // Interior
  [-25, 135], [-28, 140], [-22, 145], [-30, 145],
];

/* ═══ 2. Financial centres ═══ */

export interface FinancialCenter {
  name: string;
  /** Short label for tight spaces */
  short: string;
  lat: number;
  lon: number;
  color: string;
  glow: string;
  /** Importance tier: 1 = major (always labelled), 2 = secondary (labelled on hover/desktop) */
  tier: 1 | 2;
  /** Fallback headline (used when API data unavailable) */
  headline: string;
  /** Region key matching API geo-sentiment regions */
  region: string;
}

/* ═══ Region labels for globe surface ═══ */

export interface RegionLabel {
  name: string;
  lat: number;
  lon: number;
}

export const REGION_LABELS: RegionLabel[] = [
  { name: 'Americas', lat: 10, lon: -100 },
  { name: 'Europe', lat: 52, lon: 15 },
  { name: 'Asia-Pacific', lat: 32, lon: 105 },
  { name: 'India', lat: 22, lon: 78 },
  { name: 'Africa', lat: 5, lon: 20 },
  { name: 'Middle East', lat: 28, lon: 48 },
];

export const FINANCIAL_CENTERS: FinancialCenter[] = [
  /* ── Tier 1: Major hubs ── */
  { name: 'Mumbai', short: 'BOM', lat: 19.1, lon: 72.9, color: EMERALD, glow: EMERALD_GLOW, tier: 1, headline: 'NIFTY hits all-time high', region: 'india' },
  { name: 'New York', short: 'NYC', lat: 40.7, lon: -74.0, color: BLUE, glow: BLUE_GLOW, tier: 1, headline: 'S&P 500 record close', region: 'americas' },
  { name: 'London', short: 'LON', lat: 51.5, lon: -0.1, color: VIOLET, glow: VIOLET_GLOW, tier: 1, headline: 'BOE holds rates steady', region: 'europe' },
  { name: 'Tokyo', short: 'TYO', lat: 35.7, lon: 139.7, color: ROSE, glow: ROSE_GLOW, tier: 1, headline: 'BOJ hints normalisation', region: 'asia_pacific' },
  { name: 'Shanghai', short: 'SHA', lat: 31.2, lon: 121.5, color: AMBER, glow: AMBER_GLOW, tier: 1, headline: 'China PMI expands', region: 'asia_pacific' },
  { name: 'Frankfurt', short: 'FRA', lat: 50.1, lon: 8.7, color: AMBER, glow: AMBER_GLOW, tier: 1, headline: 'ECB cuts rates 25bps', region: 'europe' },
  /* ── Tier 2: Secondary centres ── */
  { name: 'Singapore', short: 'SIN', lat: 1.3, lon: 103.8, color: TEAL, glow: TEAL_GLOW, tier: 2, headline: 'SGX volumes surge', region: 'asia_pacific' },
  { name: 'Hong Kong', short: 'HKG', lat: 22.3, lon: 114.2, color: ROSE, glow: ROSE_GLOW, tier: 2, headline: 'HSI rebounds 2.3%', region: 'asia_pacific' },
  { name: 'Sydney', short: 'SYD', lat: -33.9, lon: 151.2, color: TEAL, glow: TEAL_GLOW, tier: 2, headline: 'RBA pauses rates', region: 'asia_pacific' },
  { name: 'Delhi', short: 'DEL', lat: 28.6, lon: 77.2, color: EMERALD, glow: EMERALD_GLOW, tier: 2, headline: 'RBI holds repo rate', region: 'india' },
  { name: 'Dubai', short: 'DXB', lat: 25.2, lon: 55.3, color: AMBER, glow: AMBER_GLOW, tier: 2, headline: 'DFM hits 5-yr high', region: 'emerging_markets' },
  { name: 'Chicago', short: 'CHI', lat: 41.9, lon: -87.6, color: BLUE, glow: BLUE_GLOW, tier: 2, headline: 'VIX drops below 14', region: 'americas' },
  { name: 'Toronto', short: 'TOR', lat: 43.7, lon: -79.4, color: BLUE, glow: BLUE_GLOW, tier: 2, headline: 'TSX energy rally', region: 'americas' },
  { name: 'S\u00e3o Paulo', short: 'SAO', lat: -23.5, lon: -46.6, color: CYAN, glow: CYAN_GLOW, tier: 2, headline: 'Bovespa gains 1.8%', region: 'americas' },
  { name: 'Zurich', short: 'ZRH', lat: 47.4, lon: 8.5, color: VIOLET, glow: VIOLET_GLOW, tier: 2, headline: 'CHF safe-haven bid', region: 'europe' },
  { name: 'Paris', short: 'PAR', lat: 48.9, lon: 2.3, color: AMBER, glow: AMBER_GLOW, tier: 2, headline: 'CAC 40 flat on trade fears', region: 'europe' },
  { name: 'Seoul', short: 'SEL', lat: 37.6, lon: 127.0, color: ROSE, glow: ROSE_GLOW, tier: 2, headline: 'KOSPI tech rally', region: 'asia_pacific' },
  { name: 'Johannesburg', short: 'JNB', lat: -26.2, lon: 28.0, color: CYAN, glow: CYAN_GLOW, tier: 2, headline: 'JSE gold stocks surge', region: 'emerging_markets' },
  { name: 'Bangalore', short: 'BLR', lat: 12.97, lon: 77.6, color: EMERALD, glow: EMERALD_GLOW, tier: 2, headline: 'IT sector wins $40B deals', region: 'india' },
  { name: 'Jakarta', short: 'JKT', lat: -6.2, lon: 106.8, color: TEAL, glow: TEAL_GLOW, tier: 2, headline: 'IDX commodity stocks up', region: 'asia_pacific' },
];

/* ═══ 3. News-flow arcs ═══ */

/** Pairs of indices into FINANCIAL_CENTERS. */
export const NEWS_ARCS: [number, number][] = [
  // Mumbai hub
  [0, 1],  // Mumbai → New York
  [0, 2],  // Mumbai → London
  [0, 3],  // Mumbai → Tokyo
  [0, 6],  // Mumbai → Singapore
  [0, 9],  // Mumbai → Delhi
  // Western axis
  [1, 2],  // New York → London
  [1, 5],  // New York → Frankfurt
  [1, 11], // New York → Chicago
  [2, 5],  // London → Frankfurt
  [2, 14], // London → Zurich
  // Asia-Pacific ring
  [3, 4],  // Tokyo → Shanghai
  [3, 7],  // Tokyo → Hong Kong
  [4, 7],  // Shanghai → Hong Kong
  [6, 7],  // Singapore → Hong Kong
  [6, 8],  // Singapore → Sydney
  [6, 19], // Singapore → Jakarta
  // Cross-continental
  [1, 13], // New York → Sao Paulo
  [2, 10], // London → Dubai
  [5, 3],  // Frankfurt → Tokyo
  [8, 3],  // Sydney → Tokyo
];

/** Subset for mobile (fewer draws). */
export const NEWS_ARCS_MOBILE: [number, number][] = [
  [0, 1],  // Mumbai → New York
  [0, 2],  // Mumbai → London
  [0, 3],  // Mumbai → Tokyo
  [1, 2],  // New York → London
  [3, 7],  // Tokyo → Hong Kong
  [6, 8],  // Singapore → Sydney
];
