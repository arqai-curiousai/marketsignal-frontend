'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as d3Scale from 'd3-scale';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { SECTOR_COLORS, RRG_QUADRANT_COLORS, RRG_QUADRANT_LABELS } from './constants';
import type { ISectorAnalytics } from '@/types/analytics';

interface SectorRRGProps {
  sectors: ISectorAnalytics[];
  onSectorClick: (sector: ISectorAnalytics) => void;
}

const MARGIN = { top: 28, right: 16, bottom: 28, left: 16 };
const PLAYBACK_INTERVAL_MS = 600; // ms between trail steps

export function SectorRRG({ sectors, onSectorClick }: SectorRRGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 380, height: 340 });
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // ─── Playback state ────────────────────────────────────────────────
  const maxTrailLen = useMemo(
    () => Math.max(...sectors.map((s) => s.rrg.trail?.length ?? 0), 1),
    [sectors],
  );
  const [playing, setPlaying] = useState(false);
  const [trailIndex, setTrailIndex] = useState(maxTrailLen); // start fully revealed

  // Animate: step trailIndex from 1 → maxTrailLen
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setTrailIndex((prev) => {
        if (prev >= maxTrailLen) {
          setPlaying(false);
          return maxTrailLen;
        }
        return prev + 1;
      });
    }, PLAYBACK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing, maxTrailLen]);

  const handlePlayPause = useCallback(() => {
    if (playing) {
      setPlaying(false);
    } else {
      // If at end, restart from beginning
      if (trailIndex >= maxTrailLen) setTrailIndex(0);
      setPlaying(true);
    }
  }, [playing, trailIndex, maxTrailLen]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setTrailIndex(maxTrailLen);
  }, [maxTrailLen]);

  // Responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ width: Math.max(width, 280), height: Math.max(Math.min(width * 0.85, 400), 280) });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const innerW = dims.width - MARGIN.left - MARGIN.right;
  const innerH = dims.height - MARGIN.top - MARGIN.bottom;
  const cx = MARGIN.left + innerW / 2;
  const cy = MARGIN.top + innerH / 2;

  // Compute domain from data
  const { xScale, yScale } = useMemo(() => {
    const allRatios = sectors.map((s) => s.rrg.rs_ratio).filter(Boolean);
    const allMomentums = sectors.map((s) => s.rrg.rs_momentum).filter(Boolean);
    if (allRatios.length === 0) {
      return {
        xScale: d3Scale.scaleLinear().domain([98, 102]).range([MARGIN.left, MARGIN.left + innerW]),
        yScale: d3Scale.scaleLinear().domain([98, 102]).range([MARGIN.top + innerH, MARGIN.top]),
      };
    }

    // Center at 100, expand symmetrically
    const maxDevR = Math.max(...allRatios.map((r) => Math.abs(r - 100)), 2);
    const maxDevM = Math.max(...allMomentums.map((m) => Math.abs(m - 100)), 2);
    const pad = 0.5;

    return {
      xScale: d3Scale
        .scaleLinear()
        .domain([100 - maxDevR - pad, 100 + maxDevR + pad])
        .range([MARGIN.left, MARGIN.left + innerW]),
      yScale: d3Scale
        .scaleLinear()
        .domain([100 - maxDevM - pad, 100 + maxDevM + pad])
        .range([MARGIN.top + innerH, MARGIN.top]),
    };
  }, [sectors, innerW, innerH]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm overflow-hidden"
    >
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-white uppercase tracking-wider">
          Relative Rotation Graph
        </span>
        <div className="flex items-center gap-1.5">
          {/* Playback controls */}
          <button
            onClick={handlePlayPause}
            className="flex items-center justify-center h-5 w-5 rounded bg-white/[0.08] hover:bg-white/[0.15] transition-colors"
            aria-label={playing ? 'Pause' : 'Play trail animation'}
            title={playing ? 'Pause' : 'Play trail animation'}
          >
            {playing ? (
              <Pause className="h-2.5 w-2.5 text-brand-blue" />
            ) : (
              <Play className="h-2.5 w-2.5 text-brand-blue ml-px" />
            )}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center h-5 w-5 rounded bg-white/[0.08] hover:bg-white/[0.15] transition-colors"
            aria-label="Reset to current"
            title="Reset to current"
          >
            <RotateCcw className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
          {/* Progress indicator */}
          <span className="text-[9px] text-muted-foreground tabular-nums ml-1">
            {trailIndex < maxTrailLen ? `${trailIndex}/${maxTrailLen}` : 'vs NIFTY 50'}
          </span>
        </div>
      </div>

      <svg width={dims.width} height={dims.height}>
        {/* Quadrant backgrounds */}
        <rect
          x={cx}
          y={MARGIN.top}
          width={innerW / 2}
          height={innerH / 2}
          fill={RRG_QUADRANT_COLORS.leading}
          opacity={0.06}
        />
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={innerW / 2}
          height={innerH / 2}
          fill={RRG_QUADRANT_COLORS.improving}
          opacity={0.06}
        />
        <rect
          x={MARGIN.left}
          y={cy}
          width={innerW / 2}
          height={innerH / 2}
          fill={RRG_QUADRANT_COLORS.lagging}
          opacity={0.06}
        />
        <rect
          x={cx}
          y={cy}
          width={innerW / 2}
          height={innerH / 2}
          fill={RRG_QUADRANT_COLORS.weakening}
          opacity={0.06}
        />

        {/* Gridlines at 100 */}
        <line
          x1={MARGIN.left}
          x2={MARGIN.left + innerW}
          y1={yScale(100)}
          y2={yScale(100)}
          stroke="rgba(255,255,255,0.12)"
          strokeDasharray="4,4"
        />
        <line
          x1={xScale(100)}
          x2={xScale(100)}
          y1={MARGIN.top}
          y2={MARGIN.top + innerH}
          stroke="rgba(255,255,255,0.12)"
          strokeDasharray="4,4"
        />

        {/* Quadrant labels */}
        <text x={MARGIN.left + 6} y={MARGIN.top + 14} fill={RRG_QUADRANT_COLORS.improving} fontSize={9} fontWeight={600} opacity={0.7}>
          Improving
        </text>
        <text x={MARGIN.left + innerW - 6} y={MARGIN.top + 14} fill={RRG_QUADRANT_COLORS.leading} fontSize={9} fontWeight={600} opacity={0.7} textAnchor="end">
          Leading
        </text>
        <text x={MARGIN.left + 6} y={MARGIN.top + innerH - 6} fill={RRG_QUADRANT_COLORS.lagging} fontSize={9} fontWeight={600} opacity={0.7}>
          Lagging
        </text>
        <text x={MARGIN.left + innerW - 6} y={MARGIN.top + innerH - 6} fill={RRG_QUADRANT_COLORS.weakening} fontSize={9} fontWeight={600} opacity={0.7} textAnchor="end">
          Weakening
        </text>

        {/* Axis labels */}
        <text
          x={MARGIN.left + innerW / 2}
          y={MARGIN.top + innerH + 20}
          fill="rgba(255,255,255,0.4)"
          fontSize={9}
          textAnchor="middle"
        >
          RS-Ratio (Relative Strength)
        </text>
        <text
          x={8}
          y={MARGIN.top + innerH / 2}
          fill="rgba(255,255,255,0.4)"
          fontSize={9}
          textAnchor="middle"
          transform={`rotate(-90, 8, ${MARGIN.top + innerH / 2})`}
        >
          RS-Momentum
        </text>

        {/* Sector trails + dots */}
        {sectors.map((sector) => {
          const rrg = sector.rrg;
          if (!rrg.rs_ratio || !rrg.rs_momentum) return null;

          const color = SECTOR_COLORS[sector.sector] ?? '#94A3B8';
          const isHovered = hoveredSector === sector.sector;

          // Slice trail to current playback position
          const fullTrail = rrg.trail ?? [];
          const visibleTrail = fullTrail.slice(0, Math.min(trailIndex, fullTrail.length));

          // Current "head" position: last visible trail point, or the live position
          const head =
            trailIndex >= fullTrail.length
              ? { rs_ratio: rrg.rs_ratio, rs_momentum: rrg.rs_momentum }
              : visibleTrail.length > 0
                ? visibleTrail[visibleTrail.length - 1]
                : { rs_ratio: rrg.rs_ratio, rs_momentum: rrg.rs_momentum };

          const sx = xScale(head.rs_ratio);
          const sy = yScale(head.rs_momentum);

          // Trail path
          const trailPath =
            visibleTrail.length > 1
              ? visibleTrail
                  .map((p, i) => {
                    const px = xScale(p.rs_ratio);
                    const py = yScale(p.rs_momentum);
                    return `${i === 0 ? 'M' : 'L'}${px},${py}`;
                  })
                  .join(' ')
              : '';

          return (
            <g
              key={sector.sector}
              onMouseEnter={() => setHoveredSector(sector.sector)}
              onMouseLeave={() => setHoveredSector(null)}
              onClick={() => onSectorClick(sector)}
              className="cursor-pointer"
            >
              {/* Trail line */}
              {trailPath && (
                <motion.path
                  d={trailPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={isHovered ? 0.7 : 0.3}
                  strokeLinecap="round"
                  initial={false}
                  animate={{ d: trailPath }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              )}

              {/* Trail dots (fading) */}
              {visibleTrail.slice(0, -1).map((p, i) => (
                <circle
                  key={i}
                  cx={xScale(p.rs_ratio)}
                  cy={yScale(p.rs_momentum)}
                  r={1.5}
                  fill={color}
                  opacity={isHovered ? 0.15 + (i / visibleTrail.length) * 0.5 : 0.1}
                />
              ))}

              {/* Current position dot — animated to follow head */}
              <motion.circle
                initial={false}
                animate={{
                  cx: sx,
                  cy: sy,
                  r: isHovered ? 7 : 5,
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                fill={color}
                stroke={isHovered ? 'white' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isHovered ? 2 : 1}
                opacity={0.9}
              />

              {/* Pulse ring during playback */}
              {playing && (
                <motion.circle
                  cx={sx}
                  cy={sy}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  initial={{ r: 5, opacity: 0.6 }}
                  animate={{ r: 14, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                />
              )}

              {/* Label */}
              <motion.text
                initial={false}
                animate={{ x: sx, y: sy - (isHovered ? 12 : 9) }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                fill="white"
                fontSize={isHovered ? 10 : 8}
                fontWeight={isHovered ? 600 : 400}
                textAnchor="middle"
                opacity={isHovered ? 1 : 0.7}
              >
                {sector.sector.length > 10 ? sector.sector.slice(0, 8) + '..' : sector.sector}
              </motion.text>

              {/* Hover tooltip */}
              {isHovered && (
                <foreignObject x={sx - 70} y={sy + 12} width={140} height={60}>
                  <div className="rounded bg-brand-slate/95 px-2 py-1.5 text-[10px] text-white shadow-lg border border-white/10 text-center">
                    <div className="font-semibold">{sector.sector}</div>
                    <div className="text-muted-foreground">
                      RS: {head.rs_ratio.toFixed(2)} | Mom: {head.rs_momentum.toFixed(2)}
                    </div>
                    <div
                      className="text-[9px] font-medium mt-0.5"
                      style={{ color: RRG_QUADRANT_COLORS[rrg.quadrant] }}
                    >
                      {RRG_QUADRANT_LABELS[rrg.quadrant]}
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
