'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { T } from './tokens';

interface ConfidenceRingProps {
  value: number; // 0-1
  size?: number; // px, default 120
  strokeWidth?: number; // default 6
  color: string; // hex color
  label?: string;
}

export function ConfidenceRing({
  value,
  size = 120,
  strokeWidth = 6,
  color,
  label,
}: ConfidenceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        role="img"
        aria-label={`Confidence ring: ${pct}%${label ? ` - ${label}` : ''}`}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={0.1}
        />
        {/* Foreground arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value) }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {/* Center text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span
          className="font-mono font-bold tabular-nums text-white"
          style={{ fontSize: size * 0.22 }}
        >
          {pct}%
        </span>
        {label && (
          <span
            className={T.caption}
            style={{ fontSize: Math.max(size * 0.09, 8) }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
