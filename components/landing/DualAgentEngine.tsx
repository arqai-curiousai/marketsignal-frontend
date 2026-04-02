'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DUAL_AGENT } from './constants';
import {
  staggerContainer,
  clipReveal,
  clipRevealUp,
  slideInFromLeft,
  slideInFromRight,
  dropIn,
  fadeUp,
  EASE_OUT_EXPO,
} from './animations';
import { VideoClip } from './VideoClip';

/* ── Agent state cycling ── */
const MM_STATES = ['Accumulating', 'Distributing', 'Neutral'] as const;
const RI_STATES = ['Bullish', 'Bearish', 'Confused'] as const;
const OUTCOMES = ['Divergence', 'Consensus', 'Mixed'] as const;

function useAgentCycle<T extends string>(states: readonly T[], interval = 3500) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % states.length), interval);
    return () => clearInterval(t);
  }, [states.length, interval]);
  return states[idx];
}

/* ── Confidence bar ── */
function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] text-white/30 mb-1.5">
        <span>Confidence</span>
        <span className="tabular-nums font-display">{value.toFixed(2)}</span>
      </div>
      <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
        />
      </div>
    </div>
  );
}

/* ── Agent card ── */
function AgentCard({
  label,
  role,
  bias,
  biasColor,
  confidence,
  barColor,
  accentGlow,
  accentBg,
  quote,
}: {
  label: string;
  role: string;
  bias: string;
  biasColor: string;
  confidence: number;
  barColor: string;
  accentGlow: string;
  accentBg: string;
  quote: string;
}) {
  return (
    <div
      className="bento-card relative overflow-hidden"
      style={{ boxShadow: `0 0 60px ${accentGlow}` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accentBg} to-transparent pointer-events-none`} />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50 mb-1">
          {label}
        </p>
        <p className="text-xs text-white/35">{role}</p>

        <div className="mt-5 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${biasColor}`} />
          <span className="text-sm font-medium text-white">{bias}</span>
        </div>

        <ConfidenceBar value={confidence} color={barColor} />

        <p className="mt-4 text-[11px] text-white/30 italic leading-relaxed border-l border-white/[0.06] pl-3">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
    </div>
  );
}

/* ── Conflict resolution center ── */
function ConflictResolver({ outcome }: { outcome: string }) {
  const colorMap: Record<string, string> = {
    Divergence: 'text-brand-emerald',
    Consensus: 'text-brand-blue',
    Mixed: 'text-brand-amber',
  };
  const glowMap: Record<string, string> = {
    Divergence: '0 0 30px rgba(110,231,183,0.3)',
    Consensus: '0 0 30px rgba(96,165,250,0.3)',
    Mixed: '0 0 30px rgba(251,191,36,0.3)',
  };

  return (
    <motion.div
      className="flex flex-col items-center py-6"
      variants={dropIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-3">
        Conflict Resolution
      </div>
      <motion.div
        className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center backdrop-blur-md"
        animate={{ boxShadow: glowMap[outcome] ?? glowMap.Mixed }}
        transition={{ duration: 0.5 }}
      >
        <motion.span
          key={outcome}
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.5 }}
          className={`text-xs font-bold font-display uppercase ${colorMap[outcome] ?? 'text-white'}`}
        >
          {outcome}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

/* ── Callout card ── */
function Callout({ title, description, glow }: { title: string; description: string; glow: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="bento-card text-center py-5 px-4 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: `radial-gradient(circle at 50% 0%, ${glow}, transparent 60%)` }}
      />
      <p className="text-sm font-semibold text-white mb-1 relative">{title}</p>
      <p className="text-xs text-white/45 relative">{description}</p>
    </motion.div>
  );
}

/* ── Main component ── */
export function DualAgentEngine() {
  const mmBias = useAgentCycle(MM_STATES);
  const riBias = useAgentCycle(RI_STATES, 4000);
  const outcome = useAgentCycle(OUTCOMES, 3500);

  const mmConf = mmBias === 'Accumulating' ? 0.82 : mmBias === 'Distributing' ? 0.71 : 0.55;
  const riConf = riBias === 'Bullish' ? 0.76 : riBias === 'Bearish' ? 0.68 : 0.45;

  const mmBiasColor =
    mmBias === 'Accumulating' ? 'bg-green-400' : mmBias === 'Distributing' ? 'bg-red-400' : 'bg-white/30';
  const riBiasColor =
    riBias === 'Bullish' ? 'bg-green-400' : riBias === 'Bearish' ? 'bg-red-400' : 'bg-yellow-400/60';

  const mmQuotes: Record<string, string> = {
    Accumulating: 'Smart money accumulation detected across major pairs...',
    Distributing: 'Institutional distribution pattern forming on higher timeframes...',
    Neutral: 'No clear institutional positioning — range-bound behavior...',
  };
  const riQuotes: Record<string, string> = {
    Bullish: 'Retail sentiment turning aggressively bullish, FOMO building...',
    Bearish: 'Retail panic selling accelerating, crowd exiting positions...',
    Confused: 'Mixed signals from retail — no clear directional consensus...',
  };

  return (
    <section className="landing-section relative overflow-hidden">
      {/* Background video */}
      <VideoClip
        webm={DUAL_AGENT.video.webm}
        mp4={DUAL_AGENT.video.mp4}
        overlay
        opacity={0.12}
        blendMode="screen"
      />

      <div className="container max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center mb-20"
        >
          <motion.p variants={clipReveal} className="section-label justify-center">
            {DUAL_AGENT.label}
          </motion.p>
          <motion.h2
            variants={clipRevealUp}
            className="font-display text-4xl md:text-5xl lg:text-[4.5rem] headline-lg text-white mb-6"
          >
            <span className="font-bold">{DUAL_AGENT.headline}</span>{' '}
            <span className="font-serif italic gradient-text-hero text-[2.5rem] md:text-[3.5rem] lg:text-[5rem]">
              {DUAL_AGENT.headlineSerif}
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-xl text-white/55 max-w-3xl mx-auto">
            {DUAL_AGENT.sub}
          </motion.p>
        </motion.div>

        {/* Split-screen theater */}
        <div className="max-w-5xl mx-auto mb-8">
          {/* Desktop: side-by-side with divider */}
          <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-8 items-stretch">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={slideInFromLeft}
            >
              <AgentCard
                label="Market Maker"
                role="Institutional / Smart Money"
                bias={mmBias}
                biasColor={mmBiasColor}
                confidence={mmConf}
                barColor="bg-brand-blue"
                accentGlow="rgba(96,165,250,0.06)"
                accentBg="from-brand-blue/[0.03]"
                quote={mmQuotes[mmBias]}
              />
            </motion.div>

            {/* Vertical divider */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex-1 w-px bg-gradient-to-b from-transparent via-brand-emerald/20 to-transparent" />
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-brand-emerald/40"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0.7, 0.3],
                  boxShadow: [
                    '0 0 8px rgba(110,231,183,0.2)',
                    '0 0 20px rgba(110,231,183,0.5)',
                    '0 0 8px rgba(110,231,183,0.2)',
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <div className="flex-1 w-px bg-gradient-to-b from-transparent via-brand-emerald/20 to-transparent" />
            </div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={slideInFromRight}
            >
              <AgentCard
                label="Retail Investor"
                role="Crowd Sentiment"
                bias={riBias}
                biasColor={riBiasColor}
                confidence={riConf}
                barColor="bg-brand-amber"
                accentGlow="rgba(251,191,36,0.06)"
                accentBg="from-brand-amber/[0.03]"
                quote={riQuotes[riBias]}
              />
            </motion.div>
          </div>

          {/* Mobile: stacked */}
          <div className="flex flex-col gap-4 md:hidden">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <AgentCard
                label="Market Maker"
                role="Institutional / Smart Money"
                bias={mmBias}
                biasColor={mmBiasColor}
                confidence={mmConf}
                barColor="bg-brand-blue"
                accentGlow="rgba(96,165,250,0.06)"
                accentBg="from-brand-blue/[0.03]"
                quote={mmQuotes[mmBias]}
              />
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <AgentCard
                label="Retail Investor"
                role="Crowd Sentiment"
                bias={riBias}
                biasColor={riBiasColor}
                confidence={riConf}
                barColor="bg-brand-amber"
                accentGlow="rgba(251,191,36,0.06)"
                accentBg="from-brand-amber/[0.03]"
                quote={riQuotes[riBias]}
              />
            </motion.div>
          </div>

          {/* Conflict resolution — drops in after agents */}
          <ConflictResolver outcome={outcome} />
        </div>

        {/* Callout cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {DUAL_AGENT.callouts.map((c, i) => (
            <Callout
              key={c.title}
              title={c.title}
              description={c.description}
              glow={
                i === 0
                  ? 'rgba(96,165,250,0.08)'
                  : i === 1
                    ? 'rgba(110,231,183,0.08)'
                    : 'rgba(251,191,36,0.08)'
              }
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
