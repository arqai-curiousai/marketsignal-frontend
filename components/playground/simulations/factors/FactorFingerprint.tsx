'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';

// ─── Types ──────────────────────────────────────────────────────────

interface FactorDef {
  id: string;
  label: string;
  description: string;
}

export interface FactorFingerprintProps {
  factors: FactorDef[];
  portfolioTilts: Record<string, number>;
  benchmarkTilts: Record<string, number>;
  className?: string;
}

// ─── Constants ──────────────────────────────────────────────────────

const CX = 160;
const CY = 160;
const MAX_R = 120;
const SCALE_STEPS = [0, 25, 50, 75, 100];
const RING_RADII = SCALE_STEPS.map((s) => (s / 100) * MAX_R);

const VIOLET = '#A78BFA';
const VIOLET_FILL = 'rgba(167,139,250,0.08)';
const VIOLET_DELTA = 'rgba(167,139,250,0.12)';
const RED_DELTA = 'rgba(248,113,113,0.06)';
const AXIS_STROKE = 'rgba(255,255,255,0.08)';
const RING_STROKE = 'rgba(255,255,255,0.04)';
const BENCHMARK_STROKE = 'rgba(255,255,255,0.3)';

// ─── Math helpers ───────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function scoreToRadius(score: number, maxR: number) {
  return (Math.max(0, Math.min(100, score)) / 100) * maxR;
}

function pointsToPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  return (
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') +
    ' Z'
  );
}

/** Build delta wedge path between two adjacent axes (portfolio vs benchmark). */
function buildDeltaWedge(
  pA: { x: number; y: number },
  pB: { x: number; y: number },
  bA: { x: number; y: number },
  bB: { x: number; y: number },
): string {
  return [
    `M${pA.x.toFixed(2)},${pA.y.toFixed(2)}`,
    `L${pB.x.toFixed(2)},${pB.y.toFixed(2)}`,
    `L${bB.x.toFixed(2)},${bB.y.toFixed(2)}`,
    `L${bA.x.toFixed(2)},${bA.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

// ─── Tooltip ────────────────────────────────────────────────────────

interface TooltipState {
  x: number;
  y: number;
  label: string;
  portfolio: number;
  benchmark: number;
}

function FingerprintTooltip({ x, y, label, portfolio, benchmark }: TooltipState) {
  const delta = portfolio - benchmark;
  const sign = delta >= 0 ? '+' : '';
  // Position tooltip to the right of cursor, flip if near right edge
  const tx = x > 220 ? x - 110 : x + 14;
  const ty = Math.max(16, Math.min(y - 28, 280));

  return (
    <foreignObject x={tx} y={ty} width={100} height={64} style={{ overflow: 'visible' }}>
      <div
        className="rounded-lg border border-white/[0.08] px-2.5 py-1.5"
        style={{
          background: 'rgba(10,15,28,0.96)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}
      >
        <p className={cn(T.badge, 'text-white/50 mb-0.5')}>{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(T.monoSm, 'text-violet-400')}>{portfolio.toFixed(0)}</span>
          <span className={cn(T.badge, 'text-white/20')}>vs</span>
          <span className={cn(T.monoSm, 'text-white/40')}>{benchmark.toFixed(0)}</span>
        </div>
        <p
          className={cn(
            T.badge,
            delta >= 0 ? 'text-violet-400/80' : 'text-red-400/80',
          )}
        >
          {sign}{delta.toFixed(0)} delta
        </p>
      </div>
    </foreignObject>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function FactorFingerprint({
  factors,
  portfolioTilts,
  benchmarkTilts,
  className,
}: FactorFingerprintProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const n = factors.length;
  const angleStep = 360 / n;

  // Precompute axis angles and endpoint positions
  const axes = useMemo(
    () =>
      factors.map((f, i) => {
        const angle = i * angleStep;
        const endPt = polarToCartesian(CX, CY, MAX_R + 4, angle);
        const labelPt = polarToCartesian(CX, CY, MAX_R + 18, angle);
        return { ...f, angle, endPt, labelPt };
      }),
    [factors, angleStep],
  );

  // Portfolio & benchmark point arrays
  const portfolioPoints = useMemo(
    () =>
      axes.map((a) => {
        const score = portfolioTilts[a.id] ?? 50;
        const r = scoreToRadius(score, MAX_R);
        return polarToCartesian(CX, CY, r, a.angle);
      }),
    [axes, portfolioTilts],
  );

  const benchmarkPoints = useMemo(
    () =>
      axes.map((a) => {
        const score = benchmarkTilts[a.id] ?? 50;
        const r = scoreToRadius(score, MAX_R);
        return polarToCartesian(CX, CY, r, a.angle);
      }),
    [axes, benchmarkTilts],
  );

  // Build polygon paths
  const portfolioPath = useMemo(() => pointsToPath(portfolioPoints), [portfolioPoints]);
  const benchmarkPath = useMemo(() => pointsToPath(benchmarkPoints), [benchmarkPoints]);

  // Delta wedges between adjacent axis pairs
  const deltaWedges = useMemo(() => {
    const wedges: Array<{ path: string; isOverweight: boolean }> = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const pScoreI = portfolioTilts[axes[i].id] ?? 50;
      const bScoreI = benchmarkTilts[axes[i].id] ?? 50;
      const pScoreJ = portfolioTilts[axes[j].id] ?? 50;
      const bScoreJ = benchmarkTilts[axes[j].id] ?? 50;
      // Determine dominant direction for this sector
      const avgDelta = ((pScoreI - bScoreI) + (pScoreJ - bScoreJ)) / 2;
      const path = buildDeltaWedge(
        portfolioPoints[i],
        portfolioPoints[j],
        benchmarkPoints[j],
        benchmarkPoints[i],
      );
      wedges.push({ path, isOverweight: avgDelta >= 0 });
    }
    return wedges;
  }, [n, axes, portfolioTilts, benchmarkTilts, portfolioPoints, benchmarkPoints]);

  // Alignment score: 100 - mean |delta|
  const alignment = useMemo(() => {
    if (n === 0) return 0;
    const totalAbsDelta = axes.reduce((sum, a) => {
      const p = portfolioTilts[a.id] ?? 50;
      const b = benchmarkTilts[a.id] ?? 50;
      return sum + Math.abs(p - b);
    }, 0);
    return Math.round(Math.max(0, 100 - totalAbsDelta / n));
  }, [axes, portfolioTilts, benchmarkTilts, n]);

  // Dot hover handlers
  const handleDotEnter = useCallback(
    (i: number) => {
      const a = axes[i];
      const pt = portfolioPoints[i];
      setTooltip({
        x: pt.x,
        y: pt.y,
        label: a.label,
        portfolio: portfolioTilts[a.id] ?? 50,
        benchmark: benchmarkTilts[a.id] ?? 50,
      });
    },
    [axes, portfolioPoints, portfolioTilts, benchmarkTilts],
  );

  const handleDotLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className={cn(S.card, 'p-3 flex flex-col items-center', className)}>
      <h3 className={cn(T.heading, 'text-white/70 mb-1 self-start')}>Factor Fingerprint</h3>

      <svg
        viewBox="0 0 320 320"
        className="w-full max-w-[320px]"
        role="img"
        aria-label="Factor fingerprint polar chart comparing portfolio and benchmark tilts"
      >
        <defs>
          {/* Glow filter for score dots */}
          <filter id="factor-dot-glow">
            <feGaussianBlur stdDeviation="2" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Concentric scale rings ── */}
        {RING_RADII.map((r, i) =>
          r > 0 ? (
            <circle
              key={`ring-${SCALE_STEPS[i]}`}
              cx={CX}
              cy={CY}
              r={r}
              stroke={RING_STROKE}
              strokeWidth={1}
              fill="none"
            />
          ) : null,
        )}

        {/* ── Scale labels along top axis ── */}
        {SCALE_STEPS.map((s) => {
          if (s === 0) return null;
          const r = (s / 100) * MAX_R;
          return (
            <text
              key={`scale-${s}`}
              x={CX + 3}
              y={CY - r - 2}
              className="text-[8px] fill-white/20 font-mono"
              textAnchor="start"
            >
              {s}
            </text>
          );
        })}

        {/* ── Radial axis lines ── */}
        {axes.map((a) => (
          <line
            key={`axis-${a.id}`}
            x1={CX}
            y1={CY}
            x2={a.endPt.x}
            y2={a.endPt.y}
            stroke={AXIS_STROKE}
            strokeWidth={1}
          />
        ))}

        {/* ── Delta fill wedges ── */}
        {deltaWedges.map((w, i) => (
          <path
            key={`delta-${i}`}
            d={w.path}
            fill={w.isOverweight ? VIOLET_DELTA : RED_DELTA}
          />
        ))}

        {/* ── Benchmark polygon (dashed reference) ── */}
        <path
          d={benchmarkPath}
          stroke={BENCHMARK_STROKE}
          strokeWidth={1}
          strokeDasharray="4 3"
          fill="none"
        />

        {/* ── Portfolio polygon (hero, animated) ── */}
        <motion.path
          d={portfolioPath}
          stroke={VIOLET}
          strokeWidth={2.5}
          fill={VIOLET_FILL}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 0.8, type: 'spring', stiffness: 80, damping: 20 },
            opacity: { duration: 0.3 },
          }}
        />

        {/* ── Score dots on portfolio polygon ── */}
        {portfolioPoints.map((pt, i) => (
          <g key={`dot-${axes[i].id}`}>
            {/* Invisible larger hit area for hover */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={12}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => handleDotEnter(i)}
              onMouseLeave={handleDotLeave}
            />
            {/* Visible glowing dot */}
            <motion.circle
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill={VIOLET}
              filter="url(#factor-dot-glow)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 200, damping: 15 }}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        ))}

        {/* ── Axis labels ── */}
        {axes.map((a) => {
          // Adjust text-anchor based on position
          let textAnchor: 'start' | 'middle' | 'end' = 'middle';
          if (a.labelPt.x < CX - 10) textAnchor = 'end';
          else if (a.labelPt.x > CX + 10) textAnchor = 'start';

          // Slight vertical nudge for top/bottom labels
          let dy = '0.35em';
          if (a.labelPt.y < CY - MAX_R) dy = '0em';
          else if (a.labelPt.y > CY + MAX_R) dy = '0.7em';

          return (
            <text
              key={`label-${a.id}`}
              x={a.labelPt.x}
              y={a.labelPt.y}
              textAnchor={textAnchor}
              dy={dy}
              className={cn(T.badge, 'fill-white/40')}
              style={{ fontSize: 9 }}
            >
              {a.label}
            </text>
          );
        })}

        {/* ── Center alignment score ── */}
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          className="fill-violet-400 font-mono font-bold"
          style={{ fontSize: 22 }}
        >
          {alignment}
        </text>
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          className={cn(T.badge, 'fill-white/30')}
          style={{ fontSize: 9 }}
        >
          Alignment
        </text>

        {/* ── Tooltip (rendered last so it sits on top) ── */}
        {tooltip && <FingerprintTooltip {...tooltip} />}
      </svg>

      {/* ── Legend strip below chart ── */}
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: VIOLET }} />
          <span className={cn(T.badge, 'text-white/40')}>Portfolio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-0.5 rounded-full"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 3px, transparent 3px 6px)`,
            }}
          />
          <span className={cn(T.badge, 'text-white/40')}>Benchmark</span>
        </div>
      </div>
    </div>
  );
}
