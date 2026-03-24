'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IVolRegime } from '@/types/simulation';
import { VOL_REGIME, fmtVol, getRegimeConfig } from './vol-tokens';
import type { VolRegimeLevel } from './vol-tokens';

interface Props {
  regime: IVolRegime;
  className?: string;
}

// ─── Particle system ──────────────────────────────────────────────

function Particle({
  index,
  color,
  speed,
  size,
}: {
  index: number;
  color: string;
  speed: number;
  size: number;
}) {
  const angle = (index * 137.5) % 360; // golden angle distribution
  const radius = 100 + (index % 3) * 20;
  const duration = 3 + (index % 4) * 1.5;

  return (
    <motion.circle
      r={size}
      fill={color}
      opacity={0}
      initial={{
        cx: 140 + Math.cos((angle * Math.PI) / 180) * (radius * 0.6),
        cy: 140 + Math.sin((angle * Math.PI) / 180) * (radius * 0.6),
        opacity: 0,
      }}
      animate={{
        cx: [
          140 + Math.cos((angle * Math.PI) / 180) * (radius * 0.6),
          140 + Math.cos(((angle + 60) * Math.PI) / 180) * radius,
          140 + Math.cos(((angle + 120) * Math.PI) / 180) * (radius * 0.8),
          140 + Math.cos((angle * Math.PI) / 180) * (radius * 0.6),
        ],
        cy: [
          140 + Math.sin((angle * Math.PI) / 180) * (radius * 0.6),
          140 + Math.sin(((angle + 60) * Math.PI) / 180) * radius,
          140 + Math.sin(((angle + 120) * Math.PI) / 180) * (radius * 0.8),
          140 + Math.sin((angle * Math.PI) / 180) * (radius * 0.6),
        ],
        opacity: [0, 0.4 * speed, 0.2 * speed, 0],
      }}
      transition={{
        duration: duration / speed,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: index * 0.3,
      }}
    />
  );
}

// ─── Arc gauge ────────────────────────────────────────────────────

const GAUGE_RADIUS = 105;
const GAUGE_STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
const ARC_FRACTION = 0.75; // 270-degree arc
const ARC_LENGTH = CIRCUMFERENCE * ARC_FRACTION;

export function VolatilityStormGauge({ regime, className }: Props) {
  const prefersReduced = useReducedMotion();
  const config = getRegimeConfig(regime.regime);

  const percentile = regime.percentile ?? 0.5;
  const fillFraction = Math.max(0, Math.min(1, percentile));

  // Spring-animated percentile value
  const springValue = useSpring(fillFraction * 100, {
    stiffness: 80,
    damping: 20,
  });
  const displayPctl = useTransform(springValue, (v) => Math.round(v));

  // Arc dash offset for the fill
  const fillLength = ARC_LENGTH * fillFraction;
  const dashOffset = ARC_LENGTH - fillLength;

  // Particles
  const particleCount = prefersReduced ? 0 : config.particles;
  const particles = useMemo(
    () => Array.from({ length: particleCount }, (_, i) => i),
    [particleCount],
  );

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <motion.div
        className="relative"
        whileHover={prefersReduced ? {} : { scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <svg
          viewBox="0 0 280 280"
          className="w-[200px] h-[200px] md:w-[280px] md:h-[280px]"
        >
          {/* Background track */}
          <circle
            cx="140"
            cy="140"
            r={GAUGE_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={GAUGE_STROKE}
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE - ARC_LENGTH}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform="rotate(135 140 140)"
          />

          {/* Filled arc */}
          <motion.circle
            cx="140"
            cy="140"
            r={GAUGE_RADIUS}
            fill="none"
            stroke={config.hex}
            strokeWidth={GAUGE_STROKE}
            strokeDasharray={`${fillLength} ${CIRCUMFERENCE - fillLength}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform="rotate(135 140 140)"
            initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
            animate={{ strokeDasharray: `${fillLength} ${CIRCUMFERENCE - fillLength}` }}
            transition={{ duration: 1.2, type: 'spring', stiffness: 80, damping: 20 }}
            style={{
              filter: `drop-shadow(0 0 6px rgba(${config.rgb}, 0.3))`,
            }}
          />

          {/* Glow ring (subtle) */}
          <motion.circle
            cx="140"
            cy="140"
            r={GAUGE_RADIUS}
            fill="none"
            stroke={config.hex}
            strokeWidth={1}
            opacity={0.15}
            strokeDasharray={`${fillLength} ${CIRCUMFERENCE - fillLength}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform="rotate(135 140 140)"
            animate={{ opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Particles */}
          {particles.map((i) => (
            <Particle
              key={i}
              index={i}
              color={config.hex}
              speed={config.particleSpeed}
              size={1.5 + (i % 3) * 0.5}
            />
          ))}

          {/* Center text group */}
          <text
            x="140"
            y="125"
            textAnchor="middle"
            className="fill-white font-mono text-[28px] md:text-[32px] font-bold"
          >
            {fmtVol(regime.currentVol)}
          </text>

          <text
            x="140"
            y="150"
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] uppercase tracking-widest"
          >
            {config.label}
          </text>

          {/* Percentile badge */}
          <text
            x="140"
            y="172"
            textAnchor="middle"
            className="fill-white/40 font-mono text-[10px]"
          >
            P{Math.round(percentile * 100)} Percentile
          </text>
        </svg>
      </motion.div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground text-center max-w-[240px] mt-2 leading-relaxed">
        {regime.description}
      </p>
    </div>
  );
}
