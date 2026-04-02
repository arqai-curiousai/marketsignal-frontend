'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MM_STATES = ['Accumulating', 'Distributing', 'Neutral'] as const;
const RI_STATES = ['Bullish', 'Bearish', 'Confused'] as const;
const OUTCOMES = ['BULLISH', 'NEUTRAL', 'BEARISH'] as const;
const CONFLICTS = ['Divergence', 'Consensus', 'Mixed'] as const;

function BiasBar({ states, colorMap }: { states: readonly string[]; colorMap: Record<string, string> }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % states.length), 3000);
    return () => clearInterval(t);
  }, [states.length]);

  const current = states[idx];
  const color = colorMap[current] || 'bg-white/20';

  return (
    <div className="mt-3">
      <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={false}
          animate={{
            width: current === states[0] ? '75%' : current === states[1] ? '25%' : '50%',
          }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">{current}</p>
    </div>
  );
}

function ConfidenceArc({ min, max }: { min: number; max: number }) {
  const [value, setValue] = useState(min);
  useEffect(() => {
    const t = setInterval(() => {
      setValue(min + Math.random() * (max - min));
    }, 2000);
    return () => clearInterval(t);
  }, [min, max]);

  const angle = (value / 1) * 180;
  const rad = (angle * Math.PI) / 180;
  const x = 24 + 18 * Math.cos(Math.PI - rad);
  const y = 24 - 18 * Math.sin(Math.PI - rad);
  const largeArc = angle > 90 ? 1 : 0;

  return (
    <div className="flex items-center gap-2 mt-3">
      <svg width="48" height="28" viewBox="0 0 48 28">
        <path d="M6,24 A18,18 0 0,1 42,24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" strokeLinecap="round" />
        <motion.path
          d={`M6,24 A18,18 0 ${largeArc},1 ${x},${y}`}
          fill="none"
          stroke="#6EE7B7"
          strokeWidth="3"
          strokeLinecap="round"
          initial={false}
          animate={{ d: `M6,24 A18,18 0 ${largeArc},1 ${x},${y}` }}
          transition={{ duration: 0.8 }}
        />
      </svg>
      <span className="text-xs text-muted-foreground tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}

function ResolverOutput() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % OUTCOMES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const outcome = OUTCOMES[idx];
  const conflict = CONFLICTS[idx];
  const colorMap: Record<string, string> = { BULLISH: 'text-green-400', NEUTRAL: 'text-white', BEARISH: 'text-red-400' };
  const glowMap: Record<string, string> = {
    BULLISH: '0 0 20px rgba(74,222,128,0.4)',
    NEUTRAL: '0 0 20px rgba(255,255,255,0.2)',
    BEARISH: '0 0 20px rgba(248,113,113,0.4)',
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="w-16 h-16 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center backdrop-blur-md"
        animate={{ boxShadow: glowMap[outcome] }}
        transition={{ duration: 0.5 }}
      >
        <motion.span
          key={outcome}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-[11px] font-bold font-display ${colorMap[outcome]}`}
        >
          {outcome}
        </motion.span>
      </motion.div>
      <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">{conflict}</p>
    </div>
  );
}

function ConnectingLine({ direction }: { direction: 'left' | 'right' }) {
  return (
    <div className={`hidden md:flex items-center ${direction === 'left' ? 'justify-end' : 'justify-start'}`}>
      <svg width="80" height="4" viewBox="0 0 80 4" className="text-brand-emerald/20">
        <line
          x1="0" y1="2" x2="80" y2="2"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="6 4"
          className="animate-dash-flow"
        />
      </svg>
    </div>
  );
}

function VerticalConnectingLine() {
  return (
    <div className="flex md:hidden justify-center py-2">
      <svg width="4" height="40" viewBox="0 0 4 40" className="text-brand-emerald/20">
        <line
          x1="2" y1="0" x2="2" y2="40"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="6 4"
          className="animate-dash-flow"
        />
      </svg>
    </div>
  );
}

export function AgentVisualizer() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Desktop: horizontal layout */}
      <div className="hidden md:grid grid-cols-[1fr_80px_auto_80px_1fr] items-center gap-0">
        {/* Market Maker Card */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bento-card relative overflow-hidden"
          style={{ boxShadow: '0 0 40px rgba(96,165,250,0.06)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue/80">Market Maker</p>
            <p className="text-xs text-muted-foreground mt-1">Institutional / Smart Money</p>
            <BiasBar
              states={MM_STATES}
              colorMap={{ Accumulating: 'bg-green-400', Distributing: 'bg-red-400', Neutral: 'bg-white/30' }}
            />
            <ConfidenceArc min={0.65} max={0.82} />
          </div>
        </motion.div>

        <ConnectingLine direction="left" />

        {/* Resolver */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <ResolverOutput />
        </motion.div>

        <ConnectingLine direction="right" />

        {/* Retail Investor Card */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bento-card relative overflow-hidden"
          style={{ boxShadow: '0 0 40px rgba(251,191,36,0.06)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-amber/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-amber/80">Retail Investor</p>
            <p className="text-xs text-muted-foreground mt-1">Crowd Sentiment</p>
            <BiasBar
              states={RI_STATES}
              colorMap={{ Bullish: 'bg-green-400', Bearish: 'bg-red-400', Confused: 'bg-yellow-400/50' }}
            />
            <ConfidenceArc min={0.55} max={0.75} />
          </div>
        </motion.div>
      </div>

      {/* Mobile: vertical layout */}
      <div className="flex flex-col items-center md:hidden gap-0">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bento-card w-full relative overflow-hidden"
          style={{ boxShadow: '0 0 40px rgba(96,165,250,0.06)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue/80">Market Maker</p>
            <p className="text-xs text-muted-foreground mt-1">Institutional / Smart Money</p>
            <BiasBar
              states={MM_STATES}
              colorMap={{ Accumulating: 'bg-green-400', Distributing: 'bg-red-400', Neutral: 'bg-white/30' }}
            />
            <ConfidenceArc min={0.65} max={0.82} />
          </div>
        </motion.div>

        <VerticalConnectingLine />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <ResolverOutput />
        </motion.div>

        <VerticalConnectingLine />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bento-card w-full relative overflow-hidden"
          style={{ boxShadow: '0 0 40px rgba(251,191,36,0.06)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-amber/[0.04] to-transparent pointer-events-none" />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-amber/80">Retail Investor</p>
            <p className="text-xs text-muted-foreground mt-1">Crowd Sentiment</p>
            <BiasBar
              states={RI_STATES}
              colorMap={{ Bullish: 'bg-green-400', Bearish: 'bg-red-400', Confused: 'bg-yellow-400/50' }}
            />
            <ConfidenceArc min={0.55} max={0.75} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
