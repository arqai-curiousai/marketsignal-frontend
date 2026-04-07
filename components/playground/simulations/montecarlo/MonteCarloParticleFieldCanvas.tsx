'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { PretextCanvas } from '@/components/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/pretext/useMobileDetect';
import { colorWithAlpha, drawSimTooltip } from '@/components/pretext/canvasEffects';
import { drawTextGlow } from '@/components/pretext/textRenderer';
import { SIM_COLORS, SIM_FONTS, SIM_TEXT } from '@/components/pretext/sim/simCanvasTokens';
import type { IMonteCarloAnalysis } from '@/types/simulation';
import { getVerdictConfig, fmtPrice, fmtPct } from './mc-tokens';

interface Props {
  data: IMonteCarloAnalysis;
  className?: string;
}

/** Seeded RNG for deterministic path generation */
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Box-Muller normal random */
function gaussRng(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
}

export function MonteCarloParticleFieldCanvas({ data, className }: Props) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const pathsRef = useRef<{ y: number[]; profit: boolean }[]>([]);
  const generatedRef = useRef(false);

  const verdictConfig = getVerdictConfig(data.verdict?.verdict ?? 'neutral');
  const bands = data.regimeAware.percentileBands;
  const currentPrice = data.currentPrice;
  const pathCount = isMobile ? 60 : 200;
  const horizonDays = bands.length;

  // Generate simulated paths once
  if (!generatedRef.current || pathsRef.current.length !== pathCount) {
    const rng = seededRng(42);
    // Estimate drift and vol from percentile bands
    const midBand = bands[Math.floor(bands.length / 2)];
    const lastBand = bands[bands.length - 1];
    const annualVol = midBand ? (midBand.p75 - midBand.p25) / currentPrice / 1.35 : 0.2;
    const dailyVol = annualVol / Math.sqrt(252);
    const dailyDrift = lastBand ? Math.log(lastBand.p50 / currentPrice) / horizonDays : 0;

    const paths: { y: number[]; profit: boolean }[] = [];
    for (let p = 0; p < pathCount; p++) {
      const ys: number[] = [currentPrice];
      let price = currentPrice;
      for (let d = 1; d < horizonDays; d++) {
        const shock = gaussRng(rng);
        price *= Math.exp(dailyDrift - 0.5 * dailyVol * dailyVol + dailyVol * shock);
        ys.push(price);
      }
      paths.push({ y: ys, profit: price > currentPrice });
    }
    pathsRef.current = paths;
    generatedRef.current = true;
  }

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  // Price range for Y-axis mapping
  const priceRange = useMemo(() => {
    if (bands.length === 0) return { min: currentPrice * 0.8, max: currentPrice * 1.2 };
    const lastBand = bands[bands.length - 1];
    return {
      min: Math.min(currentPrice * 0.85, lastBand.p5 * 0.95),
      max: Math.max(currentPrice * 1.15, lastBand.p95 * 1.05),
    };
  }, [bands, currentPrice]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const padL = 8;
      const padR = isMobile ? 8 : 100;
      const padT = 20;
      const padB = 20;
      const chartW = w - padL - padR;
      const chartH = h - padT - padB;

      const mapX = (dayIdx: number) => padL + (dayIdx / (horizonDays - 1)) * chartW;
      const mapY = (price: number) => {
        const t = (price - priceRange.min) / (priceRange.max - priceRange.min);
        return padT + chartH * (1 - t);
      };

      // ── Percentile bands ──
      // P5-P95 band
      if (bands.length > 1) {
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = SIM_COLORS.violet;
        ctx.beginPath();
        bands.forEach((b, i) => {
          const x = mapX(i);
          if (i === 0) ctx.moveTo(x, mapY(b.p95));
          else ctx.lineTo(x, mapY(b.p95));
        });
        for (let i = bands.length - 1; i >= 0; i--) {
          ctx.lineTo(mapX(i), mapY(bands[i].p5));
        }
        ctx.closePath();
        ctx.fill();

        // P25-P75 band (brighter)
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        bands.forEach((b, i) => {
          const x = mapX(i);
          if (i === 0) ctx.moveTo(x, mapY(b.p75));
          else ctx.lineTo(x, mapY(b.p75));
        });
        for (let i = bands.length - 1; i >= 0; i--) {
          ctx.lineTo(mapX(i), mapY(bands[i].p25));
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Median line (P50)
        ctx.save();
        ctx.strokeStyle = colorWithAlpha(SIM_COLORS.indigo, 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        bands.forEach((b, i) => {
          const x = mapX(i);
          const y = mapY(b.p50);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      }

      // ── Individual simulation paths ──
      // Progressive reveal: paths animate in over time
      const revealDuration = 15000; // 15 seconds to reveal all paths
      const elapsed = time % (revealDuration + 10000); // 15s reveal + 10s breathe
      const revealedPaths = elapsed < revealDuration
        ? Math.floor((elapsed / revealDuration) * pathCount)
        : pathCount;

      const paths = pathsRef.current;
      for (let p = 0; p < Math.min(revealedPaths, paths.length); p++) {
        const path = paths[p];
        const pathColor = path.profit ? SIM_COLORS.emerald : SIM_COLORS.rose;
        const alpha = 0.08 + (elapsed >= revealDuration ? Math.sin(time * 0.001 + p) * 0.02 : 0);

        ctx.save();
        ctx.strokeStyle = colorWithAlpha(pathColor, alpha);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        // Draw every Nth point for performance on mobile
        const step = isMobile ? 3 : 1;
        for (let d = 0; d < path.y.length; d += step) {
          const x = mapX(d);
          const y = mapY(path.y[d]);
          if (d === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // ── Current price line ──
      const startY = mapY(currentPrice);
      ctx.save();
      ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.15);
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(padL, startY);
      ctx.lineTo(padL + chartW, startY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Current price label
      ctx.save();
      ctx.font = SIM_FONTS.tiny;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = SIM_TEXT.muted;
      ctx.fillText(fmtPrice(currentPrice), padL + 4, startY - 8);
      ctx.restore();

      // ── Crosshair on mouse X ──
      if (mouse && mouse.x > padL && mouse.x < padL + chartW) {
        const dayIdx = Math.round(((mouse.x - padL) / chartW) * (horizonDays - 1));
        if (dayIdx >= 0 && dayIdx < bands.length) {
          const band = bands[dayIdx];
          const crossX = mapX(dayIdx);

          // Vertical line
          ctx.save();
          ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.1);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(crossX, padT);
          ctx.lineTo(crossX, padT + chartH);
          ctx.stroke();
          ctx.restore();

          // Percentile dots
          const pctls = [
            { label: 'P95', price: band.p95, color: SIM_COLORS.emerald },
            { label: 'P75', price: band.p75, color: SIM_COLORS.emerald },
            { label: 'P50', price: band.p50, color: SIM_COLORS.indigo },
            { label: 'P25', price: band.p25, color: SIM_COLORS.rose },
            { label: 'P5', price: band.p5, color: SIM_COLORS.rose },
          ];

          pctls.forEach((p) => {
            ctx.save();
            ctx.fillStyle = colorWithAlpha(p.color, 0.7);
            ctx.beginPath();
            ctx.arc(crossX, mapY(p.price), 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

          // Tooltip
          drawSimTooltip(ctx, crossX, padT, [
            { text: `Day ${dayIdx + 1}`, font: SIM_FONTS.labelLg, color: SIM_TEXT.primary },
            ...pctls.map((p) => ({
              text: `${p.label}: ${fmtPrice(p.price)}`,
              color: colorWithAlpha(p.color, 0.8),
            })),
          ], SIM_COLORS.violet, 150);
        }
      }

      // ── Verdict overlay (right side on desktop) ──
      if (!isMobile) {
        const vx = w - 50;
        const vy = h * 0.35;

        ctx.save();
        ctx.font = SIM_FONTS.value;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(verdictConfig.hex, 0.8);
        drawTextGlow(ctx, verdictConfig.label, vx, vy, verdictConfig.hex, 8);
        ctx.font = SIM_FONTS.value;
        ctx.fillStyle = colorWithAlpha(verdictConfig.hex, 0.8);
        ctx.fillText(verdictConfig.label, vx, vy);

        // Confidence
        ctx.font = SIM_FONTS.monoLg;
        ctx.fillStyle = SIM_TEXT.primary;
        ctx.fillText(`${Math.round((data.verdict?.confidence ?? 0) * 100)}%`, vx, vy + 22);

        ctx.font = SIM_FONTS.tiny;
        ctx.fillStyle = SIM_TEXT.ghost;
        ctx.fillText('confidence', vx, vy + 36);
        ctx.restore();
      }
    },
    [data, bands, currentPrice, horizonDays, priceRange, verdictConfig, pathCount, isMobile],
  );

  return (
    <div className={`relative ${className ?? ''}`} style={{ minHeight: isMobile ? 250 : 400 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`Monte Carlo simulation: ${verdictConfig.label} verdict with ${Math.round((data.verdict?.confidence ?? 0) * 100)}% confidence over ${horizonDays} day horizon`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            {verdictConfig.label} — {Math.round((data.verdict?.confidence ?? 0) * 100)}% confidence
          </div>
        }
      />
    </div>
  );
}
