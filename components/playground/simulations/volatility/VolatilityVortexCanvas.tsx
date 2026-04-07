'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { PretextCanvas } from '@/components/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/pretext/useMobileDetect';
import {
  colorWithAlpha,
  drawGlowingNode,
  drawOrbitalRing,
  drawSonarPulse,
  drawVortexArm,
  drawSimTooltip,
} from '@/components/pretext/canvasEffects';
import { drawTextGlow } from '@/components/pretext/textRenderer';
import { SIM_FONTS, SIM_TEXT } from '@/components/pretext/sim/simCanvasTokens';
import { getRegimeConfig, fmtVol, ESTIMATOR_COLORS } from './vol-tokens';
import type { IVolatilityAnalysis } from '@/types/simulation';

interface Props {
  data: IVolatilityAnalysis;
  className?: string;
}

interface EstimatorNode {
  name: string;
  label: string;
  shortLabel: string;
  value: number | null;
  efficiency: number;
  orbitRadius: number;
  angle: number;
  color: string;
  isRecommended: boolean;
}

const SHORT_LABELS: Record<string, string> = {
  close_to_close: 'CC',
  parkinson: 'PK',
  garman_klass: 'GK',
  rogers_satchell: 'RS',
  yang_zhang: 'YZ',
};

export function VolatilityVortexCanvas({ data, className }: Props) {
  const isMobile = useMobileDetect();
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredEstRef = useRef<number | null>(null);

  const regimeConfig = getRegimeConfig(data.regime.regime);
  const percentile = data.regime.percentile ?? 0.5;

  // Build estimator nodes
  const estimatorNodes: EstimatorNode[] = useMemo(() => {
    return data.estimators.map((est, i) => ({
      name: est.name,
      label: est.label,
      shortLabel: SHORT_LABELS[est.name] ?? est.name.slice(0, 2).toUpperCase(),
      value: est.currentValue,
      efficiency: est.efficiency,
      orbitRadius: 0, // calculated in draw based on canvas size
      angle: (i / data.estimators.length) * Math.PI * 2 - Math.PI / 2,
      color: ESTIMATOR_COLORS[est.name] ?? '#818CF8',
      isRecommended: est.name === data.recommendedEstimator,
    }));
  }, [data.estimators, data.recommendedEstimator]);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredEstRef.current = null;
  }, []);

  // Particle counts based on regime
  const armCount = isMobile ? 3 : 4;
  const particlesPerArm = isMobile
    ? Math.floor(regimeConfig.particles * 2)
    : Math.floor(regimeConfig.particles * 4);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const mouse = mouseRef.current;
      const maxR = Math.min(w, h) * 0.42;
      const eyeR = maxR * 0.22;
      const orbitR = maxR * 0.6;

      // ── Vortex arms ──
      for (let a = 0; a < armCount; a++) {
        const armAngle = (a / armCount) * Math.PI * 2;
        drawVortexArm(
          ctx, cx, cy, armAngle, maxR,
          particlesPerArm, regimeConfig.hex,
          regimeConfig.particleSpeed, time,
        );
      }

      // ── Estimator orbit ring ──
      drawOrbitalRing(
        ctx, cx, cy, orbitR, orbitR, 0,
        'rgba(255,255,255,1)', 0.04,
        [4, 6],
      );

      // Recommended estimator orbit (brighter)
      const recIdx = estimatorNodes.findIndex((n) => n.isRecommended);
      if (recIdx >= 0) {
        drawOrbitalRing(
          ctx, cx, cy, orbitR, orbitR, 0,
          estimatorNodes[recIdx].color, 0.12,
        );
      }

      // ── Estimator nodes ──
      let newHovered: number | null = null;
      estimatorNodes.forEach((node, i) => {
        const speed = 0.0002 * (1 + node.efficiency * 0.3);
        const currentAngle = node.angle + time * speed;
        const nx = cx + Math.cos(currentAngle) * orbitR;
        const ny = cy + Math.sin(currentAngle) * orbitR;
        const nodeR = node.isRecommended ? 8 : 6;

        // Check hover
        if (mouse) {
          const dx = mouse.x - nx;
          const dy = mouse.y - ny;
          if (Math.sqrt(dx * dx + dy * dy) < 18) {
            newHovered = i;
          }
        }

        const isHov = newHovered === i;
        const intensity = node.isRecommended ? 0.8 : 0.4;

        drawGlowingNode(ctx, nx, ny, nodeR, node.color, isHov ? 1 : intensity, time * 0.002);

        // Node label
        ctx.save();
        ctx.font = SIM_FONTS.label;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(node.color, isHov ? 0.9 : 0.6);
        ctx.fillText(node.shortLabel, nx, ny);
        ctx.restore();

        // Estimator value near node (if not too cluttered)
        if (node.value != null && !isMobile) {
          const valAngle = currentAngle;
          const valR = orbitR + 18;
          const vx = cx + Math.cos(valAngle) * valR;
          const vy = cy + Math.sin(valAngle) * valR;
          ctx.save();
          ctx.font = SIM_FONTS.tiny;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(node.color, isHov ? 0.8 : 0.3);
          ctx.fillText(fmtVol(node.value), vx, vy);
          ctx.restore();
        }

        // Sonar pulse on recommended estimator
        if (node.isRecommended) {
          const sonarT = (time % 3000) / 3000;
          drawSonarPulse(ctx, nx, ny, 20, sonarT, node.color);
        }
      });
      hoveredEstRef.current = newHovered;

      // ── GARCH forecast whisker ──
      if (data.garch) {
        const forecast = data.garch.forecastSeries;
        if (forecast.length > 0) {
          const lastVol = forecast[forecast.length - 1].meanVol;
          const currentVol = data.garch.currentVol;
          const increasing = lastVol > currentVol;
          const whiskerAngle = increasing ? -Math.PI / 4 : Math.PI / 4;
          const whiskerLen = eyeR * 1.5;
          const wx = cx + Math.cos(whiskerAngle) * whiskerLen;
          const wy = cy + Math.sin(whiskerAngle) * whiskerLen;
          const whiskerColor = increasing ? 'rgba(251, 146, 60, 1)' : 'rgba(110, 231, 183, 1)';

          ctx.save();
          ctx.strokeStyle = colorWithAlpha(whiskerColor, 0.4);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(wx, wy);
          ctx.stroke();
          ctx.setLineDash([]);

          // Arrow head
          ctx.fillStyle = colorWithAlpha(whiskerColor, 0.6);
          const arrowAngle = Math.atan2(wy - cy, wx - cx);
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(
            wx - 6 * Math.cos(arrowAngle - 0.4),
            wy - 6 * Math.sin(arrowAngle - 0.4),
          );
          ctx.lineTo(
            wx - 6 * Math.cos(arrowAngle + 0.4),
            wy - 6 * Math.sin(arrowAngle + 0.4),
          );
          ctx.closePath();
          ctx.fill();

          // GARCH label
          ctx.font = SIM_FONTS.tiny;
          ctx.textAlign = 'center';
          ctx.fillStyle = colorWithAlpha(whiskerColor, 0.5);
          ctx.fillText(
            `GARCH ${increasing ? '↑' : '↓'}`,
            wx + (increasing ? 5 : -5),
            wy + (increasing ? -8 : 8),
          );
          ctx.restore();
        }
      }

      // ── Central eye ──
      // Eye glow
      const eyeGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, eyeR * 2);
      eyeGlow.addColorStop(0, colorWithAlpha(regimeConfig.hex, 0.08));
      eyeGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, eyeR * 2, 0, Math.PI * 2);
      ctx.fill();

      // Eye ring
      ctx.save();
      ctx.strokeStyle = colorWithAlpha(regimeConfig.hex, 0.25);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, eyeR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Eye sonar
      const eyeSonarT = (time % 4000) / 4000;
      drawSonarPulse(ctx, cx, cy, eyeR + 10, eyeSonarT, regimeConfig.hex);

      // Central vol value
      const volFont = isMobile ? SIM_FONTS.heroMobile : SIM_FONTS.hero;
      ctx.save();
      ctx.font = volFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorWithAlpha(regimeConfig.hex, 0.9);
      drawTextGlow(ctx, fmtVol(data.regime.currentVol), cx, cy - 8, regimeConfig.hex, 12);
      ctx.font = volFont;
      ctx.fillStyle = colorWithAlpha(regimeConfig.hex, 0.9);
      ctx.fillText(fmtVol(data.regime.currentVol), cx, cy - 8);
      ctx.restore();

      // Regime label
      ctx.save();
      ctx.font = SIM_FONTS.label;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = SIM_TEXT.muted;
      ctx.fillText(regimeConfig.label.toUpperCase(), cx, cy + 14);
      ctx.restore();

      // Percentile
      ctx.save();
      ctx.font = SIM_FONTS.tiny;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = SIM_TEXT.ghost;
      ctx.fillText(`P${Math.round(percentile * 100)} Percentile`, cx, cy + 28);
      ctx.restore();

      // ── Hover tooltip ──
      if (newHovered !== null) {
        const node = estimatorNodes[newHovered];
        const speed = 0.0002 * (1 + node.efficiency * 0.3);
        const currentAngle = node.angle + time * speed;
        const nx = cx + Math.cos(currentAngle) * orbitR;
        const ny = cy + Math.sin(currentAngle) * orbitR;

        drawSimTooltip(ctx, nx, ny, [
          { text: node.label, color: colorWithAlpha(node.color, 0.95), font: SIM_FONTS.labelLg },
          { text: `Value: ${fmtVol(node.value)}`, color: SIM_TEXT.secondary },
          { text: `Efficiency: ${node.efficiency}×`, color: SIM_TEXT.secondary },
          ...(node.isRecommended ? [{ text: '★ Recommended', color: colorWithAlpha(node.color, 0.8) }] : []),
        ], node.color);
      }
    },
    [data, regimeConfig, percentile, estimatorNodes, armCount, particlesPerArm, isMobile],
  );

  return (
    <div className={`relative ${className ?? ''}`} style={{ minHeight: isMobile ? 200 : 280 }}>
      <PretextCanvas
        draw={draw}
        fps={isMobile ? 30 : 60}
        ariaLabel={`Volatility storm eye: ${regimeConfig.label}, ${fmtVol(data.regime.currentVol)} volatility at P${Math.round(percentile * 100)} percentile`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        fallback={
          <div className="flex items-center justify-center h-full text-white/40 text-sm">
            {regimeConfig.label} — {fmtVol(data.regime.currentVol)}
          </div>
        }
      />
    </div>
  );
}
