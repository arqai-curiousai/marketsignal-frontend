'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ANIM } from './sim-tokens';

// ─── Types ──────────────────────────────────────────────────────

export interface GaugeZone {
  /** Fractional range start (0-1) */
  start: number;
  /** Fractional range end (0-1) */
  end: number;
  /** Zone hex color */
  hex: string;
  /** Zone label */
  label: string;
}

interface Props {
  /** Normalized value 0-1 */
  value: number;
  /** Display value (center text) */
  displayValue: string;
  /** Sub-label below value */
  subLabel?: string;
  /** Color zones on the arc */
  zones: GaugeZone[];
  /** SVG viewBox size (default 280) */
  size?: number;
  /** Number of particles (0 to disable) */
  particleCount?: number;
  /** Particle speed multiplier */
  particleSpeed?: number;
  /** Accent hex for fill and particles */
  accentHex?: string;
  /** Enable needle wobble on mount */
  wobble?: boolean;
  className?: string;
}

// ─── Particle ───────────────────────────────────────────────────

function Particle({
  index,
  color,
  speed,
  cx,
  cy,
}: {
  index: number;
  color: string;
  speed: number;
  cx: number;
  cy: number;
}) {
  const angle = (index * 137.5) % 360; // golden angle distribution
  const radius = 90 + (index % 3) * 18;
  const duration = 3 + (index % 4) * 1.5;
  const size = 1.2 + (index % 3) * 0.4;

  return (
    <motion.circle
      r={size}
      fill={color}
      opacity={0}
      initial={{
        cx: cx + Math.cos((angle * Math.PI) / 180) * (radius * 0.6),
        cy: cy + Math.sin((angle * Math.PI) / 180) * (radius * 0.6),
        opacity: 0,
      }}
      animate={{
        cx: [
          cx + Math.cos((angle * Math.PI) / 180) * (radius * 0.6),
          cx + Math.cos(((angle + 60) * Math.PI) / 180) * radius,
          cx + Math.cos(((angle + 120) * Math.PI) / 180) * (radius * 0.8),
          cx + Math.cos((angle * Math.PI) / 180) * (radius * 0.6),
        ],
        cy: [
          cy + Math.sin((angle * Math.PI) / 180) * (radius * 0.6),
          cy + Math.sin(((angle + 60) * Math.PI) / 180) * radius,
          cy + Math.sin(((angle + 120) * Math.PI) / 180) * (radius * 0.8),
          cy + Math.sin((angle * Math.PI) / 180) * (radius * 0.6),
        ],
        opacity: [0, 0.35 * speed, 0.18 * speed, 0],
      }}
      transition={{
        duration: duration / Math.max(0.1, speed),
        repeat: Infinity,
        ease: 'easeInOut',
        delay: index * 0.3,
      }}
    />
  );
}

// ─── Component ──────────────────────────────────────────────────

const GAUGE_RADIUS = 100;
const GAUGE_STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
const ARC_FRACTION = 0.75; // 270-degree arc
const ARC_LENGTH = CIRCUMFERENCE * ARC_FRACTION;
const START_ANGLE = 135; // arc starts at bottom-left (135deg)

export function SimGauge({
  value,
  displayValue,
  subLabel,
  zones,
  size = 280,
  particleCount = 0,
  particleSpeed = 0.5,
  accentHex = '#818CF8',
  wobble = false,
  className,
}: Props) {
  const prefersReduced = useReducedMotion();
  const center = size / 2;

  const clampedValue = Math.max(0, Math.min(1, value));

  // Spring-animated value for needle
  const springConfig = wobble ? ANIM.springWobble : ANIM.springGauge;
  const springValue = useSpring(clampedValue * 270, springConfig);
  const needleAngle = useTransform(springValue, (v) => v + START_ANGLE);

  // Arc fill
  const fillLength = ARC_LENGTH * clampedValue;
  const dashOffset = ARC_LENGTH - fillLength;

  // Active zone color
  const activeZone = zones.find((z) => clampedValue >= z.start && clampedValue <= z.end) ?? zones[0];

  // Particles
  const pCount = prefersReduced ? 0 : particleCount;
  const particles = useMemo(
    () => Array.from({ length: pCount }, (_, i) => i),
    [pCount],
  );

  return (
    <motion.div
      className={cn('relative', className)}
      whileHover={prefersReduced ? undefined : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Glow ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={GAUGE_RADIUS + 10}
          fill="none"
          stroke={activeZone?.hex ?? accentHex}
          strokeWidth={1}
          opacity={0}
          animate={prefersReduced ? { opacity: 0.06 } : { opacity: [0.03, 0.08, 0.03] }}
          transition={prefersReduced ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Zone arcs */}
        {zones.map((zone) => {
          const zoneStart = zone.start * ARC_LENGTH;
          const zoneLen = (zone.end - zone.start) * ARC_LENGTH;
          return (
            <circle
              key={zone.label}
              cx={center}
              cy={center}
              r={GAUGE_RADIUS}
              fill="none"
              stroke={zone.hex}
              strokeWidth={GAUGE_STROKE}
              strokeDasharray={`${zoneLen} ${ARC_LENGTH - zoneLen}`}
              strokeDashoffset={-zoneStart}
              strokeLinecap="round"
              opacity={0.2}
              transform={`rotate(${START_ANGLE} ${center} ${center})`}
            />
          );
        })}

        {/* Background arc */}
        <circle
          cx={center}
          cy={center}
          r={GAUGE_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={GAUGE_STROKE}
          strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE - ARC_LENGTH}`}
          strokeLinecap="round"
          transform={`rotate(${START_ANGLE} ${center} ${center})`}
        />

        {/* Fill arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={GAUGE_RADIUS}
          fill="none"
          stroke={activeZone?.hex ?? accentHex}
          strokeWidth={GAUGE_STROKE}
          strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE - ARC_LENGTH}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(${START_ANGLE} ${center} ${center})`}
          initial={prefersReduced ? {} : { strokeDashoffset: ARC_LENGTH }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: 'spring', ...springConfig }}
        />

        {/* Needle */}
        <motion.line
          x1={center}
          y1={center}
          x2={center}
          y2={center - GAUGE_RADIUS + 15}
          stroke={activeZone?.hex ?? accentHex}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ transformOrigin: `${center}px ${center}px`, rotate: needleAngle }}
        />
        <circle cx={center} cy={center} r={4} fill={activeZone?.hex ?? accentHex} />

        {/* Center text */}
        <text
          x={center}
          y={center + 28}
          textAnchor="middle"
          className="text-[36px] font-bold font-mono fill-white"
        >
          {displayValue}
        </text>
        {subLabel && (
          <text
            x={center}
            y={center + 48}
            textAnchor="middle"
            className="text-[11px] font-medium fill-white/50"
          >
            {subLabel}
          </text>
        )}

        {/* Particles */}
        {particles.map((i) => (
          <Particle
            key={i}
            index={i}
            color={activeZone?.hex ?? accentHex}
            speed={particleSpeed}
            cx={center}
            cy={center}
          />
        ))}
      </svg>
    </motion.div>
  );
}
