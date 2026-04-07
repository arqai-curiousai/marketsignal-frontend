'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { PretextCanvas } from '../PretextCanvas';
import { useMobileDetect } from '../useMobileDetect';
import { colorWithAlpha, drawSonarPulse } from '../canvasEffects';
import { drawTextGlow, easeOutExpo } from '../textRenderer';
import { SIM_FONTS, SIM_TEXT } from './simCanvasTokens';

interface SimMetricCanvasProps {
  /** Numeric value to display */
  value: number;
  /** Format function (e.g. v => `${v.toFixed(1)}%`) */
  format: (v: number) => string;
  /** Label below the value */
  label: string;
  /** Mini sparkline data (last N points) */
  sparkData?: number[];
  /** Accent color for glow effects */
  accentColor: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'flat';
  className?: string;
}

export function SimMetricCanvas({
  value,
  format,
  label,
  sparkData,
  accentColor,
  trend,
  className,
}: SimMetricCanvasProps) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef(0);
  const prevValueRef = useRef(value);

  // Reset animation on value change
  useEffect(() => {
    prevValueRef.current = value;
    startTimeRef.current = 0;
  }, [value]);

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
      const animProgress = Math.min(elapsed / 800, 1);
      const easedProgress = easeOutExpo(animProgress);

      const isHovered = mouseRef.current !== null;
      const cx = w / 2;
      const pulse = Math.sin(time * 0.003) * 0.02;

      // Animated value
      const displayValue = value * easedProgress;
      const displayText = format(displayValue);

      // Background glow
      const glowAlpha = isHovered ? 0.08 : 0.04 + pulse;
      const grad = ctx.createRadialGradient(cx, h * 0.35, 0, cx, h * 0.35, w * 0.5);
      grad.addColorStop(0, colorWithAlpha(accentColor, glowAlpha));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Value text
      const valueFont = isMobile ? SIM_FONTS.valueSm : SIM_FONTS.value;
      ctx.save();
      ctx.font = valueFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorWithAlpha(accentColor, isHovered ? 0.95 : 0.85);
      drawTextGlow(ctx, displayText, cx, h * 0.35, accentColor, isHovered ? 10 : 4);
      ctx.font = valueFont;
      ctx.fillStyle = colorWithAlpha(accentColor, isHovered ? 0.95 : 0.85);
      ctx.fillText(displayText, cx, h * 0.35);
      ctx.restore();

      // Trend arrow
      if (trend && trend !== 'flat') {
        const arrowX = cx + ctx.measureText(displayText).width / 2 + 8;
        const arrowY = h * 0.35;
        ctx.save();
        ctx.fillStyle = trend === 'up'
          ? colorWithAlpha('rgba(110, 231, 183, 1)', 0.7)
          : colorWithAlpha('rgba(248, 113, 113, 1)', 0.7);
        ctx.beginPath();
        if (trend === 'up') {
          ctx.moveTo(arrowX, arrowY - 4);
          ctx.lineTo(arrowX - 3, arrowY + 2);
          ctx.lineTo(arrowX + 3, arrowY + 2);
        } else {
          ctx.moveTo(arrowX, arrowY + 4);
          ctx.lineTo(arrowX - 3, arrowY - 2);
          ctx.lineTo(arrowX + 3, arrowY - 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Label text
      ctx.save();
      ctx.font = SIM_FONTS.label;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = SIM_TEXT.muted;
      ctx.letterSpacing = '0.5px';
      ctx.fillText(label.toUpperCase(), cx, h * 0.65);
      ctx.restore();

      // Mini sparkline
      if (sparkData && sparkData.length > 1) {
        const sparkW = w * 0.5;
        const sparkH = h * 0.15;
        const sparkX = cx - sparkW / 2;
        const sparkY = h * 0.78;
        const min = Math.min(...sparkData);
        const max = Math.max(...sparkData);
        const range = max - min || 1;

        ctx.save();
        ctx.strokeStyle = colorWithAlpha(accentColor, isHovered ? 0.5 : 0.25);
        ctx.lineWidth = isHovered ? 1.5 : 1;
        ctx.beginPath();
        sparkData.forEach((val, i) => {
          const sx = sparkX + (i / (sparkData.length - 1)) * sparkW;
          const sy = sparkY + sparkH - ((val - min) / range) * sparkH;
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
        ctx.restore();
      }

      // Sonar pulse on fresh data
      if (animProgress < 1) {
        drawSonarPulse(ctx, cx, h * 0.35, 20, animProgress, accentColor);
      }
    },
    [value, format, label, sparkData, accentColor, trend, isMobile],
  );

  return (
    <div className={`relative ${className ?? ''}`} style={{ minHeight: isMobile ? 52 : 60 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`${label}: ${format(value)}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="flex flex-col items-center justify-center h-full gap-0.5 px-3 py-2">
            <span className="text-sm font-semibold tabular-nums font-mono text-white/80">{format(value)}</span>
            <span className="text-[8px] text-white/35 uppercase tracking-wider">{label}</span>
          </div>
        }
      />
    </div>
  );
}
