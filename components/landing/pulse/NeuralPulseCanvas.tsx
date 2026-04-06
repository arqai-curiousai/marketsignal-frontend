'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { ParticleField } from '../shared/ParticleField';
import { useMobileDetect } from '../pretext/useMobileDetect';
import {
  SAMPLE_HEADLINES,
  SENTIMENT_COLORS,
  type Sentiment,
} from '../pretext/data/pulseHeadlines';
import {
  PULSE_CENTER,
  THOUGHT_MAP_L1,
  THOUGHT_MAP_L1_MOBILE,
  type ThoughtMapL1,
} from '../pretext/data/thoughtMapNodes';
import {
  drawGlowingNode,
  drawConnection,
  drawDataPulse,
  drawSonarPulse,
  colorWithAlpha,
  dist,
  lerp,
} from '../pretext/canvasEffects';

/* ── Internal node types ── */
interface L1Node {
  label: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: string;
  glow: string;
  breathePhase: number;
  pulseProgress: number;
  pulseSpeed: number;
}

interface L2Node {
  label: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  parentIdx: number;
  color: string;
  glow: string;
  driftPhaseX: number;
  driftPhaseY: number;
  opacity: number;
  width: number;
}

interface DriftingHeadline {
  text: string;
  sentiment: Sentiment;
  width: number;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  baseOpacity: number;
}

export function NeuralPulseCanvas() {
  const isMobile = useMobileDetect();
  const readyRef = useRef(false);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const l1NodesRef = useRef<L1Node[]>([]);
  const l2NodesRef = useRef<L2Node[]>([]);
  const headlinesRef = useRef<DriftingHeadline[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });

  const l1Font = isMobile
    ? '600 10px Sora, system-ui, sans-serif'
    : '600 12px Sora, system-ui, sans-serif';
  const l2Font = isMobile
    ? '500 8px Sora, system-ui, sans-serif'
    : '500 9px Sora, system-ui, sans-serif';
  const centerFont = isMobile
    ? '700 14px Sora, system-ui, sans-serif'
    : '700 16px Sora, system-ui, sans-serif';
  const headlineFont = isMobile
    ? '400 10px Inter, system-ui, sans-serif'
    : '400 11px Inter, system-ui, sans-serif';

  const l1Data: ThoughtMapL1[] = isMobile ? THOUGHT_MAP_L1_MOBILE : THOUGHT_MAP_L1;
  const headlineCount = isMobile ? 4 : 10;

  useEffect(() => {
    document.fonts.ready.then(() => {
      // Build L1 nodes
      const l1Nodes: L1Node[] = l1Data.map((d) => ({
        label: d.label,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        radius: isMobile ? 20 : 28,
        color: d.color,
        glow: d.glow,
        breathePhase: Math.random() * Math.PI * 2,
        pulseProgress: Math.random(),
        pulseSpeed: 0.0003 + Math.random() * 0.0002,
      }));

      // Build L2 nodes with Pretext-measured widths
      const l2Nodes: L2Node[] = [];
      l1Data.forEach((d, parentIdx) => {
        d.children.forEach((child) => {
          const handle = prepare(child.label, l2Font);
          let lo = 0;
          let hi = 200;
          for (let j = 0; j < 14; j++) {
            const mid = (lo + hi) / 2;
            if (layout(handle, mid, 10).lineCount <= 1) hi = mid;
            else lo = mid;
          }
          l2Nodes.push({
            label: child.label,
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            radius: isMobile ? 8 : 12,
            parentIdx,
            color: d.color,
            glow: d.glow,
            driftPhaseX: Math.random() * Math.PI * 2,
            driftPhaseY: Math.random() * Math.PI * 2,
            opacity: 0.45,
            width: Math.ceil(hi) + 8,
          });
        });
      });

      // Build drifting headlines
      const headlines: DriftingHeadline[] = [];
      for (let i = 0; i < headlineCount; i++) {
        const def = SAMPLE_HEADLINES[i % SAMPLE_HEADLINES.length];
        const handle = prepare(def.text, headlineFont);
        let lo = 0;
        let hi = 700;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 14).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        const direction = def.sentiment === 'bearish' ? -1 : 1;
        const baseOpacity = 0.06 + Math.random() * 0.06;
        headlines.push({
          text: def.text,
          sentiment: def.sentiment,
          width: Math.ceil(hi) + 12,
          x: Math.random() * 2000 - 400,
          y: Math.random() * 800,
          speed: (0.1 + Math.random() * 0.2) * direction,
          opacity: baseOpacity,
          baseOpacity,
        });
      }

      l1NodesRef.current = l1Nodes;
      l2NodesRef.current = l2Nodes;
      headlinesRef.current = headlines;
      readyRef.current = true;
    });
  }, [l1Data, l2Font, headlineFont, headlineCount, isMobile]);

  // Position nodes relative to viewport center
  const positionNodes = useCallback(
    (w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const viewportRadius = Math.min(w, h) * 0.42;

      // L1 nodes at 35% of viewport radius
      l1NodesRef.current.forEach((node, i) => {
        const angle = l1Data[i].angle;
        const r = viewportRadius * 0.35;
        node.targetX = cx + Math.cos(angle) * r;
        node.targetY = cy + Math.sin(angle) * r;
        if (node.x === 0 && node.y === 0) {
          node.x = node.targetX;
          node.y = node.targetY;
        }
      });

      // L2 nodes clustered around their parent
      let l2Idx = 0;
      l1Data.forEach((d, parentIdx) => {
        const parent = l1NodesRef.current[parentIdx];
        const parentAngle = d.angle;
        d.children.forEach((child) => {
          const l2 = l2NodesRef.current[l2Idx];
          if (!l2) { l2Idx++; return; }
          const childAngle = parentAngle + child.angleOffset;
          const childDist = child.distance * (isMobile ? 0.6 : 1);
          l2.targetX = parent.targetX + Math.cos(childAngle) * childDist;
          l2.targetY = parent.targetY + Math.sin(childAngle) * childDist;
          if (l2.x === 0 && l2.y === 0) {
            l2.x = l2.targetX;
            l2.y = l2.targetY;
          }
          l2Idx++;
        });
      });

      // Spread drifting headlines across viewport
      headlinesRef.current.forEach((hl, i) => {
        hl.y = (h * 0.15) + ((i / headlinesRef.current.length) * h * 0.7);
      });
    },
    [l1Data, isMobile],
  );

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (!readyRef.current) return;

      if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
        sizeRef.current = { w, h };
        positionNodes(w, h);
      }

      const cx = w / 2;
      const cy = h / 2;
      const mouse = mouseRef.current;

      /* ── Layer 0: Sonar pulse from center ── */
      const sonar1 = (time % 4000) / 4000;
      const sonar2 = ((time + 2000) % 4000) / 4000;
      const maxSonar = Math.min(w, h) * 0.5;
      drawSonarPulse(ctx, cx, cy, maxSonar, sonar1, PULSE_CENTER.color);
      drawSonarPulse(ctx, cx, cy, maxSonar * 0.6, sonar2, PULSE_CENTER.color);

      /* ── Layer 1: Drifting headlines (cosmic debris) ── */
      headlinesRef.current.forEach((hl) => {
        // Check mouse proximity for reading lens
        let speedMult = 1;
        let opacityBoost = 0;
        if (mouse) {
          const d = dist(mouse.x, mouse.y, hl.x + hl.width / 2, hl.y);
          if (d < 100) {
            speedMult = 0.5;
            opacityBoost = (1 - d / 100) * 0.2;
          }
        }

        hl.x += hl.speed * speedMult;
        if (hl.speed > 0 && hl.x > w + 50) hl.x = -(hl.width + 50);
        else if (hl.speed < 0 && hl.x < -(hl.width + 50)) hl.x = w + 50;

        // Edge fade
        const edgeFade = hl.x < 80 ? hl.x / 80
          : hl.x + hl.width > w - 80 ? (w - hl.x - hl.width + 80) / 80
          : 1;
        const alpha = (hl.baseOpacity + opacityBoost) * Math.max(edgeFade, 0);
        if (alpha < 0.005) return;

        const color = SENTIMENT_COLORS[hl.sentiment];
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = headlineFont;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(hl.text, hl.x, hl.y);
        ctx.restore();
      });

      /* ── Layer 2: L2 → L1 connections ── */
      l2NodesRef.current.forEach((l2) => {
        const parent = l1NodesRef.current[l2.parentIdx];
        if (!parent) return;

        // Animate drift
        l2.x = l2.targetX + Math.sin(time * 0.0006 + l2.driftPhaseX) * 3;
        l2.y = l2.targetY + Math.cos(time * 0.0005 + l2.driftPhaseY) * 3;

        // Breathing base visibility (always partly visible)
        let connAlpha = 0.065 + Math.sin(time * 0.001 + l2.driftPhaseX * 0.7) * 0.015;
        let nodeOpacity = 0.45 + Math.sin(time * 0.0012 + l2.driftPhaseX) * 0.08;
        if (mouse) {
          const d = dist(mouse.x, mouse.y, l2.x, l2.y);
          if (d < 150) {
            const proximity = 1 - d / 150;
            connAlpha = lerp(connAlpha, 0.2, proximity);
            nodeOpacity = lerp(nodeOpacity, 0.85, proximity);
            // Gravitational pull toward cursor
            l2.x = lerp(l2.x, mouse.x, proximity * 0.08);
            l2.y = lerp(l2.y, mouse.y, proximity * 0.08);
          }
        }

        l2.opacity = l2.opacity + (nodeOpacity - l2.opacity) * 0.1;

        drawConnection(ctx, parent.x, parent.y, l2.x, l2.y, l2.color, connAlpha);
      });

      /* ── Layer 3: Center → L1 connections with data pulses ── */
      l1NodesRef.current.forEach((node) => {
        const curveOffset = 20 + Math.sin(node.breathePhase * 2) * 10;
        // Mouse proximity to L1 → illuminate connection
        let connAlpha = 0.06;
        if (mouse) {
          const d = dist(mouse.x, mouse.y, node.x, node.y);
          if (d < 200) connAlpha = lerp(0.06, 0.18, 1 - d / 200);
        }
        drawConnection(ctx, cx, cy, node.x, node.y, node.color, connAlpha, curveOffset);

        // Data pulse traveling center → L1
        node.pulseProgress = (node.pulseProgress + node.pulseSpeed * 16.67) % 1;
        drawDataPulse(ctx, cx, cy, node.x, node.y, node.pulseProgress, node.color, 2, curveOffset);
      });

      /* ── Layer 4: L2 micro-nodes ── */
      l2NodesRef.current.forEach((l2) => {
        drawGlowingNode(ctx, l2.x, l2.y, l2.radius, l2.color, l2.opacity, time * 0.002 + l2.driftPhaseX);

        // Label
        ctx.save();
        ctx.globalAlpha = l2.opacity;
        ctx.font = l2Font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = l2.color;
        ctx.fillText(l2.label, l2.x, l2.y);
        ctx.restore();
      });

      /* ── Layer 5: L1 nodes ── */
      l1NodesRef.current.forEach((node) => {
        // Animate toward target with drift
        const driftX = Math.sin(time * 0.0004 + node.breathePhase) * 6;
        const driftY = Math.cos(time * 0.0003 + node.breathePhase * 1.3) * 4;
        node.x += (node.targetX + driftX - node.x) * 0.03;
        node.y += (node.targetY + driftY - node.y) * 0.03;

        let intensity = 0.5;
        if (mouse) {
          const d = dist(mouse.x, mouse.y, node.x, node.y);
          if (d < 200) intensity = lerp(0.5, 1, 1 - d / 200);
        }

        drawGlowingNode(ctx, node.x, node.y, node.radius, node.color, intensity, time * 0.002 + node.breathePhase);

        // Label with glow
        ctx.save();
        ctx.font = l1Font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = node.glow;
        ctx.shadowBlur = 8;
        ctx.fillStyle = colorWithAlpha(node.color, 0.5 + intensity * 0.3);
        ctx.fillText(node.label, node.x, node.y);
        ctx.shadowBlur = 0;
        ctx.fillText(node.label, node.x, node.y);
        ctx.restore();
      });

      /* ── Layer 6: Central PULSE node ── */
      const centerRadius = isMobile ? PULSE_CENTER.radiusMobile : PULSE_CENTER.radiusDesktop;
      const centerBreath = Math.sin(time * 0.0015) * 3;

      drawGlowingNode(ctx, cx, cy, centerRadius + centerBreath, PULSE_CENTER.color, 0.8, time * 0.002);

      // Center label
      ctx.save();
      ctx.font = centerFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = PULSE_CENTER.glow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = PULSE_CENTER.color;
      ctx.fillText(PULSE_CENTER.label, cx, cy);
      ctx.shadowBlur = 0;
      ctx.fillText(PULSE_CENTER.label, cx, cy);
      ctx.restore();

      /* ── Mouse spotlight glow ── */
      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
        grad.addColorStop(0, 'rgba(110, 231, 183, 0.03)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [headlineFont, l1Font, l2Font, centerFont, positionNodes, isMobile],
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
