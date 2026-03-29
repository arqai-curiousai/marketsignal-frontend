'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { COVERAGE } from './constants';

// Simplified continent outlines as SVG paths (very minimal)
const CONTINENTS = [
  // North America (simplified)
  'M15,25 Q20,20 28,22 Q32,25 30,30 Q25,35 20,32 Q15,30 15,25',
  // South America
  'M25,52 Q28,45 30,50 Q32,58 28,62 Q25,60 25,52',
  // Europe
  'M45,22 Q50,20 52,24 Q50,28 47,27 Q44,25 45,22',
  // Africa
  'M47,35 Q52,32 55,38 Q54,50 50,52 Q46,48 47,35',
  // Asia (simplified)
  'M58,20 Q68,18 82,22 Q85,30 80,35 Q75,40 68,38 Q62,35 58,28 Q56,24 58,20',
  // Australia
  'M78,55 Q84,52 86,56 Q84,60 79,59 Q77,57 78,55',
];

function ExchangeDot({ x, y, label, delay }: { x: number; y: number; label: string; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Pulse ring */}
      <circle cx={x} cy={y} r="3" fill="none" stroke="#6EE7B7" strokeWidth="0.5" opacity="0.3">
        <animate attributeName="r" values="3;8;3" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
      {/* Core dot */}
      <circle cx={x} cy={y} r="2" fill="#6EE7B7" opacity="0.9" />
      <circle cx={x} cy={y} r="1" fill="white" opacity="0.6" />
      {/* Label */}
      <text
        x={x}
        y={y - 5}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="3"
        fontFamily="var(--font-display)"
        letterSpacing="0.08em"
      >
        {label}
      </text>
    </motion.g>
  );
}

function ArcPath({ fromX, fromY, toX, toY, delay }: { fromX: number; fromY: number; toX: number; toY: number; delay: number }) {
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 10;
  const d = `M${fromX},${fromY} Q${midX},${midY} ${toX},${toY}`;

  return (
    <motion.path
      d={d}
      fill="none"
      stroke="url(#arcGradient)"
      strokeWidth="0.5"
      strokeDasharray="3 2"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.5 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 2, ease: 'easeOut' }}
    />
  );
}

type Exchange = { id: string; label: string; city: string; x: number; y: number };

export function WorldMap({ exchanges: exProp }: { exchanges?: Exchange[] } = {}) {
  const data = exProp ?? COVERAGE.exchanges;
  const mumbai = data.find((e) => e.id === 'NSE')!;
  const others = data.filter((e) => e.id !== 'NSE');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="w-full"
    >
      <svg viewBox="0 0 100 70" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Continent outlines */}
        {CONTINENTS.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * i, duration: 0.5 }}
          />
        ))}

        {/* Connection arcs from Mumbai to each exchange */}
        {others.map((ex, i) => (
          <ArcPath
            key={ex.id}
            fromX={mumbai.x}
            fromY={mumbai.y}
            toX={ex.x}
            toY={ex.y}
            delay={0.8 + i * 0.3}
          />
        ))}

        {/* Exchange dots */}
        {data.map((ex, i) => (
          <ExchangeDot
            key={ex.id}
            x={ex.x}
            y={ex.y}
            label={ex.id}
            delay={0.5 + i * 0.15}
          />
        ))}
      </svg>
    </motion.div>
  );
}
