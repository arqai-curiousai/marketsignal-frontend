'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IOverfittingResult } from '@/types/simulation';
import { T, S, TOOLTIP_STYLE } from '@/components/playground/pyramid/tokens';
import { getTrafficConfig, fmtPct } from './backtest-tokens';

interface Props {
  overfitting: IOverfittingResult;
  strategyLabel: string;
  className?: string;
}

// ─── SVG Traffic Light ──────────────────────────────────────────

function TrafficLightSVG({ level, pbo }: { level: string; pbo: number }) {
  const config = getTrafficConfig(level);
  const pboDisplay = `${(pbo * 100).toFixed(0)}%`;

  const lights: Array<{ key: string; color: string; isActive: boolean }> = [
    { key: 'red', color: '#FB7185', isActive: level === 'red' },
    { key: 'yellow', color: '#FBBF24', isActive: level === 'yellow' },
    { key: 'green', color: '#4ADE80', isActive: level === 'green' },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.svg
        viewBox="0 0 56 140"
        className="w-[48px] h-[120px] md:w-[56px] md:h-[140px]"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 15, delay: 0.1 }}
      >
        {/* Housing */}
        <rect x="4" y="4" width="48" height="132" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* Three lights */}
        {lights.map((light, i) => {
          const cy = 28 + i * 40;
          return (
            <g key={light.key}>
              {/* Glow ring for active light */}
              {light.isActive && (
                <motion.circle
                  cx="28" cy={cy} r="18"
                  fill={light.color}
                  opacity={0.12}
                  animate={{ opacity: [0.08, 0.2, 0.08] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              {/* Light circle */}
              <circle cx="28" cy={cy} r="14"
                fill={light.color}
                opacity={light.isActive ? 0.7 : 0.08}
              />
              {/* Inner bright core for active */}
              {light.isActive && (
                <circle cx="28" cy={cy} r="8" fill={light.color} opacity={0.9} />
              )}
            </g>
          );
        })}
      </motion.svg>

      {/* PBO and label below */}
      <div className="text-center">
        <p className="text-[13px] font-mono font-bold text-white/80">{pboDisplay}</p>
        <span
          className={cn(
            'text-[9px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-0.5',
            config.bg, config.text, config.border,
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

// ─── Split Sharpe tooltip ───────────────────────────────────────

function SplitTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { split: string; sharpe: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-[10px] text-white/60">{d.split}</p>
      <p className="text-[11px] font-mono">
        Sharpe:{' '}
        <span className={cn('font-semibold', d.sharpe >= 0 ? 'text-indigo-400' : 'text-amber-400')}>
          {d.sharpe.toFixed(2)}
        </span>
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export function OverfittingDetector({ overfitting, strategyLabel, className }: Props) {
  const [expanded, setExpanded] = useState(false);

  const { pbo, nProfitable, nTotal, splitSharpes, trafficLight, description } = overfitting;

  const splitData = (splitSharpes ?? []).map((sharpe, i) => ({
    split: `Split ${i + 1}`,
    sharpe,
  }));

  return (
    <motion.div
      className={cn(S.card, 'p-4', className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={cn(T.heading, 'text-white/80')}>Overfitting Detector</h4>
        <span className={cn(T.badge, 'text-white/30')}>CPCV Method</span>
      </div>

      {/* Main content */}
      <div className="flex items-start gap-5">
        {/* Traffic light */}
        <TrafficLightSVG level={trafficLight} pbo={pbo} />

        {/* Description */}
        <div className="flex-1 space-y-2">
          <p className={cn(T.mono, 'text-white/80')}>
            {strategyLabel}
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {description}
          </p>
          <p className="text-[10px] text-white/40">
            <span className="font-mono font-semibold text-white/60">
              {nProfitable}
            </span>{' '}
            of{' '}
            <span className="font-mono font-semibold text-white/60">
              {nTotal}
            </span>{' '}
            out-of-sample tests were profitable
          </p>
          <p className="text-[10px] text-white/30">
            PBO: {fmtPct(pbo)} probability of backtest overfitting
          </p>
        </div>
      </div>

      {/* Expandable split Sharpes chart */}
      {splitData.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/[0.04]">
          <button
            type="button"
            className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/60 transition-colors w-full"
            onClick={() => setExpanded(!expanded)}
          >
            <span>CPCV Split Sharpes ({splitData.length} splits)</span>
            <ChevronDown
              className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')}
            />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-3">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={splitData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <XAxis
                        dataKey="split"
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 8, fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'monospace' }}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                        tickFormatter={(v: number) => v.toFixed(1)}
                      />
                      <Tooltip content={<SplitTooltip />} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
                      <Bar dataKey="sharpe" radius={[3, 3, 0, 0]} animationDuration={800}>
                        {splitData.map((entry) => (
                          <Cell
                            key={entry.split}
                            fill={entry.sharpe >= 0 ? '#818CF8' : '#FBBF24'}
                            opacity={0.7}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
