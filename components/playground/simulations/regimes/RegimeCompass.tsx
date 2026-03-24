'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { IRegimeAnalysis, IRegimeState, IRegimeTransitionCell } from '@/types/simulation';
import { getRegimeColor, fmtReturn, fmtProb } from './regime-tokens';

interface Props {
  data: IRegimeAnalysis;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────

const CX = 140;
const CY = 140;
const NODE_RADIUS = 28;
const ORBIT_RADIUS = 90;
const SVG_SIZE = 280;

// ─── Arc path between two points ─────────────────────────────────

function arcPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature = 0.3,
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Perpendicular offset for curvature
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

// ─── State Node ──────────────────────────────────────────────────

function StateNode({
  state,
  x,
  y,
  isCurrent,
  index,
}: {
  state: IRegimeState;
  x: number;
  y: number;
  isCurrent: boolean;
  index: number;
}) {
  const color = getRegimeColor(state.label);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: 0.3 + index * 0.12,
        type: 'spring',
        stiffness: 130,
        damping: 18,
      }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {/* Outer glow for current state */}
      {isCurrent && (
        <motion.circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + 6}
          fill="none"
          stroke={color.hex}
          strokeWidth={1.5}
          opacity={0.2}
          animate={{ opacity: [0.1, 0.35, 0.1], r: [NODE_RADIUS + 4, NODE_RADIUS + 8, NODE_RADIUS + 4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Node circle */}
      <circle
        cx={x}
        cy={y}
        r={NODE_RADIUS}
        fill={`rgba(${color.rgb}, 0.08)`}
        stroke={color.hex}
        strokeWidth={isCurrent ? 2 : 1}
        opacity={isCurrent ? 1 : 0.6}
      />

      {/* Label */}
      <text
        x={x}
        y={y - 6}
        textAnchor="middle"
        className="text-[10px] font-semibold"
        fill={color.hex}
      >
        {state.displayName}
      </text>

      {/* Avg return */}
      <text
        x={x}
        y={y + 8}
        textAnchor="middle"
        className="text-[8px] font-mono"
        fill="rgba(255,255,255,0.4)"
      >
        {fmtReturn(state.meanReturn)}
      </text>
    </motion.g>
  );
}

// ─── Transition Arc ──────────────────────────────────────────────

function TransitionArc({
  cell,
  fromPos,
  toPos,
  index,
  isSelfLoop,
}: {
  cell: IRegimeTransitionCell;
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
  index: number;
  isSelfLoop: boolean;
}) {
  if (isSelfLoop || cell.probability < 0.02) return null;

  const fromColor = getRegimeColor(cell.fromLabel);
  const strokeWidth = Math.max(0.5, cell.probability * 4);
  const opacity = Math.max(0.15, Math.min(0.7, cell.probability));

  // Offset start/end to node edge
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return null;

  const nx = dx / dist;
  const ny = dy / dist;
  const startX = fromPos.x + nx * NODE_RADIUS;
  const startY = fromPos.y + ny * NODE_RADIUS;
  const endX = toPos.x - nx * (NODE_RADIUS + 4);
  const endY = toPos.y - ny * (NODE_RADIUS + 4);

  const d = arcPath(startX, startY, endX, endY, 0.25);

  return (
    <motion.g>
      <motion.path
        d={d}
        fill="none"
        stroke={fromColor.hex}
        strokeWidth={strokeWidth}
        opacity={opacity}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.6 + index * 0.1,
          duration: 0.8,
          type: 'spring',
          stiffness: 120,
          damping: 20,
        }}
      />
      {/* Arrowhead */}
      <circle
        cx={endX}
        cy={endY}
        r={2}
        fill={fromColor.hex}
        opacity={opacity}
      />
      {/* Probability label at midpoint */}
      {cell.probability >= 0.05 && (
        <text
          x={(startX + endX) / 2 - dy * 0.12}
          y={(startY + endY) / 2 + dx * 0.12}
          textAnchor="middle"
          className="text-[7px] font-mono"
          fill="rgba(255,255,255,0.3)"
        >
          {fmtProb(cell.probability)}
        </text>
      )}
    </motion.g>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function RegimeCompass({ data, className }: Props) {
  const prefersReduced = useReducedMotion();
  const currentColor = getRegimeColor(data.currentState.label);

  // Compute node positions (equally spaced around circle)
  const nodePositions = useMemo(() => {
    const n = data.states.length;
    // Start from top (-90 degrees)
    return data.states.map((state, i) => {
      const angle = (-Math.PI / 2) + (2 * Math.PI * i) / n;
      return {
        state,
        x: CX + Math.cos(angle) * ORBIT_RADIUS,
        y: CY + Math.sin(angle) * ORBIT_RADIUS,
      };
    });
  }, [data.states]);

  // Build flat list of arcs
  const arcs = useMemo(() => {
    const result: Array<{
      cell: IRegimeTransitionCell;
      fromPos: { x: number; y: number };
      toPos: { x: number; y: number };
      isSelfLoop: boolean;
    }> = [];

    for (const row of data.transitionMatrix) {
      for (const cell of row) {
        const from = nodePositions.find((n) => n.state.label === cell.fromLabel);
        const to = nodePositions.find((n) => n.state.label === cell.toLabel);
        if (from && to) {
          result.push({
            cell,
            fromPos: { x: from.x, y: from.y },
            toPos: { x: to.x, y: to.y },
            isSelfLoop: cell.fromLabel === cell.toLabel,
          });
        }
      }
    }

    return result;
  }, [data.transitionMatrix, nodePositions]);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <motion.div
        className="relative"
        whileHover={prefersReduced ? {} : { scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-[200px] h-[200px] md:w-[280px] md:h-[280px]"
        >
          {/* Center glow ring */}
          <motion.circle
            cx={CX}
            cy={CY}
            r={30}
            fill="none"
            stroke={currentColor.hex}
            strokeWidth={1}
            opacity={0.15}
            animate={
              prefersReduced
                ? {}
                : { opacity: [0.08, 0.25, 0.08], r: [28, 33, 28] }
            }
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Center filled circle */}
          <circle
            cx={CX}
            cy={CY}
            r={26}
            fill={`rgba(${currentColor.rgb}, 0.06)`}
            stroke={currentColor.hex}
            strokeWidth={0.5}
            opacity={0.5}
          />

          {/* Center text: regime label */}
          <text
            x={CX}
            y={CY - 4}
            textAnchor="middle"
            className="text-[11px] font-semibold"
            fill={currentColor.hex}
          >
            {currentColor.label}
          </text>

          {/* Center text: confidence */}
          <text
            x={CX}
            y={CY + 10}
            textAnchor="middle"
            className="text-[8px] font-mono"
            fill="rgba(255,255,255,0.4)"
          >
            {fmtProb(data.currentState.probability)}
          </text>

          {/* Orbit track (subtle) */}
          <circle
            cx={CX}
            cy={CY}
            r={ORBIT_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={1}
            strokeDasharray="4 6"
          />

          {/* Transition arcs */}
          {arcs.map((arc, i) => (
            <TransitionArc
              key={`${arc.cell.fromLabel}-${arc.cell.toLabel}`}
              cell={arc.cell}
              fromPos={arc.fromPos}
              toPos={arc.toPos}
              index={i}
              isSelfLoop={arc.isSelfLoop}
            />
          ))}

          {/* State nodes (drawn last so they are on top) */}
          {nodePositions.map((np, i) => (
            <StateNode
              key={np.state.label}
              state={np.state}
              x={np.x}
              y={np.y}
              isCurrent={np.state.label === data.currentState.label}
              index={i}
            />
          ))}
        </svg>
      </motion.div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground text-center max-w-[260px] mt-2 leading-relaxed">
        {data.currentState.durationDays > 0
          ? `In ${currentColor.label} regime for ${data.currentState.durationDays} trading days`
          : `Currently in ${currentColor.label} regime`}
      </p>
    </div>
  );
}
