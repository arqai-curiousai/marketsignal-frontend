'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '@/components/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawGlowingNode,
  drawPentagonWeb,
  drawSonarPulse,
  drawSimTooltip,
} from '@/components/pretext/canvasEffects';
import { drawTextGlow } from '@/components/pretext/textRenderer';
import { SIM_COLORS, SIM_FONTS, SIM_TEXT } from '@/components/pretext/sim/simCanvasTokens';
import type { IFactorDecomposition } from '@/types/simulation';

interface Props {
  data: IFactorDecomposition;
  className?: string;
}

const FACTOR_COLORS = [
  SIM_COLORS.rose,     // Momentum
  SIM_COLORS.amber,    // Value
  SIM_COLORS.blue,     // Size
  SIM_COLORS.emerald,  // Quality
  SIM_COLORS.violet,   // Low Vol
];

export function FactorConstellationCanvas({ data, className }: Props) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const factors = data.factors;
  const axisCount = factors.length || 5;

  // Compute polygon points for portfolio and benchmark
  const computePolygon = useCallback(
    (tilts: Record<string, number>, radius: number, cx: number, cy: number) => {
      return factors.map((f, i) => {
        const angle = (i / axisCount) * Math.PI * 2 - Math.PI / 2;
        const tilt = tilts[f.id] ?? 50;
        const r = (tilt / 100) * radius;
        return {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        };
      });
    },
    [factors, axisCount],
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const cx = w / 2;
      const cy = h * 0.45;
      const radius = Math.min(w, h) * (isMobile ? 0.32 : 0.35);

      // ── Pentagon web ──
      drawPentagonWeb(ctx, cx, cy, radius, 4, axisCount, 0.04);

      // ── Benchmark polygon (dashed white) ──
      const benchmarkPoly = computePolygon(data.benchmarkTilts, radius, cx, cy);
      if (benchmarkPoly.length > 2) {
        ctx.save();
        ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.12);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        benchmarkPoly.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ── Portfolio polygon (filled violet) ──
      const portfolioPoly = computePolygon(data.portfolioTilts, radius, cx, cy);
      if (portfolioPoly.length > 2) {
        // Fill
        ctx.save();
        ctx.fillStyle = colorWithAlpha(SIM_COLORS.violet, 0.06);
        ctx.beginPath();
        portfolioPoly.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();

        // Stroke
        ctx.strokeStyle = colorWithAlpha(SIM_COLORS.violet, 0.35);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        portfolioPoly.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // ── Factor nodes at polygon vertices ──
      let hoveredFactor: number | null = null;

      factors.forEach((factor, i) => {
        const angle = (i / axisCount) * Math.PI * 2 - Math.PI / 2;
        const tilt = data.portfolioTilts[factor.id] ?? 50;
        const nodeR = 6 + (tilt / 100) * 8;
        const color = FACTOR_COLORS[i % FACTOR_COLORS.length];

        // Node at the axis endpoint (100% mark)
        const nx = cx + Math.cos(angle) * radius;
        const ny = cy + Math.sin(angle) * radius;

        // Portfolio tilt node (on polygon)
        const pn = portfolioPoly[i];

        // Hover detection
        if (mouse) {
          const dx = mouse.x - nx;
          const dy = mouse.y - ny;
          if (Math.sqrt(dx * dx + dy * dy) < 20) hoveredFactor = i;
        }

        const isHov = hoveredFactor === i;
        const breatheAmp = 0.5 + (tilt / 100) * 1.5;

        // Axis endpoint node
        drawGlowingNode(ctx, nx, ny, nodeR, color, isHov ? 0.9 : 0.4, time * 0.002 * breatheAmp);

        // Factor label beyond the node
        const labelR = radius + (isMobile ? 16 : 22);
        const lx = cx + Math.cos(angle) * labelR;
        const ly = cy + Math.sin(angle) * labelR;
        ctx.save();
        ctx.font = isHov ? SIM_FONTS.labelLg : SIM_FONTS.label;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(color, isHov ? 0.85 : 0.55);
        ctx.fillText(factor.label, lx, ly);

        // Tilt score below label
        ctx.font = SIM_FONTS.tiny;
        ctx.fillStyle = colorWithAlpha(color, isHov ? 0.7 : 0.35);
        ctx.fillText(`${tilt.toFixed(0)}`, lx, ly + 12);
        ctx.restore();

        // Attribution particle stream (simplified: small dots between center and node)
        const attrEntry = data.factorAttribution.find((a) => a.factorId === factor.id);
        const attribution = attrEntry?.contribution ?? 0;
        if (Math.abs(attribution) > 0.001) {
          const streamColor = attribution > 0 ? SIM_COLORS.emerald : SIM_COLORS.rose;
          const streamCount = Math.min(5, Math.ceil(Math.abs(attribution) * 40));
          for (let p = 0; p < streamCount; p++) {
            const st = ((time * 0.001 + p * 0.3) % 1.5) / 1.5;
            const direction = attribution > 0 ? st : 1 - st;
            const px = cx + (pn.x - cx) * direction;
            const py = cy + (pn.y - cy) * direction;
            const alpha = (0.5 - Math.abs(st - 0.5)) * 0.4;
            ctx.save();
            ctx.fillStyle = colorWithAlpha(streamColor, alpha);
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      });

      // ── Center alignment score ──
      const alignScore = Object.values(data.portfolioTilts).reduce((a, b) => a + b, 0) / axisCount;
      ctx.save();
      ctx.font = SIM_FONTS.value;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorWithAlpha(SIM_COLORS.violet, 0.7);
      drawTextGlow(ctx, `${alignScore.toFixed(0)}`, cx, cy, SIM_COLORS.violet, 6);
      ctx.font = SIM_FONTS.value;
      ctx.fillStyle = colorWithAlpha(SIM_COLORS.violet, 0.7);
      ctx.fillText(`${alignScore.toFixed(0)}`, cx, cy);

      ctx.font = SIM_FONTS.tiny;
      ctx.fillStyle = SIM_TEXT.ghost;
      ctx.fillText('avg tilt', cx, cy + 14);
      ctx.restore();

      // Center sonar
      const sonarT = (time % 4000) / 4000;
      drawSonarPulse(ctx, cx, cy, 20, sonarT, SIM_COLORS.violet);

      // ── Legend (bottom) ──
      if (!isMobile) {
        const legendY = h - 18;
        ctx.save();
        ctx.font = SIM_FONTS.tiny;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Portfolio legend
        ctx.fillStyle = colorWithAlpha(SIM_COLORS.violet, 0.4);
        ctx.fillRect(w / 2 - 50, legendY - 3, 12, 2);
        ctx.fillText('Portfolio', w / 2 - 24, legendY);

        // Benchmark legend
        ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.15);
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(w / 2 + 20, legendY);
        ctx.lineTo(w / 2 + 32, legendY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = SIM_TEXT.ghost;
        ctx.fillText('Benchmark', w / 2 + 52, legendY);
        ctx.restore();
      }

      // ── Hover tooltip ──
      if (hoveredFactor !== null) {
        const factor = factors[hoveredFactor];
        const color = FACTOR_COLORS[hoveredFactor % FACTOR_COLORS.length];
        const angle = (hoveredFactor / axisCount) * Math.PI * 2 - Math.PI / 2;
        const nx = cx + Math.cos(angle) * radius;
        const ny = cy + Math.sin(angle) * radius;
        const ptilt = data.portfolioTilts[factor.id] ?? 0;
        const btilt = data.benchmarkTilts[factor.id] ?? 0;
        const attrItem = data.factorAttribution.find((a) => a.factorId === factor.id);
        const attr = attrItem?.contribution ?? 0;

        drawSimTooltip(ctx, nx, ny, [
          { text: factor.label, color: colorWithAlpha(color, 0.95), font: SIM_FONTS.labelLg },
          { text: factor.description ?? '', color: SIM_TEXT.muted, font: SIM_FONTS.tiny },
          { text: `Portfolio: ${ptilt.toFixed(0)} | Benchmark: ${btilt.toFixed(0)}`, color: SIM_TEXT.secondary },
          { text: `Attribution: ${(attr * 100).toFixed(2)}%`, color: attr > 0 ? colorWithAlpha(SIM_COLORS.emerald, 0.8) : colorWithAlpha(SIM_COLORS.rose, 0.8) },
        ], color, 200);
      }
    },
    [data, factors, axisCount, computePolygon, isMobile],
  );

  return (
    <div className={`relative ${className ?? ''}`} style={{ minHeight: isMobile ? 240 : 340 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`Factor constellation: ${factors.map((f) => f.label).join(', ')}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            {factors.length} factor analysis
          </div>
        }
      />
    </div>
  );
}
