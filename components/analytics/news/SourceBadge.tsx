'use client';

import React from 'react';
import { SOURCE_BADGE_CONFIG } from './constants';

interface SourceBadgeProps {
  source: string;
  className?: string;
}

/**
 * SourceBadge — compact colored chip showing the news source abbreviation.
 *
 * Maps backend source identifiers (e.g. "economic_times") to a short
 * abbreviation ("ET") with a distinct color for instant visual recognition.
 */
export function SourceBadge({ source, className = '' }: SourceBadgeProps) {
  const config = SOURCE_BADGE_CONFIG[source];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold leading-none tracking-wide font-mono shrink-0 ${className}`}
      style={{
        backgroundColor: `${config.color}18`,
        color: config.color,
      }}
    >
      {config.abbr}
    </span>
  );
}
