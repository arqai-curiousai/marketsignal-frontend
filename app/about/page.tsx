'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    ArrowRight,
    Eye,
    Globe2,
    ShieldCheck,
    BarChart3,
} from 'lucide-react';
import { fadeUp, blurIn, staggerContainer } from '@/components/landing/animations';

/* ═══════════════════════════════════════════════════════════
   Section 1 — Hero: The Mission
   ═══════════════════════════════════════════════════════════ */

function ScrollIndicator() {
    return (
        <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
        >
            <motion.div
                className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-white/5"
                animate={{ scaleY: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="w-1.5 h-1.5 rounded-full bg-white/20"
                animate={{ y: [0, 4, 0], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
        </motion.div>
    );
}

function HeroSection() {
    return (
        <section className="grain-overlay relative w-full min-h-[80vh] flex items-center px-6 pt-24 pb-20 overflow-hidden">
            {/* Aurora gradient mesh */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-brand-emerald/[0.04] blur-[150px] rounded-full"
                    animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-brand-violet/[0.04] blur-[130px] rounded-full"
                    animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-brand-blue/[0.03] blur-[120px] rounded-full"
                    animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <div className="container max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
                >
                    <motion.span
                        variants={fadeUp}
                        className="inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-emerald rounded-full px-5 py-2 mb-8 gradient-border-animated"
                    >
                        About arQai
                    </motion.span>

                    <motion.h1
                        variants={blurIn}
                        className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl headline-xl text-white mb-8"
                    >
                        <span className="font-bold">Institutional-Grade</span>
                        <br />
                        <span className="font-light bg-gradient-to-r from-brand-emerald via-brand-blue to-brand-emerald bg-[length:200%_auto] bg-clip-text text-transparent">
                            Market Intelligence
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-4"
                    >
                        MarketSignal by arQai brings the same analytical tools used by institutional
                        trading desks to every investor. Two independent AI agents analyze every data point.
                        A deterministic resolver settles every disagreement. No black boxes. No guesswork.
                    </motion.p>

                    <motion.p
                        variants={fadeUp}
                        className="text-base text-muted-foreground/70 max-w-xl mx-auto leading-relaxed"
                    >
                        Built in India. Watching the world.
                    </motion.p>
                </motion.div>
            </div>

            <ScrollIndicator />
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════
   Section 2 — Timeline: Our Journey
   ═══════════════════════════════════════════════════════════ */

const milestones = [
    {
        year: '2024',
        title: 'The Dual-Agent Engine',
        description:
            'MarketSignal launched with a first-of-its-kind analytical architecture: two independent AI agents — a Market Maker (institutional perspective) and a Retail Investor (crowd sentiment) — analyze every market snapshot. A deterministic conflict resolver maps their biases into actionable pattern classifications. Divergence between smart money and retail crowds produces the most informative analysis.',
    },
    {
        year: '2025 Q1',
        title: 'Multi-Exchange Expansion',
        description:
            'Coverage expanded from NSE alone to 5 global stock exchanges — NASDAQ, NYSE, LSE, and HKSE — with 260+ tracked stocks. Sector intelligence dashboards brought heatmaps, relative rotation graphs, Mansfield RS, FII/DII ownership tracking, and valuation aggregates across all exchanges.',
    },
    {
        year: '2025 Q1',
        title: 'Forex Analytics & 42 Pairs',
        description:
            'A dedicated forex analytics suite launched with 42 global currency pairs across 17 currencies: real-time heatmaps with G10/Full/Exotics matrix modes, currency strength meters, carry trade analysis, multi-timeframe technicals, volatility regime detection, and session tracking across Asia, London, and New York. Powered by 5-minute OHLCV data and AI-curated news impact scoring.',
    },
    {
        year: '2025 Q2',
        title: 'Analytics Intelligence Suite',
        description:
            'Deep analytics dashboards arrived — DCC-GARCH dynamic correlations, F&O option chain analysis with Greeks and GEX, multi-timeframe pattern detection with candlestick confirmation, volatility intelligence with range-based estimators and GARCH forecasts, and a news intelligence engine with sentiment scoring from 20+ sources across 6 global regions.',
    },
    {
        year: 'Now',
        title: 'Always Evolving',
        description:
            'The platform keeps growing. The Simulation Lab, advanced portfolio analytics, and expanded AI capabilities are in continuous development. Every 5 minutes, the engine refreshes. Every day, the intelligence gets sharper.',
    },
];

function TimelineSection() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section ref={ref} className="w-full py-24 md:py-32 px-6 relative overflow-hidden">
            {/* Subtle background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>

            <div className="container max-w-3xl mx-auto relative z-10">
                <motion.div
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    variants={staggerContainer}
                    className="mb-16 text-center"
                >
                    <motion.span variants={fadeUp} className="section-label">
                        Our Journey
                    </motion.span>
                    <motion.h2
                        variants={fadeUp}
                        className="font-display text-3xl sm:text-4xl md:text-5xl headline-xl text-white"
                    >
                        Built insight by insight
                    </motion.h2>
                </motion.div>

                {/* Timeline */}
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[23px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-[2px]">
                        <motion.div
                            className="w-full h-full bg-gradient-to-b from-brand-emerald via-brand-blue to-brand-violet"
                            initial={{ scaleY: 0 }}
                            animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            style={{ transformOrigin: 'top' }}
                        />
                    </div>

                    <div className="space-y-12">
                        {milestones.map((milestone, i) => {
                            const isEven = i % 2 === 0;
                            return (
                                <TimelineCard
                                    key={i}
                                    milestone={milestone}
                                    index={i}
                                    isEven={isEven}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

function TimelineCard({
    milestone,
    index,
    isEven,
}: {
    milestone: (typeof milestones)[0];
    index: number;
    isEven: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex items-start gap-6 md:gap-0 ${
                isEven ? 'md:flex-row' : 'md:flex-row-reverse'
            }`}
        >
            {/* Dot on timeline */}
            <div className="absolute left-[16px] md:left-1/2 md:-translate-x-1/2 top-1 z-10">
                <motion.div
                    className="w-4 h-4 rounded-full border-2 border-brand-emerald bg-brand-slate"
                    animate={inView ? { boxShadow: '0 0 12px rgba(110, 231, 183, 0.5)' } : {}}
                    transition={{ delay: 0.3 + index * 0.1 }}
                />
            </div>

            {/* Card */}
            <div className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] ${isEven ? 'md:pr-0 md:mr-auto' : 'md:pl-0 md:ml-auto'}`}>
                <div className="glass-card p-5 md:p-6">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-emerald bg-brand-emerald/10 px-3 py-1 rounded-full mb-3">
                        {milestone.year}
                    </span>
                    <h3 className="text-lg font-semibold text-white mb-2">{milestone.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {milestone.description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════
   Section 3 — Values: What We Believe
   ═══════════════════════════════════════════════════════════ */

const values = [
    {
        icon: Eye,
        title: 'AI Transparency',
        description:
            'Every analysis shows both agent perspectives — Market Maker and Retail Investor — plus the conflict type. You see why the AI decided, not just what it decided. Confidence scores are capped to prevent hallucination overreach.',
        color: 'emerald' as const,
    },
    {
        icon: Globe2,
        title: 'Built in India, Watching the World',
        description:
            'Built on NSE and NIFTY 50, then expanded to NASDAQ, NYSE, LSE, and HKSE. 42 forex pairs across 17 currencies — G10, Scandinavian, Asia-Pacific, and Emerging Markets. 5 MCX commodities and 20+ news sources across 6 regions round out the coverage. Local roots, global reach.',
        color: 'blue' as const,
    },
    {
        icon: ShieldCheck,
        title: 'Information, Not Advice',
        description:
            'MarketSignal is an analytics platform, not a tipster. We surface patterns, data, and intelligence — never buy or sell recommendations. Regulatory-compliant by design, with content filtering built into every response.',
        color: 'violet' as const,
    },
    {
        icon: BarChart3,
        title: 'Institutional Tools for Everyone',
        description:
            'DCC-GARCH correlations, F&O Greeks with gamma exposure, multi-timeframe pattern detection, volatility intelligence with GARCH forecasts. Tools that used to cost thousands per month, accessible to every trader.',
        color: 'sage' as const,
    },
];

const colorMap = {
    emerald: {
        glow: 'rgba(110, 231, 183, 0.15)',
        border: 'hover:border-brand-emerald/30',
        icon: 'text-brand-emerald',
        bg: 'bg-brand-emerald/10',
    },
    blue: {
        glow: 'rgba(74, 222, 128, 0.15)',
        border: 'hover:border-brand-blue/30',
        icon: 'text-brand-blue',
        bg: 'bg-brand-blue/10',
    },
    violet: {
        glow: 'rgba(34, 197, 94, 0.15)',
        border: 'hover:border-brand-violet/30',
        icon: 'text-brand-violet',
        bg: 'bg-brand-violet/10',
    },
    sage: {
        glow: 'rgba(134, 239, 172, 0.15)',
        border: 'hover:border-brand-sage/30',
        icon: 'text-brand-sage',
        bg: 'bg-brand-sage/10',
    },
};

function ValuesSection() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section ref={ref} className="w-full py-24 md:py-32 px-6 relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            <div className="container max-w-5xl mx-auto">
                <motion.div
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    variants={staggerContainer}
                    className="mb-16 text-center"
                >
                    <motion.span variants={fadeUp} className="section-label">
                        Our Principles
                    </motion.span>
                    <motion.h2
                        variants={fadeUp}
                        className="font-display text-3xl sm:text-4xl md:text-5xl headline-xl text-white"
                    >
                        What we believe
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {values.map((value) => {
                        const Icon = value.icon;
                        const colors = colorMap[value.color];
                        return (
                            <motion.div
                                key={value.title}
                                variants={fadeUp}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.2 }}
                                className={`bento-card group ${colors.border}`}
                            >
                                <div className={`inline-flex p-2.5 rounded-xl ${colors.bg} mb-4`}>
                                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-brand-emerald transition-colors duration-300">
                                    {value.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {value.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════
   Section 5 — CTA: Join The Platform
   ═══════════════════════════════════════════════════════════ */

const starPositions = [
    { left: '12%', top: '18%', delay: 0 },
    { left: '85%', top: '22%', delay: 0.8 },
    { left: '25%', top: '75%', delay: 1.2 },
    { left: '72%', top: '80%', delay: 0.4 },
    { left: '8%', top: '50%', delay: 1.6 },
    { left: '92%', top: '55%', delay: 0.6 },
    { left: '45%', top: '12%', delay: 1.0 },
    { left: '55%', top: '88%', delay: 1.4 },
];

function CTASection() {
    return (
        <section className="relative w-full py-32 md:py-40 px-6 overflow-hidden">
            {/* Aurora blobs */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-emerald/[0.07] blur-[180px] rounded-full pointer-events-none"
                animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0], scale: [1, 1.1, 0.95, 1] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute top-[40%] left-[35%] w-[400px] h-[400px] bg-brand-blue/[0.05] blur-[150px] rounded-full pointer-events-none"
                animate={{ x: [0, -25, 20, 0], y: [0, 20, -15, 0], scale: [1, 0.9, 1.1, 1] }}
                transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute top-[55%] left-[60%] w-[350px] h-[350px] bg-brand-violet/[0.04] blur-[140px] rounded-full pointer-events-none"
                animate={{ x: [0, 15, -30, 0], y: [0, -20, 25, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Perspective grid */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]" style={{ perspective: '600px' }}>
                <div className="absolute inset-x-0 bottom-0 h-[60%]" style={{ transform: 'rotateX(55deg)', transformOrigin: 'bottom center' }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={`h-${i}`} className="absolute h-px w-full bg-white" style={{ bottom: `${i * 9}%` }} />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={`v-${i}`} className="absolute w-px h-full bg-white" style={{ left: `${10 + i * 9}%` }} />
                    ))}
                </div>
            </div>

            {/* Star dots */}
            {starPositions.map((star, i) => (
                <motion.div
                    key={i}
                    aria-hidden="true"
                    className="absolute w-1 h-1 rounded-full bg-white/30"
                    style={{ left: star.left, top: star.top }}
                    animate={{ opacity: [0.1, 0.5, 0.1], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 3, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            <div className="container max-w-3xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <h2 className="font-display headline-xl text-4xl sm:text-5xl md:text-6xl text-white mb-5">
                        <span className="font-bold">Ready to see the full picture?</span>
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-lg mx-auto">
                        Join the next generation of market intelligence.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login">
                            <Button
                                size="lg"
                                className="h-14 px-10 text-base bg-brand-emerald text-brand-slate font-semibold hover:bg-brand-emerald/90 transition-all shadow-[0_0_30px_rgba(110,231,183,0.2),0_0_60px_rgba(110,231,183,0.1)] hover:shadow-[0_0_50px_rgba(110,231,183,0.3),0_0_80px_rgba(110,231,183,0.15)] rounded-xl"
                            >
                                Get Started Free
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/signals">
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 px-10 text-base border-white/10 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] text-white transition-all rounded-xl"
                            >
                                Explore the Platform
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════
   Page Assembly
   ═══════════════════════════════════════════════════════════ */

export default function AboutPage() {
    return (
        <main className="flex flex-col">
            <HeroSection />
            <TimelineSection />
            <ValuesSection />
            <CTASection />
        </main>
    );
}
