'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { ParticleField } from '../shared/ParticleField';
import { useMobileDetect } from '../pretext/useMobileDetect';
import {
  FOREX_PAIRS,
  FOREX_PAIRS_MOBILE,
  SESSION_COLORS,
  type ForexSession,
} from '../pretext/data/forexPairs';
import {
  CURRENCIES,
  CURRENCIES_MOBILE,
  TIER_RADIUS,
  TIER_RADIUS_MOBILE,
  TIER_RING,
  SESSION_RING_COLORS,
  type CurrencyNode as CurrencyDef,
} from '../pretext/data/currencies';
import {
  drawGlowingNode,
  drawConnection,
  drawOrbitalRing,
  drawSonarPulse,
  colorWithAlpha,
  dist,
} from '../pretext/canvasEffects';

/* ── Internal types ── */
interface CurrencyState {
  def: CurrencyDef;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  renderX: number;
  renderY: number;
  radius: number;
  breathePhase: number;
  opacity: number;
  labelWidth: number;
}

interface PairConnection {
  fromIdx: number;
  toIdx: number;
  session: ForexSession;
  strength: number;
  pulseProgress: number;
  pulseSpeed: number;
}

interface PriceParticle {
  connectionIdx: number;
  progress: number;
  speed: number;
  brightness: number;
}

export function ForexConstellationCanvas() {
  const isMobile = useMobileDetect();
  const readyRef = useRef(false);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredCurrencyRef = useRef<number>(-1);

  const currenciesRef = useRef<CurrencyState[]>([]);
  const connectionsRef = useRef<PairConnection[]>([]);
  const particlesRef = useRef<PriceParticle[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const orbitalRotRef = useRef({ asia: 0, london: 0, newyork: 0 });

  const currencyDefs = isMobile ? CURRENCIES_MOBILE : CURRENCIES;
  const pairDefs = isMobile ? FOREX_PAIRS_MOBILE : FOREX_PAIRS;
  const tierRadii = isMobile ? TIER_RADIUS_MOBILE : TIER_RADIUS;
  const particleCount = isMobile ? 12 : 30;

  const codeFont = isMobile
    ? '600 9px Sora, system-ui, sans-serif'
    : '600 11px Sora, system-ui, sans-serif';
  const sessionFont = '500 9px Sora, system-ui, sans-serif';
  const detailFont = '400 9px Inter, system-ui, sans-serif';

  useEffect(() => {
    document.fonts.ready.then(() => {
      // Build currency states
      const currencies: CurrencyState[] = currencyDefs.map((def) => {
        const handle = prepare(def.code, codeFont);
        let lo = 0;
        let hi = 100;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 12).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        return {
          def,
          x: 0, y: 0,
          targetX: 0, targetY: 0,
          renderX: 0, renderY: 0,
          radius: tierRadii[def.tier],
          breathePhase: Math.random() * Math.PI * 2,
          opacity: def.tier === 'major' ? 0.5 : def.tier === 'minor' ? 0.35 : 0.25,
          labelWidth: Math.ceil(hi) + 4,
        };
      });

      // Build pair connections (between currency nodes, not pairs)
      const codeToIdx = new Map<string, number>();
      currencies.forEach((c, i) => codeToIdx.set(c.def.code, i));

      const connections: PairConnection[] = [];
      pairDefs.forEach((p) => {
        const [base, quote] = p.pair.split('/');
        const fromIdx = codeToIdx.get(base);
        const toIdx = codeToIdx.get(quote);
        if (fromIdx !== undefined && toIdx !== undefined) {
          connections.push({
            fromIdx,
            toIdx,
            session: p.session,
            strength: 0.3 + Math.random() * 0.5,
            pulseProgress: Math.random(),
            pulseSpeed: 0.002 + Math.random() * 0.002,
          });
        }
      });

      // Build price stream particles
      const particles: PriceParticle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          connectionIdx: Math.floor(Math.random() * connections.length),
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
          brightness: 0.5 + Math.random() * 0.5,
        });
      }

      currenciesRef.current = currencies;
      connectionsRef.current = connections;
      particlesRef.current = particles;
      readyRef.current = true;
    });
  }, [currencyDefs, pairDefs, tierRadii, codeFont, particleCount]);

  // Position currencies in concentric rings
  const positionCurrencies = useCallback(
    (w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const viewportRadius = Math.min(w, h) * 0.42;
      const currencies = currenciesRef.current;

      // Group by tier
      const byTier: Record<string, number[]> = { major: [], minor: [], exotic: [] };
      currencies.forEach((c, i) => {
        if (c.def.code === 'USD') return; // USD goes to center
        byTier[c.def.tier].push(i);
      });

      // USD at center
      const usdIdx = currencies.findIndex((c) => c.def.code === 'USD');
      if (usdIdx >= 0) {
        currencies[usdIdx].targetX = cx;
        currencies[usdIdx].targetY = cy;
      }

      // Distribute each tier evenly around its ring
      (['major', 'minor', 'exotic'] as const).forEach((tier) => {
        const indices = byTier[tier];
        const ringRadius = viewportRadius * TIER_RING[tier];
        indices.forEach((idx, i) => {
          const angle = (i / indices.length) * Math.PI * 2 - Math.PI / 2;
          currencies[idx].targetX = cx + Math.cos(angle) * ringRadius;
          currencies[idx].targetY = cy + Math.sin(angle) * ringRadius;
        });
      });

      // Initialize positions if first layout
      currencies.forEach((c) => {
        if (c.x === 0 && c.y === 0) {
          c.x = c.targetX;
          c.y = c.targetY;
          c.renderX = c.x;
          c.renderY = c.y;
        }
      });
    },
    [],
  );

  const handleMouseMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null;
    hoveredCurrencyRef.current = -1;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (!readyRef.current) return;

      if (sizeRef.current.w !== w || sizeRef.current.h !== h) {
        sizeRef.current = { w, h };
        positionCurrencies(w, h);
      }

      const cx = w / 2;
      const cy = h / 2;
      const mouse = mouseRef.current;
      const currencies = currenciesRef.current;
      const connections = connectionsRef.current;
      const particles = particlesRef.current;
      const viewportRadius = Math.min(w, h) * 0.42;

      /* ── Layer 0: Session orbital rings (slowly rotating) ── */
      if (!isMobile) {
        const sessions: ForexSession[] = ['asia', 'london', 'newyork'];
        const ringRadii = [viewportRadius * 0.28, viewportRadius * 0.52, viewportRadius * 0.72];
        const tiltAngles = [-0.15, 0.1, -0.05];
        const speeds = [0.00008, 0.00006, 0.0001];

        sessions.forEach((session, i) => {
          orbitalRotRef.current[session] += speeds[i];
          drawOrbitalRing(
            ctx, cx, cy,
            ringRadii[i], ringRadii[i] * 0.55,
            orbitalRotRef.current[session] + tiltAngles[i],
            SESSION_RING_COLORS[session],
            0.05,
            [8, 12],
          );

          // Session label at rightmost point of ellipse
          const labelAngle = orbitalRotRef.current[session];
          const lx = cx + Math.cos(labelAngle) * ringRadii[i];
          const ly = cy + Math.sin(labelAngle) * ringRadii[i] * 0.55;
          ctx.save();
          ctx.font = sessionFont;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = colorWithAlpha(SESSION_RING_COLORS[session], 0.3);
          ctx.fillText(session === 'newyork' ? 'New York' : session === 'asia' ? 'Asia' : 'London', lx, ly - 4);
          ctx.restore();
        });
      }

      /* ── Animate currency positions (spring + drift) ── */
      currencies.forEach((c) => {
        const driftX = Math.sin(time * 0.0003 + c.breathePhase) * 4;
        const driftY = Math.cos(time * 0.00025 + c.breathePhase * 1.3) * 3;
        c.x += (c.targetX + driftX - c.x) * 0.03;
        c.y += (c.targetY + driftY - c.y) * 0.03;
        c.renderX = c.x;
        c.renderY = c.y;
      });

      /* ── Mouse gravitational lensing ── */
      let hoveredIdx = -1;
      if (mouse) {
        currencies.forEach((c, i) => {
          const d = dist(mouse.x, mouse.y, c.x, c.y);
          if (d < 250 && d > 1) {
            const force = ((250 - d) / 250) * 15;
            c.renderX = c.x + ((mouse.x - c.x) / d) * force;
            c.renderY = c.y + ((mouse.y - c.y) / d) * force;
          }
          if (d < 30) hoveredIdx = i;
        });
      }
      hoveredCurrencyRef.current = hoveredIdx;

      /* ── Layer 1: Pair connections ── */
      connections.forEach((conn) => {
        const from = currencies[conn.fromIdx];
        const to = currencies[conn.toIdx];
        if (!from || !to) return;

        // Illuminate if either endpoint is hovered
        const isHovered = hoveredIdx === conn.fromIdx || hoveredIdx === conn.toIdx;
        const alpha = isHovered ? 0.12 : 0.035;

        drawConnection(ctx, from.renderX, from.renderY, to.renderX, to.renderY,
          SESSION_COLORS[conn.session], alpha);
      });

      /* ── Layer 2: Price stream particles ── */
      particles.forEach((p) => {
        const conn = connections[p.connectionIdx];
        if (!conn) return;
        const from = currencies[conn.fromIdx];
        const to = currencies[conn.toIdx];
        if (!from || !to) return;

        // Speed up if on hovered connection
        const isOnHovered = hoveredIdx === conn.fromIdx || hoveredIdx === conn.toIdx;
        const speedMult = isOnHovered ? 2 : 1;
        p.progress += p.speed * speedMult;

        if (p.progress >= 1) {
          p.progress = 0;
          p.connectionIdx = Math.floor(Math.random() * connections.length);
          p.speed = 0.003 + Math.random() * 0.004;
        }

        const t = p.progress;
        const px = from.renderX + (to.renderX - from.renderX) * t;
        const py = from.renderY + (to.renderY - from.renderY) * t;

        // Glowing particle
        const baseAlpha = p.brightness * 0.5;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, 6);
        grad.addColorStop(0, colorWithAlpha(SESSION_COLORS[conn.session], baseAlpha));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colorWithAlpha(SESSION_COLORS[conn.session], baseAlpha + 0.3);
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      /* ── Layer 3: Currency nodes ── */
      currencies.forEach((c, i) => {
        const isHovered = i === hoveredIdx;
        const intensity = isHovered ? 0.9 : c.opacity;
        const sessionColor = SESSION_COLORS[c.def.session];

        drawGlowingNode(ctx, c.renderX, c.renderY, c.radius, sessionColor, intensity,
          time * 0.002 + c.breathePhase);

        // Currency code label
        ctx.save();
        ctx.font = codeFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = colorWithAlpha(sessionColor, 0.3);
        ctx.shadowBlur = isHovered ? 12 : 6;
        ctx.fillStyle = colorWithAlpha(sessionColor, isHovered ? 0.9 : 0.5 + c.opacity * 0.3);
        ctx.fillText(c.def.code, c.renderX, c.renderY);
        ctx.shadowBlur = 0;
        ctx.fillText(c.def.code, c.renderX, c.renderY);
        ctx.restore();
      });

      /* ── Layer 4: Hover detail tooltip ── */
      if (hoveredIdx >= 0 && !isMobile) {
        const hc = currencies[hoveredIdx];
        // Find connected pairs
        const connectedPairs: string[] = [];
        pairDefs.forEach((p) => {
          const [base, quote] = p.pair.split('/');
          if (base === hc.def.code || quote === hc.def.code) {
            connectedPairs.push(p.pair);
          }
        });

        const tooltipX = hc.renderX;
        let tooltipY = hc.renderY + hc.radius + 18;
        ctx.save();
        ctx.textAlign = 'center';

        // Currency name
        ctx.font = detailFont;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(hc.def.name, tooltipX, tooltipY);
        tooltipY += 14;

        // Connected pairs (max 6, wrapped in 2 rows of 3)
        ctx.font = '400 8px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        const shown = connectedPairs.slice(0, 6);
        const row1 = shown.slice(0, 3).join('  ');
        const row2 = shown.slice(3).join('  ');
        ctx.fillText(row1, tooltipX, tooltipY);
        if (row2) ctx.fillText(row2, tooltipX, tooltipY + 11);

        ctx.restore();
      }

      /* ── Center sonar pulse (USD anchor) ── */
      const sonar = (time % 5000) / 5000;
      drawSonarPulse(ctx, cx, cy, viewportRadius * 0.2, sonar, 'rgba(96, 165, 250, 0.5)');

      /* ── Mouse glow ── */
      if (mouse) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100);
        grad.addColorStop(0, 'rgba(96, 165, 250, 0.025)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [codeFont, sessionFont, detailFont, positionCurrencies, isMobile, pairDefs],
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
