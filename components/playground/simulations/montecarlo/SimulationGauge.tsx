'use client';

import React, { useId, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ISimulationVerdict, IQualityScore } from '@/types/simulation';
import { getVerdictConfig, fmtQuality } from './mc-tokens';
import { S } from '@/components/playground/pyramid/tokens';

// ─── Props ──────────────────────────────────────────────────────────

interface Props {
  verdict: ISimulationVerdict;
  qualityScore: IQualityScore | null;
  className?: string;
}

// ─── Arc Geometry ───────────────────────────────────────────────────

const CX = 130;
const CY = 130;
const RADIUS = 105;
const START_ANGLE = -225;
const END_ANGLE = 45;
const SWEEP = END_ANGLE - START_ANGLE; // 270 degrees
const ARC_LENGTH = 2 * Math.PI * RADIUS * (SWEEP / 360);

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/** Full 270-degree background arc path */
const FULL_ARC = describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE);

// ─── Particle ───────────────────────────────────────────────────────

function Particle({ index, color }: { index: number; color: string }) {
  const angle = (index * 137.5) % 360;
  const radius = 85 + (index % 3) * 5; // 85-95 range
  const cx = CX + Math.cos((angle * Math.PI) / 180) * radius;
  const cy = CY + Math.sin((angle * Math.PI) / 180) * radius;
  const opacity = 0.2 + (index % 3) * 0.1; // 0.2-0.4

  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={2}
      fill={color}
      opacity={opacity}
      animate={{ opacity: [0.1, 0.4, 0.1] }}
      transition={{
        duration: 2 + (index % 5) * 0.2,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: index * 0.2,
      }}
    />
  );
}

// ─── SimulationGauge ────────────────────────────────────────────────

export function SimulationGauge({ verdict, qualityScore, className }: Props) {
  const gId = useId();
  const prefersReducedMotion = useReducedMotion();
  const config = getVerdictConfig(verdict.verdict);

  const score = Math.max(0, Math.min(1, verdict.score));
  const confidence = Math.max(0, Math.min(1, verdict.confidence));

  // Foreground arc: map score to partial arc endpoint
  const scoreEndAngle = START_ANGLE + SWEEP * score;
  const foregroundArc =
    score > 0.001
      ? describeArc(CX, CY, RADIUS, START_ANGLE, scoreEndAngle)
      : '';

  // Dash values for animated partial stroke
  const fillLength = ARC_LENGTH * score;
  const dashArray = `${fillLength} ${ARC_LENGTH}`;

  // Particles
  const particleCount = prefersReducedMotion ? 0 : config.particles;
  const particles = useMemo(
    () => Array.from({ length: particleCount }, (_, i) => i),
    [particleCount],
  );

  // Quality text
  const qualityText = qualityScore
    ? `${fmtQuality(qualityScore.compositeScore)} Quality`
    : '';

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-center">
        <svg
          viewBox="0 0 260 260"
          className="w-[200px] h-[200px] md:w-[260px] md:h-[260px]"
          role="img"
          aria-label="Monte Carlo simulation gauge"
        >
          <defs>
            <linearGradient id={`${gId}-mc-gauge-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#4ADE80" />
            </linearGradient>
          </defs>

          {/* Background arc (full 270 degrees) */}
          <path
            d={FULL_ARC}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={12}
            strokeLinecap="round"
          />

          {/* Glow ring (pulsing) */}
          {foregroundArc && (
            <motion.path
              d={FULL_ARC}
              fill="none"
              stroke={config.hex}
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={dashArray}
              animate={{ opacity: [0.05, 0.15, 0.05] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Foreground arc (animated partial stroke) */}
          {foregroundArc && (
            <motion.path
              d={FULL_ARC}
              fill="none"
              stroke={`url(#${gId}-mc-gauge-gradient)`}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
              initial={{ strokeDashoffset: ARC_LENGTH }}
              animate={{ strokeDashoffset: ARC_LENGTH - fillLength }}
              transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              style={{
                filter: `drop-shadow(0 0 8px rgba(${config.rgb}, 0.3))`,
              }}
            />
          )}

          {/* Particles */}
          {particles.map((i) => (
            <Particle key={i} index={i} color={config.hex} />
          ))}

          {/* Center text: verdict label */}
          <text
            x={CX}
            y={125}
            textAnchor="middle"
            fill={config.hex}
            fontSize={22}
            fontWeight={700}
          >
            {config.label}
          </text>

          {/* Center text: confidence percentage */}
          <text
            x={CX}
            y={155}
            textAnchor="middle"
            fill="white"
            fontSize={32}
            fontWeight={800}
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {Math.round(confidence * 100)}%
          </text>

          {/* Center text: quality badge */}
          {qualityText && (
            <text
              x={CX}
              y={175}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize={10}
            >
              {qualityText}
            </text>
          )}
        </svg>

        {/* Description below SVG */}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed mt-3">
          {verdict.description}
        </p>
      </div>
    </motion.div>
  );
}
