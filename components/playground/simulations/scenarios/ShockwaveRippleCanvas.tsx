'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '@/components/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawShockwaveRipple,
  drawGlowingNode,
  drawSimTooltip,
} from '@/components/pretext/canvasEffects';
import { drawTextGlow } from '@/components/pretext/textRenderer';
import { SIM_COLORS, SIM_FONTS, SIM_TEXT } from '@/components/pretext/sim/simCanvasTokens';
import type { IScenarioResult } from '@/types/simulation';

interface Props {
  data: IScenarioResult;
  className?: string;
}

export function ShockwaveRippleCanvas({ data, className }: Props) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  // Scenario severity (0-1)
  const severity = Math.min(1, Math.abs(data.deltaMetrics.annualReturn) / 0.5);
  const scenarioColor = severity > 0.6 ? SIM_COLORS.rose
    : severity > 0.3 ? SIM_COLORS.orange
    : SIM_COLORS.amber;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const cx = w / 2;
      const cy = h * 0.4;
      const maxR = Math.min(w, h) * 0.35;

      // ── Shockwave ripples from epicenter ──
      drawShockwaveRipple(
        ctx, cx, cy, maxR,
        4 + Math.round(severity * 4),
        severity,
        scenarioColor,
        time,
      );

      // ── Epicenter label ──
      ctx.save();
      ctx.font = isMobile ? SIM_FONTS.labelLg : SIM_FONTS.value;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorWithAlpha(scenarioColor, 0.85);
      drawTextGlow(ctx, data.scenario.label.toUpperCase(), cx, cy, scenarioColor, 10);
      ctx.font = isMobile ? SIM_FONTS.labelLg : SIM_FONTS.value;
      ctx.fillStyle = colorWithAlpha(scenarioColor, 0.85);
      ctx.fillText(data.scenario.label.toUpperCase(), cx, cy);
      ctx.restore();

      // Severity subtitle
      ctx.save();
      ctx.font = SIM_FONTS.tiny;
      ctx.textAlign = 'center';
      ctx.fillStyle = SIM_TEXT.muted;
      ctx.fillText(`Severity: ${(severity * 100).toFixed(0)}%`, cx, cy + 16);
      ctx.restore();

      // ── Impact metric nodes around perimeter ──
      const metrics = [
        { label: 'Return', value: data.deltaMetrics.annualReturn, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
        { label: 'Volatility', value: data.deltaMetrics.annualVol, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
        { label: 'Sharpe', value: data.deltaMetrics.sharpe, fmt: (v: number) => v.toFixed(2) },
        { label: 'VaR 95%', value: data.stressedMetrics.var95, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
      ];

      let hoveredMetric: number | null = null;

      metrics.forEach((m, i) => {
        const angle = (i / metrics.length) * Math.PI * 2 - Math.PI / 2;
        const impact = Math.min(1, Math.abs(m.value) / 0.4);
        const dist = maxR * (0.5 + (1 - impact) * 0.45);
        const nx = cx + Math.cos(angle) * dist;
        const ny = cy + Math.sin(angle) * dist;
        const nodeR = isMobile ? 5 : 7;
        const nodeColor = m.value < 0 ? SIM_COLORS.rose : SIM_COLORS.emerald;

        // Hover detection
        if (mouse) {
          const dx = mouse.x - nx;
          const dy = mouse.y - ny;
          if (Math.sqrt(dx * dx + dy * dy) < 20) hoveredMetric = i;
        }

        const isHov = hoveredMetric === i;

        drawGlowingNode(ctx, nx, ny, nodeR, nodeColor, isHov ? 0.9 : 0.5, time * 0.002);

        // Label
        ctx.save();
        ctx.font = SIM_FONTS.tiny;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(nodeColor, isHov ? 0.8 : 0.45);
        ctx.fillText(m.label, nx, ny - nodeR - 8);
        ctx.font = SIM_FONTS.label;
        ctx.fillStyle = colorWithAlpha(nodeColor, isHov ? 0.9 : 0.6);
        ctx.fillText(m.fmt(m.value), nx, ny + nodeR + 8);
        ctx.restore();
      });

      // ── Per-stock impact scatter ──
      if (!isMobile) {
        const stockY = h * 0.78;
        const stockAreaW = w * 0.8;
        const stockLeft = (w - stockAreaW) / 2;

        ctx.save();
        ctx.font = SIM_FONTS.tiny;
        ctx.textAlign = 'center';
        ctx.fillStyle = SIM_TEXT.ghost;
        ctx.fillText('STOCK IMPACT', w / 2, stockY - 12);
        ctx.restore();

        let hoveredStock: number | null = null;
        const maxStocks = Math.min(data.perStockImpact.length, 15);

        data.perStockImpact.slice(0, maxStocks).forEach((stock, i) => {
          const t = i / (maxStocks - 1 || 1);
          const sx = stockLeft + t * stockAreaW;
          const impactMag = Math.abs(stock.deltaReturn);
          const sy = stockY + impactMag * 150;
          const stockColor = stock.deltaReturn < 0 ? SIM_COLORS.rose : SIM_COLORS.emerald;
          const dotR = 3 + impactMag * 8;

          if (mouse) {
            const dx = mouse.x - sx;
            const dy = mouse.y - sy;
            if (Math.sqrt(dx * dx + dy * dy) < 12) hoveredStock = i;
          }

          const isHov = hoveredStock === i;

          ctx.save();
          ctx.fillStyle = colorWithAlpha(stockColor, isHov ? 0.7 : 0.25);
          ctx.beginPath();
          ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
          ctx.fill();

          // Ticker label
          ctx.font = SIM_FONTS.tiny;
          ctx.textAlign = 'center';
          ctx.fillStyle = colorWithAlpha(stockColor, isHov ? 0.7 : 0.25);
          ctx.fillText(stock.ticker, sx, sy + dotR + 8);
          ctx.restore();

          if (isHov) {
            drawSimTooltip(ctx, sx, sy, [
              { text: stock.ticker, font: SIM_FONTS.labelLg, color: colorWithAlpha(stockColor, 0.9) },
              { text: `Return: ${(stock.deltaReturn * 100).toFixed(1)}%`, color: SIM_TEXT.secondary },
              { text: `Vol: ${(stock.deltaVol * 100).toFixed(1)}%`, color: SIM_TEXT.secondary },
            ], stockColor, 140);
          }
        });
      }
    },
    [data, severity, scenarioColor, isMobile],
  );

  return (
    <div className={`relative ${className ?? ''}`} style={{ minHeight: isMobile ? 240 : 360 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`Scenario shockwave: ${data.scenario.label}, return impact ${(data.deltaMetrics.annualReturn * 100).toFixed(1)}%`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            {data.scenario.label}: {(data.deltaMetrics.annualReturn * 100).toFixed(1)}% impact
          </div>
        }
      />
    </div>
  );
}
