'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '../PretextCanvas';
import { useReducedMotion } from '../useReducedMotion';
import { useMobileDetect } from '../useMobileDetect';
import { colorWithAlpha } from '../canvasEffects';
import { easeOutExpo } from '../textRenderer';
import { SIM_FONTS, SIM_TEXT, SIM_BG } from './simCanvasTokens';
import type { SimKPI } from '@/components/playground/simulations/shared/SimKPIStrip';

interface SimKPIStripCanvasProps {
  kpis: SimKPI[];
  accentColor?: string;
  className?: string;
}

export function SimKPIStripCanvas({ kpis, accentColor = 'rgba(167, 139, 250, 1)', className }: SimKPIStripCanvasProps) {
  const reduced = useReducedMotion();
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef(0);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const mouse = mouseRef.current;

      const colCount = kpis.length;
      if (colCount === 0) return;
      const colW = w / colCount;

      // Determine hovered column
      let hoveredCol = -1;
      if (mouse) {
        hoveredCol = Math.floor(mouse.x / colW);
        if (hoveredCol >= colCount) hoveredCol = -1;
      }

      // Draw each KPI column
      kpis.forEach((kpi, i) => {
        const cx = colW * i + colW / 2;
        const isHovered = hoveredCol === i;

        // Staggered animation
        const staggerDelay = i * 50;
        const kpiElapsed = Math.max(0, elapsed - staggerDelay);
        const animProgress = Math.min(kpiElapsed / 800, 1);
        const eased = easeOutExpo(animProgress);

        // Column hover highlight
        if (isHovered) {
          ctx.save();
          ctx.fillStyle = SIM_BG.cardHover;
          ctx.fillRect(colW * i, 0, colW, h);
          ctx.restore();
        }

        // Dim non-hovered columns when one is hovered
        const baseAlpha = hoveredCol >= 0 && !isHovered ? 0.5 : 1;

        // Value text (with count-up effect)
        ctx.save();
        ctx.globalAlpha = eased * baseAlpha;
        ctx.font = isMobile ? SIM_FONTS.valueSm : SIM_FONTS.value;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = kpi.colorHex ?? SIM_TEXT.primary;
        ctx.fillText(kpi.value, cx, h * 0.38);
        ctx.restore();

        // Label text
        ctx.save();
        ctx.globalAlpha = eased * baseAlpha * 0.6;
        ctx.font = SIM_FONTS.label;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = SIM_TEXT.muted;
        ctx.fillText(kpi.label.toUpperCase(), cx, h * 0.68);
        ctx.restore();

        // Vertical divider (except last column)
        if (i < colCount - 1) {
          ctx.save();
          ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.04);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(colW * (i + 1), h * 0.2);
          ctx.lineTo(colW * (i + 1), h * 0.8);
          ctx.stroke();
          ctx.restore();
        }
      });

      // Traveling data pulse across the strip (every 6 seconds)
      const pulseCycle = 6000;
      const pulseT = (time % pulseCycle) / pulseCycle;
      if (pulseT < 0.4) {
        const px = pulseT / 0.4 * w;
        const py = h * 0.5;
        const pulseAlpha = pulseT < 0.2 ? pulseT / 0.2 : (0.4 - pulseT) / 0.2;
        ctx.save();
        ctx.globalAlpha = pulseAlpha * 0.3;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 20);
        grad.addColorStop(0, colorWithAlpha(accentColor, 0.4));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    [kpis, accentColor, isMobile],
  );

  // Reduced motion fallback: use the original React component
  if (reduced) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SimKPIStrip } = require('@/components/playground/simulations/shared/SimKPIStrip');
    return <SimKPIStrip kpis={kpis} className={className} />;
  }

  return (
    <div className={`relative ${className ?? ''}`} style={{ height: isMobile ? 52 : 64 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`KPI strip: ${kpis.map((k) => `${k.label} ${k.value}`).join(', ')}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
