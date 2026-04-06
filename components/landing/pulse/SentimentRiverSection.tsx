'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import {
  SAMPLE_HEADLINES,
  SENTIMENT_COLORS,
  SENTIMENT_GLOW,
  type Sentiment,
} from '../pretext/data/pulseHeadlines';
import { staggerContainer, clipReveal, fadeUp } from '../animations';

/* ── Flowing headline in the river ── */
interface RiverHeadline {
  text: string;
  sentiment: Sentiment;
  width: number;
  x: number;
  y: number;
  speed: number;
  lane: number;
  opacity: number;
}

const LANE_COUNT = 4;
const MOBILE_LANES = 2;

export function SentimentRiverSection() {
  const isMobile = useMobileDetect();
  const headlinesRef = useRef<RiverHeadline[]>([]);
  const readyRef = useRef(false);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const lanes = isMobile ? MOBILE_LANES : LANE_COUNT;

  const font = isMobile
    ? '400 11px Inter, system-ui, sans-serif'
    : '400 13px Inter, system-ui, sans-serif';

  // Initialize flowing headlines
  useEffect(() => {
    document.fonts.ready.then(() => {
      const items: RiverHeadline[] = [];

      // Create enough headlines to fill the river
      const headlinesPerLane = isMobile ? 4 : 6;

      for (let lane = 0; lane < lanes; lane++) {
        for (let i = 0; i < headlinesPerLane; i++) {
          const defIdx = (lane * headlinesPerLane + i) % SAMPLE_HEADLINES.length;
          const def = SAMPLE_HEADLINES[defIdx];

          const handle = prepare(def.text, font);
          let lo = 0;
          let hi = 600;
          for (let j = 0; j < 14; j++) {
            const mid = (lo + hi) / 2;
            if (layout(handle, mid, 16).lineCount <= 1) hi = mid;
            else lo = mid;
          }
          const width = Math.ceil(hi) + 16;

          // Direction based on sentiment
          const direction = def.sentiment === 'bullish' ? 1 : def.sentiment === 'bearish' ? -1 : (lane % 2 === 0 ? 1 : -1);
          const baseSpeed = 0.3 + Math.random() * 0.2;

          items.push({
            text: def.text,
            sentiment: def.sentiment,
            width,
            x: Math.random() * 2000 - 500,
            y: 0, // computed in draw
            speed: baseSpeed * direction,
            lane,
            opacity: 0.3 + Math.random() * 0.4,
          });
        }
      }

      headlinesRef.current = items;
      readyRef.current = true;
    });
  }, [font, lanes, isMobile]);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (!readyRef.current) return;

      const headlines = headlinesRef.current;
      const laneHeight = h / lanes;
      const mouse = mouseRef.current;

      // River pulse — width oscillation
      const pulsePhase = (Math.sin(time * 0.001) + 1) / 2;
      const pulseScale = 0.92 + pulsePhase * 0.08;

      // Draw lane guides (very subtle)
      for (let i = 0; i <= lanes; i++) {
        const y = i * laneHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Mouse spotlight glow
      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 60);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 60, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw headlines
      headlines.forEach((hl) => {
        // Mouse proximity → slow down + boost opacity
        let speedMult = 1;
        let opacityBoost = 0;
        if (mouse) {
          const dx = mouse.x - (hl.x + hl.width / 2);
          const dy = mouse.y - hl.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            const proximity = 1 - d / 120;
            speedMult = 1 - proximity * 0.5;
            opacityBoost = proximity * 0.3;
          }
        }

        // Move
        hl.x += hl.speed * speedMult;

        // Wrap around
        if (hl.speed > 0 && hl.x > w + 50) {
          hl.x = -(hl.width + 50);
        } else if (hl.speed < 0 && hl.x < -(hl.width + 50)) {
          hl.x = w + 50;
        }

        // Y position based on lane
        hl.y = hl.lane * laneHeight + laneHeight / 2;

        // Viewport edge fade
        const edgeFade =
          hl.x < 100
            ? hl.x / 100
            : hl.x + hl.width > w - 100
              ? (w - hl.x - hl.width + 100) / 100
              : 1;

        const alpha = (hl.opacity + opacityBoost) * Math.max(edgeFade, 0) * pulseScale;
        if (alpha < 0.01) return;

        const color = SENTIMENT_COLORS[hl.sentiment];
        const glow = SENTIMENT_GLOW[hl.sentiment];

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = font;
        ctx.textBaseline = 'middle';

        // Glow
        ctx.shadowColor = glow;
        ctx.shadowBlur = 6;
        ctx.fillStyle = color;
        ctx.fillText(hl.text, hl.x, hl.y);

        ctx.shadowBlur = 0;
        ctx.fillText(hl.text, hl.x, hl.y);

        ctx.restore();
      });
    },
    [font, lanes],
  );

  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden">
      {/* Header */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="text-center mb-8 px-6"
      >
        <motion.p variants={clipReveal} className="section-label justify-center">
          LIVE INFORMATION FLOW
        </motion.p>
        <motion.p variants={fadeUp} className="text-sm text-white/40 mt-2">
          Bullish headlines flow right. Bearish flow left. Watch the market narrative unfold.
        </motion.p>
      </motion.div>

      {/* River canvas */}
      <div className="relative w-full" style={{ height: isMobile ? 160 : 220 }}>
        <PretextCanvas
          draw={draw}
          fps={isMobile ? 30 : 60}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 px-6">
        {(['bullish', 'bearish', 'neutral'] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SENTIMENT_COLORS[s] }}
            />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">{s}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
