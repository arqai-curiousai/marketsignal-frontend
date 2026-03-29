'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TRUST } from './constants';
import { fadeUp, staggerContainer, scaleReveal } from './animations';

/* ── Animated visual accents for each card ── */
function FilterVisual() {
    const keywords = [
        'Buy now',
        'Guaranteed returns',
        'Sure profit',
        'Risk-free',
        'Investment advice',
        'Insider tip',
    ];

    return (
        <div className="mt-4 space-y-1.5 overflow-hidden h-20">
            {keywords.map((word, i) => (
                <motion.div
                    key={word}
                    className="flex items-center gap-2 text-[10px] font-mono"
                    initial={{ x: -10, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + i * 0.15 }}
                >
                    <span className="text-red-400/60 line-through">{word}</span>
                    <span className="text-red-400/40 text-[8px]">✕ blocked</span>
                </motion.div>
            ))}
        </div>
    );
}

function AgentsVisual() {
    return (
        <div className="mt-4 flex items-center justify-center gap-6">
            {/* MM indicator */}
            <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-brand-blue">MM</span>
                </div>
                <div className="h-1 w-6 rounded-full bg-green-400/40" />
                <span className="text-[8px] text-muted-foreground">0.78</span>
            </div>
            {/* Conflict */}
            <div className="flex flex-col items-center gap-1">
                <motion.div
                    className="w-3 h-3 rounded-full border border-brand-emerald/30"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[8px] text-brand-emerald/60">Divergence</span>
            </div>
            {/* RI indicator */}
            <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-lg bg-brand-amber/10 border border-brand-amber/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-brand-amber">RI</span>
                </div>
                <div className="h-1 w-6 rounded-full bg-red-400/40" />
                <span className="text-[8px] text-muted-foreground">0.62</span>
            </div>
        </div>
    );
}

function DataFlowVisual() {
    return (
        <div className="mt-4 flex items-center justify-center gap-3">
            {['API', 'MongoDB', 'S3'].map((node, i) => (
                <React.Fragment key={node}>
                    {i > 0 && (
                        <svg width="24" height="8" viewBox="0 0 24 8" className="text-brand-emerald/20">
                            <line
                                x1="0"
                                y1="4"
                                x2="24"
                                y2="4"
                                stroke="currentColor"
                                strokeWidth="1"
                                strokeDasharray="4 3"
                                className="animate-dash-flow"
                            />
                        </svg>
                    )}
                    <div className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[9px] text-muted-foreground font-mono">
                        {node}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
}

const VISUAL_MAP: Record<string, React.FC> = {
    filter: FilterVisual,
    agents: AgentsVisual,
    'data-flow': DataFlowVisual,
};

/* ── Main component ── */
export function TrustWall() {
    return (
        <section className="landing-section relative overflow-hidden">
            <div className="container max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={staggerContainer}
                    className="text-center mb-16"
                >
                    <motion.p variants={fadeUp} className="section-label justify-center">
                        {TRUST.label}
                    </motion.p>
                    <motion.h2
                        variants={fadeUp}
                        className="font-display text-4xl md:text-5xl lg:text-6xl headline-xl text-white mb-6"
                    >
                        <span className="font-bold">{TRUST.headline}</span>{' '}
                        <span className="font-serif italic gradient-text-hero">
                            {TRUST.headlineSerif}
                        </span>
                    </motion.h2>
                </motion.div>

                {/* Cards */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-40px' }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12"
                >
                    {TRUST.cards.map((card) => {
                        const Visual = VISUAL_MAP[card.visual];
                        const Icon = card.icon;

                        return (
                            <motion.div
                                key={card.title}
                                variants={scaleReveal}
                                whileHover={{ y: -4 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="bento-card flex flex-col"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-lg bg-brand-emerald/[0.08] border border-brand-emerald/[0.12] flex items-center justify-center">
                                        <Icon className="h-4 w-4 text-brand-emerald" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-white">
                                        {card.title}
                                    </h3>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                                    {card.description}
                                </p>
                                {Visual && <Visual />}
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Disclaimer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-[11px] text-muted-foreground/50 uppercase tracking-wider max-w-3xl mx-auto"
                >
                    {TRUST.disclaimer}
                </motion.p>
            </div>
        </section>
    );
}
