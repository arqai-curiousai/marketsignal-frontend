'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { PretextCanvas } from '@/components/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawSonarPulse,
  drawSimTooltip,
} from '@/components/pretext/canvasEffects';
import { SIM_COLORS, SIM_FONTS, SIM_TEXT } from '@/components/pretext/sim/simCanvasTokens';
import type { IBacktestAnalysis } from '@/types/simulation';

interface Props {
  data: IBacktestAnalysis;
  className?: string;
}

const STRATEGY_COLORS: string[] = [
  SIM_COLORS.violet,
  SIM_COLORS.emerald,
  SIM_COLORS.amber,
  SIM_COLORS.blue,
  SIM_COLORS.rose,
];

export function EquityCurveRaceCanvas({ data, className }: Props) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  // Find global min/max for Y axis
  const yRange = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    data.strategies.forEach((strat) => {
      strat.backtest.equityCurve.forEach((pt) => {
        if (pt.value < min) min = pt.value;
        if (pt.value > max) max = pt.value;
      });
    });
    const pad = (max - min) * 0.1;
    return { min: min - pad, max: max + pad };
  }, [data]);

  const maxDays = useMemo(() => {
    return Math.max(...data.strategies.map((s) => s.backtest.equityCurve.length));
  }, [data]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const padL = 8;
      const padR = isMobile ? 8 : 60;
      const padT = 20;
      const padB = 20;
      const chartW = w - padL - padR;
      const chartH = h - padT - padB;

      const mapX = (idx: number) => padL + (idx / (maxDays - 1)) * chartW;
      const mapY = (val: number) => {
        const t = (val - yRange.min) / (yRange.max - yRange.min);
        return padT + chartH * (1 - t);
      };

      // Race animation: curves draw progressively
      const raceDuration = 8000;
      const elapsed = time % (raceDuration + 12000); // 8s race + 12s breathe
      const raceProgress = elapsed < raceDuration ? elapsed / raceDuration : 1;

      // ── Draw each strategy ──
      let leaderIdx = -1;
      let leaderVal = -Infinity;

      data.strategies.forEach((strat, si) => {
        const curve = strat.backtest.equityCurve;
        const color = STRATEGY_COLORS[si % STRATEGY_COLORS.length];
        const revealCount = Math.floor(raceProgress * curve.length);
        const hasPBOWarning = strat.overfitting.pbo > 0.4;

        // Drawdown region fill
        if (revealCount > 1 && strat.backtest.drawdownSeries) {
          ctx.save();
          ctx.globalAlpha = 0.04;
          ctx.fillStyle = SIM_COLORS.rose;
          ctx.beginPath();
          for (let i = 0; i < Math.min(revealCount, strat.backtest.drawdownSeries.length); i++) {
            const dd = strat.backtest.drawdownSeries[i];
            if (dd.value < -0.02) {
              const x = mapX(i);
              const yTop = mapY(curve[i]?.value ?? 0);
              const yBot = yTop + Math.abs(dd.value) * chartH * 2;
              ctx.fillRect(x - 1, yTop, 2, Math.min(yBot - yTop, 20));
            }
          }
          ctx.restore();
        }

        // Main equity curve line
        if (revealCount > 1) {
          ctx.save();
          // PBO flicker effect
          const flickerAlpha = hasPBOWarning
            ? 0.3 + Math.random() * 0.2
            : 0.5;
          ctx.strokeStyle = colorWithAlpha(color, flickerAlpha);
          ctx.lineWidth = si === 0 ? 2 : 1.5;
          ctx.beginPath();
          const step = isMobile ? 2 : 1;
          for (let i = 0; i < revealCount; i += step) {
            const pt = curve[i];
            if (!pt) continue;
            const x = mapX(i);
            const y = mapY(pt.value);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Glow under line
          ctx.globalAlpha = 0.04;
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.restore();

          // Head particle
          const headIdx = Math.min(revealCount - 1, curve.length - 1);
          const headPt = curve[headIdx];
          if (headPt) {
            const hx = mapX(headIdx);
            const hy = mapY(headPt.value);

            // Track leader
            if (headPt.value > leaderVal) {
              leaderVal = headPt.value;
              leaderIdx = si;
            }

            // Head glow
            const headGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8);
            headGrad.addColorStop(0, colorWithAlpha(color, 0.6));
            headGrad.addColorStop(1, 'transparent');
            ctx.save();
            ctx.fillStyle = headGrad;
            ctx.beginPath();
            ctx.arc(hx, hy, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = colorWithAlpha(color, 0.9);
            ctx.beginPath();
            ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      });

      // Leader sonar pulse
      if (leaderIdx >= 0 && raceProgress < 1) {
        const leaderCurve = data.strategies[leaderIdx].backtest.equityCurve;
        const headIdx = Math.min(
          Math.floor(raceProgress * leaderCurve.length) - 1,
          leaderCurve.length - 1,
        );
        if (headIdx >= 0) {
          const pt = leaderCurve[headIdx];
          if (pt) {
            const sonarT = (time % 2000) / 2000;
            drawSonarPulse(ctx, mapX(headIdx), mapY(pt.value), 15, sonarT,
              STRATEGY_COLORS[leaderIdx % STRATEGY_COLORS.length]);
          }
        }
      }

      // ── Finish line with final returns (desktop only) ──
      if (!isMobile && raceProgress >= 1) {
        const finishX = w - padR + 5;
        data.strategies.forEach((strat, si) => {
          const curve = strat.backtest.equityCurve;
          const lastPt = curve[curve.length - 1];
          if (!lastPt) return;
          const y = mapY(lastPt.value);
          const color = STRATEGY_COLORS[si % STRATEGY_COLORS.length];
          const isWinner = si === leaderIdx;

          ctx.save();
          ctx.font = isWinner ? SIM_FONTS.labelLg : SIM_FONTS.tiny;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(color, isWinner ? 0.9 : 0.5);
          const retPct = ((lastPt.value / curve[0].value - 1) * 100).toFixed(0);
          ctx.fillText(`${retPct}%`, finishX, y);

          if (isWinner) {
            // Trophy glow
            const trophyGrad = ctx.createRadialGradient(finishX + 10, y, 0, finishX + 10, y, 15);
            trophyGrad.addColorStop(0, colorWithAlpha(color, 0.15));
            trophyGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = trophyGrad;
            ctx.beginPath();
            ctx.arc(finishX + 10, y, 15, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
      }

      // ── Mouse crosshair ──
      if (mouse && mouse.x > padL && mouse.x < padL + chartW) {
        const dayIdx = Math.round(((mouse.x - padL) / chartW) * (maxDays - 1));
        const crossX = mapX(dayIdx);

        ctx.save();
        ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.08);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(crossX, padT);
        ctx.lineTo(crossX, padT + chartH);
        ctx.stroke();
        ctx.restore();

        // Values at crosshair
        const lines = data.strategies.map((strat, si) => {
          const pt = strat.backtest.equityCurve[Math.min(dayIdx, strat.backtest.equityCurve.length - 1)];
          const color = STRATEGY_COLORS[si % STRATEGY_COLORS.length];
          return {
            text: `${strat.label}: ${pt ? pt.value.toFixed(0) : 'N/A'}`,
            color: colorWithAlpha(color, 0.8),
          };
        });

        drawSimTooltip(ctx, crossX, padT, [
          { text: `Day ${dayIdx + 1}`, font: SIM_FONTS.labelLg, color: SIM_TEXT.primary },
          ...lines,
        ], SIM_COLORS.violet, 180);
      }

      // ── Legend ──
      if (!isMobile) {
        data.strategies.forEach((strat, si) => {
          const color = STRATEGY_COLORS[si % STRATEGY_COLORS.length];
          const lx = padL + si * 80;
          const ly = padT - 10;

          ctx.save();
          ctx.fillStyle = colorWithAlpha(color, 0.6);
          ctx.beginPath();
          ctx.arc(lx, ly, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = SIM_FONTS.tiny;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(color, 0.5);
          ctx.fillText(strat.label, lx + 6, ly);
          ctx.restore();
        });
      }
    },
    [data, yRange, maxDays, isMobile],
  );

  return (
    <div className={`relative ${className ?? ''}`} style={{ minHeight: isMobile ? 220 : 350 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`Equity curve race: ${data.strategies.length} strategies competing over ${maxDays} days`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            {data.strategies.length} strategies backtested
          </div>
        }
      />
    </div>
  );
}
