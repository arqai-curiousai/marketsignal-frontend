'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DUAL_AGENT } from './constants';
import { fadeUp, staggerContainer, scaleReveal } from './animations';
import { AgentVisualizer } from './AgentVisualizer';
import { VideoClip } from './VideoClip';

export function DualAgentEngine() {
  return (
    <section className="landing-section relative overflow-hidden">
      {/* Background video at low opacity */}
      <VideoClip
        webm={DUAL_AGENT.video.webm}
        mp4={DUAL_AGENT.video.mp4}
        overlay
        opacity={0.15}
        blendMode="screen"
      />

      <div className="container max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.p variants={fadeUp} className="section-label justify-center">
            {DUAL_AGENT.label}
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl lg:text-6xl headline-xl text-white mb-6"
          >
            <span className="font-bold">{DUAL_AGENT.headline}</span>{' '}
            <span className="font-serif italic gradient-text-hero">{DUAL_AGENT.headlineSerif}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {DUAL_AGENT.sub}
          </motion.p>
        </motion.div>

        {/* Agent Visualization */}
        <div className="mb-16">
          <AgentVisualizer />
        </div>

        {/* Feature Callouts */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {DUAL_AGENT.callouts.map((callout) => (
            <motion.div
              key={callout.title}
              variants={scaleReveal}
              className="bento-card text-center py-5 px-4"
            >
              <p className="text-sm font-semibold text-white mb-1">{callout.title}</p>
              <p className="text-xs text-muted-foreground">{callout.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
