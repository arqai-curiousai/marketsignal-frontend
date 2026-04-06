'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { easeOutExpo } from '../pretext/textRenderer';

/* ── Number particle composing a letter shape ── */
interface NumberParticle {
  value: string;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
}

/* ── State ── */
interface TextShape {
  particles: NumberParticle[];
  width: number;
  height: number;
}

const MICRO_NUMBERS = [
  '1847', '0.73', '2.4%', '89.1', '23.4', '0.56', '154.7', '42.8',
  '3.21', '67.3', '5412', '0.92', '18.2', '4.32', '72.3', '99.8',
  '1.08', '234', '8.92', '45.6', '3892', '0.34', '15.6', '2.78',
  '7.24', '83.4', '1234', '0.65', '11.2', '6.50', '456', '0.89',
  '3.45', '78.9', '21.3', '0.12', '5.67', '98.7', '1.45', '34.5',
];

export function MonteCarloTextCanvas() {
  const isMobile = useMobileDetect();
  const shapeRef = useRef<TextShape | null>(null);
  const readyRef = useRef(false);
  const scatterRef = useRef<{ active: boolean; t: number; born: number }>({
    active: false,
    t: 0,
    born: 0,
  });
  const nextScatterRef = useRef(0);

  const heroText = 'WHAT IF';
  const heroFont = isMobile
    ? '700 80px Sora, system-ui, sans-serif'
    : '700 180px Sora, system-ui, sans-serif';
  const heroFontSize = isMobile ? 80 : 180;
  const particleFont = isMobile
    ? '400 7px Sora, system-ui, sans-serif'
    : '400 9px Sora, system-ui, sans-serif';
  const particleFontSize = isMobile ? 7 : 9;
  const particlesPerChar = isMobile ? 15 : 40;

  useEffect(() => {
    document.fonts.ready.then(() => {
      // Measure hero text to get bounding box
      const handle = prepare(heroText, heroFont);
      let lo = 0;
      let hi = 2000;
      for (let j = 0; j < 18; j++) {
        const mid = (lo + hi) / 2;
        if (layout(handle, mid, heroFontSize).lineCount <= 1) hi = mid;
        else lo = mid;
      }
      const textWidth = Math.ceil(hi) + 10;
      const textHeight = heroFontSize * 1.1;

      // Create number particles distributed within the text area
      // We approximate the text shape by sampling a grid
      const particles: NumberParticle[] = [];
      const cols = Math.ceil(textWidth / (particleFontSize * 3.5));
      const rows = Math.ceil(textHeight / (particleFontSize * 1.8));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Add some randomness to grid positions
          const tx = (c / cols) * textWidth + (Math.random() - 0.5) * particleFontSize * 2;
          const ty = (r / rows) * textHeight + (Math.random() - 0.5) * particleFontSize;

          const numIdx = Math.floor(Math.random() * MICRO_NUMBERS.length);

          particles.push({
            value: MICRO_NUMBERS[numIdx],
            targetX: tx,
            targetY: ty,
            x: tx + (Math.random() - 0.5) * 20,
            y: ty + (Math.random() - 0.5) * 20,
            vx: 0,
            vy: 0,
            opacity: 0.2 + Math.random() * 0.5,
            size: particleFontSize,
          });
        }
      }

      shapeRef.current = { particles, width: textWidth, height: textHeight };
      readyRef.current = true;
    });
  }, [heroFont, heroFontSize, particleFontSize, particlesPerChar]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (!readyRef.current || !shapeRef.current) return;

      const shape = shapeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const offsetX = cx - shape.width / 2;
      const offsetY = cy - shape.height / 2;

      // Scatter timing
      if (time > nextScatterRef.current && !scatterRef.current.active) {
        scatterRef.current = { active: true, t: 0, born: time };
        nextScatterRef.current = time + 6000;
      }

      const scatter = scatterRef.current;
      let scatterStrength = 0;
      if (scatter.active) {
        const age = time - scatter.born;
        const duration = 3000;
        const t = age / duration;

        if (t < 0.25) {
          // Scatter out
          scatterStrength = easeOutExpo(t / 0.25);
        } else if (t < 0.5) {
          // Hold scattered
          scatterStrength = 1;
        } else if (t < 1) {
          // Reconverge
          scatterStrength = 1 - easeOutExpo((t - 0.5) / 0.5);
        } else {
          scatter.active = false;
          scatterStrength = 0;
        }
      }

      // Draw background ghost text
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.font = heroFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(167, 139, 250, 1)';
      ctx.fillText(heroText, cx, cy);
      ctx.restore();

      // Update and draw particles
      ctx.font = particleFont;
      ctx.textBaseline = 'middle';

      shape.particles.forEach((p, i) => {
        // Target position (relative to text center)
        let tx = offsetX + p.targetX;
        let ty = offsetY + p.targetY;

        if (scatterStrength > 0) {
          // Gaussian-distributed scatter: center particles scatter less, edges more
          // This creates a visible bell curve shape during the scatter phase
          const dx = p.targetX - shape.width / 2;
          const dy = p.targetY - shape.height / 2;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const normalizedDist = dist / (Math.max(shape.width, shape.height) * 0.5);
          // Gaussian: particles near center get smaller scatter, edges get larger
          const gaussianFactor = 0.3 + normalizedDist * 1.2;
          const fanDist = (60 + dist * 1.2) * gaussianFactor;
          // Vertical bias: push particles upward more if they're near center (bell shape)
          const verticalBias = (1 - normalizedDist) * -40 * scatterStrength;
          tx += (dx / dist) * fanDist * scatterStrength;
          ty += (dy / dist) * fanDist * scatterStrength + verticalBias;
        }

        // Brownian vibration
        const vibX = Math.sin(time * 0.005 + i * 1.7) * 1.5;
        const vibY = Math.cos(time * 0.004 + i * 2.3) * 1.5;

        // Spring toward target
        p.vx += (tx + vibX - p.x) * 0.06;
        p.vy += (ty + vibY - p.y) * 0.06;
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;

        // Opacity
        const scatterFade = scatterStrength > 0.5 ? 1 - (scatterStrength - 0.5) * 0.6 : 1;
        const alpha = p.opacity * scatterFade;

        if (alpha < 0.02) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Color: violet theme with variation
        const hue = 250 + (i % 30);
        ctx.fillStyle = `hsla(${hue}, 60%, 75%, 0.9)`;
        ctx.fillText(p.value, p.x, p.y);
        ctx.restore();
      });

      // Draw scatter label when scattered
      if (scatterStrength > 0.3) {
        ctx.save();
        ctx.globalAlpha = scatterStrength * 0.7;
        ctx.font = isMobile ? '600 14px Sora, system-ui, sans-serif' : '600 18px Sora, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(167, 139, 250, 0.6)';
        ctx.fillText('SIMULATING OUTCOMES...', cx, cy + shape.height / 2 + 30);
        ctx.restore();
      }
    },
    [heroFont, heroText, particleFont, isMobile],
  );

  return (
    <PretextCanvas
      draw={draw}
      fps={isMobile ? 30 : 60}
      className="rounded-xl"
    />
  );
}
