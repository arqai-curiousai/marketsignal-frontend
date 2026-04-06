'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SIM_GRID } from '../constants/simulations';
import { fadeUp, staggerContainer, scaleReveal } from '../animations';
import { SimGridItemCanvas } from './SimGridItemCanvas';

export function SimulationGrid() {
  return (
    <section id="grid" className="landing-section relative overflow-hidden">
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
            9 FREE TOOLS
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl lg:text-6xl headline-xl text-white mb-6"
          >
            <span className="font-bold">Wall Street Tools,</span>{' '}
            <span className="font-serif italic gradient-text-hero">Your Hands</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Check how risky a stock really is. See where your portfolio could go in a crash. Test any strategy against real history. Build the perfect mix of investments. All in one place — and all completely free.
          </motion.p>
        </motion.div>

        {/* 3x3 Bento Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {SIM_GRID.map((item) => (
            <GridCard key={item.id} item={item} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function GridCard({ item }: { item: (typeof SIM_GRID)[number] }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = item.icon;

  return (
    <motion.div
      variants={scaleReveal}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bento-card flex flex-col group relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Canvas visualization — always visible, intensifies on hover */}
      <div className="absolute inset-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500">
        <SimGridItemCanvas
          toolId={item.id as Parameters<typeof SimGridItemCanvas>[0]['toolId']}
          isHovered={isHovered}
        />
      </div>

      {/* Icon */}
      <div className="w-9 h-9 rounded-lg bg-brand-violet/[0.08] border border-brand-violet/[0.12] flex items-center justify-center mb-3 relative z-10">
        <Icon className="h-4 w-4 text-brand-violet" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-white mb-0.5">{item.title}</h3>
        <p className="text-[10px] font-medium text-brand-violet/80 uppercase tracking-wider mb-2">
          {item.subtitle}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
        style={{ boxShadow: 'inset 0 0 60px rgba(167,139,250,0.06)' }}
      />
    </motion.div>
  );
}
