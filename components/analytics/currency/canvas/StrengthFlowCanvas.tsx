'use client';

import { useRef, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import { colorWithAlpha } from '@/components/landing/pretext/canvasEffects';
import { useForexData } from '../ForexDataProvider';
import {
  FONT_CODE_SM,
  FONT_VALUE_SM,
  POSITIVE_COLOR,
  NEGATIVE_COLOR,
  BREATHE_SPEED,
} from './canvasConstants';

interface StreamEntry {
  code: string;
  strength: number;
  absStrength: number;
  isPositive: boolean;
  labelWidth: number;
}

interface StreamParticle {
  streamIdx: number;
  x: number;
  speed: number;
  brightness: number;
}

export function StrengthFlowCanvas() {
  const isMobile = useMobileDetect();
  const { strength } = useForexData();
  const streamsRef = useRef<StreamEntry[]>([]);
  const particlesRef = useRef<StreamParticle[]>([]);
  const builtForRef = useRef('');
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef(-1);

  const buildStreams = useCallback(() => {
    const currencies = strength?.currencies ?? {};
    const key = JSON.stringify(currencies);
    if (key === builtForRef.current) return;
    builtForRef.current = key;

    const entries: StreamEntry[] = [];
    for (const [code, vals] of Object.entries(currencies)) {
      const s = vals['1d'] ?? 0;
      const handle = prepare(code, FONT_CODE_SM);
      let lo = 0, hi = 80;
      for (let j = 0; j < 12; j++) {
        const mid = (lo + hi) / 2;
        if (layout(handle, mid, 1).lineCount <= 1) hi = mid;
        else lo = mid;
      }
      entries.push({
        code,
        strength: s,
        absStrength: Math.abs(s),
        isPositive: s >= 0,
        labelWidth: Math.ceil(hi) + 2,
      });
    }

    // Sort by strength (strongest at top)
    entries.sort((a, b) => b.strength - a.strength);
    streamsRef.current = entries;

    // Build particles
    const particles: StreamParticle[] = [];
    const count = isMobile ? 20 : 40;
    for (let i = 0; i < count; i++) {
      particles.push({
        streamIdx: Math.floor(Math.random() * Math.max(1, entries.length)),
        x: Math.random(),
        speed: 0.001 + Math.random() * 0.003,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
    particlesRef.current = particles;
  }, [strength, isMobile]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      buildStreams();
      const streams = streamsRef.current;
      const particles = particlesRef.current;
      if (streams.length === 0) return;

      const maxAbs = Math.max(...streams.map(s => s.absStrength), 1);
      const leftMargin = 40;
      const rightMargin = 50;
      const streamAreaW = w - leftMargin - rightMargin;
      const streamH = Math.min(20, (h - 8) / streams.length - 2);
      const gap = 2;
      const totalH = streams.length * (streamH + gap);
      const startY = (h - totalH) / 2;

      const mouse = mouseRef.current;
      hoveredRef.current = -1;

      streams.forEach((s, i) => {
        const y = startY + i * (streamH + gap);
        const bandW = Math.max(8, (s.absStrength / maxAbs) * streamAreaW * 0.85);

        // Check hover
        if (mouse && mouse.y >= y && mouse.y < y + streamH) {
          hoveredRef.current = i;
        }
        const isHovered = hoveredRef.current === i;

        // Stream band with Bezier edges
        const color = s.isPositive ? POSITIVE_COLOR : NEGATIVE_COLOR;
        const alpha = isHovered ? 0.25 : 0.1;
        const breathe = Math.sin(time * BREATHE_SPEED + i * 0.5) * 2;

        ctx.save();
        ctx.fillStyle = colorWithAlpha(color, alpha);
        ctx.beginPath();
        ctx.moveTo(leftMargin, y);
        ctx.quadraticCurveTo(
          leftMargin + bandW * 0.5 + breathe, y - 1,
          leftMargin + bandW, y + streamH * 0.2,
        );
        ctx.lineTo(leftMargin + bandW, y + streamH * 0.8);
        ctx.quadraticCurveTo(
          leftMargin + bandW * 0.5 - breathe, y + streamH + 1,
          leftMargin, y + streamH,
        );
        ctx.closePath();
        ctx.fill();

        // Glow on hover
        if (isHovered) {
          ctx.shadowColor = colorWithAlpha(color, 0.3);
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();

        // Currency label (left)
        ctx.save();
        ctx.font = FONT_CODE_SM;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)';
        ctx.fillText(s.code, leftMargin - 6, y + streamH / 2);
        ctx.restore();

        // Value label (right)
        ctx.save();
        ctx.font = FONT_VALUE_SM;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(color, isHovered ? 0.8 : 0.4);
        const sign = s.strength >= 0 ? '+' : '';
        ctx.fillText(`${sign}${s.strength.toFixed(1)}`, leftMargin + bandW + 8, y + streamH / 2);
        ctx.restore();
      });

      // Particles flowing within streams
      particles.forEach(p => {
        if (streams.length === 0) return;
        const stream = streams[p.streamIdx % streams.length];
        if (!stream) return;

        p.x += p.speed;
        if (p.x > 1) {
          p.x = 0;
          p.streamIdx = Math.floor(Math.random() * streams.length);
          p.speed = 0.001 + Math.random() * 0.003;
        }

        const bandW = Math.max(8, (stream.absStrength / maxAbs) * streamAreaW * 0.85);
        const y = startY + (p.streamIdx % streams.length) * (streamH + gap);
        const px = leftMargin + p.x * bandW;
        const py = y + streamH / 2 + Math.sin(time * 0.003 + p.x * 10) * (streamH * 0.3);

        const color = stream.isPositive ? POSITIVE_COLOR : NEGATIVE_COLOR;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 4);
        grad.addColorStop(0, colorWithAlpha(color, p.brightness * 0.4));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colorWithAlpha(color, p.brightness * 0.7);
        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    [buildStreams],
  );

  return (
    <div className="h-full w-full relative" style={{ minHeight: 180 }}>
      <PretextCanvas
        draw={draw}
        fallback={
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground/40">
            Strength Flow
          </div>
        }
        fps={isMobile ? 30 : 60}
        onMouseMove={(x, y) => { mouseRef.current = { x, y }; }}
        onMouseLeave={() => { mouseRef.current = null; hoveredRef.current = -1; }}
      />
    </div>
  );
}
