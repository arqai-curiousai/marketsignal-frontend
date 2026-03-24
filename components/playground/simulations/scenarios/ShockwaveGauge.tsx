'use client';

import React, { useMemo } from 'react';
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import { deltaColor, fmtPct, fmtPctAbs } from './scenario-tokens';

// ─── Types ──────────────────────────────────────────────────────

export interface ShockwaveGaugeProps {
  baselineReturn: number; // e.g. 0.12
  stressedReturn: number; // e.g. -0.08
  baselineVol: number; // e.g. 0.18
  stressedVol: number; // e.g. 0.45
  baselineSharpe: number; // e.g. 1.2
  stressedSharpe: number; // e.g. -0.3
  baselineVaR: number; // e.g. 0.025
  stressedVaR: number; // e.g. 0.065
  scenarioLabel: string; // e.g. "COVID Crash"
  className?: string;
}

// ─── Constants ──────────────────────────────────────────────────

const VB_W = 720;
const VB_H = 280;

// Gauge geometry
const GAUGE_R = 100;
const GAUGE_STROKE = 7;

// Left gauge center
const L_CX = 180;
const L_CY = 200;

// Right gauge center
const R_CX = 540;
const R_CY = 200;

// Sharpe range for arc mapping
const SHARPE_MIN = -1;
const SHARPE_MAX = 3;

// Arc sweep (semi-circular = 180 degrees)
const ARC_SWEEP_DEG = 180;
const ARC_START_DEG = 180; // starts at 9-o'clock, sweeps clockwise

// ─── Helpers ────────────────────────────────────────────────────

/** Map a Sharpe value to 0-1 fraction within the gauge range */
function sharpeToFraction(sharpe: number): number {
  return Math.max(0, Math.min(1, (sharpe - SHARPE_MIN) / (SHARPE_MAX - SHARPE_MIN)));
}

/** Convert polar to cartesian for arc endpoint calculation */
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** Build an SVG arc path from startAngle to endAngle */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** Format a return number as signed percentage for the big center readout */
function fmtReturnBig(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${(val * 100).toFixed(1)}%`;
}

/** Format Sharpe ratio */
function fmtSharpe(val: number): string {
  return val.toFixed(2);
}

// ─── Calm Particle (baseline side) ────────────────────────────

function CalmParticle({ index, cx, cy }: { index: number; cx: number; cy: number }) {
  const baseAngle = (index * 97) % 360;
  const radius = 60 + (index % 3) * 25;
  const size = 1.2 + (index % 3) * 0.5;
  const duration = 5 + (index % 3) * 2;

  const startX = cx + Math.cos((baseAngle * Math.PI) / 180) * radius * 0.5;
  const startY = cy + Math.sin((baseAngle * Math.PI) / 180) * radius * 0.5 - 10;

  return (
    <motion.circle
      r={size}
      fill="#60A5FA"
      initial={{ cx: startX, cy: startY, opacity: 0 }}
      animate={{
        cx: [startX, startX + (index % 2 === 0 ? 8 : -8), startX],
        cy: [startY, startY - 20 - index * 5, startY],
        opacity: [0, 0.3, 0.15, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1.5 + index * 0.4,
      }}
    />
  );
}

// ─── Agitated Particle (stressed side) ─────────────────────────

function AgitatedParticle({ index, cx, cy }: { index: number; cx: number; cy: number }) {
  const baseAngle = (index * 137.5) % 360;
  const radius = 50 + (index % 4) * 20;
  const size = 1.0 + (index % 3) * 0.6;
  const duration = 2 + (index % 3) * 0.8;

  const sx = cx + Math.cos((baseAngle * Math.PI) / 180) * radius * 0.4;
  const sy = cy + Math.sin((baseAngle * Math.PI) / 180) * radius * 0.4;
  const mx = cx + Math.cos(((baseAngle + 40) * Math.PI) / 180) * radius;
  const my = cy + Math.sin(((baseAngle + 40) * Math.PI) / 180) * radius;
  const ex = cx + Math.cos(((baseAngle + 90) * Math.PI) / 180) * radius * 0.7;
  const ey = cy + Math.sin(((baseAngle + 90) * Math.PI) / 180) * radius * 0.7;

  return (
    <motion.circle
      r={size}
      fill="#FB923C"
      initial={{ cx: sx, cy: sy, opacity: 0 }}
      animate={{
        cx: [sx, mx, ex, sx],
        cy: [sy, my, ey, sy],
        opacity: [0, 0.45, 0.25, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1.5 + index * 0.25,
      }}
    />
  );
}

// ─── Semi-circular Arc Gauge ───────────────────────────────────

interface ArcGaugeProps {
  cx: number;
  cy: number;
  fraction: number; // 0-1
  trackColor: string;
  fillGradientId: string;
  glowColor: string;
  delay: number;
}

function ArcGauge({
  cx,
  cy,
  fraction,
  trackColor,
  fillGradientId,
  glowColor,
  delay,
}: ArcGaugeProps) {
  const trackPath = describeArc(cx, cy, GAUGE_R, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG);
  const fillEndAngle = ARC_START_DEG + ARC_SWEEP_DEG * Math.max(0.01, fraction);
  const fillPath = describeArc(cx, cy, GAUGE_R, ARC_START_DEG, fillEndAngle);

  // Compute total arc length for stroke animation
  const arcLength = (Math.PI * GAUGE_R * ARC_SWEEP_DEG) / 180;
  const fillLength = arcLength * Math.max(0.01, fraction);

  return (
    <g>
      {/* Track */}
      <path
        d={trackPath}
        fill="none"
        stroke={trackColor}
        strokeWidth={GAUGE_STROKE}
        strokeLinecap="round"
        opacity={0.15}
      />

      {/* Fill arc */}
      <motion.path
        d={fillPath}
        fill="none"
        stroke={`url(#${fillGradientId})`}
        strokeWidth={GAUGE_STROKE}
        strokeLinecap="round"
        strokeDasharray={fillLength}
        strokeDashoffset={fillLength}
        initial={{ strokeDashoffset: fillLength }}
        animate={{ strokeDashoffset: 0 }}
        transition={{
          duration: 0.5,
          delay,
          type: 'spring',
          stiffness: 80,
          damping: 20,
        }}
        style={{
          filter: `drop-shadow(0 0 6px ${glowColor})`,
        }}
      />

      {/* Glow ring */}
      <motion.path
        d={fillPath}
        fill="none"
        stroke={glowColor}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0}
        animate={{ opacity: [0.08, 0.2, 0.08] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 }}
      />

      {/* Tick marks at 0, 0.5, 1 */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const angle = ARC_START_DEG + ARC_SWEEP_DEG * t;
        const inner = polarToCartesian(cx, cy, GAUGE_R - 12, angle);
        const outer = polarToCartesian(cx, cy, GAUGE_R - 6, angle);
        return (
          <line
            key={t}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

// ─── Animated Number (counts from 0 to target) ─────────────────

function AnimatedNumber({
  value,
  format,
  className,
  delay = 0,
}: {
  value: number;
  format: (v: number) => string;
  className?: string;
  delay?: number;
}) {
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => format(v));

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      spring.set(value);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [spring, value, delay]);

  return <motion.tspan className={className}>{display}</motion.tspan>;
}

// ─── Lightning Bolt Path ────────────────────────────────────────

const BOLT_PATH =
  'M 360 20 L 352 65 L 366 68 L 348 120 L 370 118 L 345 175 L 375 170 L 350 225 L 368 222 L 355 260';

// ─── Main Component ────────────────────────────────────────────

export function ShockwaveGauge({
  baselineReturn,
  stressedReturn,
  baselineVol,
  stressedVol,
  baselineSharpe,
  stressedSharpe,
  baselineVaR,
  stressedVaR,
  scenarioLabel,
  className,
}: ShockwaveGaugeProps) {
  const prefersReduced = useReducedMotion();

  const baselineFraction = sharpeToFraction(baselineSharpe);
  const stressedFraction = sharpeToFraction(stressedSharpe);

  // Particle arrays (hidden in reduced motion or on server)
  const calmParticles = useMemo(
    () => (prefersReduced ? [] : Array.from({ length: 4 }, (_, i) => i)),
    [prefersReduced],
  );
  const agitatedParticles = useMemo(
    () => (prefersReduced ? [] : Array.from({ length: 5 }, (_, i) => i)),
    [prefersReduced],
  );

  // Bottom metrics strip data
  const metrics = useMemo(
    () => [
      {
        label: 'Return',
        baseline: fmtPct(baselineReturn),
        stressed: fmtPct(stressedReturn),
        delta: stressedReturn - baselineReturn,
      },
      {
        label: 'Volatility',
        baseline: fmtPctAbs(baselineVol),
        stressed: fmtPctAbs(stressedVol),
        delta: stressedVol - baselineVol,
      },
      {
        label: 'Sharpe',
        baseline: fmtSharpe(baselineSharpe),
        stressed: fmtSharpe(stressedSharpe),
        delta: stressedSharpe - baselineSharpe,
      },
      {
        label: 'VaR 95%',
        baseline: fmtPctAbs(baselineVaR),
        stressed: fmtPctAbs(stressedVaR),
        delta: stressedVaR - baselineVaR,
      },
    ],
    [
      baselineReturn,
      stressedReturn,
      baselineVol,
      stressedVol,
      baselineSharpe,
      stressedSharpe,
      baselineVaR,
      stressedVaR,
    ],
  );

  return (
    <div className={cn('w-full', className)}>
      {/* ── Scenario label ── */}
      <motion.div
        className="flex items-center justify-center mb-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span
          className={cn(
            T.badge,
            'px-3 py-1 rounded-full',
            'bg-orange-500/10 text-orange-400 border border-orange-500/20',
          )}
        >
          {scenarioLabel}
        </span>
      </motion.div>

      {/* ── SVG Gauge ── */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
        role="img"
        aria-label={`Shockwave gauge comparing baseline and stressed portfolio for ${scenarioLabel}`}
      >
        <defs>
          {/* Baseline gradient (calm blue) */}
          <linearGradient id="sw-grad-baseline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          {/* Stressed gradient (orange to red) */}
          <linearGradient id="sw-grad-stressed" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>

          {/* Lightning glow filter */}
          <filter id="shockwave-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Flash pulse filter (brighter glow) */}
          <filter id="shockwave-flash" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle vignette for each gauge half */}
          <radialGradient id="sw-vignette-left" cx="0.25" cy="0.7" r="0.4">
            <stop offset="0%" stopColor="rgba(96,165,250,0.06)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </radialGradient>
          <radialGradient id="sw-vignette-right" cx="0.75" cy="0.7" r="0.4">
            <stop offset="0%" stopColor="rgba(251,146,60,0.06)" />
            <stop offset="100%" stopColor="rgba(251,146,60,0)" />
          </radialGradient>
        </defs>

        {/* Ambient vignettes */}
        <rect x="0" y="0" width={VB_W / 2} height={VB_H} fill="url(#sw-vignette-left)" />
        <rect x={VB_W / 2} y="0" width={VB_W / 2} height={VB_H} fill="url(#sw-vignette-right)" />

        {/* ─── Left Half: Baseline ─── */}
        <ArcGauge
          cx={L_CX}
          cy={L_CY}
          fraction={baselineFraction}
          trackColor="#60A5FA"
          fillGradientId="sw-grad-baseline"
          glowColor="rgba(96,165,250,0.35)"
          delay={0}
        />

        {/* Baseline center value */}
        <text
          x={L_CX}
          y={L_CY - 32}
          textAnchor="middle"
          className="fill-blue-400 font-mono text-[28px] font-bold"
        >
          <AnimatedNumber
            value={baselineReturn}
            format={fmtReturnBig}
            delay={0.2}
          />
        </text>

        {/* Sharpe sub-value */}
        <text
          x={L_CX}
          y={L_CY - 8}
          textAnchor="middle"
          className="fill-white/30 font-mono text-[11px]"
        >
          Sharpe {fmtSharpe(baselineSharpe)}
        </text>

        {/* "Baseline" label */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <rect
            x={L_CX - 30}
            y={L_CY + 8}
            width={60}
            height={18}
            rx={9}
            fill="rgba(96,165,250,0.12)"
            stroke="rgba(96,165,250,0.2)"
            strokeWidth={0.5}
          />
          <text
            x={L_CX}
            y={L_CY + 21}
            textAnchor="middle"
            className="fill-blue-400 text-[9px] font-semibold uppercase tracking-wider"
          >
            Baseline
          </text>
        </motion.g>

        {/* Calm particles */}
        <g className="hidden md:block">
          {calmParticles.map((i) => (
            <CalmParticle key={`calm-${i}`} index={i} cx={L_CX} cy={L_CY} />
          ))}
        </g>

        {/* ─── Right Half: Stressed ─── */}
        <ArcGauge
          cx={R_CX}
          cy={R_CY}
          fraction={stressedFraction}
          trackColor="#FB923C"
          fillGradientId="sw-grad-stressed"
          glowColor="rgba(251,146,60,0.35)"
          delay={0.3}
        />

        {/* Stressed center value */}
        <text
          x={R_CX}
          y={R_CY - 32}
          textAnchor="middle"
          className="fill-red-400 font-mono text-[28px] font-bold"
        >
          <AnimatedNumber
            value={stressedReturn}
            format={fmtReturnBig}
            delay={0.5}
          />
        </text>

        {/* Sharpe sub-value */}
        <text
          x={R_CX}
          y={R_CY - 8}
          textAnchor="middle"
          className="fill-white/30 font-mono text-[11px]"
        >
          Sharpe {fmtSharpe(stressedSharpe)}
        </text>

        {/* "Stressed" label */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <rect
            x={R_CX - 32}
            y={R_CY + 8}
            width={64}
            height={18}
            rx={9}
            fill="rgba(251,146,60,0.12)"
            stroke="rgba(251,146,60,0.2)"
            strokeWidth={0.5}
          />
          <text
            x={R_CX}
            y={R_CY + 21}
            textAnchor="middle"
            className="fill-orange-400 text-[9px] font-semibold uppercase tracking-wider"
          >
            Stressed
          </text>
        </motion.g>

        {/* Agitated particles */}
        <g className="hidden md:block">
          {agitatedParticles.map((i) => (
            <AgitatedParticle key={`agit-${i}`} index={i} cx={R_CX} cy={R_CY} />
          ))}
        </g>

        {/* ─── Center Lightning Bolt Divider ─── */}
        <g filter="url(#shockwave-glow)">
          {/* Bolt shadow/underlay */}
          <motion.path
            d={BOLT_PATH}
            fill="none"
            stroke="rgba(251,146,60,0.25)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={0}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.4, delay: 0.6, ease: 'easeOut' },
              opacity: { duration: 0.1, delay: 0.6 },
            }}
          />
          {/* Bolt main stroke */}
          <motion.path
            d={BOLT_PATH}
            fill="none"
            stroke="#FB923C"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={0}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.4, delay: 0.6, ease: 'easeOut' },
              opacity: { duration: 0.1, delay: 0.6 },
            }}
          />
          {/* Bolt white core */}
          <motion.path
            d={BOLT_PATH}
            fill="none"
            stroke="white"
            strokeWidth={0.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={0}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{
              pathLength: { duration: 0.4, delay: 0.6, ease: 'easeOut' },
              opacity: { duration: 0.1, delay: 0.6 },
            }}
          />
        </g>

        {/* Flash effect (brief white opacity pulse at bolt completion) */}
        {!prefersReduced && (
          <motion.rect
            x={340}
            y={0}
            width={40}
            height={VB_H}
            fill="white"
            opacity={0}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.15, 0],
            }}
            transition={{
              duration: 0.15,
              delay: 0.6,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Center divider thin line (behind bolt, subtle) */}
        <line
          x1={360}
          y1={10}
          x2={360}
          y2={VB_H - 10}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={1}
          strokeDasharray="4 6"
        />
      </svg>

      {/* ── Bottom Metrics Strip ── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {metrics.map((m, i) => {
          // For VaR and Vol, increase is bad (red); for Return and Sharpe, decrease is bad
          const isBad =
            m.label === 'Volatility' || m.label === 'VaR 95%'
              ? m.delta > 0
              : m.delta < 0;

          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 + i * 0.05 }}
              className={cn(
                S.glass,
                'px-3 py-2.5 flex flex-col items-center text-center',
              )}
            >
              <span className={cn(T.label, 'text-white/35 mb-1.5')}>{m.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={cn(T.monoSm, 'text-blue-400/70')}>{m.baseline}</span>
                <svg width="12" height="8" viewBox="0 0 12 8" className="shrink-0">
                  <path
                    d="M 0 4 L 8 4 M 6 1.5 L 9 4 L 6 6.5"
                    fill="none"
                    stroke={isBad ? '#F87171' : '#34D399'}
                    strokeWidth={1.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className={cn(
                    T.mono,
                    isBad ? 'text-red-400' : 'text-emerald-400',
                  )}
                >
                  {m.stressed}
                </span>
              </div>
              <span
                className={cn(
                  T.monoSm,
                  'mt-1',
                  deltaColor(m.label === 'Volatility' || m.label === 'VaR 95%' ? -m.delta : m.delta),
                )}
              >
                {m.delta >= 0 ? '+' : ''}
                {(m.delta * 100).toFixed(1)}pp
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
