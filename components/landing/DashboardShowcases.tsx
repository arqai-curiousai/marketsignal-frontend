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

function PatternsVisual() {
  const candles = [
    { o: 50, c: 58, h: 62, l: 48 },
    { o: 58, c: 55, h: 60, l: 53 },
    { o: 55, c: 63, h: 65, l: 54 },
    { o: 63, c: 60, h: 66, l: 58 },
    { o: 60, c: 68, h: 70, l: 59 },
    { o: 68, c: 72, h: 75, l: 66 },
    { o: 72, c: 69, h: 74, l: 67 },
    { o: 69, c: 76, h: 78, l: 68 },
    { o: 76, c: 74, h: 80, l: 72 },
    { o: 74, c: 82, h: 84, l: 73 },
  ];
  const W = 320;
  const H = 120;
  const cw = W / candles.length - 4;
  const mn = 45;
  const mx = 85;
  const scaleY = (v: number) => H - ((v - mn) / (mx - mn)) * (H - 20) - 10;

  // Supertrend line: follows below candles, switches color
  const stLine = candles.map((c, i) => {
    const x = i * (cw + 4) + 2 + cw / 2;
    const y = scaleY(Math.min(c.o, c.c) - 3);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {candles.map((c, i) => {
          const x = i * (cw + 4) + 2;
          const bullish = c.c >= c.o;
          const bodyTop = scaleY(Math.max(c.o, c.c));
          const bodyBot = scaleY(Math.min(c.o, c.c));
          return (
            <g key={i}>
              <line x1={x + cw / 2} y1={scaleY(c.h)} x2={x + cw / 2} y2={scaleY(c.l)} stroke={bullish ? '#4ade80' : '#f87171'} strokeWidth={1} strokeOpacity={0.6} />
              <rect x={x} y={bodyTop} width={cw} height={Math.max(bodyBot - bodyTop, 1)} rx={2} fill={bullish ? '#4ade8050' : '#f8717150'} stroke={bullish ? '#4ade80' : '#f87171'} strokeWidth={0.5} />
            </g>
          );
        })}

        {/* Supertrend overlay */}
        <motion.path
          d={stLine}
          fill="none"
          stroke="#6EE7B7"
          strokeWidth={1.5}
          strokeDasharray="3 2"
          opacity={0.5}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />

        {/* Pattern annotation with animated dash */}
        <rect x={5 * (cw + 4) - 4} y={2} width={(cw + 4) * 3 + 8} height={H - 4} rx={6} fill="none" stroke="#6EE7B7" strokeWidth={1} strokeDasharray="4 2" opacity={0.4}>
          <animate attributeName="stroke-dashoffset" values="0;12" dur="2s" repeatCount="indefinite" />
        </rect>
        <text x={5 * (cw + 4) + (cw + 4) * 1.5} y={H - 4} textAnchor="middle" fill="#6EE7B7" fontSize={8} opacity={0.7}>Bullish Engulfing</text>
      </svg>
      <div className="flex gap-1.5 justify-center">
        {['5m', '15m', '1H', '1D', '1W'].map((tf, i) => (
          <div key={tf} className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
            i === 3
              ? 'gradient-border-animated text-brand-emerald'
              : 'bg-white/[0.03] text-muted-foreground border border-white/[0.06] hover:bg-white/[0.05]'
          }`}>
            {tf}
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

function FnOVisual() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/[0.06] overflow-hidden text-[10px]">
        <div className="grid grid-cols-5 gap-px bg-white/[0.04] px-2 py-1.5 text-muted-foreground font-medium border-b border-white/[0.06]">
          <span>CE OI</span><span>CE LTP</span><span className="text-center text-brand-emerald">Strike</span><span>PE LTP</span><span>PE OI</span>
        </div>
        {[
          { ceOi: '12.4L', ceLtp: '245', strike: '22000', peLtp: '180', peOi: '8.2L' },
          { ceOi: '18.1L', ceLtp: '165', strike: '22100', peLtp: '225', peOi: '15.3L' },
          { ceOi: '22.5L', ceLtp: '98', strike: '22200', peLtp: '310', peOi: '11.7L' },
        ].map((row, i) => (
          <div key={i} className={`grid grid-cols-5 gap-px px-2 py-1.5 transition-colors ${
            i === 1
              ? 'bg-brand-emerald/[0.06] shadow-[inset_0_0_20px_rgba(110,231,183,0.05)]'
              : 'bg-white/[0.01] hover:bg-white/[0.03]'
          }`}>
            <span className="text-muted-foreground tabular-nums">{row.ceOi}</span>
            <span className="text-green-400 tabular-nums">{row.ceLtp}</span>
            <span className="text-center text-white font-medium tabular-nums">{row.strike}</span>
            <span className="text-red-400 tabular-nums">{row.peLtp}</span>
            <span className="text-muted-foreground tabular-nums">{row.peOi}</span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 200 60" className="w-full h-auto">
        <defs>
          <linearGradient id="payoffFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6EE7B7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
        <motion.path
          d="M0,50 L60,50 L80,30 L120,10 L140,10 L200,10"
          fill="none"
          stroke="#6EE7B7"
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.3 }}
        />
        <path d="M0,50 L60,50 L80,30 L120,10 L140,10 L200,10 L200,60 L0,60 Z" fill="url(#payoffFill)" opacity={0.6} />
        <text x="100" y="56" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={7}>Bull Call Spread</text>
      </svg>
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
      <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${tickers.length}, 1fr)` }}>
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

function ResearchVisual() {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-end">
        <div className="rounded-xl rounded-br-sm bg-brand-emerald/10 border border-brand-emerald/20 px-3.5 py-2 max-w-[85%] shadow-[0_0_20px_rgba(110,231,183,0.05)]">
          <div className="text-xs text-white/90">What&apos;s driving IT sector momentum this quarter?</div>
        </div>
      </div>
      <div className="flex justify-start">
        <div className="rounded-xl rounded-bl-sm bg-white/[0.03] border border-white/[0.06] px-3.5 py-2.5 max-w-[90%] space-y-2">
          <div className="text-xs text-white/80 leading-relaxed">
            IT sector is up 8.2% QoQ driven by strong deal wins and USD/INR tailwinds. TCS and Infosys reported double-digit revenue growth...
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['TCS Q3 Report', 'NSE Sectoral Data', 'RBI Forex Brief'].map((src) => (
              <motion.span
                key={src}
                whileHover={{ y: -2 }}
                className="text-[9px] px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue border border-brand-blue/20 cursor-default transition-colors hover:bg-brand-blue/15"
              >
                {src}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 px-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-emerald/40"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Visual Selector ─────────────────────────────────────────────────────────

const VISUALS: Record<string, React.FC> = {
  sectors: SectorsVisual,
  patterns: PatternsVisual,
  news: NewsVisual,
  fno: FnOVisual,
  correlation: CorrelationVisual,
  research: ResearchVisual,
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
            Six specialized views. Each built to give you an edge that generic platforms can&apos;t.
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
