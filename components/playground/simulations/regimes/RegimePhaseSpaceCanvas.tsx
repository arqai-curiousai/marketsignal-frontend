'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { PretextCanvas } from '@/components/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawGlowingNode,
  drawConnection,
  drawDataPulse,
  drawOrbitalRing,
  drawSonarPulse,
  drawSimTooltip,
} from '@/components/pretext/canvasEffects';
import { SIM_FONTS, SIM_TEXT } from '@/components/pretext/sim/simCanvasTokens';
import type { IRegimeAnalysis } from '@/types/simulation';

interface Props {
  data: IRegimeAnalysis;
  className?: string;
}

/* ── Colorblind-safe regime colors (warm amber / cool slate / deep blue) ── */
const REGIME_COLORS: Record<string, string> = {
  Growth: 'rgba(251, 191, 36, 1)',      // warm amber
  Neutral: 'rgba(148, 163, 184, 1)',    // cool slate
  Contraction: 'rgba(96, 165, 250, 1)', // deep blue
};

const REGIME_POSITIONS: Record<string, { nx: number; ny: number }> = {
  Growth: { nx: 0.5, ny: 0.18 },       // top center
  Neutral: { nx: 0.2, ny: 0.75 },      // bottom left
  Contraction: { nx: 0.8, ny: 0.75 },  // bottom right
};

export function RegimePhaseSpaceCanvas({ data, className }: Props) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredRef = useRef<string | null>(null);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredRef.current = null;
  }, []);

  // Build state info
  const stateInfo = useMemo(() => {
    return data.states.map((s) => ({
      label: s.label,
      displayName: s.displayName,
      color: REGIME_COLORS[s.label] ?? REGIME_COLORS.Neutral,
      pos: REGIME_POSITIONS[s.label] ?? REGIME_POSITIONS.Neutral,
      isCurrent: data.currentState.label === s.label,
      probability: data.stateStatistics.find((st) => st.label === s.label)?.frequency ?? 0,
    }));
  }, [data]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const mouse = mouseRef.current;
      let newHovered: string | null = null;

      // Convert normalized positions to actual coordinates
      const nodes = stateInfo.map((s) => ({
        ...s,
        x: s.pos.nx * w,
        y: s.pos.ny * h,
      }));

      // ── Transition arcs between states ──
      data.transitionMatrix.flat().forEach((cell) => {
        const from = nodes.find((n) => n.label === cell.fromLabel);
        const to = nodes.find((n) => n.label === cell.toLabel);
        if (!from || !to || from.label === to.label) return;

        const prob = cell.probability;
        if (prob < 0.01) return;

        const lineAlpha = 0.05 + prob * 0.15;
        const curveOff = 20 + prob * 15;

        drawConnection(ctx, from.x, from.y, to.x, to.y, from.color, lineAlpha, curveOff);

        // Animated data pulse along transition arc
        const pulseSpeed = 0.3 + prob * 0.7;
        const pulseCycle = 3000 / pulseSpeed;
        const pulseT = (time % pulseCycle) / pulseCycle;
        const pulseSize = 1.5 + prob * 1.5;

        drawDataPulse(
          ctx, from.x, from.y, to.x, to.y,
          pulseT, from.color, pulseSize, curveOff,
        );

        // Probability label at midpoint (desktop only)
        if (!isMobile && prob >= 0.05) {
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          const offY = from.y < to.y ? -8 : 8;
          ctx.save();
          ctx.font = SIM_FONTS.tiny;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(from.color, 0.3);
          ctx.fillText(`${(prob * 100).toFixed(0)}%`, mx, my + offY);
          ctx.restore();
        }
      });

      // ── State nodes ──
      nodes.forEach((node) => {
        const nodeR = isMobile ? 20 : 28;
        const scaledR = nodeR * (0.7 + node.probability * 0.6);

        // Check hover
        if (mouse) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          if (Math.sqrt(dx * dx + dy * dy) < scaledR + 10) {
            newHovered = node.label;
          }
        }

        const isHov = newHovered === node.label;
        const intensity = node.isCurrent ? 0.9 : 0.4;
        const breatheAmp = node.isCurrent ? 1.5 : 0.5;

        drawGlowingNode(
          ctx, node.x, node.y, scaledR, node.color,
          isHov ? 1 : intensity,
          time * 0.002 * breatheAmp,
        );

        // Duration rings (for current state)
        if (node.isCurrent) {
          const durationDays = data.currentState.durationDays;
          const ringCount = Math.min(5, Math.ceil(durationDays / 10));
          for (let r = 1; r <= ringCount; r++) {
            drawOrbitalRing(
              ctx, node.x, node.y,
              scaledR + r * 6, scaledR + r * 6,
              time * 0.0003 * r,
              node.color, 0.06 + (ringCount - r) * 0.02,
              [2, 4],
            );
          }

          // Current state sonar pulse
          const sonarT = (time % 3500) / 3500;
          drawSonarPulse(ctx, node.x, node.y, scaledR + 25, sonarT, node.color);
        }

        // State label inside node
        ctx.save();
        ctx.font = node.isCurrent ? SIM_FONTS.labelLg : SIM_FONTS.label;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(node.color, isHov ? 0.95 : 0.75);
        ctx.fillText(node.displayName, node.x, node.y - 4);

        // Probability below label
        ctx.font = SIM_FONTS.tiny;
        ctx.fillStyle = colorWithAlpha(node.color, isHov ? 0.7 : 0.4);
        const probText = node.isCurrent
          ? `${(data.currentState.probability * 100).toFixed(0)}% · ${data.currentState.durationDays}d`
          : `${(node.probability * 100).toFixed(0)}%`;
        ctx.fillText(probText, node.x, node.y + 10);
        ctx.restore();
      });

      hoveredRef.current = newHovered;

      // ── "YOU ARE HERE" indicator for current state ──
      const currentNode = nodes.find((n) => n.isCurrent);
      if (currentNode) {
        ctx.save();
        ctx.font = SIM_FONTS.tiny;
        ctx.textAlign = 'center';
        ctx.fillStyle = colorWithAlpha(currentNode.color, 0.35);
        ctx.fillText('▼ CURRENT REGIME', currentNode.x, currentNode.y - (isMobile ? 28 : 38));
        ctx.restore();
      }

      // ── Hover tooltip ──
      if (newHovered) {
        const hNode = nodes.find((n) => n.label === newHovered);
        const stat = data.stateStatistics.find((s) => s.label === newHovered);
        if (hNode && stat) {
          drawSimTooltip(ctx, hNode.x, hNode.y, [
            { text: hNode.displayName, color: colorWithAlpha(hNode.color, 0.95), font: SIM_FONTS.labelLg },
            { text: `Avg Return: ${(stat.avgDailyReturn * 25200).toFixed(1)}% ann.`, color: SIM_TEXT.secondary },
            { text: `Volatility: ${(stat.avgVolatility * 100).toFixed(1)}%`, color: SIM_TEXT.secondary },
            { text: `Typical Duration: ${stat.typicalDurationDays}d`, color: SIM_TEXT.secondary },
            { text: `Frequency: ${(stat.frequency * 100).toFixed(0)}%`, color: SIM_TEXT.muted },
          ], hNode.color);
        }
      }
    },
    [data, stateInfo, isMobile],
  );

  const currentLabel = data.currentState.label;

  return (
    <div className={`relative ${className ?? ''}`} style={{ minHeight: isMobile ? 200 : 280 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`Regime phase space: Currently in ${currentLabel} regime with ${(data.currentState.probability * 100).toFixed(0)}% probability for ${data.currentState.durationDays} days`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            Current Regime: {currentLabel}
          </div>
        }
      />
    </div>
  );
}
