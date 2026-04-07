'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '@/components/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawAuroraBand,
  drawSeismographTrace,
} from '@/components/pretext/canvasEffects';
import { drawTextGlow, easeOutExpo } from '@/components/pretext/textRenderer';
import { SIM_COLORS, SIM_FONTS, SIM_TEXT, RISK_ZONE_COLORS } from '@/components/pretext/sim/simCanvasTokens';
import type { IRiskScoreResult } from '@/types/simulation';

interface Props {
  data: IRiskScoreResult;
  className?: string;
}

const ZONE_LABELS = ['Conservative', 'Moderate', 'Balanced', 'Aggressive', 'Speculative'];

export function RiskAuroraCanvas({ data, className }: Props) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const startTimeRef = useRef(0);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  // Determine zone color based on score
  const zoneIdx = data.compositeScore <= 20 ? 0
    : data.compositeScore <= 40 ? 1
    : data.compositeScore <= 60 ? 2
    : data.compositeScore <= 80 ? 3
    : 4;
  const zoneColor = RISK_ZONE_COLORS[zoneIdx];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (startTimeRef.current === 0) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const animProgress = Math.min(elapsed / 1200, 1);
      const eased = easeOutExpo(animProgress);

      const cx = w / 2;

      // ── Aurora bands (background) ──
      const bandCount = 3;
      for (let i = 0; i < bandCount; i++) {
        const bandY = h * 0.1 + (i / bandCount) * h * 0.4;
        const bandH = h * 0.15;
        drawAuroraBand(
          ctx, bandY, w, bandH,
          zoneColor,
          i * 2.1, i * 3.7, time,
        );
      }

      // ── Score number (large, centered) ──
      const scoreFont = isMobile ? SIM_FONTS.heroMobile : SIM_FONTS.hero;
      const displayScore = Math.round(data.compositeScore * eased);
      const scoreText = `${displayScore}`;

      ctx.save();
      ctx.font = scoreFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorWithAlpha(zoneColor, 0.9);
      drawTextGlow(ctx, scoreText, cx, h * 0.22, zoneColor, 16);
      ctx.font = scoreFont;
      ctx.fillStyle = colorWithAlpha(zoneColor, 0.9);
      ctx.fillText(scoreText, cx, h * 0.22);
      ctx.restore();

      // /99 suffix
      ctx.save();
      ctx.font = SIM_FONTS.value;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = SIM_TEXT.muted;
      ctx.fillText('/ 99', cx + (isMobile ? 26 : 36), h * 0.22 + 2);
      ctx.restore();

      // Zone label
      ctx.save();
      ctx.font = SIM_FONTS.label;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorWithAlpha(zoneColor, 0.6);
      ctx.fillText(data.zone.label.toUpperCase(), cx, h * 0.35);
      ctx.restore();

      // ── Seismograph trace ──
      const traceY = h * 0.42;
      const traceH = h * 0.12;
      const amplitude = (data.compositeScore / 99) * traceH * 0.8;
      drawSeismographTrace(
        ctx, 0, traceY, w, traceH,
        amplitude, 3 + data.compositeScore / 20,
        zoneColor, time,
      );

      // ── Sub-component bars ──
      const components = data.subScores;
      const barTop = h * 0.58;
      const barH = isMobile ? 6 : 8;
      const barGap = isMobile ? 16 : 22;
      const barLeft = isMobile ? 60 : 100;
      const barRight = w - 20;
      const barW = barRight - barLeft;

      components.forEach((comp, i) => {
        const by = barTop + i * barGap;
        const fillW = (comp.score / 100) * barW * eased;
        const compColor = comp.score > 70 ? SIM_COLORS.rose
          : comp.score > 40 ? SIM_COLORS.amber
          : SIM_COLORS.emerald;

        // Label
        ctx.save();
        ctx.font = SIM_FONTS.tiny;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = SIM_TEXT.muted;
        ctx.fillText(comp.label, barLeft - 8, by + barH / 2);
        ctx.restore();

        // Background bar
        ctx.save();
        ctx.fillStyle = colorWithAlpha('rgba(255,255,255,1)', 0.03);
        ctx.beginPath();
        ctx.roundRect(barLeft, by, barW, barH, 3);
        ctx.fill();

        // Fill bar
        ctx.fillStyle = colorWithAlpha(compColor, 0.4);
        ctx.beginPath();
        ctx.roundRect(barLeft, by, fillW, barH, 3);
        ctx.fill();
        ctx.restore();

        // Score value
        ctx.save();
        ctx.font = SIM_FONTS.tiny;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(compColor, 0.7);
        ctx.fillText(`${comp.score}`, barLeft + fillW + 6, by + barH / 2);
        ctx.restore();
      });

      // ── Zone progression bar (bottom) ──
      const zoneBarY = h - 30;
      const zoneBarH = 6;
      const zoneBarLeft = isMobile ? 20 : 40;
      const zoneBarRight = w - (isMobile ? 20 : 40);
      const zoneBarW = zoneBarRight - zoneBarLeft;

      // Draw 5 zone segments
      RISK_ZONE_COLORS.forEach((zc, zi) => {
        const segX = zoneBarLeft + (zi / 5) * zoneBarW;
        const segW = zoneBarW / 5;
        ctx.save();
        ctx.fillStyle = colorWithAlpha(zc, 0.2);
        ctx.fillRect(segX, zoneBarY, segW, zoneBarH);
        ctx.restore();
      });

      // Score marker
      const markerX = zoneBarLeft + (data.compositeScore / 99) * zoneBarW * eased;
      ctx.save();
      ctx.fillStyle = colorWithAlpha(zoneColor, 0.9);
      ctx.beginPath();
      ctx.moveTo(markerX, zoneBarY - 3);
      ctx.lineTo(markerX - 4, zoneBarY - 9);
      ctx.lineTo(markerX + 4, zoneBarY - 9);
      ctx.closePath();
      ctx.fill();

      // Marker glow
      const mPulse = Math.sin(time * 0.003) * 3;
      const mGrad = ctx.createRadialGradient(markerX, zoneBarY + zoneBarH / 2, 0, markerX, zoneBarY + zoneBarH / 2, 12 + mPulse);
      mGrad.addColorStop(0, colorWithAlpha(zoneColor, 0.25));
      mGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.arc(markerX, zoneBarY + zoneBarH / 2, 12 + mPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Zone labels below bar (desktop only)
      if (!isMobile) {
        ZONE_LABELS.forEach((label, zi) => {
          ctx.save();
          ctx.font = SIM_FONTS.tiny;
          ctx.textAlign = 'center';
          ctx.fillStyle = zi === zoneIdx
            ? colorWithAlpha(RISK_ZONE_COLORS[zi], 0.6)
            : SIM_TEXT.ghost;
          ctx.fillText(label, zoneBarLeft + (zi + 0.5) / 5 * zoneBarW, zoneBarY + zoneBarH + 12);
          ctx.restore();
        });
      }
    },
    [data, zoneColor, zoneIdx, isMobile],
  );

  return (
    <div className={`relative ${className ?? ''}`} style={{ minHeight: isMobile ? 280 : 380 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`Risk score: ${data.compositeScore} out of 99, zone: ${data.zone.label}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            Risk Score: {data.compositeScore} / 99 — {data.zone.label}
          </div>
        }
      />
    </div>
  );
}
