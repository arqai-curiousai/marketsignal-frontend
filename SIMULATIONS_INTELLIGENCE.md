# Simulations Intelligence — Dashboard Redesign Spec

> **Objective**: Redesign the Simulation Lab dashboard (`/playground`) into a world-class
> Simulations Intelligence experience — Bloomberg-grade data density with zen aesthetics,
> powered by Pretext canvas rendering for rich, animated data visualization.

---

## 1. Vision

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                                                                      │
  │   "Running simulations is fine — but showing enriched visuals and    │
  │    their simple explanations in cool manner with cool animations     │
  │    is the go-to agenda."                                             │
  │                                                                      │
  │   The dashboard should feel like looking through a window into       │
  │   the mathematics of markets — where every number breathes,          │
  │   every chart tells a story, and complex quant outputs are           │
  │   distilled into instant understanding.                              │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

### Competitive Reference

| Platform | Strength | What We Take |
|----------|----------|--------------|
| **Bloomberg Terminal** | Data density, multi-panel layouts, keyboard-driven | Panel architecture, pro-grade tables, keyboard shortcuts |
| **Refinitiv Eikon** | Clean visualization of complex analytics | Chart-first layout, clear hierarchy of information |
| **Koyfin** | Modern SaaS feel with institutional depth | Card-based modules, dark theme, gradient accents |
| **QuantConnect** | Algorithm visualization, backtest storytelling | Equity curve race, strategy comparison UI |
| **Portfolio Visualizer** | Monte Carlo fan charts, efficient frontier | Probability cone rendering, interactive percentile bands |

### What Makes Ours Different

We use **Pretext** (`@chenglou/pretext`) — a sub-pixel text rendering engine running on
HTML5 Canvas — to achieve visuals that **cannot exist in traditional DOM/SVG**:
- Pixel-perfect animated typography at 60fps
- Real-time data integrated directly into canvas scenes
- Particle systems, sonar pulses, and physics-based text
- Zero layout thrashing — everything is GPU-composited

---

## 2. Pretext Architecture (Existing)

### Core Engine

```
┌──────────────────────────────────────────────────────────────┐
│  @chenglou/pretext                                           │
│                                                              │
│  prepare(text, font) → PreparedText                          │
│    Sub-pixel glyph measurement, font metrics caching         │
│                                                              │
│  layout(handle, maxWidth, lineHeight) → LayoutResult         │
│    Line breaking, word wrapping with exact pixel positions    │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│  Our Pretext Layer (components/landing/pretext/)             │
│                                                              │
│  PretextCanvas.tsx     — DPR-aware <canvas> with rAF loop    │
│  usePretextEngine.ts   — React hook: texts → PreparedText[]  │
│  textRenderer.ts       — Cached measureText() + getWidth()   │
│  GravityHeadline.tsx   — Physics-based falling word animation │
│  canvasEffects.ts      — Sonar pulses, glow, gradients       │
│  ParticleField.tsx     — Floating particle background layer   │
│  useMobileDetect.ts    — Adaptive rendering for mobile       │
│  useReducedMotion.ts   — Respects prefers-reduced-motion     │
└──────────────────────────────────────────────────────────────┘
```

### Current Usage in Landing Pages

| Page | Canvas Components | Techniques |
|------|-------------------|------------|
| **`/forex`** | `ForexShowcaseCanvas`, `ForexModuleCanvas`, `DualAgentCanvas`, `ForexConstellationCanvas` | Constellation networks, agent viz, orbit animations |
| **`/pulse`** | `NeuralPulseCanvas`, `PulseShowcaseCanvas`, `PulseModuleCanvas`, `GlobeCanvas` | Neural networks, globe rotation, sentiment rivers |
| **`/simulations`** | `ProbabilityCascadeCanvas`, `SimShowcaseCanvas`, `SimGridItemCanvas`, `GridCanvas` | Monte Carlo fans, volatility gauges, donut charts, risk scores |

---

## 3. Data Sources for Simulations

### Global Coverage (Post-Upgrade)

```
┌─────────────────────────────────────────────────────────────────┐
│  S3 Data Lake (Cold — Full History)                             │
│  s3://marketsignal/eodhd/                                       │
│                                                                 │
│  ┌─────────┬──────────┬──────────┬────────────────────────────┐ │
│  │Exchange │ Stocks   │ Bars     │ Range                      │ │
│  ├─────────┼──────────┼──────────┼────────────────────────────┤ │
│  │ NSE     │ 50       │ ~66K     │ 2020 → present (Kite)     │ │
│  │ NASDAQ  │ 50       │ ~390K   │ 1980 → present (EODHD)    │ │
│  │ NYSE    │ 49       │ ~549K   │ 1962 → present (EODHD)    │ │
│  │ LSE     │ 50       │ ~409K   │ 1988 → present (EODHD)    │ │
│  │ HKSE    │ 50       │ ~292K   │ 1986 → present (EODHD)    │ │
│  │ FX      │ 42 pairs │ ~465K   │ 1971 → present (EODHD)    │ │
│  ├─────────┼──────────┼──────────┼────────────────────────────┤ │
│  │ TOTAL   │ 291      │ ~2.1M   │ 65.8 MB Parquet           │ │
│  └─────────┴──────────┴──────────┴────────────────────────────┘ │
│                                                                 │
│  Format: Parquet (Snappy) per instrument                        │
│  Schema: date, open, high, low, close, adjusted_close, volume   │
│  Path:   eodhd/{exchange}/{ticker}/daily.parquet                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  MongoDB (Hot — Rolling Window)                                 │
│  Atlas M0 Free Tier (512 MB)                                    │
│                                                                 │
│  ohlcv_daily:  FX 6-month + NSE 6-month (~12K bars)            │
│  ohlcv_intraday: FX 48h + NSE 30d (~11K bars)                  │
│  market_news: 6-month rolling (~5K articles)                    │
│  users, sessions, watchlists, signals                           │
│                                                                 │
│  Budget: ~36 MB / 512 MB = 7% used                             │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
  Frontend Pages              Backend Services              Storage
  ──────────────              ────────────────              ───────

  /signals (Pulse)  ───────→  MongoDB queries  ◄──────────  MongoDB
  /forex            ───────→  MongoDB queries  ◄──────────  (hot layer)
  /stocks           ───────→  MongoDB queries  ◄──────────

  /playground       ───────→  SimulationDataService ◄─────  S3 Parquet
  (Simulations)               reads from S3,                (cold layer)
                              caches in memory (LRU)
                              4h TTL, ~72 MB RAM
```

---

## 4. Simulation Tabs — 9 Intelligence Modules

### Current Tabs & Redesign Intent

```
┌─────────────────────────────────────────────────────────────────────┐
│  Tab             Current State           Redesign Target            │
│─────────────────────────────────────────────────────────────────────│
│                                                                     │
│  1. AI Signals   Pattern detection       Pretext: animated pattern  │
│                  cards, text-heavy        constellation canvas       │
│                                                                     │
│  2. Volatility   Storm gauge + charts    Pretext: breathing storm   │
│                  (Recharts)               eye with live estimator    │
│                                           beams radiating outward   │
│                                                                     │
│  3. Regimes      State cards + timeline  Pretext: regime landscape  │
│                  (static badges)          — terrain shifts between   │
│                                           growth/neutral/contraction│
│                                           with transition particles │
│                                                                     │
│  4. Monte Carlo  Probability cone        Pretext: cascading price   │
│                  (Recharts area)          paths with density heatmap │
│                                           on canvas, percentile     │
│                                           bands as glowing ribbons  │
│                                                                     │
│  5. Portfolio    Sunburst + table        Pretext: orbital allocation│
│                  (Recharts pie)           — stocks orbit center at   │
│                                           distance = volatility,    │
│                                           size = weight             │
│                                                                     │
│  6. Backtesting  Equity curve race       Pretext: animated horse    │
│                  (Recharts line)          race — strategy lines      │
│                                           pulse and compete live    │
│                                                                     │
│  7. Risk Score   Compass + breakdown     Pretext: seismograph-style │
│                  (SVG gauge)              risk pulse with zone       │
│                                           colors bleeding through   │
│                                                                     │
│  8. Scenarios    Impact table            Pretext: stress fracture   │
│                  (static grid)            map — portfolio cracks     │
│                                           appear under stress with  │
│                                           severity-based glow       │
│                                                                     │
│  9. Factors      Tilt table + bar        Pretext: factor fingerprint│
│                  (Recharts bar)           radar with animated arms   │
│                                           extending to factor       │
│                                           loadings                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Visual Language

### Zen Principles (Non-Negotiable)

```
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   1. BREATHE     Every number should have space around it.  │
  │                  Whitespace is not wasted space.             │
  │                                                             │
  │   2. FLOW        Data should feel alive — subtle motion,    │
  │                  not static snapshots. 60fps canvas.        │
  │                                                             │
  │   3. LAYER       Background particles → mid-ground chart → │
  │                  foreground metrics → floating AI insight.   │
  │                                                             │
  │   4. EXPLAIN     Every complex output gets a one-line       │
  │                  plain-English annotation. Not a textbook.  │
  │                                                             │
  │   5. DELIGHT     Micro-interactions on hover. Sonar pulses  │
  │                  on data updates. Gravity on headlines.     │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

### Color System

```css
/* Canvas palette — designed for dark backgrounds */

/* Primary data colors */
--sim-emerald:  rgba(110, 231, 183, 1)   /* Positive / growth / profit */
--sim-rose:     rgba(248, 113, 113, 1)   /* Negative / risk / loss */
--sim-violet:   rgba(167, 139, 250, 1)   /* Primary accent / selected */
--sim-blue:     rgba(129, 140, 248, 1)   /* Secondary / info */
--sim-amber:    rgba(251, 191, 36, 1)    /* Warning / caution / neutral */

/* Canvas backgrounds */
--canvas-deep:  rgba(9, 20, 18, 1)       /* brand-slate deep */
--canvas-surface: rgba(255, 255, 255, 0.03)  /* card surfaces */
--canvas-border:  rgba(255, 255, 255, 0.06)  /* subtle borders */

/* Text hierarchy (on canvas) */
--text-primary:   rgba(255, 255, 255, 0.85)
--text-secondary: rgba(255, 255, 255, 0.50)
--text-muted:     rgba(255, 255, 255, 0.25)
--text-ghost:     rgba(255, 255, 255, 0.10)

/* Glow effects */
--glow-violet:  rgba(167, 139, 250, 0.15)
--glow-emerald: rgba(110, 231, 183, 0.12)
--glow-rose:    rgba(248, 113, 113, 0.12)
```

### Typography (Canvas)

```
/* Pretext-rendered fonts on canvas */

Metric Hero:    '700 48px Sora'    /* Big numbers (risk score, Sharpe) */
Metric Value:   '700 16px Sora'    /* KPI values */
Metric Label:   '500 9px Sora'     /* KPI labels, uppercase tracking */
Body:           '400 11px Sora'    /* Descriptions, annotations */
Tiny:           '400 8px Sora'     /* Timestamps, footnotes */
Code:           '500 10px JetBrains Mono'  /* Ticker symbols, numbers */
```

---

## 6. Dashboard Layout Architecture

### Desktop (>1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Header: "Simulation Lab" + Exchange Selector + DataFreshnessStrip   │
├──────────────────────────────────────────────────────────────────────┤
│  Tab Bar: [Signals][Vol][Regimes][MC][Portfolio][BT][Risk][Stress][F] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────┐  ┌───────────────────────────┐ │
│  │                                  │  │                           │ │
│  │   HERO CANVAS                    │  │  KPI STRIP (6 metrics)   │ │
│  │   (Pretext-rendered main viz)    │  │  ┌─────┐┌─────┐┌─────┐  │ │
│  │                                  │  │  │ 23% ││ 0.82││Storm│  │ │
│  │   - Volatility: Storm eye        │  │  │ vol ││Shrpe││Regme│  │ │
│  │   - Monte Carlo: Path cascade    │  │  └─────┘└─────┘└─────┘  │ │
│  │   - Portfolio: Orbital chart      │  │  ┌─────┐┌─────┐┌─────┐  │ │
│  │   - Risk: Seismograph pulse       │  │  │ 72  ││-12% ││ 0.4 │  │ │
│  │                                  │  │  │Score││ VaR ││ Beta│  │ │
│  │   Interactive: hover, click       │  │  └─────┘└─────┘└─────┘  │ │
│  │   Animated: 60fps Pretext         │  │                           │ │
│  │                                  │  ├───────────────────────────┤ │
│  │   Height: 50vh (responsive)       │  │                           │ │
│  │                                  │  │  AI INSIGHT PANEL          │ │
│  └──────────────────────────────────┘  │  "Volatility is in storm   │ │
│                                        │   regime — YZ estimator     │ │
│                                        │   diverges from Parkinson   │ │
│                                        │   suggesting overnight      │ │
│                                        │   gaps drive risk..."       │ │
│                                        │                           │ │
│                                        └───────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  DETAIL PANELS (tab-specific charts, tables, breakdowns)        │ │
│  │  Standard Recharts / Tables below the hero canvas               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  COMPARISON MODE (when active)                                   │ │
│  │  Side-by-side: Ticker A canvas | Ticker B canvas                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌────────────────────────┐
│ Simulation Lab   [?]   │
├────────────────────────┤
│ [Tab pills - scrollH]  │
├────────────────────────┤
│                        │
│  HERO CANVAS           │
│  (full-width, 40vh)    │
│                        │
├────────────────────────┤
│  KPI STRIP (2-col)     │
│  ┌─────┐ ┌─────┐      │
│  │ 23% │ │ 0.82│      │
│  └─────┘ └─────┘      │
├────────────────────────┤
│  AI INSIGHT (collapsed)│
├────────────────────────┤
│  DETAIL PANELS         │
│  (stacked, scrollable) │
└────────────────────────┘
```

---

## 7. Per-Tab Pretext Canvas Specs

### 7.1 Volatility — "Storm Eye"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              . * .  particles drift inward                  │
│           .  *    .                                         │
│         *    ┌────────┐    .                                │
│        .     │ STORM  │     *   ← regime label floats      │
│       .      │  EYE   │      .     with glow matching      │
│        *     │  ◉     │     .      current regime          │
│         .    └────────┘    *                                │
│           *    .    .   .      Estimator beams radiate      │
│         ─────YZ──────────→     from center (5 beams for    │
│         ─────PK──────────→     5 estimators), length =     │
│         ─────GK──────────→     current vol estimate        │
│         ─────RS──────────→                                  │
│         ─────CC──────────→     Beam brightness = how far   │
│              .  *  .           from historical median       │
│                                                             │
│  Hover beam → tooltip shows estimator name + value          │
│  Regime change → eye color transitions with pulse           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Monte Carlo — "Probability Cascade"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Current                                         p95       │
│  Price ●───────────────────────────────── ╱ ── ── ──       │
│        │  ╲                            ╱  ╱                 │
│        │    ╲ ── ── p75 ──────── ╱── ╱                     │
│        │       ╲            ╱──╱                            │
│        │         ── median ──                               │
│        │       ╱            ╲──╲                            │
│        │    ╱ ── ── p25 ──────── ╲── ╲                     │
│        │  ╱                            ╲  ╲                 │
│        │───────────────────────────────── ╲ ── ── ──       │
│                                               p5            │
│                                                             │
│  10,000 paths rendered as density heatmap (canvas pixels)   │
│  Percentile ribbons glow with brand colors                  │
│  Sample paths (50) fade in/out as thin trails               │
│  Final distribution histogram animates on right edge        │
│                                                             │
│  Hover on any day → vertical crosshair shows percentiles    │
│  Drag target line → live P(price >= target) updates         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Portfolio — "Orbital Allocation"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ╱ TCS (8%)                               │
│               INFY ○  ╱                                     │
│              (12%) ╲╱                                       │
│                        ● RELIANCE (18%)                     │
│             ╱                  ╲                             │
│       HDFCBANK ○                ○ ITC (10%)                 │
│        (15%)  ╱   ┌──────────┐   ╲                         │
│              ╱    │  Sharpe  │    ╲                         │
│                   │  1.42    │      SBIN ○ (7%)             │
│                   │ Max Shrp │                              │
│                   └──────────┘                              │
│                                                             │
│  Stocks orbit center. Distance = volatility contribution.   │
│  Circle size = portfolio weight. Color = sector.            │
│  Center shows recommended strategy metrics.                 │
│  Hover stock → pull it toward center with spring physics.   │
│  Strategy switch → orbits rearrange with easing.            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Risk Score — "Seismograph Pulse"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│           ┌─── SCORE ───┐                                   │
│           │             │                                   │
│           │     72      │  ← counting-up animation          │
│           │   /  99     │     with spring overshoot          │
│           │             │                                   │
│           └─────────────┘                                   │
│                                                             │
│  ────────────╱╲╱╲────╱╲╱╲╱╲──────╱╲────────────────────    │
│              seismograph trace — amplitude = risk level      │
│                                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Market│ │Concen│ │ Vol  │ │ Tail │ │Liquid│ │Correl│   │
│  │  68  │ │  82  │ │  55  │ │  71  │ │  40  │ │  65  │   │
│  │██████│ │██████│ │████  │ │██████│ │███   │ │█████ │   │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   │
│                                                             │
│  Zone bar fills from left with color gradient:              │
│  Blue(safe) → Emerald → Amber → Orange → Rose(danger)      │
│  Score number pulses gently at 0.5Hz                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.5 Regimes — "Terrain Shift"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─ GROWTH ────────┐┌─ NEUTRAL ───┐┌─ CONTRACTION ────┐   │
│  │  ╱╲ ╱╲ ╱╲      ││  ── ── ── ──││  ╲╱ ╲╱ ╲╱       │   │
│  │ ╱  ╲  ╲  ╲     ││             ││   ╲  ╱  ╱        │   │
│  │╱    ╱   ╲  ╲    ││─────────────││    ╲╱  ╱         │   │
│  │    rising terrain││  flat plain  ││ sinking terrain   │   │
│  └─────────────────┘└──────────────┘└──────────────────┘   │
│                          ▲ YOU ARE HERE                      │
│                                                             │
│  Terrain drawn as animated canvas landscape.                │
│  Current regime highlighted with glowing border.            │
│  Transition particles flow between regimes.                 │
│  Timeline below shows regime history as colored ribbon.     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.6 Backtesting — "Strategy Race"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ₹ 2.5L ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ╱── Momentum     │
│                                        ╱╱                   │
│  ₹ 2.0L ─ ─ ─ ─ ─ ─ ─ ─ ─ ── ──╱── ╱──── Max Sharpe     │
│                              ╱──╱──╱                        │
│  ₹ 1.5L ─ ─ ─ ─ ─ ──╱── ╱╱─╱                              │
│                  ╱──╱╱──╱╱                                  │
│  ₹ 1.0L ──●── ╱──╱╱──╱ ─ ─ ─ ─ ─ ─ ─ ─── Buy & Hold     │
│           START                                              │
│  ₹ 0.8L ─ ─ ─ ─ ─ ─ ─ ─ ─ ── ──╲──────── Mean Reversion  │
│                                                             │
│  Lines animate left-to-right as "race" on load.             │
│  Winning strategy has a glow trail.                         │
│  Hover line → strategy scorecard tooltip.                   │
│  Drawdown periods shown as subtle red underlays.            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Shared Canvas Patterns

### Sonar Pulse (Data Update Indicator)

```typescript
// Existing: canvasEffects.ts → drawSonarPulse()
// Use when: new data arrives, simulation completes, AI insight loads
// Radiates from the updated element with brand-violet glow
```

### Particle Field (Background Layer)

```typescript
// Existing: ParticleField.tsx
// Use in: every simulation tab as background depth layer
// Particles drift slowly, react to mouse proximity
// Density and speed reflect market volatility (if available)
```

### Gravity Headline (Section Titles)

```typescript
// Existing: GravityHeadline.tsx
// Use for: tab title animations on first load
// Words fall into place with physics-based spring
```

### Number Counter (KPI Animation)

```
// Pattern: numbers count up from 0 to target value
// Duration: 800ms with easeOutExpo
// Overshoot: slight bounce past target then settle
// Triggered: on tab switch, on data refresh
```

---

## 9. AI Integration Layer

### Per-Tab AI Insight Panel

```
┌──────────────────────────────────────────────────────────┐
│  ✦ AI Analysis                                    [↻] [▾]│
│──────────────────────────────────────────────────────────│
│                                                          │
│  Volatility is in storm regime — the Yang-Zhang          │
│  estimator at 28.4% diverges from Parkinson (22.1%),     │
│  suggesting overnight gaps are the primary risk driver.   │
│  GARCH forecasts moderation to 24% over 21 days.         │
│                                                          │
│  AI-generated analysis. Not investment advice.            │
│                                                          │
└──────────────────────────────────────────────────────────┘

Backend: GET /api/simulations/volatility/{ticker}?include_ai=true
Response: { ...metrics, ai_narrative: "..." }
Cache: 4-hour TTL per ticker+simulation
Model: GPT-4-turbo, temperature 0.3, max 400 tokens
```

### Cross-Simulation Synthesis

```
Backend: POST /api/simulations/ai/synthesize
Body: { ticker, exchange, volatility: {...}, regime: {...}, montecarlo: {...} }
Response: { narrative: "Executive summary connecting all simulations..." }
```

---

## 10. Implementation Priority

### Phase 1 — Data Foundation (Done)
- [x] S3 data lake: 291 instruments, 2.1M bars
- [x] EODHD backfill scripts
- [x] GlobalAssetSearch component
- [x] useInstrumentList hooks
- [x] AI analysis backend service

### Phase 2 — SimulationDataService (Next)
- [ ] S3 Parquet reader with LRU cache
- [ ] Replace MongoDB reads in shared.py
- [ ] Trim MongoDB to 6-month rolling window

### Phase 3 — Pretext Hero Canvases (Core Work)
- [ ] Volatility Storm Eye canvas
- [ ] Monte Carlo Probability Cascade canvas
- [ ] Portfolio Orbital Allocation canvas
- [ ] Risk Score Seismograph canvas
- [ ] Regime Terrain Shift canvas
- [ ] Backtesting Strategy Race canvas

### Phase 4 — AI + Polish
- [ ] AI Insight Panel in every tab
- [ ] Cross-simulation synthesis
- [ ] Comparison mode with dual canvases
- [ ] Mobile-responsive canvas scaling
- [ ] Keyboard shortcuts for power users

---

## 11. Key Files

### Pretext Engine
- `components/landing/pretext/PretextCanvas.tsx` — Core canvas component
- `components/landing/pretext/usePretextEngine.ts` — Text measurement hook
- `components/landing/pretext/textRenderer.ts` — Cached text renderer
- `components/landing/pretext/canvasEffects.ts` — Glow, sonar, gradient utils
- `components/landing/pretext/GravityHeadline.tsx` — Physics headline

### Simulation Landing (Reference Implementations)
- `components/landing/simulations/ProbabilityCascadeCanvas.tsx` — MC fan viz
- `components/landing/simulations/SimShowcaseCanvas.tsx` — Portfolio + Risk
- `components/landing/simulations/SimGridItemCanvas.tsx` — Grid items

### Simulation Dashboard (Targets for Redesign)
- `app/playground/page.tsx` — Tab container
- `components/playground/simulations/volatility/VolatilityDashboard.tsx`
- `components/playground/simulations/montecarlo/MonteCarloDashboard.tsx`
- `components/playground/simulations/portfolio/PortfolioDashboard.tsx`
- `components/playground/simulations/risk/RiskScoreDashboard.tsx`
- `components/playground/simulations/regimes/RegimeDashboard.tsx`
- `components/playground/simulations/backtesting/BacktestDashboard.tsx`
- `components/playground/simulations/scenarios/ScenarioDashboard.tsx`
- `components/playground/simulations/factors/FactorDashboard.tsx`

### Shared Dashboard Components
- `components/playground/simulations/shared/AIInsightPanel.tsx`
- `components/playground/simulations/shared/GlobalAssetSearch.tsx`
- `components/playground/simulations/shared/ComparisonMode.tsx`
- `components/playground/simulations/shared/DataFreshnessStrip.tsx`
- `components/playground/simulations/shared/SimKPIStrip.tsx`