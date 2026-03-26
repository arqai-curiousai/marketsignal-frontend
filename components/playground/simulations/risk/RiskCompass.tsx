'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SimGauge } from '@/components/playground/simulations/shared/SimGauge';
import type { GaugeZone } from '@/components/playground/simulations/shared/SimGauge';
import type { IRiskScoreResult } from '@/types/simulation';
import {
  RISK_ZONES,
  ZONE_PARTICLES,
  DEFAULT_BENCHMARKS,
  fmtScore,
  getZoneForScore,
} from './risk-tokens';
import type { RiskZoneKey } from './risk-tokens';

interface Props {
  data: IRiskScoreResult;
  className?: string;
}

// ─── Constants ──────────────────────────────────────────────
const GAUGE_SIZE = 360;
const GAUGE_RADIUS = 100;
const START_ANGLE = 135;
const CENTER = GAUGE_SIZE / 2;

// ─── Build gauge zones from RISK_ZONES ───────────────────────

function buildGaugeZones(): GaugeZone[] {
  return Object.values(RISK_ZONES).map((zone) => ({
    start: (zone.rangeStart - 1) / 99,
    end: zone.rangeEnd / 99,
    hex: zone.hex,
    label: zone.label,
  }));
}

// ─── Benchmark tick on gauge arc ─────────────────────────────

function BenchmarkTick({
  score,
  label,
  center,
  radius,
}: {
  score: number;
  label: string;
  center: number;
  radius: number;
}) {
  const normalized = (score - 1) / 98;
  const angleDeg = START_ANGLE + normalized * 270;
  const angleRad = (angleDeg * Math.PI) / 180;

  const innerR = radius - 14;
  const outerR = radius - 8;
  const labelR = radius - 22;

  const x1 = center + innerR * Math.cos(angleRad);
  const y1 = center + innerR * Math.sin(angleRad);
  const x2 = center + outerR * Math.cos(angleRad);
  const y2 = center + outerR * Math.sin(angleRad);
  const lx = center + labelR * Math.cos(angleRad);
  const ly = center + labelR * Math.sin(angleRad);

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <text
        x={lx} y={ly}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.30)"
        fontSize={7}
        fontFamily="monospace"
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Zone labels around arc perimeter ────────────────────────

function ZoneLabel({
  zone,
  center,
  radius,
}: {
  zone: (typeof RISK_ZONES)[RiskZoneKey];
  center: number;
  radius: number;
}) {
  const midNorm = ((zone.rangeStart + zone.rangeEnd) / 2 - 1) / 98;
  const angleDeg = START_ANGLE + midNorm * 270;
  const angleRad = (angleDeg * Math.PI) / 180;
  const labelR = radius + 20;
  const x = center + labelR * Math.cos(angleRad);
  const y = center + labelR * Math.sin(angleRad);

  return (
    <text
      x={x} y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={zone.hex}
      fontSize={7}
      fontFamily="monospace"
      fontWeight={500}
      opacity={0.45}
    >
      {zone.label}
    </text>
  );
}

// ─── Component ──────────────────────────────────────────────

export function RiskCompass({ data, className }: Props) {
  const prefersReduced = useReducedMotion();
  const zones = useMemo(() => buildGaugeZones(), []);

  const score = data.compositeScore;
  const normalizedValue = Math.max(0, Math.min(1, (score - 1) / 98));
  const zoneConfig = getZoneForScore(score);
  const isHighRisk = score > 70;

  // Determine zone key for particle config
  const zoneKey = useMemo<RiskZoneKey>(() => {
    for (const [key, zone] of Object.entries(RISK_ZONES)) {
      if (score >= zone.rangeStart && score <= zone.rangeEnd) {
        return key as RiskZoneKey;
      }
    }
    return 'balanced';
  }, [score]);

  const particleConfig = ZONE_PARTICLES[zoneKey];
  const pCount = prefersReduced ? 0 : particleConfig.count;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative w-[280px] h-[280px] md:w-[360px] md:h-[360px]">
        {/* Heartbeat pulse for high-risk */}
        {isHighRisk && !prefersReduced && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${zoneConfig.hex}08 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Main gauge */}
        <SimGauge
          value={normalizedValue}
          displayValue={fmtScore(score)}
          subLabel={zoneConfig.label}
          zones={zones}
          size={GAUGE_SIZE}
          particleCount={pCount}
          particleSpeed={particleConfig.speed}
          accentHex={zoneConfig.hex}
          wobble
        />

        {/* Benchmark ticks + zone labels overlay */}
        <svg
          viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {DEFAULT_BENCHMARKS.map((b) => (
            <BenchmarkTick
              key={b.key}
              score={b.score}
              label={b.label}
              center={CENTER}
              radius={GAUGE_RADIUS}
            />
          ))}
          {Object.values(RISK_ZONES).map((zone) => (
            <ZoneLabel
              key={zone.label}
              zone={zone}
              center={CENTER}
              radius={GAUGE_RADIUS}
            />
          ))}
        </svg>
      </div>

      {/* Score context */}
      <div className="flex items-center gap-3 mt-2">
        <span
          className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border"
          style={{
            color: zoneConfig.hex,
            borderColor: `${zoneConfig.hex}33`,
            backgroundColor: `${zoneConfig.hex}0D`,
          }}
        >
          {score}/99
        </span>
      </div>

      <p className="text-[10px] text-muted-foreground text-center max-w-[300px] mt-2 leading-relaxed">
        {data.naturalLanguage}
      </p>
    </div>
  );
}
