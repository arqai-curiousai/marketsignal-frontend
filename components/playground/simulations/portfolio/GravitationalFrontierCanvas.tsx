'use client';

import React, { useRef, useCallback } from 'react';
import { PretextCanvas } from '@/components/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawGlowingNode,
  drawSonarPulse,
  drawConnection,
  drawSimTooltip,
} from '@/components/pretext/canvasEffects';
import { drawTextGlow } from '@/components/pretext/textRenderer';
import { SIM_COLORS, SIM_FONTS, SIM_TEXT } from '@/components/pretext/sim/simCanvasTokens';
import type { IPortfolioOptimization } from '@/types/simulation';

interface Props {
  data: IPortfolioOptimization;
  className?: string;
}

const STRATEGY_COLORS: Record<string, string> = {
  equal_weight: SIM_COLORS.blue,
  min_variance: SIM_COLORS.emerald,
  max_sharpe: SIM_COLORS.violet,
  risk_parity: SIM_COLORS.amber,
  hrp: SIM_COLORS.orange,
};

const STRATEGY_LABELS: Record<string, string> = {
  equal_weight: 'Equal',
  min_variance: 'Min Var',
  max_sharpe: 'Max Sharpe',
  risk_parity: 'Risk Parity',
  hrp: 'HRP',
};

export function GravitationalFrontierCanvas({ data, className }: Props) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      const padL = 50;
      const padR = 20;
      const padT = 30;
      const padB = 30;
      const chartW = w - padL - padR;
      const chartH = h - padT - padB;

      // Gather all strategy points to determine axis range
      const strategies = data.strategies;
      const allVols = strategies.map((s) => s.metrics.annualVolatility);
      const allRets = strategies.map((s) => s.metrics.annualReturn);

      const minVol = Math.min(...allVols) * 0.8;
      const maxVol = Math.max(...allVols) * 1.2;
      const minRet = Math.min(...allRets, 0) * 1.2;
      const maxRet = Math.max(...allRets) * 1.2;

      const mapX = (vol: number) => padL + ((vol - minVol) / (maxVol - minVol)) * chartW;
      const mapY = (ret: number) => padT + chartH * (1 - (ret - minRet) / (maxRet - minRet));

      // ── Axes ──
      ctx.save();
      ctx.strokeStyle = colorWithAlpha('rgba(255,255,255,1)', 0.08);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(padL, padT + chartH);
      ctx.lineTo(padL + chartW, padT + chartH);
      ctx.moveTo(padL, padT + chartH);
      ctx.lineTo(padL, padT);
      ctx.stroke();
      ctx.restore();

      // Axis labels
      ctx.save();
      ctx.font = SIM_FONTS.tiny;
      ctx.fillStyle = SIM_TEXT.ghost;
      ctx.textAlign = 'center';
      ctx.fillText('Risk (Volatility)', padL + chartW / 2, padT + chartH + 18);
      ctx.save();
      ctx.translate(12, padT + chartH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('Return', 0, 0);
      ctx.restore();
      ctx.restore();

      // ── Frontier curve (connecting strategies sorted by vol) ──
      const sorted = [...strategies].sort((a, b) => a.metrics.annualVolatility - b.metrics.annualVolatility);
      if (sorted.length > 1) {
        ctx.save();
        const pulse = Math.sin(time * 0.002) * 0.08;
        ctx.strokeStyle = colorWithAlpha(SIM_COLORS.violet, 0.25 + pulse);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        sorted.forEach((s, i) => {
          const x = mapX(s.metrics.annualVolatility);
          const y = mapY(s.metrics.annualReturn);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Frontier glow
        ctx.globalAlpha = 0.06;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();
      }

      // ── Strategy nodes ──
      let hoveredStrategy: string | null = null;
      strategies.forEach((strat) => {
        const x = mapX(strat.metrics.annualVolatility);
        const y = mapY(strat.metrics.annualReturn);
        const color = STRATEGY_COLORS[strat.mode] ?? SIM_COLORS.blue;
        const label = STRATEGY_LABELS[strat.mode] ?? strat.label;
        const isMaxSharpe = strat.mode === data.bestStrategy;
        const nodeR = isMaxSharpe ? 10 : 7;

        // Hover detection
        if (mouse) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          if (Math.sqrt(dx * dx + dy * dy) < 20) {
            hoveredStrategy = strat.mode;
          }
        }

        const isHov = hoveredStrategy === strat.mode;
        const intensity = isMaxSharpe ? 0.8 : 0.5;

        drawGlowingNode(ctx, x, y, nodeR, color, isHov ? 1 : intensity, time * 0.002);

        // Sharpe halo (radius proportional to Sharpe)
        if (strat.metrics.sharpe > 0) {
          const haloR = nodeR + strat.metrics.sharpe * 12;
          ctx.save();
          ctx.strokeStyle = colorWithAlpha(color, 0.08);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(x, y, haloR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Max Sharpe sonar
        if (isMaxSharpe) {
          const sonarT = (time % 3500) / 3500;
          drawSonarPulse(ctx, x, y, 25, sonarT, color);
        }

        // Strategy label
        ctx.save();
        ctx.font = isMaxSharpe ? SIM_FONTS.labelLg : SIM_FONTS.label;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = colorWithAlpha(color, isHov ? 0.9 : 0.55);
        ctx.fillText(label, x, y + nodeR + 5);
        ctx.restore();
      });

      // ── Hover tooltip ──
      if (hoveredStrategy) {
        const strat = strategies.find((s) => s.mode === hoveredStrategy);
        if (strat) {
          const x = mapX(strat.metrics.annualVolatility);
          const y = mapY(strat.metrics.annualReturn);
          const color = STRATEGY_COLORS[strat.mode] ?? SIM_COLORS.blue;

          drawSimTooltip(ctx, x, y, [
            { text: STRATEGY_LABELS[strat.mode] ?? strat.label, color: colorWithAlpha(color, 0.95), font: SIM_FONTS.labelLg },
            { text: `Return: ${(strat.metrics.annualReturn * 100).toFixed(1)}%`, color: SIM_TEXT.secondary },
            { text: `Volatility: ${(strat.metrics.annualVolatility * 100).toFixed(1)}%`, color: SIM_TEXT.secondary },
            { text: `Sharpe: ${strat.metrics.sharpe.toFixed(2)}`, color: colorWithAlpha(SIM_COLORS.amber, 0.8) },
            { text: `Max DD: ${(strat.metrics.maxDrawdown * 100).toFixed(1)}%`, color: colorWithAlpha(SIM_COLORS.rose, 0.7) },
          ], color);
        }
      }

      // ── Best strategy highlight ──
      if (!isMobile && data.bestStrategy) {
        ctx.save();
        ctx.font = SIM_FONTS.tiny;
        ctx.textAlign = 'right';
        ctx.fillStyle = colorWithAlpha(SIM_COLORS.violet, 0.4);
        ctx.fillText(`Best: ${STRATEGY_LABELS[data.bestStrategy] ?? data.bestStrategy}`, w - padR, padT - 8);
        ctx.restore();
      }
    },
    [data, isMobile],
  );

  return (
    <div className={`relative ${className ?? ''}`} style={{ minHeight: isMobile ? 220 : 320 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`Portfolio efficient frontier: ${data.strategies.length} strategies, best is ${data.bestStrategy}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            Best Strategy: {data.bestStrategy}
          </div>
        }
      />
    </div>
  );
}
