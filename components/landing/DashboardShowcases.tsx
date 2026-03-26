'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { DASHBOARDS, type DashboardShowcase } from './constants';
import { fadeUp, staggerContainer } from './animations';

// ─── Glow color map ─────────────────────────────────────────────────────────

const GLOW_COLORS: Record<string, { bg: string; border: string }> = {
  emerald: { bg: 'bg-brand-emerald/[0.06]', border: 'border-brand-emerald/10' },
  blue: { bg: 'bg-brand-blue/[0.06]', border: 'border-brand-blue/10' },
  violet: { bg: 'bg-brand-violet/[0.06]', border: 'border-brand-violet/10' },
};

// ─── Mini Visual Components ──────────────────────────────────────────────────

function SectorsVisual() {
  const sectors = [
    { name: 'IT', val: 3.2 },
    { name: 'Banks', val: -1.1 },
    { name: 'Pharma', val: 1.8 },
    { name: 'Auto', val: 0.3 },
    { name: 'FMCG', val: -0.5 },
    { name: 'Metal', val: 2.4 },
    { name: 'Energy', val: -1.8 },
    { name: 'Realty', val: 4.1 },
    { name: 'Infra', val: 0.9 },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {sectors.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.06 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className={`rounded-lg p-2.5 cursor-default transition-colors ${
              s.val > 0
                ? 'bg-green-500/10 border border-green-500/10 hover:bg-green-500/15'
                : 'bg-red-500/10 border border-red-500/10 hover:bg-red-500/15'
            } ${s.name === 'Realty' ? 'ring-1 ring-green-400/20' : ''}`}
          >
            <div className="text-[10px] text-muted-foreground">{s.name}</div>
            <div className={`text-xs font-bold tabular-nums ${s.val > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {s.val > 0 ? '+' : ''}{s.val}%
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        {[{ k: 'PE', v: '22.4' }, { k: 'PB', v: '3.1' }, { k: 'DY', v: '1.2%' }].map((m) => (
          <div key={m.k} className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.06] py-2 px-2.5 text-center">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{m.k}</div>
            <div className="text-xs font-semibold text-white tabular-nums">{m.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CurrencyVisual() {
  const pairs = [
    { name: 'EUR/USD', val: 0.32 },
    { name: 'GBP/USD', val: -0.18 },
    { name: 'USD/JPY', val: 0.45 },
    { name: 'AUD/USD', val: -0.27 },
    { name: 'EUR/GBP', val: 0.12 },
    { name: 'USD/INR', val: 0.08 },
  ];
  const strengths = [
    { currency: 'USD', score: 72, color: 'bg-blue-400' },
    { currency: 'EUR', score: 58, color: 'bg-brand-emerald' },
    { currency: 'GBP', score: 45, color: 'bg-violet-400' },
    { currency: 'INR', score: 38, color: 'bg-orange-400' },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {pairs.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.06 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className={`rounded-lg p-2.5 cursor-default transition-colors ${
              p.val > 0
                ? 'bg-green-500/10 border border-green-500/10 hover:bg-green-500/15'
                : 'bg-red-500/10 border border-red-500/10 hover:bg-red-500/15'
            }`}
          >
            <div className="text-[10px] text-muted-foreground">{p.name}</div>
            <div className={`text-xs font-bold tabular-nums ${p.val > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {p.val > 0 ? '+' : ''}{p.val}%
            </div>
          </motion.div>
        ))}
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium px-1">Strength</div>
        {strengths.map((s) => (
          <div key={s.currency} className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-muted-foreground w-6 font-medium">{s.currency}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${s.color}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${s.score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <span className="text-[10px] text-white/50 tabular-nums w-5 text-right">{s.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsVisual() {
  const items = [
    { headline: 'RBI holds repo rate steady at 6.5%', sentiment: 'Neutral', impact: 'High', sentimentColor: 'text-white/60', borderColor: 'border-l-white/20' },
    { headline: 'TCS wins $2B deal with European bank', sentiment: 'Bullish', impact: 'Medium', sentimentColor: 'text-green-400', borderColor: 'border-l-green-400/40' },
    { headline: 'Crude oil surges past $85/barrel', sentiment: 'Bearish', impact: 'High', sentimentColor: 'text-red-400', borderColor: 'border-l-red-400/40' },
  ];
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.15 }}
          className={`rounded-lg border border-white/[0.06] ${item.borderColor} border-l-2 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors`}
        >
          <div className="text-xs text-white/90 mb-1.5 leading-snug">{item.headline}</div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-medium ${item.sentimentColor}`}>{item.sentiment}</span>
            <div className="flex items-center gap-1.5">
              {item.impact === 'High' && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-red-400"
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <span className="text-[10px] text-muted-foreground">Impact: {item.impact}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CorrelationVisual() {
  const tickers = ['RELI', 'TCS', 'HDFC', 'USD', 'GOLD'];
  const matrix = [
    [1, 0.6, 0.4, -0.2, -0.3],
    [0.6, 1, 0.5, -0.1, -0.2],
    [0.4, 0.5, 1, 0.1, -0.4],
    [-0.2, -0.1, 0.1, 1, 0.7],
    [-0.3, -0.2, -0.4, 0.7, 1],
  ];
  const getColor = (v: number, isDiag: boolean) => {
    if (isDiag) return 'bg-gradient-to-br from-white/[0.06] to-white/[0.02]';
    if (v > 0.5) return 'bg-blue-500/40';
    if (v > 0.2) return 'bg-blue-400/20';
    if (v > -0.2) return 'bg-white/[0.03]';
    if (v > -0.5) return 'bg-orange-400/20';
    return 'bg-orange-500/40';
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${tickers.length}, 1fr)` }} role="img" aria-label="Correlation matrix preview">
        <div />
        {tickers.map((t) => (
          <div key={t} className="text-[9px] text-muted-foreground text-center font-medium">{t}</div>
        ))}
        {matrix.map((row, ri) => (
          <React.Fragment key={ri}>
            <div className="text-[9px] text-muted-foreground flex items-center font-medium">{tickers[ri]}</div>
            {row.map((v, ci) => (
              <motion.div
                key={ci}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.15 }}
                viewport={{ once: true }}
                transition={{ delay: (ri * tickers.length + ci) * 0.02 }}
                className={`aspect-square rounded-sm ${getColor(v, ri === ci)} flex items-center justify-center cursor-default transition-transform`}
              >
                <span className="text-[8px] text-white/50 tabular-nums">{ri === ci ? '1.0' : v.toFixed(1)}</span>
              </motion.div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground">
        <div className="w-3 h-3 rounded-sm bg-orange-500/40" />
        <span>-1</span>
        <div className="w-16 h-2.5 rounded-full bg-gradient-to-r from-orange-500/40 via-white/[0.04] to-blue-500/40 mx-1" />
        <span>+1</span>
        <div className="w-3 h-3 rounded-sm bg-blue-500/40" />
      </div>
    </div>
  );
}

// ─── Visual Selector ─────────────────────────────────────────────────────────

const VISUALS: Record<string, React.FC> = {
  sectors: SectorsVisual,
  currency: CurrencyVisual,
  news: NewsVisual,
  correlation: CorrelationVisual,
};

// ─── Single Dashboard Section ────────────────────────────────────────────────

function DashboardSection({ dashboard, index }: { dashboard: DashboardShowcase; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reversed = index % 2 === 1;
  const Icon = dashboard.icon;
  const Visual = VISUALS[dashboard.visual];
  const glow = GLOW_COLORS[dashboard.glowColor] || GLOW_COLORS.emerald;

  return (
    <div ref={ref} className="py-16 md:py-24 first:pt-0">
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reversed ? 'lg:[direction:rtl]' : ''}`}>
        {/* Copy side */}
        <motion.div
          className={reversed ? 'lg:[direction:ltr]' : ''}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-emerald">
              {dashboard.label}
            </span>
          </motion.div>

          <motion.h3
            variants={fadeUp}
            className="font-display text-3xl md:text-4xl lg:text-[2.75rem] tracking-tight leading-[1.1] mb-5"
          >
            <span className="text-white font-bold">{dashboard.headline}</span>
            <br />
            <span className="text-muted-foreground font-light">{dashboard.headlineAccent}</span>
          </motion.h3>

          <motion.p
            variants={fadeUp}
            className="text-base text-muted-foreground leading-relaxed mb-6 max-w-lg"
          >
            {dashboard.description}
          </motion.p>

          <motion.ul variants={fadeUp} className="space-y-2.5 mb-8">
            {dashboard.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                <Check className="h-4 w-4 text-brand-emerald mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div variants={fadeUp}>
            <Link
              href={dashboard.href}
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-emerald hover:text-brand-emerald/80 transition-colors group/link"
            >
              Explore {dashboard.label.toLowerCase()}
              <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Visual side */}
        <motion.div
          className={reversed ? 'lg:[direction:ltr]' : ''}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className={`rounded-2xl border ${glow.border} bg-white/[0.02] p-5 md:p-6 relative overflow-hidden`}
            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.02)' }}
          >
            {/* Top edge highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            {/* Per-dashboard glow */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 ${glow.bg} blur-[60px] rounded-full pointer-events-none`} />
            <div className="relative z-10">
              <Visual />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DashboardShowcases() {
  return (
    <section id="dashboards" className="w-full py-16 md:py-24 px-6">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="section-label">DASHBOARDS</span>
          <h2 className="font-display headline-xl text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            Every dashboard, in detail.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four specialized views. Each built to give you an edge that generic platforms can&apos;t.
          </p>
        </motion.div>

        <div className="divide-y divide-white/[0.04]">
          {DASHBOARDS.map((db, i) => (
            <DashboardSection key={db.id} dashboard={db} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
