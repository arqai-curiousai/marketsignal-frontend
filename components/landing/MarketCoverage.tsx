'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { COVERAGE } from './constants';
import { staggerContainer, fadeUp } from './animations';

const colorMap = {
  emerald: {
    gradient: 'from-brand-emerald/8 to-transparent',
    number: 'text-brand-emerald/[0.09]',
    border: 'hover:border-brand-emerald/20',
  },
  blue: {
    gradient: 'from-brand-blue/8 to-transparent',
    number: 'text-brand-blue/[0.09]',
    border: 'hover:border-brand-blue/20',
  },
  violet: {
    gradient: 'from-brand-violet/8 to-transparent',
    number: 'text-brand-violet/[0.09]',
    border: 'hover:border-brand-violet/20',
  },
};

export function MarketCoverage() {
  return (
    <section className="landing-section bg-white/[0.01]">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="section-label">{COVERAGE.label}</span>
          <h2 className="font-display headline-xl text-4xl md:text-5xl lg:text-6xl text-white">
            <span className="font-bold">{COVERAGE.headline}</span>
            <br />
            <span className="text-muted-foreground font-light">{COVERAGE.headlineLine2}</span>
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {COVERAGE.cards.map((card) => {
            const colors = colorMap[card.color];
            return (
              <motion.div
                key={card.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 md:p-10 transition-all duration-500 backdrop-blur-sm ${colors.border}`}
                style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)' }}
              >
                {/* Big background number with watermark blur */}
                <div className={`absolute -top-4 -right-4 text-[120px] md:text-[160px] font-display font-bold leading-none select-none blur-[1px] ${colors.number}`}>
                  {card.bigNumber}
                </div>

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} pointer-events-none`} />

                {/* Decorative dots */}
                <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-white/[0.04]" />
                <div className="absolute bottom-8 right-12 w-1.5 h-1.5 rounded-full bg-white/[0.03]" />

                <div className="relative z-10">
                  <h3 className="text-xl font-semibold text-white mb-3 font-display">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
