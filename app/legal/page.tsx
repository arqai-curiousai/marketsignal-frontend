'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Shield, Info, Scale, Gavel } from 'lucide-react';
import { fadeUp, blurIn, staggerContainer } from '@/components/landing/animations';

const colorMap = {
  blue: { icon: 'text-brand-blue', bg: 'bg-brand-blue/10', border: 'hover:border-brand-blue/30' },
  emerald: { icon: 'text-brand-emerald', bg: 'bg-brand-emerald/10', border: 'hover:border-brand-emerald/30' },
  violet: { icon: 'text-brand-violet', bg: 'bg-brand-violet/10', border: 'hover:border-brand-violet/30' },
};

const dataSources = [
  {
    title: 'Exchange Market Data',
    description: 'Live and historical pricing from NSE via Kite Connect (Zerodha), and global exchanges (NASDAQ, NYSE, LSE, HKSE) via EODHD.',
    color: 'blue' as const,
  },
  {
    title: 'News Aggregation',
    description: 'Financial news aggregated from Indian and global sources including Economic Times, NDTV Profit, Livemint, Moneycontrol, and Hindu Business Line.',
    color: 'emerald' as const,
  },
  {
    title: 'Currency & Commodity Data',
    description: 'Forex rates and commodity pricing via EODHD and FCSAPI data feeds.',
    color: 'violet' as const,
  },
];

export default function LegalPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });
  const contentRef = useRef<HTMLDivElement>(null);
  const contentInView = useInView(contentRef, { once: true, margin: '-80px' });
  const dataRef = useRef<HTMLDivElement>(null);
  const dataInView = useInView(dataRef, { once: true, margin: '-80px' });

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Aurora background blobs */}
      <motion.div
        className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-brand-blue/[0.04] blur-[180px] rounded-full pointer-events-none"
        animate={{ x: [0, 25, -15, 0], y: [0, -20, 10, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[50%] left-[65%] w-[400px] h-[400px] bg-brand-emerald/[0.03] blur-[160px] rounded-full pointer-events-none"
        animate={{ x: [0, -20, 15, 0], y: [0, 15, -20, 0], scale: [1, 0.92, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[75%] left-[25%] w-[350px] h-[350px] bg-brand-violet/[0.03] blur-[140px] rounded-full pointer-events-none"
        animate={{ x: [0, 15, -25, 0], y: [0, -15, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-6 pt-24 pb-32 md:pt-32 md:pb-40">
        <div className="container max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div
            ref={heroRef}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="mb-20 text-center"
          >
            <motion.span variants={fadeUp} className="section-label justify-center">
              LEGAL & COMPLIANCE
            </motion.span>
            <motion.h1
              variants={blurIn}
              className="font-display text-4xl sm:text-5xl md:text-6xl headline-xl text-white mb-6"
            >
              <span className="font-bold">Transparency,</span>{' '}
              <span className="font-serif italic bg-gradient-to-r from-brand-emerald via-brand-blue to-brand-emerald bg-[length:200%_auto] bg-clip-text text-transparent">
                by Design
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-xl mx-auto">
              Methodology, regulatory disclaimers, and data provenance
            </motion.p>
          </motion.div>

          {/* Investment Disclaimer */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16"
          >
            <div className="bento-card relative overflow-hidden p-8 md:p-10">
              <div className="absolute top-4 right-4 opacity-[0.04]">
                <Shield className="h-28 w-28" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 border border-brand-blue/[0.12] flex items-center justify-center">
                  <Scale className="h-5 w-5 text-brand-blue" />
                </div>
                <h2 className="text-xl font-bold text-white">Investment Disclaimer</h2>
              </div>
              <div className="space-y-4 text-white/80 leading-relaxed">
                <p className="font-bold text-white uppercase tracking-tight text-sm">
                  MarketSignal AI is an informational research platform only.
                </p>
                <p className="text-sm">
                  The content, signals, and AI-generated analysis provided on this platform do not constitute investment, financial, tax, or legal advice. No part of this platform should be construed as a recommendation to buy, sell, or hold any security or financial instrument.
                </p>
                <p className="text-sm">
                  Investing in financial markets involves significant risk. Past performance is not indicative of future results. Always consult with a qualified financial advisor before making any investment decisions.
                </p>
              </div>
            </div>
          </motion.section>

          {/* AI Methodology + Regulatory Compliance */}
          <motion.section
            ref={contentRef}
            initial="hidden"
            animate={contentInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
          >
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bento-card hover:border-brand-emerald/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-emerald/10 border border-brand-emerald/[0.12] flex items-center justify-center">
                  <Info className="h-4 w-4 text-brand-emerald" />
                </div>
                <h3 className="text-base font-semibold text-white">AI Methodology</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our AI Research Assistant uses Retrieval-Augmented Generation (RAG) to synthesize insights from verified institutional data sources. Every response is cross-referenced against multiple feeds to ensure accuracy and reduce hallucinations.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bento-card hover:border-brand-violet/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-violet/10 border border-brand-violet/[0.12] flex items-center justify-center">
                  <Gavel className="h-4 w-4 text-brand-violet" />
                </div>
                <h3 className="text-base font-semibold text-white">Regulatory Compliance</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We enforce strict &quot;no-recommendation&quot; filters. Our systems are designed to provide data, context, and analysis without crossing the line into personalized investment advice as defined by global financial regulators.
              </p>
            </motion.div>
          </motion.section>

          {/* Data Provenance */}
          <motion.section
            ref={dataRef}
            initial="hidden"
            animate={dataInView ? 'visible' : 'hidden'}
            variants={staggerContainer}
            className="mb-16"
          >
            <motion.span variants={fadeUp} className="section-label">
              DATA PROVENANCE
            </motion.span>
            <motion.h3
              variants={fadeUp}
              className="font-display text-2xl md:text-3xl headline-xl text-white mb-8 font-bold"
            >
              Where the data comes from
            </motion.h3>

            <div className="space-y-4">
              {dataSources.map((source) => {
                const colors = colorMap[source.color];
                return (
                  <motion.div
                    key={source.title}
                    variants={fadeUp}
                    className="bento-card flex items-start gap-4"
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${colors.bg.replace('/10', '')} shadow-[0_0_6px_currentColor]`} />
                    <div>
                      <p className="text-sm font-medium text-white mb-1">{source.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{source.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={dataInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-8" />
            <p className="text-center text-xs text-muted-foreground/50">
              Last updated: March 30, 2026
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
