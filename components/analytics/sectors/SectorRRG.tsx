'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3Scale from 'd3-scale';
import { Play, Pause, RotateCcw, HelpCircle, ChevronDown, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SECTOR_COLORS, RRG_QUADRANT_COLORS, RRG_QUADRANT_LABELS } from './constants';
import {
  countByQuadrant,
  detectCrossings,
  fastestMover,
  groupByQuadrant,
  topMovers,
  type Quadrant,
  type QuadrantCrossing,
} from './rrg-utils';
import type { ISectorAnalytics } from '@/types/analytics';

interface SectorRRGProps {
  sectors: ISectorAnalytics[];
  onSectorClick: (sector: ISectorAnalytics) => void;
}

const MARGIN = { top: 28, right: 16, bottom: 28, left: 16 };
const PLAYBACK_SPEEDS = [600, 300] as const; // 1x, 2x

export function SectorRRG({ sectors, onSectorClick }: SectorRRGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 380, height: 340 });
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // ─── Focus / filter state ─────────────────────────────────────────
  const [pinnedSectors, setPinnedSectors] = useState<Set<string>>(new Set());
  const [activeQuadrants, setActiveQuadrants] = useState<Set<Quadrant>>(new Set());
  const [listExpanded, setListExpanded] = useState(false);

  // ─── Playback state ───────────────────────────────────────────────
  const maxTrailLen = useMemo(
    () => Math.max(...sectors.map((s) => s.rrg.trail?.length ?? 0), 1),
    [sectors],
  );
  const [playing, setPlaying] = useState(false);
  const [trailIndex, setTrailIndex] = useState(maxTrailLen);
  const [speedIdx, setSpeedIdx] = useState(0);

  // Auto-focus top 3 movers during playback when nothing is pinned/filtered
  const autoFocusSet = useMemo(() => topMovers(sectors, 3), [sectors]);

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
    }, PLAYBACK_SPEEDS[speedIdx]);
    return () => clearInterval(timer);
  }, [playing, maxTrailLen, speedIdx]);

  const handlePlayPause = useCallback(() => {
    if (playing) {
      setPlaying(false);
    } else {
      if (trailIndex >= maxTrailLen) setTrailIndex(0);
      setPlaying(true);
    }
  }, [playing, trailIndex, maxTrailLen]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setTrailIndex(maxTrailLen);
  }, [maxTrailLen]);

  const togglePin = useCallback((sectorName: string) => {
    setPinnedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sectorName)) next.delete(sectorName);
      else next.add(sectorName);
      return next;
    });
  }, []);

  const toggleQuadrant = useCallback((q: Quadrant) => {
    setActiveQuadrants((prev) => {
      const next = new Set(prev);
      if (next.has(q)) next.delete(q);
      else next.add(q);
      return next;
    });
  }, []);

  // ─── Insight computations ─────────────────────────────────────────
  const quadrantCounts = useMemo(() => countByQuadrant(sectors), [sectors]);
  const crossings = useMemo(() => detectCrossings(sectors), [sectors]);
  const mover = useMemo(() => fastestMover(sectors), [sectors]);
  const grouped = useMemo(() => groupByQuadrant(sectors), [sectors]);

  // ─── Responsive ───────────────────────────────────────────────────
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

  const { xScale, yScale } = useMemo(() => {
    const allRatios = sectors.map((s) => s.rrg.rs_ratio).filter(Boolean);
    const allMomentums = sectors.map((s) => s.rrg.rs_momentum).filter(Boolean);
    if (allRatios.length === 0) {
      return {
        xScale: d3Scale.scaleLinear().domain([98, 102]).range([MARGIN.left, MARGIN.left + innerW]),
        yScale: d3Scale.scaleLinear().domain([98, 102]).range([MARGIN.top + innerH, MARGIN.top]),
      };
    }
    const maxDevR = Math.max(...allRatios.map((r) => Math.abs(r - 100)), 2);
    const maxDevM = Math.max(...allMomentums.map((m) => Math.abs(m - 100)), 2);
    const pad = 0.5;
    return {
      xScale: d3Scale.scaleLinear().domain([100 - maxDevR - pad, 100 + maxDevR + pad]).range([MARGIN.left, MARGIN.left + innerW]),
      yScale: d3Scale.scaleLinear().domain([100 - maxDevM - pad, 100 + maxDevM + pad]).range([MARGIN.top + innerH, MARGIN.top]),
    };
  }, [sectors, innerW, innerH]);

  // ─── Determine which sectors are "focused" ────────────────────────
  const hasPins = pinnedSectors.size > 0;
  const hasFilters = activeQuadrants.size > 0;
  const hasAnyFocus = hasPins || hasFilters || hoveredSector !== null;

  const isFocused = useCallback(
    (sectorName: string, quadrant: string): boolean => {
      if (hoveredSector === sectorName) return true;
      if (pinnedSectors.has(sectorName)) return true;
      if (activeQuadrants.has(quadrant as Quadrant)) return true;
      // During playback with no manual focus, auto-focus top movers
      if (playing && !hasPins && !hasFilters && autoFocusSet.has(sectorName)) return true;
      return false;
    },
    [hoveredSector, pinnedSectors, activeQuadrants, playing, hasPins, hasFilters, autoFocusSet],
  );

  // Should this sector animate during playback?
  const shouldAnimate = useCallback(
    (sectorName: string, quadrant: string): boolean => {
      if (!playing) return true; // not playing, show current position
      if (hasPins) return pinnedSectors.has(sectorName);
      if (hasFilters) return activeQuadrants.has(quadrant as Quadrant);
      return autoFocusSet.has(sectorName);
    },
    [playing, hasPins, hasFilters, pinnedSectors, activeQuadrants, autoFocusSet],
  );

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-sm overflow-hidden"
    >
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Relative Rotation Graph
          </span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-[10px] leading-snug">
                Sectors rotate clockwise: Improving &rarr; Leading &rarr; Weakening &rarr; Lagging.
                Top-right = strongest. Click dots to pin &amp; compare.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1.5">
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
          {/* Speed toggle */}
          <button
            onClick={() => setSpeedIdx((p) => (p + 1) % PLAYBACK_SPEEDS.length)}
            className="text-[9px] tabular-nums px-1 h-5 rounded bg-white/[0.08] hover:bg-white/[0.15] transition-colors text-muted-foreground"
            title="Toggle playback speed"
          >
            {speedIdx === 0 ? '1x' : '2x'}
          </button>
          <span className="text-[9px] text-muted-foreground tabular-nums ml-1">
            {trailIndex < maxTrailLen ? `${trailIndex}/${maxTrailLen}` : 'vs NIFTY 50'}
          </span>
        </div>
      </div>

      {/* ─── Insight Summary Strip ───────────────────────────────────── */}
      <div className="px-4 pb-2 space-y-1">
        {/* Quadrant distribution badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['leading', 'improving', 'weakening', 'lagging'] as Quadrant[]).map((q) => (
            <span
              key={q}
              className="inline-flex items-center gap-0.5 text-[9px] tabular-nums"
              style={{ color: RRG_QUADRANT_COLORS[q] }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: RRG_QUADRANT_COLORS[q] }}
              />
              {quadrantCounts[q]} {RRG_QUADRANT_LABELS[q]}
            </span>
          ))}
        </div>

        {/* Rotation alerts */}
        {crossings.length > 0 ? (
          <div className="text-[9px] leading-tight">
            {crossings.map((c: QuadrantCrossing) => (
              <span key={c.sector} className="mr-2">
                <ArrowRightLeft className="inline h-2.5 w-2.5 mr-0.5" style={{ color: RRG_QUADRANT_COLORS[c.to] }} />
                <span className="text-white/80 font-medium">{c.sector}</span>
                <span className="text-muted-foreground"> &rarr; </span>
                <span style={{ color: RRG_QUADRANT_COLORS[c.to] }} className="font-medium">
                  {RRG_QUADRANT_LABELS[c.to]}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-[9px] text-muted-foreground/60">No recent rotations</div>
        )}

        {/* Fastest mover */}
        {mover && mover.distance > 0.01 && (
          <div className="text-[9px] text-muted-foreground flex items-center gap-1">
            {mover.direction === 'up' ? (
              <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5 text-red-400" />
            )}
            <span>
              Fastest: <span className="text-white/80 font-medium">{mover.sector}</span>
            </span>
          </div>
        )}
      </div>

      {/* ─── SVG Chart ───────────────────────────────────────────────── */}
      <svg width={dims.width} height={dims.height}>
        {/* Quadrant backgrounds */}
        <rect x={cx} y={MARGIN.top} width={innerW / 2} height={innerH / 2} fill={RRG_QUADRANT_COLORS.leading} opacity={0.06} />
        <rect x={MARGIN.left} y={MARGIN.top} width={innerW / 2} height={innerH / 2} fill={RRG_QUADRANT_COLORS.improving} opacity={0.06} />
        <rect x={MARGIN.left} y={cy} width={innerW / 2} height={innerH / 2} fill={RRG_QUADRANT_COLORS.lagging} opacity={0.06} />
        <rect x={cx} y={cy} width={innerW / 2} height={innerH / 2} fill={RRG_QUADRANT_COLORS.weakening} opacity={0.06} />

        {/* Gridlines at 100 */}
        <line x1={MARGIN.left} x2={MARGIN.left + innerW} y1={yScale(100)} y2={yScale(100)} stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />
        <line x1={xScale(100)} x2={xScale(100)} y1={MARGIN.top} y2={MARGIN.top + innerH} stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />

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
        <text x={MARGIN.left + innerW / 2} y={MARGIN.top + innerH + 20} fill="rgba(255,255,255,0.4)" fontSize={9} textAnchor="middle">
          RS-Ratio (Relative Strength)
        </text>
        <text x={8} y={MARGIN.top + innerH / 2} fill="rgba(255,255,255,0.4)" fontSize={9} textAnchor="middle" transform={`rotate(-90, 8, ${MARGIN.top + innerH / 2})`}>
          RS-Momentum
        </text>

        {/* Sector trails + dots */}
        {sectors.map((sector) => {
          const rrg = sector.rrg;
          if (!rrg.rs_ratio || !rrg.rs_momentum) return null;

          const color = SECTOR_COLORS[sector.sector] ?? '#94A3B8';
          const isHovered = hoveredSector === sector.sector;
          const isPinned = pinnedSectors.has(sector.sector);
          const focused = isFocused(sector.sector, rrg.quadrant);
          const animate = shouldAnimate(sector.sector, rrg.quadrant);

          // Determine opacity: focused = full, else dimmed
          const dotOpacity = focused ? 0.9 : hasAnyFocus || playing ? 0.15 : 0.35;
          const showTrailAndLabel = focused;

          // Slice trail to current playback position (or show full if not animating)
          const fullTrail = rrg.trail ?? [];
          const effectiveTrailIndex = animate ? trailIndex : fullTrail.length;
          const visibleTrail = fullTrail.slice(0, Math.min(effectiveTrailIndex, fullTrail.length));

          const head =
            effectiveTrailIndex >= fullTrail.length
              ? { rs_ratio: rrg.rs_ratio, rs_momentum: rrg.rs_momentum }
              : visibleTrail.length > 0
                ? visibleTrail[visibleTrail.length - 1]
                : { rs_ratio: rrg.rs_ratio, rs_momentum: rrg.rs_momentum };

          const sx = xScale(head.rs_ratio);
          const sy = yScale(head.rs_momentum);

          const trailPath =
            visibleTrail.length > 1
              ? visibleTrail
                  .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.rs_ratio)},${yScale(p.rs_momentum)}`)
                  .join(' ')
              : '';

          return (
            <g
              key={sector.sector}
              onMouseEnter={() => setHoveredSector(sector.sector)}
              onMouseLeave={() => setHoveredSector(null)}
              onClick={() => togglePin(sector.sector)}
              onDoubleClick={() => onSectorClick(sector)}
              className="cursor-pointer"
            >
              {/* Trail line — only when focused */}
              {showTrailAndLabel && trailPath && (
                <motion.path
                  d={trailPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={isHovered ? 0.7 : 0.4}
                  strokeLinecap="round"
                  initial={false}
                  animate={{ d: trailPath }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              )}

              {/* Trail dots — only when focused */}
              {showTrailAndLabel &&
                visibleTrail.slice(0, -1).map((p, i) => (
                  <circle
                    key={i}
                    cx={xScale(p.rs_ratio)}
                    cy={yScale(p.rs_momentum)}
                    r={1.5}
                    fill={color}
                    opacity={0.1 + (i / visibleTrail.length) * 0.4}
                  />
                ))}

              {/* Current position dot */}
              <motion.circle
                initial={false}
                animate={{
                  cx: sx,
                  cy: sy,
                  r: isHovered ? 7 : isPinned ? 6 : focused ? 5 : 4,
                  opacity: dotOpacity,
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                fill={color}
                stroke={isHovered ? 'white' : isPinned ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}
                strokeWidth={isHovered ? 2 : isPinned ? 1.5 : 0.5}
              />

              {/* Pin indicator ring */}
              {isPinned && !isHovered && (
                <circle cx={sx} cy={sy} r={9} fill="none" stroke={color} strokeWidth={0.5} opacity={0.4} strokeDasharray="2,2" />
              )}

              {/* Pulse ring during playback (only for animated sectors) */}
              {playing && animate && focused && (
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

              {/* Label — only when focused */}
              {showTrailAndLabel && (
                <motion.text
                  initial={false}
                  animate={{ x: sx, y: sy - (isHovered ? 13 : 10) }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  fill="white"
                  fontSize={isHovered ? 10 : 9}
                  fontWeight={isHovered ? 600 : 500}
                  textAnchor="middle"
                  opacity={isHovered ? 1 : 0.85}
                >
                  {sector.sector}
                </motion.text>
              )}

              {/* Hover tooltip */}
              {isHovered && (
                <foreignObject x={sx - 80} y={sy + 14} width={160} height={62}>
                  <div className="rounded-lg bg-brand-slate/95 px-2.5 py-1.5 text-[10px] text-white shadow-lg border border-white/10 text-center">
                    <div className="font-semibold">{sector.sector}</div>
                    <div className="text-muted-foreground mt-0.5">
                      RS: {head.rs_ratio.toFixed(2)} | Mom: {head.rs_momentum.toFixed(2)}
                    </div>
                    <div className="text-[9px] font-medium mt-0.5" style={{ color: RRG_QUADRANT_COLORS[rrg.quadrant] }}>
                      {RRG_QUADRANT_LABELS[rrg.quadrant]}
                    </div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>

      {/* ─── Quadrant Filter Pills ───────────────────────────────────── */}
      <div className="px-4 pt-1 pb-2 flex items-center gap-1.5 flex-wrap">
        {(['leading', 'improving', 'weakening', 'lagging'] as Quadrant[]).map((q) => {
          const isActive = activeQuadrants.has(q);
          return (
            <button
              key={q}
              onClick={() => toggleQuadrant(q)}
              className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full border transition-all"
              style={{
                borderColor: isActive ? RRG_QUADRANT_COLORS[q] : 'rgba(255,255,255,0.08)',
                backgroundColor: isActive ? `${RRG_QUADRANT_COLORS[q]}18` : 'transparent',
                color: isActive ? RRG_QUADRANT_COLORS[q] : 'rgba(255,255,255,0.4)',
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: RRG_QUADRANT_COLORS[q] }}
              />
              {RRG_QUADRANT_LABELS[q]}
              <span className="tabular-nums opacity-70">({quadrantCounts[q]})</span>
            </button>
          );
        })}
        {(hasPins || hasFilters) && (
          <button
            onClick={() => {
              setPinnedSectors(new Set());
              setActiveQuadrants(new Set());
            }}
            className="text-[9px] text-muted-foreground/60 hover:text-muted-foreground transition-colors ml-auto"
          >
            Clear
          </button>
        )}
      </div>

      {/* ─── Quadrant Sector List (collapsible) ──────────────────────── */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setListExpanded((p) => !p)}
          className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-white/70 transition-colors w-full"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${listExpanded ? 'rotate-0' : '-rotate-90'}`}
          />
          <span className="uppercase tracking-wider font-medium">Sectors by Quadrant</span>
        </button>

        <AnimatePresence>
          {listExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2">
                {(['leading', 'improving', 'weakening', 'lagging'] as Quadrant[]).map((q) => {
                  const crossingSet = new Set(crossings.filter((c) => c.to === q).map((c) => c.sector));
                  return (
                    <div key={q}>
                      <div
                        className="text-[8px] uppercase tracking-wider font-semibold mb-0.5"
                        style={{ color: RRG_QUADRANT_COLORS[q] }}
                      >
                        {RRG_QUADRANT_LABELS[q]}
                      </div>
                      {grouped[q].length === 0 ? (
                        <div className="text-[9px] text-muted-foreground/40 italic">None</div>
                      ) : (
                        grouped[q].map((s) => (
                          <button
                            key={s.sector}
                            onClick={() => {
                              togglePin(s.sector);
                              onSectorClick(s);
                            }}
                            className="block text-[9px] text-white/60 hover:text-white transition-colors leading-relaxed"
                          >
                            {s.sector}
                            {crossingSet.has(s.sector) && (
                              <span
                                className="ml-1 text-[7px] font-bold uppercase px-1 py-px rounded"
                                style={{
                                  color: RRG_QUADRANT_COLORS[q],
                                  backgroundColor: `${RRG_QUADRANT_COLORS[q]}20`,
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
