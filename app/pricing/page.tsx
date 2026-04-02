'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  DollarSign,
  Zap,
  ArrowRight,
  Crown,
  Sparkles,
} from 'lucide-react';

/* ─── animation variants (matching landing page style) ─── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ─── plan data ─── */
interface Plan {
  name: string;
  price: number;
  period: string;
  tagline: string;
  icon: React.ElementType;
  features: string[];
  highlighted: boolean;
  badge?: string;
  glowColor: string;
  borderColor: string;
  iconBg: string;
  ctaLabel: string;
  ctaStyle: string;
}

const plans: Plan[] = [
  {
    name: 'Forex',
    price: 20,
    period: '/mo',
    tagline: '42 global currency pairs across 17 currencies',
    icon: DollarSign,
    features: [
      'Real-time forex heatmaps & strength meters',
      '42 currency pairs (G10, exotics, INR, EM)',
      'Multi-timeframe technicals (5m to weekly)',
      'Carry trade analysis & session tracking',
      'Volatility regime detection',
      'Mean reversion scoring',
    ],
    highlighted: false,
    glowColor: 'rgba(110, 231, 183, 0.06)',
    borderColor: 'border-white/[0.08]',
    iconBg: 'from-brand-emerald/20 to-brand-emerald/5',
    ctaLabel: 'Start with Forex',
    ctaStyle:
      'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.10] hover:border-white/20',
  },
  {
    name: 'Pro',
    price: 50,
    period: '/mo',
    tagline: 'Forex + AI-powered news intelligence',
    icon: Sparkles,
    features: [
      'Everything in Forex',
      'AI-curated news with sentiment scoring',
      'Impact analysis per instrument',
      'Central bank & macro event tracking',
      'Cross-reference news with price action',
      'Sector intelligence & correlation explorer',
      'DCC-GARCH dynamic correlations',
      'Pattern detection & chart patterns',
    ],
    highlighted: true,
    badge: 'Most Popular',
    glowColor: 'rgba(74, 222, 128, 0.08)',
    borderColor: 'border-brand-emerald/30',
    iconBg: 'from-brand-blue/30 to-brand-violet/10',
    ctaLabel: 'Go Pro',
    ctaStyle:
      'bg-brand-emerald text-brand-slate font-semibold hover:bg-brand-emerald/90 shadow-[0_0_30px_rgba(110,231,183,0.2),0_0_60px_rgba(110,231,183,0.1)] hover:shadow-[0_0_50px_rgba(110,231,183,0.3)]',
  },
  {
    name: 'Elite',
    price: 100,
    period: '/mo',
    tagline: 'Full platform access with Simulation Lab',
    icon: Crown,
    features: [
      'Everything in Pro',
      'Simulation Lab access',
      'Volatility intelligence (5 estimators)',
      'GARCH forecasting & regime detection',
      'AI dual-agent analytics pipeline',
      'Simulation Lab with 9 analytical tools',
      'F&O analytics with Greeks & payoffs',
      'Priority support & early features',
    ],
    highlighted: false,
    glowColor: 'rgba(34, 197, 94, 0.05)',
    borderColor: 'border-white/[0.08]',
    iconBg: 'from-brand-violet/20 to-brand-blue/10',
    ctaLabel: 'Go Elite',
    ctaStyle:
      'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.10] hover:border-white/20',
  },
];

/* ─── star dots for atmosphere ─── */
const stars = [
  { left: '8%', top: '15%', delay: 0 },
  { left: '88%', top: '20%', delay: 0.6 },
  { left: '15%', top: '80%', delay: 1.2 },
  { left: '78%', top: '85%', delay: 0.3 },
  { left: '50%', top: '8%', delay: 0.9 },
  { left: '5%', top: '50%', delay: 1.5 },
  { left: '95%', top: '55%', delay: 0.4 },
  { left: '35%', top: '92%', delay: 1.1 },
];

export default function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Aurora background blobs ── */}
      <motion.div
        className="absolute top-[20%] left-[15%] w-[500px] h-[500px] bg-brand-emerald/[0.04] blur-[180px] rounded-full pointer-events-none"
        animate={{ x: [0, 25, -15, 0], y: [0, -20, 10, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-brand-blue/[0.03] blur-[160px] rounded-full pointer-events-none"
        animate={{ x: [0, -20, 15, 0], y: [0, 15, -20, 0], scale: [1, 0.92, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[65%] left-[30%] w-[350px] h-[350px] bg-brand-violet/[0.03] blur-[140px] rounded-full pointer-events-none"
        animate={{ x: [0, 15, -25, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Star dots ── */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          aria-hidden="true"
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{ left: star.left, top: star.top }}
          animate={{ opacity: [0.05, 0.4, 0.05], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 3.5, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* ── Content ── */}
      <div className="relative z-10 w-full px-6 pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="container max-w-6xl mx-auto">
          {/* ── Header ── */}
          <motion.div
            className="text-center mb-16 md:mb-20"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <span className="section-label">Pricing</span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="font-display headline-xl text-4xl sm:text-5xl md:text-6xl text-white mb-5"
            >
              <span className="font-bold">Choose your </span>
              <span className="gradient-text font-bold">edge.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto"
            >
              Institutional-grade analytics at a fraction of the cost. No contracts, cancel anytime.
            </motion.p>
          </motion.div>

          {/* ── Plan Cards ── */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  className={`relative rounded-2xl ${plan.borderColor} border p-px group`}
                >
                  {/* Animated gradient border for highlighted card */}
                  {plan.highlighted && (
                    <div className="absolute -inset-px rounded-2xl gradient-border-animated pointer-events-none" />
                  )}

                  <div
                    className={`relative rounded-2xl h-full flex flex-col ${
                      plan.highlighted
                        ? 'bg-white/[0.04] backdrop-blur-lg'
                        : 'bg-white/[0.02] backdrop-blur-md'
                    } transition-all duration-500 hover:bg-white/[0.05]`}
                    style={{
                      boxShadow: plan.highlighted
                        ? `inset 0 1px 0 0 rgba(255,255,255,0.06), 0 0 60px ${plan.glowColor}, 0 8px 40px rgba(0,0,0,0.3)`
                        : 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-emerald text-brand-slate text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(110,231,183,0.3)]">
                          <Zap className="h-3 w-3" />
                          {plan.badge}
                        </div>
                      </div>
                    )}

                    <div className="p-8 md:p-9 flex flex-col h-full">
                      {/* Icon + Name */}
                      <div className="flex items-center gap-3 mb-6">
                        <div
                          className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${plan.iconBg} border border-white/[0.06]`}
                        >
                          <Icon className="h-5 w-5 text-white/80" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-[11px] font-medium text-muted-foreground self-start mt-2">
                          $
                        </span>
                        <span className="text-5xl font-bold text-white tracking-tight font-display">
                          {plan.price}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          {plan.period}
                        </span>
                      </div>

                      {/* Tagline */}
                      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                        {plan.tagline}
                      </p>

                      {/* Divider */}
                      <div className="h-px bg-white/[0.06] mb-7" />

                      {/* Features */}
                      <ul className="space-y-3.5 mb-10 flex-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <div
                              className={`flex-shrink-0 mt-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center ${
                                plan.highlighted
                                  ? 'text-brand-emerald'
                                  : 'text-white/40'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </div>
                            <span className="text-white/70 leading-snug">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <Link
                        href="/login"
                        className={`mt-auto w-full h-12 rounded-xl text-sm font-medium transition-all duration-300 inline-flex items-center justify-center ${plan.ctaStyle}`}
                      >
                        {plan.ctaLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ── Bottom note ── */}
          <motion.div
            className="text-center mt-16 md:mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <p className="text-sm text-muted-foreground/60">
              All plans include a 7-day free trial. No credit card required to start.
            </p>

            {/* FAQ / Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-10">
              {[
                { label: 'Cancel anytime' },
                { label: 'Secure payments' },
                { label: '7-day free trial' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-xs text-muted-foreground/50 uppercase tracking-wider"
                >
                  <div className="w-1 h-1 rounded-full bg-brand-emerald/50" />
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
