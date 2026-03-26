'use client';

import React, { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';

// ─── Types ──────────────────────────────────────────────────────

export interface PortfolioFlowHeroProps {
  weights: Record<string, number>;
  sectors: Record<string, string>;
  strategyLabel: string;
  annualReturn: number;
  sharpe: number;
}

// ─── Sector Colors ──────────────────────────────────────────────

const SECTOR_COLORS: Record<string, string> = {
  'Financial Services': '#60A5FA',
  'Information Technology': '#34D399',
  'Oil & Gas': '#FB923C',
  'Consumer Goods': '#F472B6',
  'Automobile': '#A78BFA',
  'Metals & Mining': '#FBBF24',
  'Pharma': '#22D3EE',
  'Infrastructure': '#94A3B8',
  'Telecom': '#818CF8',
  // Extended palette for Indian sector names
  Banking: '#60A5FA',
  IT: '#34D399',
  FMCG: '#4ADE80',
  Auto: '#FB923C',
  Energy: '#FBBF24',
  Metals: '#94A3B8',
  Cement: '#E879F9',
  Insurance: '#38BDF8',
  Financials: '#22D3EE',
  Other: '#6B7280',
};

function getSectorColor(sector: string): string {
  return SECTOR_COLORS[sector] ?? SECTOR_COLORS.Other;
}

/** Convert hex (#RRGGBB) to "R, G, B" string */
function hexToRgb(hex: string): string {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.substring(0, 2), 16);
  const g = parseInt(raw.substring(2, 4), 16);
  const b = parseInt(raw.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// ─── Layout constants ───────────────────────────────────────────

const VB_W = 800;
const VB_H = 320;

const COL_LEFT = 40;
const COL_MID = 320;
const COL_RIGHT = 620;

const NODE_W = 120;
const PORTFOLIO_Y_TOP = 30;
const PORTFOLIO_Y_BOT = 290;
const COLUMN_Y_TOP = 20;
const COLUMN_Y_BOT = 300;
const COLUMN_USABLE = COLUMN_Y_BOT - COLUMN_Y_TOP;

const MIN_STROKE = 2;
const MAX_STROKE = 20;
const MIN_NODE_H = 16;

// ─── Data helpers ───────────────────────────────────────────────

interface SectorNode {
  name: string;
  weight: number;
  color: string;
  y: number;
  h: number;
  cy: number;
}

interface StockNode {
  ticker: string;
  weight: number;
  sector: string;
  color: string;
  y: number;
  h: number;
  cy: number;
}

function buildNodes(
  weights: Record<string, number>,
  sectors: Record<string, string>,
): { sectorNodes: SectorNode[]; stockNodes: StockNode[] } {
  // Aggregate sector weights
  const sectorWeightMap: Record<string, number> = {};
  const sectorStocks: Record<string, { ticker: string; weight: number }[]> = {};

  for (const [ticker, w] of Object.entries(weights)) {
    if (w < 0.001) continue;
    const sector = sectors[ticker] ?? 'Other';
    sectorWeightMap[sector] = (sectorWeightMap[sector] ?? 0) + w;
    if (!sectorStocks[sector]) sectorStocks[sector] = [];
    sectorStocks[sector].push({ ticker, weight: w });
  }

  // Sort sectors descending
  const sortedSectors = Object.entries(sectorWeightMap)
    .sort(([, a], [, b]) => b - a);

  // Compute total for normalization
  const totalWeight = sortedSectors.reduce((s, [, w]) => s + w, 0) || 1;

  // Build sector nodes with proportional Y positions
  const sectorGap = 4;
  const totalGaps = (sortedSectors.length - 1) * sectorGap;
  const sectorDrawable = COLUMN_USABLE - totalGaps;

  let sectorY = COLUMN_Y_TOP;
  const sectorNodes: SectorNode[] = sortedSectors.map(([name, w]) => {
    const frac = w / totalWeight;
    const h = Math.max(MIN_NODE_H, sectorDrawable * frac);
    const node: SectorNode = {
      name,
      weight: w,
      color: getSectorColor(name),
      y: sectorY,
      h,
      cy: sectorY + h / 2,
    };
    sectorY += h + sectorGap;
    return node;
  });

  // Build stock nodes (top 8 by weight)
  const allStocks = Object.entries(weights)
    .filter(([, w]) => w >= 0.001)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const stockTotalWeight = allStocks.reduce((s, [, w]) => s + w, 0) || 1;
  const stockGap = 4;
  const totalStockGaps = (allStocks.length - 1) * stockGap;
  const stockDrawable = COLUMN_USABLE - totalStockGaps;

  let stockY = COLUMN_Y_TOP;
  const stockNodes: StockNode[] = allStocks.map(([ticker, w]) => {
    const frac = w / stockTotalWeight;
    const h = Math.max(MIN_NODE_H, stockDrawable * frac);
    const sector = sectors[ticker] ?? 'Other';
    const node: StockNode = {
      ticker,
      weight: w,
      sector,
      color: getSectorColor(sector),
      y: stockY,
      h,
      cy: stockY + h / 2,
    };
    stockY += h + stockGap;
    return node;
  });

  return { sectorNodes, stockNodes };
}

/** Cubic bezier for smoother curves */
function flowPathCubic(x1: number, y1: number, x2: number, y2: number): string {
  const dx = (x2 - x1) * 0.45;
  return `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

function strokeForWeight(w: number, maxW: number): number {
  if (maxW <= 0) return MIN_STROKE;
  const norm = w / maxW;
  return MIN_STROKE + (MAX_STROKE - MIN_STROKE) * norm;
}

// ─── SVG Sub-components ─────────────────────────────────────────

function FlowPath({
  d,
  color,
  width,
  index,
  gradientId,
}: {
  d: string;
  color: string;
  width: number;
  index: number;
  gradientId: string;
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={0.65}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.65 }}
      transition={{
        pathLength: {
          duration: 0.8,
          delay: 0.1 + index * 0.05,
          type: 'spring',
          stiffness: 60,
          damping: 18,
        },
        opacity: {
          duration: 0.4,
          delay: 0.1 + index * 0.05,
        },
      }}
      style={{
        filter: `drop-shadow(0 0 4px rgba(${hexToRgb(color)}, 0.2))`,
      }}
    />
  );
}

function NodeRect({
  x,
  y,
  w,
  h,
  color,
  index,
  delay,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  index: number;
  delay: number;
}) {
  const rgb = hexToRgb(color);
  return (
    <motion.rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={4}
      fill={`rgba(${rgb}, 0.12)`}
      stroke={`rgba(${rgb}, 0.35)`}
      strokeWidth={1}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{
        duration: 0.5,
        delay: delay + index * 0.04,
        type: 'spring',
        stiffness: 100,
        damping: 18,
      }}
      style={{ transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}
    />
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function PortfolioFlowHero({
  weights,
  sectors,
  strategyLabel,
  annualReturn,
  sharpe,
}: PortfolioFlowHeroProps) {
  const { sectorNodes, stockNodes } = useMemo(
    () => buildNodes(weights, sectors),
    [weights, sectors],
  );

  // Max weights for stroke scaling
  const maxSectorW = useMemo(
    () => Math.max(...sectorNodes.map((s) => s.weight), 0.01),
    [sectorNodes],
  );
  const maxStockW = useMemo(
    () => Math.max(...stockNodes.map((s) => s.weight), 0.01),
    [stockNodes],
  );

  // Map stock tickers to their sector node for path drawing
  const sectorByName = useMemo(() => {
    const m: Record<string, SectorNode> = {};
    for (const s of sectorNodes) m[s.name] = s;
    return m;
  }, [sectorNodes]);

  // Portfolio node center
  const portfolioCy = (PORTFOLIO_Y_TOP + PORTFOLIO_Y_BOT) / 2;
  const portfolioH = PORTFOLIO_Y_BOT - PORTFOLIO_Y_TOP;

  // Return formatting
  const fmtReturn = annualReturn >= 0
    ? `+${(annualReturn * 100).toFixed(1)}%`
    : `${(annualReturn * 100).toFixed(1)}%`;

  // Unique gradient IDs (SSR-safe — useId is deterministic across server/client)
  const rawId = useId();
  const uid = rawId.replace(/:/g, '');

  if (sectorNodes.length === 0) {
    return null;
  }

  return (
    <div className={cn(S.card, 'relative overflow-hidden min-h-[200px] md:min-h-[300px]')}>
      {/* Strategy label */}
      <motion.div
        className="absolute top-3 left-4 z-10"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <span className={cn(T.badge, 'text-amber-400/70 uppercase tracking-widest')}>
          Capital Flow
        </span>
      </motion.div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter */}
          <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle ambient glow for center metrics */}
          <filter id={`glow-center-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Portfolio node gradient */}
          <linearGradient id={`grad-portfolio-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.15)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.08)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0.15)" />
          </linearGradient>

          {/* Per-sector flow gradients (left → mid) */}
          {sectorNodes.map((s) => {
            const rgb = hexToRgb(s.color);
            return (
              <linearGradient
                key={`grad-flow-l-${s.name}`}
                id={`grad-flow-l-${uid}-${s.name.replace(/\s+/g, '-')}`}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor={`rgba(251, 191, 36, 0.5)`} />
                <stop offset="40%" stopColor={`rgba(${rgb}, 0.45)`} />
                <stop offset="100%" stopColor={`rgba(${rgb}, 0.6)`} />
              </linearGradient>
            );
          })}

          {/* Per-sector flow gradients (mid → right) */}
          {sectorNodes.map((s) => {
            const rgb = hexToRgb(s.color);
            return (
              <linearGradient
                key={`grad-flow-r-${s.name}`}
                id={`grad-flow-r-${uid}-${s.name.replace(/\s+/g, '-')}`}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor={`rgba(${rgb}, 0.6)`} />
                <stop offset="60%" stopColor={`rgba(${rgb}, 0.45)`} />
                <stop offset="100%" stopColor={`rgba(${rgb}, 0.3)`} />
              </linearGradient>
            );
          })}

          {/* Noise texture for glass effect */}
          <filter id={`noise-${uid}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.03" />
            </feComponentTransfer>
          </filter>
        </defs>

        {/* Subtle background noise texture */}
        <rect
          x="0"
          y="0"
          width={VB_W}
          height={VB_H}
          fill="transparent"
          filter={`url(#noise-${uid})`}
          opacity={0.5}
        />

        {/* ── Flow paths: Portfolio → Sectors ── */}
        {sectorNodes.map((s, i) => {
          const sw = strokeForWeight(s.weight, maxSectorW);
          const gradId = `grad-flow-l-${uid}-${s.name.replace(/\s+/g, '-')}`;
          return (
            <FlowPath
              key={`path-l-${s.name}`}
              d={flowPathCubic(
                COL_LEFT + NODE_W,
                portfolioCy,
                COL_MID,
                s.cy,
              )}
              color={s.color}
              width={sw}
              index={i}
              gradientId={gradId}
            />
          );
        })}

        {/* ── Flow paths: Sectors → Stocks ── */}
        {stockNodes.map((st, i) => {
          const sectorNode = sectorByName[st.sector];
          if (!sectorNode) return null;
          const sw = strokeForWeight(st.weight, maxStockW);
          const gradId = `grad-flow-r-${uid}-${st.sector.replace(/\s+/g, '-')}`;
          return (
            <FlowPath
              key={`path-r-${st.ticker}`}
              d={flowPathCubic(
                COL_MID + NODE_W,
                sectorNode.cy,
                COL_RIGHT,
                st.cy,
              )}
              color={st.color}
              width={sw}
              index={sectorNodes.length + i}
              gradientId={gradId}
            />
          );
        })}

        {/* ── Portfolio Node (left) ── */}
        <motion.rect
          x={COL_LEFT}
          y={PORTFOLIO_Y_TOP}
          width={NODE_W}
          height={portfolioH}
          rx={8}
          fill={`url(#grad-portfolio-${uid})`}
          stroke="rgba(251, 191, 36, 0.25)"
          strokeWidth={1}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 80, damping: 16 }}
          style={{ transformOrigin: `${COL_LEFT}px ${portfolioCy}px` }}
        />
        <motion.text
          x={COL_LEFT + NODE_W / 2}
          y={portfolioCy - 8}
          textAnchor="middle"
          className="fill-amber-400 text-[11px] font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Portfolio
        </motion.text>
        <motion.text
          x={COL_LEFT + NODE_W / 2}
          y={portfolioCy + 10}
          textAnchor="middle"
          className="fill-white/30 text-[9px] font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          100%
        </motion.text>

        {/* ── Sector Nodes (middle) ── */}
        {sectorNodes.map((s, i) => {
          const rgb = hexToRgb(s.color);
          return (
            <g key={`sector-${s.name}`}>
              <NodeRect
                x={COL_MID}
                y={s.y}
                w={NODE_W}
                h={s.h}
                color={s.color}
                index={i}
                delay={0.2}
              />
              {/* Sector label */}
              {s.h >= 14 && (
                <motion.text
                  x={COL_MID + NODE_W / 2}
                  y={s.cy + (s.h >= 28 ? -4 : 1)}
                  textAnchor="middle"
                  className="text-[8px] font-semibold"
                  fill={`rgba(${rgb}, 0.9)`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                >
                  {s.name.length > 14 ? `${s.name.slice(0, 12)}..` : s.name}
                </motion.text>
              )}
              {/* Weight % */}
              {s.h >= 28 && (
                <motion.text
                  x={COL_MID + NODE_W / 2}
                  y={s.cy + 9}
                  textAnchor="middle"
                  className="text-[7px] font-mono"
                  fill="rgba(255,255,255,0.3)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 + i * 0.04 }}
                >
                  {(s.weight * 100).toFixed(1)}%
                </motion.text>
              )}
            </g>
          );
        })}

        {/* ── Stock Nodes (right) ── */}
        {stockNodes.map((st, i) => {
          const rgb = hexToRgb(st.color);
          return (
            <g key={`stock-${st.ticker}`}>
              <NodeRect
                x={COL_RIGHT}
                y={st.y}
                w={NODE_W}
                h={st.h}
                color={st.color}
                index={i}
                delay={0.35}
              />
              {/* Ticker */}
              {st.h >= 14 && (
                <motion.text
                  x={COL_RIGHT + NODE_W / 2}
                  y={st.cy + (st.h >= 28 ? -4 : 1)}
                  textAnchor="middle"
                  className="text-[8px] font-mono font-semibold"
                  fill={`rgba(${rgb}, 0.85)`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                >
                  {st.ticker}
                </motion.text>
              )}
              {/* Weight */}
              {st.h >= 28 && (
                <motion.text
                  x={COL_RIGHT + NODE_W / 2}
                  y={st.cy + 9}
                  textAnchor="middle"
                  className="text-[7px] font-mono"
                  fill="rgba(255,255,255,0.3)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 + i * 0.04 }}
                >
                  {(st.weight * 100).toFixed(1)}%
                </motion.text>
              )}
            </g>
          );
        })}

        {/* ── Column headers ── */}
        <motion.text
          x={COL_MID + NODE_W / 2}
          y={10}
          textAnchor="middle"
          className="text-[8px] uppercase tracking-[0.12em] font-semibold fill-white/20"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Sectors
        </motion.text>
        <motion.text
          x={COL_RIGHT + NODE_W / 2}
          y={10}
          textAnchor="middle"
          className="text-[8px] uppercase tracking-[0.12em] font-semibold fill-white/20"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          Top Holdings
        </motion.text>

        {/* ── Center Overlay: Strategy + Metrics ── */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {/* Frosted glass background */}
          <rect
            x={360}
            y={120}
            width={120}
            height={80}
            rx={10}
            fill="rgba(10, 12, 20, 0.55)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />

          {/* Strategy label */}
          <text
            x={420}
            y={140}
            textAnchor="middle"
            className="text-[8px] uppercase tracking-[0.14em] font-semibold"
            fill="rgba(255,255,255,0.35)"
          >
            {strategyLabel}
          </text>

          {/* Annual return (hero number) */}
          <text
            x={420}
            y={166}
            textAnchor="middle"
            className="text-[20px] font-bold font-mono"
            fill="#FBBF24"
            filter={`url(#glow-center-${uid})`}
          >
            {fmtReturn}
          </text>

          {/* Sharpe label */}
          <text
            x={420}
            y={185}
            textAnchor="middle"
            className="text-[9px] font-mono"
            fill="rgba(255,255,255,0.35)"
          >
            Sharpe {sharpe.toFixed(2)}
          </text>
        </motion.g>

        {/* ── Decorative: subtle grid lines ── */}
        <line
          x1={COL_LEFT + NODE_W + 10}
          y1={VB_H / 2}
          x2={COL_MID - 10}
          y2={VB_H / 2}
          stroke="rgba(255,255,255,0.02)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        <line
          x1={COL_MID + NODE_W + 10}
          y1={VB_H / 2}
          x2={COL_RIGHT - 10}
          y2={VB_H / 2}
          stroke="rgba(255,255,255,0.02)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
      </svg>
    </div>
  );
}
