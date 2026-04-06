'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { ParticleField } from '../shared/ParticleField';
import { useMobileDetect } from '../pretext/useMobileDetect';
import { lerp, clamp, easeOutExpo } from '../pretext/textRenderer';
import {
  drawGlowingNode,
  drawSonarPulse,
  colorWithAlpha,
  dist,
} from '../pretext/canvasEffects';

/* ── Tool station ── */
interface ToolStation {
  id: string;
  label: string;
  subtitle: string;
  labelWidth: number;
  subtitleWidth: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  phase: number;
  breatheSpeed: number;
  glowIntensity: number;
  scale: number;
  enterDelay: number;
  opacity: number;
  isHovered: boolean;
  hoverTime: number;
  microVizType: MicroVizType;
}

type MicroVizType = 'bellcurve' | 'bars' | 'score' | 'pie' | 'sparkline';

/* ── Data particle with trail ── */
interface DataParticle {
  fromIdx: number;
  toIdx: number;
  t: number;
  speed: number;
  size: number;
  opacity: number;
  value: string;
  color: string;
  isFan: boolean;
  fanOffset: number;
  trail: { x: number; y: number }[];
}

/* ── Connection ── */
interface ToolConnection {
  from: number;
  to: number;
  curvature: number;
}

const TOOLS: { id: string; label: string; subtitle: string; viz: MicroVizType }[] = [
  { id: 'signals', label: 'AI Patterns', subtitle: 'Multi-Model Detection', viz: 'sparkline' },
  { id: 'volatility', label: 'Volatility', subtitle: 'Storm Gauge', viz: 'bars' },
  { id: 'regimes', label: 'Regimes', subtitle: 'Market Mode', viz: 'sparkline' },
  { id: 'montecarlo', label: 'Monte Carlo', subtitle: 'Price Simulator', viz: 'bellcurve' },
  { id: 'portfolio', label: 'Portfolio', subtitle: 'Optimizer', viz: 'pie' },
  { id: 'backtesting', label: 'Backtesting', subtitle: 'Strategy Tester', viz: 'sparkline' },
  { id: 'riskscore', label: 'Risk Score', subtitle: '1 to 99', viz: 'score' },
  { id: 'scenarios', label: 'Scenarios', subtitle: 'Crash Tests', viz: 'bars' },
  { id: 'factors', label: 'Factors', subtitle: 'Return Drivers', viz: 'sparkline' },
];

const FLOW_VALUES = [
  '0.82', '1.47', '67%', '2847', '14.2%', '3.21', '0.92', '23.1',
  '99.2', '45.6', '78.9', '5412', '0.34', '8.92', '0.65', '234',
];

const VIOLET = 'rgba(167, 139, 250, 0.8)';
const VIOLET_DIM = 'rgba(167, 139, 250, 0.5)';

const FLOW_COLORS = [
  'rgba(167, 139, 250, 0.8)',
  'rgba(110, 231, 183, 0.7)',
  'rgba(129, 140, 248, 0.7)',
  'rgba(196, 181, 253, 0.6)',
];

export function GridCanvas() {
  const isMobile = useMobileDetect();
  const stationsRef = useRef<ToolStation[]>([]);
  const particlesRef = useRef<DataParticle[]>([]);
  const connectionsRef = useRef<ToolConnection[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const readyRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });
  const startTimeRef = useRef(0);

  const labelFont = isMobile
    ? '600 11px Sora, system-ui, sans-serif'
    : '600 14px Sora, system-ui, sans-serif';
  const subtitleFont = isMobile
    ? '300 8px Sora, system-ui, sans-serif'
    : '300 10px Sora, system-ui, sans-serif';
  const valueFont = isMobile
    ? '400 7px Sora, system-ui, sans-serif'
    : '400 8px Sora, system-ui, sans-serif';
  const toolDefs = isMobile ? TOOLS.slice(0, 6) : TOOLS;

  useEffect(() => {
    document.fonts.ready.then(() => {
      const stations: ToolStation[] = toolDefs.map((tool, i) => {
        const labelHandle = prepare(tool.label, labelFont);
        let lo = 0;
        let hi = 300;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(labelHandle, mid, 16).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        const labelWidth = Math.ceil(hi) + 4;

        const subHandle = prepare(tool.subtitle, subtitleFont);
        lo = 0;
        hi = 300;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(subHandle, mid, 12).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        const subtitleWidth = Math.ceil(hi) + 4;

        return {
          id: tool.id,
          label: tool.label,
          subtitle: tool.subtitle,
          labelWidth,
          subtitleWidth,
          x: 0, y: 0,
          targetX: 0, targetY: 0,
          phase: (i / toolDefs.length) * Math.PI * 2,
          breatheSpeed: 0.001 + Math.random() * 0.0005,
          glowIntensity: 0.4 + Math.random() * 0.3,
          scale: 1,
          enterDelay: i * 120,
          opacity: 0,
          isHovered: false,
          hoverTime: 0,
          microVizType: tool.viz,
        };
      });

      // Hub-and-spoke + ring connections
      const conns: ToolConnection[] = [];
      const hubIdx = toolDefs.findIndex((t) => t.id === 'montecarlo');
      const hub = hubIdx >= 0 ? hubIdx : 3;

      for (let i = 0; i < stations.length; i++) {
        if (i !== hub) {
          conns.push({ from: hub, to: i, curvature: (Math.random() - 0.5) * 40 });
        }
      }
      for (let i = 0; i < stations.length; i++) {
        const next = (i + 1) % stations.length;
        if (i !== hub && next !== hub) {
          conns.push({ from: i, to: next, curvature: (Math.random() - 0.5) * 30 });
        }
      }

      stationsRef.current = stations;
      connectionsRef.current = conns;
      readyRef.current = true;
      startTimeRef.current = performance.now();
    });
  }, [labelFont, subtitleFont, toolDefs]);

  const positionTools = useCallback((w: number, h: number) => {
    const stations = stationsRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const rx = isMobile ? w * 0.34 : w * 0.36;
    const ry = isMobile ? h * 0.32 : h * 0.34;
    const hubIdx = stations.findIndex((s) => s.id === 'montecarlo');

    stations.forEach((s, i) => {
      if (i === hubIdx) {
        s.targetX = cx;
        s.targetY = cy - (isMobile ? 10 : 20);
      } else {
        const adjustedIdx = i > hubIdx ? i - 1 : i;
        const angle = (adjustedIdx / (stations.length - 1)) * Math.PI * 2 - Math.PI / 2;
        s.targetX = cx + Math.cos(angle) * rx;
        s.targetY = cy + Math.sin(angle) * ry;
      }
      if (s.x === 0) { s.x = s.targetX; s.y = s.targetY; }
    });
  }, [isMobile]);

  const spawnParticle = useCallback(() => {
    const conns = connectionsRef.current;
    const stations = stationsRef.current;
    if (!conns.length) return;

    const conn = conns[Math.floor(Math.random() * conns.length)];
    const isFromHub = stations[conn.from]?.id === 'montecarlo';

    // Fan particles from Monte Carlo
    if (isFromHub && !isMobile) {
      const fanCount = 2 + Math.floor(Math.random() * 2);
      for (let f = 0; f < fanCount; f++) {
        particlesRef.current.push({
          fromIdx: conn.from,
          toIdx: conn.to,
          t: 0,
          speed: 0.003 + Math.random() * 0.002,
          size: 1.5,
          opacity: 0.3 + Math.random() * 0.2,
          value: FLOW_VALUES[Math.floor(Math.random() * FLOW_VALUES.length)],
          color: FLOW_COLORS[Math.floor(Math.random() * FLOW_COLORS.length)],
          isFan: true,
          fanOffset: (f - (fanCount - 1) / 2) * 12,
          trail: [],
        });
      }
    } else {
      particlesRef.current.push({
        fromIdx: conn.from,
        toIdx: conn.to,
        t: 0,
        speed: 0.003 + Math.random() * 0.002,
        size: isMobile ? 1 : 1.5,
        opacity: 0.4 + Math.random() * 0.3,
        value: FLOW_VALUES[Math.floor(Math.random() * FLOW_VALUES.length)],
        color: FLOW_COLORS[Math.floor(Math.random() * FLOW_COLORS.length)],
        isFan: false,
        fanOffset: 0,
        trail: [],
      });
    }

    const maxP = isMobile ? 15 : 50;
    if (particlesRef.current.length > maxP) {
      particlesRef.current = particlesRef.current.slice(-maxP);
    }
  }, [isMobile]);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (!readyRef.current) return;

      const elapsed = time - startTimeRef.current;
      const mouse = mouseRef.current;

      if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
        sizeRef.current = { w, h };
        positionTools(w, h);
      }

      const stations = stationsRef.current;
      const connections = connectionsRef.current;

      // Spawn particles
      const spawnRate = isMobile ? 0.03 : 0.06;
      if (Math.random() < spawnRate) spawnParticle();

      // Hover-boosted spawn
      if (mouse && !isMobile) {
        stations.forEach((s) => {
          if (s.isHovered && Math.random() < 0.15) spawnParticle();
        });
      }

      /* ── Layer 0: Dot grid (cosmic, x.ai style) ── */
      const gridSize = isMobile ? 40 : 50;
      ctx.fillStyle = 'rgba(167, 139, 250, 0.015)';
      for (let x = gridSize; x < w; x += gridSize) {
        for (let y = gridSize; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ── Update hover state ── */
      if (mouse && !isMobile) {
        stations.forEach((s) => {
          const d = dist(mouse.x, mouse.y, s.x, s.y);
          const wasHovered = s.isHovered;
          s.isHovered = d < 60;
          if (s.isHovered) {
            s.hoverTime = wasHovered ? s.hoverTime + 16 : 0;
          }
          // Gravitational pull (200px range, not 60px hover)
          if (d < 200 && d > 60) {
            const pull = ((200 - d) / 200) * 8;
            s.x = lerp(s.x, s.x + ((mouse.x - s.x) / d) * pull, 0.02);
            s.y = lerp(s.y, s.y + ((mouse.y - s.y) / d) * pull, 0.02);
          }
        });
      } else {
        stations.forEach((s) => { s.isHovered = false; });
      }

      /* ── Layer 1: Connection lines ── */
      connections.forEach((conn) => {
        const from = stations[conn.from];
        const to = stations[conn.to];
        if (!from || !to || from.opacity < 0.1 || to.opacity < 0.1) return;

        const isIlluminated = from.isHovered || to.isHovered;
        const alpha = isIlluminated ? 0.18 : Math.min(from.opacity, to.opacity) * 0.08;

        const mx = (from.x + to.x) / 2 + conn.curvature;
        const my = (from.y + to.y) / 2 + conn.curvature * 0.5;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = VIOLET_DIM;
        ctx.lineWidth = isIlluminated ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(mx, my, to.x, to.y);
        ctx.stroke();
        ctx.restore();
      });

      /* ── Layer 2: Data particles with trails ── */
      const survivors: DataParticle[] = [];
      particlesRef.current.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) return;

        const from = stations[p.fromIdx];
        const to = stations[p.toIdx];
        if (!from || !to || from.opacity < 0.1 || to.opacity < 0.1) return;

        const conn = connections.find(
          (c) => c.from === p.fromIdx && c.to === p.toIdx,
        );
        const curv = conn?.curvature ?? 0;
        const mx = (from.x + to.x) / 2 + curv;
        const my = (from.y + to.y) / 2 + curv * 0.5;

        const t = p.t;
        const u = 1 - t;
        let px = u * u * from.x + 2 * u * t * mx + t * t * to.x;
        let py = u * u * from.y + 2 * u * t * my + t * t * to.y;

        // Fan offset — perpendicular to path tangent at midpoint
        if (p.isFan && p.fanOffset !== 0) {
          const fanStrength = Math.sin(t * Math.PI); // widest at midpoint
          const tangentX = 2 * (1 - t) * (mx - from.x) + 2 * t * (to.x - mx);
          const tangentY = 2 * (1 - t) * (my - from.y) + 2 * t * (to.y - my);
          const tLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY) || 1;
          px += (-tangentY / tLen) * p.fanOffset * fanStrength;
          py += (tangentX / tLen) * p.fanOffset * fanStrength;
        }

        // Store trail
        p.trail.push({ x: px, y: py });
        if (p.trail.length > 4) p.trail.shift();

        const fadeFactor = t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1;
        const baseAlpha = p.opacity * fadeFactor * Math.min(from.opacity, to.opacity);

        // Trail
        if (p.trail.length > 1 && !isMobile) {
          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 0.5;
          for (let i = 1; i < p.trail.length; i++) {
            ctx.globalAlpha = baseAlpha * (i / p.trail.length) * 0.3;
            ctx.beginPath();
            ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Glow + core
        ctx.save();
        ctx.globalAlpha = baseAlpha;
        ctx.beginPath();
        ctx.arc(px, py, p.size + 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(/[\d.]+\)$/, '0.15)');
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Value label
        if (!isMobile && fadeFactor > 0.5) {
          ctx.globalAlpha = baseAlpha * 0.4;
          ctx.font = valueFont;
          ctx.textAlign = 'center';
          ctx.fillStyle = p.color;
          ctx.fillText(p.value, px, py - 8);
        }
        ctx.restore();

        survivors.push(p);
      });
      particlesRef.current = survivors;

      /* ── Layer 3: Tool stations ── */
      const hubIdx = stations.findIndex((s) => s.id === 'montecarlo');

      stations.forEach((s) => {
        const enterT = clamp((elapsed - s.enterDelay) / 800, 0, 1);
        s.opacity = easeOutExpo(enterT);
        if (s.opacity < 0.01) return;

        const breathe = Math.sin(time * s.breatheSpeed + s.phase);
        const driftX = Math.sin(time * 0.0003 + s.phase) * 4;
        const driftY = Math.cos(time * 0.00025 + s.phase * 1.3) * 3;
        s.x = lerp(s.x, s.targetX + driftX, 0.03);
        s.y = lerp(s.y, s.targetY + driftY, 0.03);

        const isHub = s.id === 'montecarlo';
        const nodeRadius = isHub ? (isMobile ? 28 : 38) : (isMobile ? 20 : 28);
        const intensity = s.isHovered ? 0.9 : s.glowIntensity;

        drawGlowingNode(ctx, s.x, s.y, nodeRadius, VIOLET, intensity, time * 0.002 + s.phase);

        ctx.save();
        ctx.globalAlpha = s.opacity;

        // Label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = labelFont;
        ctx.fillStyle = isHub
          ? `rgba(255, 255, 255, ${0.8 + breathe * 0.1})`
          : `rgba(255, 255, 255, ${0.55 + breathe * 0.1})`;

        if (isHub) {
          ctx.shadowColor = 'rgba(167, 139, 250, 0.3)';
          ctx.shadowBlur = 8;
        }

        // If hovered, show micro-viz instead of subtitle
        if (s.isHovered && !isMobile) {
          const vizAlpha = clamp(s.hoverTime / 300, 0, 1);
          ctx.fillText(s.label, s.x, s.y - 6);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = s.opacity * vizAlpha;
          drawMicroViz(ctx, s.x, s.y + 10, nodeRadius * 0.7, s.microVizType, time);
        } else {
          ctx.fillText(s.label, s.x, s.y - (isMobile ? 4 : 5));
          ctx.shadowBlur = 0;

          ctx.font = subtitleFont;
          ctx.fillStyle = isHub
            ? `rgba(167, 139, 250, ${0.5 + breathe * 0.1})`
            : `rgba(167, 139, 250, ${0.3 + breathe * 0.05})`;
          ctx.fillText(s.subtitle, s.x, s.y + (isMobile ? 8 : 10));
        }

        ctx.restore();
      });

      /* ── Double sonar pulse from hub (heartbeat) ── */
      if (hubIdx >= 0) {
        const hub = stations[hubIdx];
        if (hub.opacity > 0.5) {
          const maxR = isMobile ? 60 : 90;
          const sonar1 = (time % 3000) / 3000;
          const sonar2 = ((time + 1500) % 3000) / 3000;
          drawSonarPulse(ctx, hub.x, hub.y, maxR, sonar1, VIOLET);
          drawSonarPulse(ctx, hub.x, hub.y, maxR * 0.6, sonar2, VIOLET);
        }
      }

      /* ── Mouse glow ── */
      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        grad.addColorStop(0, 'rgba(167, 139, 250, 0.025)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [labelFont, subtitleFont, valueFont, isMobile, positionTools, spawnParticle],
  );

  return (
    <PretextCanvas
      draw={draw}
      fallback={<ParticleField count={50} />}
      fps={isMobile ? 30 : 60}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

/* ── Micro-visualizations rendered inside hovered nodes ── */
function drawMicroViz(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  type: MicroVizType,
  time: number,
): void {
  ctx.save();

  switch (type) {
    case 'bellcurve': {
      // Numbers arranged in bell-curve arc
      const values = ['0.3', '1.2', '2.8', '4.1', '2.6', '1.0', '0.4'];
      ctx.font = '400 7px Sora, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(167, 139, 250, 0.7)';
      values.forEach((v, i) => {
        const bellH = [0.3, 0.6, 0.9, 1, 0.85, 0.55, 0.25][i];
        const vx = cx + (i - 3) * (radius / 4);
        const vy = cy - bellH * radius * 0.4;
        ctx.fillText(v, vx, vy);
      });
      break;
    }
    case 'bars': {
      const heights = [0.4, 0.7, 0.5, 0.9, 0.3];
      const barW = radius / 5;
      ctx.fillStyle = 'rgba(167, 139, 250, 0.5)';
      heights.forEach((h, i) => {
        const bx = cx - radius * 0.5 + i * (barW + 2);
        const bh = h * radius * 0.5;
        ctx.fillRect(bx, cy - bh / 2, barW, bh);
      });
      break;
    }
    case 'score': {
      const pulse = Math.sin(time * 0.003) * 0.15;
      ctx.font = '700 14px Sora, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorWithAlpha(VIOLET, 0.7 + pulse);
      ctx.fillText('87', cx, cy);
      break;
    }
    case 'pie': {
      const segments = [0.45, 0.3, 0.25];
      const colors = ['rgba(167, 139, 250, 0.5)', 'rgba(110, 231, 183, 0.4)', 'rgba(96, 165, 250, 0.4)'];
      let startAngle = -Math.PI / 2;
      segments.forEach((seg, i) => {
        const endAngle = startAngle + seg * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius * 0.35, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        startAngle = endAngle;
      });
      break;
    }
    case 'sparkline': {
      const points = [0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.75];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.6)';
      ctx.lineWidth = 1;
      points.forEach((p, i) => {
        const px = cx - radius * 0.4 + (i / (points.length - 1)) * radius * 0.8;
        const py = cy + (1 - p) * radius * 0.4 - radius * 0.15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}
