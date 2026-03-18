'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { ILayerResult, StrategySignal } from '@/types/strategy';
import { LAYERS, PYRAMID_LAYER_WIDTHS, PYRAMID_LAYER_HEIGHTS } from './constants';
import { signalColor, layerColor } from './tokens';

interface SignalPyramidProps {
  layers: Record<string, ILayerResult>;
  finalSignal: StrategySignal;
  finalConfidence: number;
  selectedLayer: string | null;
  onLayerClick: (layerId: string) => void;
  className?: string;
}

// ─── Geometry helpers ──────────────────────────────────────────────

const VB_W = 400;
const VB_H = 500;
const PAD_X = 10;
const PAD_TOP = 60; // space for apex orb
const PAD_BOT = 10;
const DRAW_H = VB_H - PAD_TOP - PAD_BOT;
const CORNER_R = 6;

interface TrapezoidGeom {
  topLeft: [number, number];
  topRight: [number, number];
  botLeft: [number, number];
  botRight: [number, number];
  centerX: number;
  centerY: number;
}

function computeLayerGeometries(): TrapezoidGeom[] {
  // Layers are ordered bottom (index 0 = widest) to top (index 4 = narrowest)
  const geoms: TrapezoidGeom[] = [];
  let yOffset = VB_H - PAD_BOT;

  for (let i = 0; i < LAYERS.length; i++) {
    const h = PYRAMID_LAYER_HEIGHTS[i] * DRAW_H;
    const botW = PYRAMID_LAYER_WIDTHS[i] * (VB_W - PAD_X * 2);
    const topW =
      i < LAYERS.length - 1
        ? PYRAMID_LAYER_WIDTHS[i + 1] * (VB_W - PAD_X * 2)
        : botW * 0.55;

    const cx = VB_W / 2;
    const botY = yOffset;
    const topY = yOffset - h;

    geoms.push({
      botLeft: [cx - botW / 2, botY],
      botRight: [cx + botW / 2, botY],
      topLeft: [cx - topW / 2, topY],
      topRight: [cx + topW / 2, topY],
      centerX: cx,
      centerY: (topY + botY) / 2,
    });

    yOffset -= h + 2; // 2px gap between layers
  }
  return geoms;
}

function trapezoidPath(g: TrapezoidGeom): string {
  const { topLeft, topRight, botRight, botLeft } = g;
  const r = CORNER_R;
  // Rounded trapezoid path using quadratic bezier at corners
  return [
    `M ${topLeft[0] + r} ${topLeft[1]}`,
    `L ${topRight[0] - r} ${topRight[1]}`,
    `Q ${topRight[0]} ${topRight[1]} ${topRight[0]} ${topRight[1] + r}`,
    `L ${botRight[0]} ${botRight[1] - r}`,
    `Q ${botRight[0]} ${botRight[1]} ${botRight[0] - r} ${botRight[1]}`,
    `L ${botLeft[0] + r} ${botLeft[1]}`,
    `Q ${botLeft[0]} ${botLeft[1]} ${botLeft[0]} ${botLeft[1] - r}`,
    `L ${topLeft[0]} ${topLeft[1] + r}`,
    `Q ${topLeft[0]} ${topLeft[1]} ${topLeft[0] + r} ${topLeft[1]}`,
    'Z',
  ].join(' ');
}

// ─── Particle positions along pyramid edges ────────────────────────

interface ParticlePos {
  x: number;
  startY: number;
  yEnd: number;
  duration: number;
}

function generateParticlePositions(count: number): ParticlePos[] {
  const positions: ParticlePos[] = [];
  const cx = VB_W / 2;
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const spread = 30 + Math.random() * 100;
    positions.push({
      x: cx + side * spread,
      startY: VB_H - PAD_BOT - Math.random() * DRAW_H * 0.3,
      yEnd: -120 - Math.random() * 80,
      duration: 4 + Math.random() * 3,
    });
  }
  return positions;
}

// ─── Sub-components ────────────────────────────────────────────────

function biasColorHex(bias: StrategySignal): string {
  return signalColor(bias).hex;
}

function biasOpacity(confidence: number): number {
  return 0.15 + Math.min(Math.max(confidence, 0), 1) * 0.55;
}

// ─── Main Component ────────────────────────────────────────────────

export function SignalPyramid({
  layers,
  finalSignal,
  finalConfidence,
  selectedLayer,
  onLayerClick,
  className,
}: SignalPyramidProps) {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const geometries = useMemo(() => computeLayerGeometries(), []);
  const particles = useMemo(() => generateParticlePositions(8), []);

  const sortedLayers = useMemo(
    () => [...LAYERS].sort((a, b) => a.order - b.order),
    [],
  );

  const signalStyle = signalColor(finalSignal);

  const handleLayerClick = useCallback(
    (id: string) => {
      onLayerClick(id);
    },
    [onLayerClick],
  );

  return (
    <div className={`relative aspect-[4/5] w-full ${className ?? ''}`}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow filter for selected layer */}
          <filter id="pyramid-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
            <feFlood floodColor="white" floodOpacity="0.15" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Apex orb glow */}
          <filter id="apex-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dashed connection lines between layers */}
        {geometries.map((geom, i) => {
          if (i >= geometries.length - 1) return null;
          const next = geometries[i + 1];
          return (
            <motion.line
              key={`conn-${i}`}
              x1={geom.centerX}
              y1={geom.topLeft[1]}
              x2={next.centerX}
              y2={next.botLeft[1]}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
              strokeDasharray="4 4"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -16 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          );
        })}

        {/* Pyramid layers (bottom to top) */}
        {sortedLayers.map((layerDef, i) => {
          const geom = geometries[i];
          if (!geom) return null;
          const layerResult = layers[layerDef.id];
          const bias: StrategySignal = layerResult?.bias ?? 'hold';
          const confidence = layerResult?.confidence ?? 0;
          const fillHex = biasColorHex(bias);
          const opacity = biasOpacity(confidence);
          const accentColor = layerColor(layerDef.id);
          const isSelected = selectedLayer === layerDef.id;
          const isHovered = hoveredLayer === layerDef.id;
          const path = trapezoidPath(geom);

          return (
            <g
              key={layerDef.id}
              role="button"
              tabIndex={0}
              aria-label={`${layerDef.shortName} layer - ${bias} signal`}
              onClick={() => handleLayerClick(layerDef.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLayerClick(layerDef.id);
                }
              }}
              onMouseEnter={() => setHoveredLayer(layerDef.id)}
              onMouseLeave={() => setHoveredLayer(null)}
              className="cursor-pointer"
            >
              {/* Trapezoid fill */}
              <motion.path
                d={path}
                fill={fillHex}
                fillOpacity={opacity}
                stroke={isSelected ? accentColor.hex : 'rgba(255,255,255,0.08)'}
                strokeWidth={isSelected ? 2 : 1}
                filter={isSelected ? 'url(#pyramid-glow)' : undefined}
                initial={{ fillOpacity: 0 }}
                animate={{
                  fillOpacity: isHovered
                    ? [opacity * 1.2, opacity * 1.05, opacity * 1.2]
                    : [opacity, opacity * 0.85, opacity],
                }}
                transition={{
                  fillOpacity: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.4,
                  },
                }}
              />
              {/* Layer label */}
              <text
                x={geom.centerX}
                y={geom.centerY - 4}
                textAnchor="middle"
                fill="white"
                fontSize={12}
                fontWeight={600}
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
              >
                {layerDef.shortName}
              </text>
              {/* Confidence % */}
              <text
                x={geom.centerX}
                y={geom.centerY + 12}
                textAnchor="middle"
                fill="rgba(255,255,255,0.55)"
                fontSize={10}
                fontFamily="ui-monospace, SFMono-Regular, monospace"
              >
                {layerResult
                  ? `${Math.round(confidence * 100)}%`
                  : '\u2014'}
              </text>
              {/* Layer accent side dot */}
              <circle
                cx={geom.botLeft[0] + 12}
                cy={geom.centerY}
                r={3}
                fill={accentColor.hex}
                opacity={0.7}
              />
            </g>
          );
        })}

        {/* Apex signal orb */}
        <motion.circle
          cx={VB_W / 2}
          cy={PAD_TOP / 2 + 5}
          r={20}
          fill={signalStyle.hex}
          fillOpacity={0.3}
          stroke={signalStyle.hex}
          strokeWidth={2}
          filter="url(#apex-glow)"
          animate={{
            fillOpacity: [0.25, 0.45, 0.25],
            r: [20, 22, 20],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <text
          x={VB_W / 2}
          y={PAD_TOP / 2 + 10}
          textAnchor="middle"
          fill="white"
          fontSize={11}
          fontWeight={700}
          style={{ textShadow: '0 0 8px rgba(0,0,0,0.6)' }}
        >
          {finalSignal.toUpperCase()}
        </text>
      </svg>

      {/* Animated particles (absolute positioned divs) */}
      <div className="pointer-events-none absolute inset-0">
        {particles.map((p, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute h-1 w-1 rounded-full bg-white/20"
            style={{
              left: `${(p.x / VB_W) * 100}%`,
              top: `${(p.startY / VB_H) * 100}%`,
            }}
            animate={{
              y: [0, p.yEnd],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
