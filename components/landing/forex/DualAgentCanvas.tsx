'use client';

import React, { useCallback } from 'react';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { colorWithAlpha } from '../pretext/canvasEffects';

/* ── Colors ── */
const BLUE = 'rgba(96, 165, 250, 1)';
const AMBER = 'rgba(251, 191, 36, 1)';
const EMERALD = 'rgba(110, 231, 183, 1)';

const SORA = (size: number, weight = 600) =>
  `${weight} ${size}px Sora, system-ui, sans-serif`;

/* ── Flowing text data ── */
const MM_LABELS = [
  'MARKET MAKER', 'Accumulating', 'Distributing', 'Neutral',
  'Smart Money', 'Institutional', '0.82', '0.71', '0.55',
  'Flow Analysis', 'Order Book', 'Block Trade', 'Dark Pool',
  'Sweep Order', 'VWAP Cross', 'Accumulation', 'Distribution',
];
const RI_LABELS = [
  'RETAIL INVESTOR', 'Bullish', 'Bearish', 'Confused',
  'Crowd Sentiment', 'FOMO', '0.76', '0.68', '0.45',
  'Social Signal', 'Momentum', 'Herd Behavior', 'Panic Sell',
  'Trend Follow', 'Mean Revert', 'Capitulation', 'Euphoria',
];
const OUTCOME_LABELS = [
  'DIVERGENCE', 'CONSENSUS', 'MIXED', 'CONFLICT',
  'HIGH CONVICTION', 'BUY SIGNAL', 'SELL SIGNAL', 'HOLD',
  '0.85 CAP', 'RESOLVER', 'DETERMINISTIC', 'NO HALLUCINATION',
];

interface FloatingText {
  text: string;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  alpha: number;
  targetAlpha: number;
  color: string;
  font: string;
}

const textsRef: FloatingText[] = [];
let initialized = false;

function initTexts(w: number, h: number) {
  textsRef.length = 0;
  const all = [
    ...MM_LABELS.map((t) => ({ text: t, color: BLUE })),
    ...RI_LABELS.map((t) => ({ text: t, color: AMBER })),
    ...OUTCOME_LABELS.map((t) => ({ text: t, color: EMERALD })),
  ];

  all.forEach((item, i) => {
    const size = 8 + Math.random() * 4;
    textsRef.push({
      text: item.text,
      x: Math.random() * w,
      y: Math.random() * h,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.15 - 0.1,
      alpha: 0,
      targetAlpha: 0.04 + Math.random() * 0.08,
      color: item.color,
      font: SORA(size, i % 3 === 0 ? 700 : 500),
    });
  });
  initialized = true;
}

export function DualAgentCanvas() {
  const isMobile = useMobileDetect();

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _time: number) => {
      if (!initialized || textsRef.length === 0) {
        initTexts(w, h);
      }

      textsRef.forEach((t) => {
        // Move
        t.x += t.speedX;
        t.y += t.speedY;

        // Wrap around
        if (t.x < -100) t.x = w + 50;
        if (t.x > w + 100) t.x = -50;
        if (t.y < -30) t.y = h + 20;
        if (t.y > h + 30) t.y = -20;

        // Fade in
        t.alpha += (t.targetAlpha - t.alpha) * 0.01;

        // Draw
        ctx.save();
        ctx.font = t.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(t.color, t.alpha);
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      });
    },
    [],
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 20 : 30}
        fallback={null}
      />
    </div>
  );
}
