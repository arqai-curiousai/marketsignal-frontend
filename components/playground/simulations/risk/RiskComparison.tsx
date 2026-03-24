'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { T, S } from '@/components/playground/pyramid/tokens';
import type { IRiskScoreResult } from '@/types/simulation';
import { RISK_ZONES, DEFAULT_BENCHMARKS, getZoneForScore } from './risk-tokens';

interface Props {
  data: IRiskScoreResult;
  className?: string;
}

// ─── Zone gradient segments ──────────────────────────────────

function ZoneBar() {
  const zones = Object.values(RISK_ZONES);
  return (
    <div className="relative h-3 rounded-full overflow-hidden flex">
      {zones.map((zone) => {
        const widthPct = ((zone.rangeEnd - zone.rangeStart + 1) / 99) * 100;
        return (
          <div
            key={zone.label}
            className="h-full"
            style={{
              width: `${widthPct}%`,
              backgroundColor: zone.hex,
              opacity: 0.35,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Benchmark marker ────────────────────────────────────────

function BenchmarkMarker({
  label,
  score,
  index,
  isPortfolio = false,
}: {
  label: string;
  score: number;
  index: number;
  isPortfolio?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const leftPct = ((score - 1) / 98) * 100;
  const above = index % 2 === 0;
  const zoneConfig = getZoneForScore(score);

  return (
    <motion.div
      className="absolute"
      style={{ left: `${leftPct}%` }}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: above ? -6 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06 + 0.2,
        type: 'spring',
        stiffness: 120,
        damping: 18,
      }}
    >
      {/* Connector line */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 w-px',
          isPortfolio ? 'bg-white/60' : 'bg-white/15',
        )}
        style={{
          height: isPortfolio ? 32 : 20,
          top: above ? -24 : 6,
          ...(above ? {} : { top: 6 }),
        }}
      />

      {/* Dot */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
        {isPortfolio ? (
          <motion.div
            className="w-3.5 h-3.5 rounded-full border-2 border-white"
            style={{ backgroundColor: zoneConfig.hex }}
            animate={prefersReduced ? {} : { scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ) : (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: zoneConfig.hex, opacity: 0.7 }}
          />
        )}
      </div>

      {/* Label */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center',
          above ? '-top-10' : 'top-5',
        )}
      >
        <span
          className={cn(
            isPortfolio ? 'text-[10px] font-semibold font-mono' : T.legend,
            isPortfolio ? 'text-white/80' : '',
          )}
          style={isPortfolio ? { color: zoneConfig.hex } : undefined}
        >
          {label}
          {isPortfolio && (
            <span className="ml-1 text-white/50">{Math.round(score)}</span>
          )}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────

export function RiskComparison({ data, className }: Props) {
  // Merge API benchmarks (if available) with defaults
  const benchmarks = DEFAULT_BENCHMARKS.map((b) => {
    const apiBench = data.benchmarks?.[b.key];
    return {
      key: b.key,
      label: apiBench?.label ?? b.label,
      score: apiBench?.score ?? b.score,
    };
  });

  return (
    <div className={cn(S.card, 'p-4 md:p-5', className)}>
      <h3 className={cn(T.heading, 'text-white/70 mb-6')}>Risk Spectrum</h3>

      {/* Zone labels */}
      <div className="flex justify-between mb-1 px-1">
        {Object.values(RISK_ZONES).map((zone) => (
          <span
            key={zone.label}
            className={cn(T.legend)}
            style={{ color: zone.hex }}
          >
            {zone.label}
          </span>
        ))}
      </div>

      {/* Comparison scale */}
      <div className="relative pt-12 pb-10">
        {/* Zone bar */}
        <ZoneBar />

        {/* Benchmark markers */}
        {benchmarks.map((b, i) => (
          <BenchmarkMarker
            key={b.key}
            label={b.label}
            score={b.score}
            index={i}
          />
        ))}

        {/* Portfolio marker */}
        <BenchmarkMarker
          label="Portfolio"
          score={data.compositeScore}
          index={benchmarks.length}
          isPortfolio
        />
      </div>
    </div>
  );
}
