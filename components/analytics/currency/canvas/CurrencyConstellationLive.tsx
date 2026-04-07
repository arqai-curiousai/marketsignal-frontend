'use client';

import { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import {
  drawGlowingNode,
  drawConnection,
  drawOrbitalRing,
  drawSonarPulse,
  drawDataPulse,
  colorWithAlpha,
  dist,
} from '@/components/landing/pretext/canvasEffects';
import { useForexData } from '../ForexDataProvider';
import { useForexCanvasData, type CanvasPairConnection } from './useForexCanvasData';
import {
  SESSION_COLORS,
  TIER_RING,
  FONT_CODE,
  FONT_CODE_MOBILE,
  FONT_VALUE_SM,
  FONT_LABEL,
  BREATHE_SPEED,
  SONAR_CYCLE_MS,
} from './canvasConstants';

/* ── Internal types ── */

interface NodeState {
  code: string;
  tier: 'major' | 'minor' | 'exotic';
  session: 'asia' | 'london' | 'newyork';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  renderX: number;
  renderY: number;
  radius: number;
  breathePhase: number;
  baseOpacity: number;
  labelWidth: number;
  strength1d: number;
  name: string;
}

interface ConnectionState {
  fromIdx: number;
  toIdx: number;
  pair: string;
  session: 'asia' | 'london' | 'newyork';
  changePct: number;
  price: number;
}

interface Particle {
  connIdx: number;
  progress: number;
  speed: number;
  brightness: number;
}

const SESSION_COLOR_MAP: Record<string, string> = {
  asia: SESSION_COLORS.asia,
  london: SESSION_COLORS.london,
  newyork: SESSION_COLORS.newyork,
};

const ORBITAL_SESSION_COLORS: Record<string, string> = {
  asia: 'rgba(110, 231, 183, 0.6)',
  london: 'rgba(96, 165, 250, 0.6)',
  newyork: 'rgba(251, 191, 36, 0.6)',
};

/* ── Component ── */

interface Props {
  onSelectPair: (pair: string) => void;
}

export function CurrencyConstellationLive({ onSelectPair }: Props) {
  const isMobile = useMobileDetect();
  const { overview, strength, marketClock } = useForexData();
  const canvasData = useForexCanvasData(overview, strength, marketClock, isMobile);

  const readyRef = useRef(false);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const clickRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredNodeRef = useRef(-1);
  const nodesRef = useRef<NodeState[]>([]);
  const connsRef = useRef<ConnectionState[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const orbRotRef = useRef({ asia: 0, london: 0, newyork: 0 });

  const codeFont = isMobile ? FONT_CODE_MOBILE : FONT_CODE;
  const particleCount = isMobile ? 15 : 35;

  // Rebuild canvas state when data changes
  useEffect(() => {
    document.fonts.ready.then(() => {
      const { nodes: dataNodes, connections: dataConns } = canvasData;

      // Build node states
      const codeToIdx = new Map<string, number>();
      const nodeStates: NodeState[] = dataNodes.map((n, i) => {
        codeToIdx.set(n.def.code, i);
        const handle = prepare(n.def.code, codeFont);
        let lo = 0;
        let hi = 100;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 12).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        // Scale radius by strength if data available
        const absStr = Math.abs(n.strength1d);
        const maxStr = canvasData.maxAbsStrength || 1;
        const strengthScale = 0.7 + (absStr / maxStr) * 0.6;

        return {
          code: n.def.code,
          tier: n.def.tier,
          session: n.def.session,
          x: 0, y: 0,
          targetX: 0, targetY: 0,
          renderX: 0, renderY: 0,
          radius: n.radius * strengthScale,
          breathePhase: Math.random() * Math.PI * 2,
          baseOpacity: n.def.tier === 'major' ? 0.5 : n.def.tier === 'minor' ? 0.35 : 0.25,
          labelWidth: Math.ceil(hi) + 4,
          strength1d: n.strength1d,
          name: n.def.name,
        };
      });

      // Build connection states
      const connStates: ConnectionState[] = [];
      dataConns.forEach(c => {
        const fromIdx = codeToIdx.get(c.fromCode);
        const toIdx = codeToIdx.get(c.toCode);
        if (fromIdx !== undefined && toIdx !== undefined) {
          connStates.push({
            fromIdx,
            toIdx,
            pair: c.pair,
            session: c.session,
            changePct: c.changePct,
            price: c.price,
          });
        }
      });

      // Particles
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          connIdx: Math.floor(Math.random() * Math.max(1, connStates.length)),
          progress: Math.random(),
          speed: 0.002 + Math.random() * 0.003,
          brightness: 0.4 + Math.random() * 0.6,
        });
      }

      nodesRef.current = nodeStates;
      connsRef.current = connStates;
      particlesRef.current = particles;
      readyRef.current = true;
      // Force re-layout
      sizeRef.current = { w: 0, h: 0 };
    });
  }, [canvasData, codeFont, particleCount]);

  // Position nodes in concentric rings
  const positionNodes = useCallback((w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const viewportR = Math.min(w, h) * 0.42;
    const nodes = nodesRef.current;

    const byTier: Record<string, number[]> = { major: [], minor: [], exotic: [] };
    nodes.forEach((n, i) => {
      if (n.code === 'USD') return;
      byTier[n.tier].push(i);
    });

    // USD center
    const usdIdx = nodes.findIndex(n => n.code === 'USD');
    if (usdIdx >= 0) {
      nodes[usdIdx].targetX = cx;
      nodes[usdIdx].targetY = cy;
    }

    (['major', 'minor', 'exotic'] as const).forEach(tier => {
      const indices = byTier[tier];
      const ringR = viewportR * TIER_RING[tier];
      indices.forEach((idx, i) => {
        const angle = (i / indices.length) * Math.PI * 2 - Math.PI / 2;
        nodes[idx].targetX = cx + Math.cos(angle) * ringR;
        nodes[idx].targetY = cy + Math.sin(angle) * ringR;
      });
    });

    // Initialize first time
    nodes.forEach(n => {
      if (n.x === 0 && n.y === 0) {
        n.x = n.targetX;
        n.y = n.targetY;
        n.renderX = n.x;
        n.renderY = n.y;
      }
    });
  }, []);

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredNodeRef.current = -1;
  }, []);

  const handleMouseDown = useCallback((x: number, y: number) => {
    clickRef.current = { x, y };
  }, []);

  const handleMouseUp = useCallback((x: number, y: number) => {
    const down = clickRef.current;
    clickRef.current = null;
    if (!down) return;
    // Only fire if click didn't drag
    if (Math.abs(x - down.x) > 5 || Math.abs(y - down.y) > 5) return;

    const nodes = nodesRef.current;
    const conns = connsRef.current;

    // Check node click
    for (let i = 0; i < nodes.length; i++) {
      if (dist(x, y, nodes[i].renderX, nodes[i].renderY) < 25) {
        // Find strongest pair for this currency
        let bestPair = '';
        let bestAbs = -1;
        for (const c of conns) {
          if (nodes[c.fromIdx].code === nodes[i].code || nodes[c.toIdx].code === nodes[i].code) {
            const a = Math.abs(c.changePct);
            if (a > bestAbs) { bestAbs = a; bestPair = c.pair; }
          }
        }
        if (bestPair) onSelectPair(bestPair);
        return;
      }
    }

    // Check connection click (within 8px of line)
    for (const c of conns) {
      const from = nodes[c.fromIdx];
      const to = nodes[c.toIdx];
      if (!from || !to) continue;
      const lineLen = dist(from.renderX, from.renderY, to.renderX, to.renderY);
      if (lineLen < 1) continue;
      // Point-to-line distance
      const dx = to.renderX - from.renderX;
      const dy = to.renderY - from.renderY;
      const t = Math.max(0, Math.min(1,
        ((x - from.renderX) * dx + (y - from.renderY) * dy) / (lineLen * lineLen),
      ));
      const projX = from.renderX + t * dx;
      const projY = from.renderY + t * dy;
      if (dist(x, y, projX, projY) < 8) {
        onSelectPair(c.pair);
        return;
      }
    }
  }, [onSelectPair]);

  // Draw callback
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
      const nodes = nodesRef.current;
      const conns = connsRef.current;
      const particles = particlesRef.current;
      const viewportR = Math.min(w, h) * 0.42;

      // Check which sessions are active
      const activeSessions = new Set<string>();
      for (const s of canvasData.sessions) {
        if (s.isActive) activeSessions.add(s.city.toLowerCase());
      }

      /* ── Layer 0: Orbital rings ── */
      if (!isMobile) {
        const sessions = ['asia', 'london', 'newyork'] as const;
        const ringRadii = [viewportR * 0.28, viewportR * 0.52, viewportR * 0.72];
        const tiltAngles = [-0.15, 0.1, -0.05];
        const speeds = [0.00008, 0.00006, 0.0001];

        sessions.forEach((session, i) => {
          orbRotRef.current[session] += speeds[i];
          const isActive = activeSessions.has(session === 'newyork' ? 'new york' : session);
          const alpha = isActive ? 0.08 : 0.03;

          drawOrbitalRing(
            ctx, cx, cy,
            ringRadii[i], ringRadii[i] * 0.55,
            orbRotRef.current[session] + tiltAngles[i],
            ORBITAL_SESSION_COLORS[session],
            alpha,
            [8, 12],
          );

          // Session label
          const labelAngle = orbRotRef.current[session];
          const lx = cx + Math.cos(labelAngle) * ringRadii[i];
          const ly = cy + Math.sin(labelAngle) * ringRadii[i] * 0.55;
          ctx.save();
          ctx.font = FONT_LABEL;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const labelAlpha = isActive ? 0.5 : 0.2;
          ctx.fillStyle = colorWithAlpha(SESSION_COLOR_MAP[session], labelAlpha);
          const label = session === 'newyork' ? 'New York' : session === 'asia' ? 'Asia' : 'London';
          ctx.fillText(label, lx, ly - 4);
          if (isActive) {
            ctx.fillStyle = colorWithAlpha(SESSION_COLOR_MAP[session], 0.15);
            ctx.font = '400 7px Inter, system-ui, sans-serif';
            ctx.fillText('ACTIVE', lx, ly + 6);
          }
          ctx.restore();
        });
      }

      /* ── Animate node positions ── */
      nodes.forEach(n => {
        const driftX = Math.sin(time * 0.0003 + n.breathePhase) * 4;
        const driftY = Math.cos(time * 0.00025 + n.breathePhase * 1.3) * 3;
        n.x += (n.targetX + driftX - n.x) * 0.03;
        n.y += (n.targetY + driftY - n.y) * 0.03;
        n.renderX = n.x;
        n.renderY = n.y;
      });

      /* ── Mouse gravitational lens ── */
      let hoveredIdx = -1;
      if (mouse) {
        nodes.forEach((n, i) => {
          const d = dist(mouse.x, mouse.y, n.x, n.y);
          if (d < 200 && d > 1) {
            const force = ((200 - d) / 200) * 12;
            n.renderX = n.x + ((mouse.x - n.x) / d) * force;
            n.renderY = n.y + ((mouse.y - n.y) / d) * force;
          }
          if (d < 30) hoveredIdx = i;
        });
      }
      hoveredNodeRef.current = hoveredIdx;

      /* ── Layer 1: Connections ── */
      conns.forEach(c => {
        const from = nodes[c.fromIdx];
        const to = nodes[c.toIdx];
        if (!from || !to) return;
        const isHovered = hoveredIdx === c.fromIdx || hoveredIdx === c.toIdx;
        const absChange = Math.abs(c.changePct);
        const maxChange = canvasData.maxAbsChange || 1;
        const changeAlpha = 0.02 + (absChange / maxChange) * 0.08;
        const alpha = isHovered ? 0.15 : changeAlpha;
        const color = c.changePct >= 0 ? 'rgba(96, 165, 250, 1)' : 'rgba(251, 146, 60, 1)';
        drawConnection(ctx, from.renderX, from.renderY, to.renderX, to.renderY, color, alpha);
      });

      /* ── Layer 2: Particles ── */
      particles.forEach(p => {
        if (conns.length === 0) return;
        const conn = conns[p.connIdx % conns.length];
        if (!conn) return;
        const from = nodes[conn.fromIdx];
        const to = nodes[conn.toIdx];
        if (!from || !to) return;

        const isOnHovered = hoveredIdx === conn.fromIdx || hoveredIdx === conn.toIdx;
        p.progress += p.speed * (isOnHovered ? 2.5 : 1);
        if (p.progress >= 1) {
          p.progress = 0;
          p.connIdx = Math.floor(Math.random() * conns.length);
          p.speed = 0.002 + Math.random() * 0.003;
        }

        const color = conn.changePct >= 0 ? 'rgba(96, 165, 250, 1)' : 'rgba(251, 146, 60, 1)';
        drawDataPulse(
          ctx, from.renderX, from.renderY, to.renderX, to.renderY,
          p.progress, color, 1.5,
        );
      });

      /* ── Layer 3: Nodes ── */
      nodes.forEach((n, i) => {
        const isHovered = i === hoveredIdx;
        const sessionColor = SESSION_COLOR_MAP[n.session] ?? SESSION_COLORS.asia;
        // Strength modulates intensity
        const maxStr = canvasData.maxAbsStrength || 1;
        const strIntensity = Math.abs(n.strength1d) / maxStr;
        const intensity = isHovered ? 0.9 : n.baseOpacity + strIntensity * 0.3;

        drawGlowingNode(ctx, n.renderX, n.renderY, n.radius, sessionColor, intensity,
          time * BREATHE_SPEED + n.breathePhase);

        // Currency code
        ctx.save();
        ctx.font = codeFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = colorWithAlpha(sessionColor, 0.3);
        ctx.shadowBlur = isHovered ? 12 : 6;
        ctx.fillStyle = colorWithAlpha(sessionColor, isHovered ? 0.9 : 0.5 + n.baseOpacity * 0.3);
        ctx.fillText(n.code, n.renderX, n.renderY);
        ctx.shadowBlur = 0;
        ctx.fillText(n.code, n.renderX, n.renderY);
        ctx.restore();
      });

      /* ── Layer 4: Hover tooltip ── */
      if (hoveredIdx >= 0 && !isMobile) {
        const hc = nodes[hoveredIdx];
        const tooltipX = hc.renderX;
        let tooltipY = hc.renderY + hc.radius + 18;

        ctx.save();
        ctx.textAlign = 'center';

        // Name
        ctx.font = FONT_VALUE_SM;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(hc.name, tooltipX, tooltipY);
        tooltipY += 13;

        // Strength
        const strColor = hc.strength1d >= 0 ? 'rgba(96, 165, 250, 0.8)' : 'rgba(251, 146, 60, 0.8)';
        ctx.fillStyle = strColor;
        ctx.font = '500 8px Inter, system-ui, sans-serif';
        ctx.fillText(
          `Strength: ${hc.strength1d >= 0 ? '+' : ''}${hc.strength1d.toFixed(1)}`,
          tooltipX, tooltipY,
        );
        tooltipY += 12;

        // Connected pairs
        ctx.font = '400 7px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        const connected: string[] = [];
        conns.forEach(c => {
          if (nodes[c.fromIdx].code === hc.code || nodes[c.toIdx].code === hc.code) {
            connected.push(c.pair);
          }
        });
        const shown = connected.slice(0, 6);
        ctx.fillText(shown.slice(0, 3).join('  '), tooltipX, tooltipY);
        if (shown.length > 3) {
          ctx.fillText(shown.slice(3).join('  '), tooltipX, tooltipY + 10);
        }

        ctx.restore();
      }

      /* ── Center sonar (USD) ── */
      const sonarT = (time % SONAR_CYCLE_MS) / SONAR_CYCLE_MS;
      drawSonarPulse(ctx, cx, cy, viewportR * 0.18, sonarT, 'rgba(96, 165, 250, 0.5)');

      /* ── Mouse glow ── */
      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        grad.addColorStop(0, 'rgba(96, 165, 250, 0.02)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [codeFont, positionNodes, isMobile, canvasData],
  );

  return (
    <PretextCanvas
      draw={draw}
      fallback={
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground/40">
          Currency Constellation
        </div>
      }
      fps={isMobile ? 30 : 60}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      cursor="crosshair"
    />
  );
}
