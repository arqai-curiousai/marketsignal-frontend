'use client';

/**
 * Globe Canvas — Pulse landing hero.
 *
 * Interactive Canvas 2D orthographic projection with:
 *   - Draggable rotation (mouse/touch) with momentum + auto-rotation resume
 *   - Scroll-to-zoom
 *   - Glass-globe effect (back hemisphere visible at reduced alpha)
 *   - Live news intelligence (cycling headlines, sentiment, breaking badges)
 *   - Ambient atmosphere particles
 *   - Full @chenglou/pretext usage for text measurement and truncation
 *
 * Visual layers:
 *   L0: Atmosphere glow + specular highlight
 *   L0.5: Ambient particles
 *   L1: Globe outline
 *   L2: Latitude lines
 *   L3: Longitude lines
 *   L4: Landmass dot-matrix (front + glass back)
 *   L4.5: Region labels on globe surface
 *   L5: News-flow arcs (front + glass back)
 *   L6: Arc data pulses with glow trails
 *   L7: Financial centre dots + labels + news headlines
 *   L7.5: Hover info card
 *   L8: Sonar from Mumbai + breaking news pulse rings
 *   L9: Mouse spotlight
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { ParticleField } from '../shared/ParticleField';
import { useMobileDetect } from '../pretext/useMobileDetect';
import {
  drawGlowingNode,
  drawSonarPulse,
  drawBreakingPulse,
  drawArcTrail,
  drawInfoCard,
  colorWithAlpha,
  dist,
  lerp,
  clamp01,
} from '../pretext/canvasEffects';
import {
  LANDMASS_DOTS,
  FINANCIAL_CENTERS,
  NEWS_ARCS,
  NEWS_ARCS_MOBILE,
  REGION_LABELS,
  type FinancialCenter,
} from '../pretext/data/globeRegions';
import { useGlobeNewsData } from './useGlobeNewsData';

/* ═══ Helpers ═══ */

const DEG2RAD = Math.PI / 180;
const TAU = Math.PI * 2;

function project(
  lat: number,
  lon: number,
  cx: number,
  cy: number,
  R: number,
  rotLon: number,
  rotLat: number,
): { x: number; y: number; visible: boolean; depth: number } {
  const latR = lat * DEG2RAD;
  const lonR = (lon + rotLon) * DEG2RAD;
  // 3D coordinates on unit sphere
  const x3 = Math.cos(latR) * Math.sin(lonR);
  const y3 = Math.sin(latR);
  const z3 = Math.cos(latR) * Math.cos(lonR);
  // Rotate around X-axis by rotLat (tilt)
  const tiltR = rotLat * DEG2RAD;
  const cosT = Math.cos(tiltR);
  const sinT = Math.sin(tiltR);
  const y3r = y3 * cosT - z3 * sinT;
  const z3r = y3 * sinT + z3 * cosT;
  return {
    x: cx + R * x3,
    y: cy - R * y3r,
    visible: z3r > 0,
    depth: z3r, // 1 = dead center, 0 = edge, <0 = back
  };
}

function greatCirclePoints(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  n: number,
): { lat: number; lon: number }[] {
  const la1 = lat1 * DEG2RAD;
  const lo1 = lon1 * DEG2RAD;
  const la2 = lat2 * DEG2RAD;
  const lo2 = lon2 * DEG2RAD;
  const d =
    Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          Math.sin(la1) * Math.sin(la2) +
            Math.cos(la1) * Math.cos(la2) * Math.cos(lo2 - lo1),
        ),
      ),
    ) || 0.001;
  const pts: { lat: number; lon: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
    const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
    const z = A * Math.sin(la1) + B * Math.sin(la2);
    pts.push({
      lat: Math.atan2(z, Math.sqrt(x * x + y * y)) / DEG2RAD,
      lon: Math.atan2(y, x) / DEG2RAD,
    });
  }
  return pts;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Desaturate a color toward slate-400 for back-hemisphere rendering */
function desaturate(color: string, amount: number): string {
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return color;
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  // Blend toward slate-400 (148, 163, 184)
  const dr = Math.round(r + (148 - r) * amount);
  const dg = Math.round(g + (163 - g) * amount);
  const db = Math.round(b + (184 - b) * amount);
  return `rgba(${dr}, ${dg}, ${db}, 1)`;
}

/* ═══ Constants ═══ */

const EMERALD = 'rgba(110, 231, 183, 1)';
const GRID_COLOR = 'rgba(110, 231, 183, 1)';
const LAND_COLOR = 'rgba(110, 231, 183, 1)';
const SENTIMENT_GREEN = 'rgba(16, 185, 129, 1)';
const SENTIMENT_RED = 'rgba(239, 68, 68, 1)';

/* ═══ Types ═══ */

interface CityState {
  def: FinancialCenter;
  labelWidth: number;
  headlineTimer: number;
  currentHeadlineIdx: number;
  hoverT: number; // 0-1 hover expansion
}

interface ArcPulse {
  arcIdx: number;
  t: number;
  speed: number;
}

interface AmbientParticle {
  angle: number;
  speed: number;
  orbitOffset: number;
  fadePhase: number;
  size: number;
}

interface DragState {
  isDragging: boolean;
  lastX: number;
  lastY: number;
  velLon: number;
  velLat: number;
  lastInteraction: number;
}

/* ═══ Component ═══ */

export function GlobeCanvas() {
  const isMobile = useMobileDetect();
  const readyRef = useRef(false);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rotRef = useRef(20); // Atlantic view
  const rotLatRef = useRef(0); // latitude tilt
  const zoomRef = useRef(1.0);
  const citiesRef = useRef<CityState[]>([]);
  const pulsesRef = useRef<ArcPulse[]>([]);
  const startRef = useRef(0);
  const cursorRef = useRef('grab');
  const hoveredCityRef = useRef(-1);

  // Drag state
  const dragRef = useRef<DragState>({
    isDragging: false,
    lastX: 0,
    lastY: 0,
    velLon: 0,
    velLat: 0,
    lastInteraction: 0,
  });

  // Ambient particles
  const ambientRef = useRef<AmbientParticle[]>([]);

  // Pretext handles for region labels
  const regionHandlesRef = useRef<{ name: string; width: number }[]>([]);

  // News data
  const { geoRef, headlinesRef } = useGlobeNewsData();

  const arcs = isMobile ? NEWS_ARCS_MOBILE : NEWS_ARCS;

  const labelFont = isMobile
    ? '600 8px Sora, system-ui, sans-serif'
    : '600 9px Sora, system-ui, sans-serif';
  const headlineFont = isMobile
    ? '400 7px Inter, system-ui, sans-serif'
    : '400 8px Inter, system-ui, sans-serif';
  const regionFont = '500 11px Inter, system-ui, sans-serif';

  // Initialize cities, ambient particles, and region labels
  useEffect(() => {
    document.fonts.ready.then(() => {
      // Cities
      const cities: CityState[] = FINANCIAL_CENTERS.map((def) => {
        const handle = prepare(def.short, labelFont);
        let lo = 0;
        let hi = 200;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 10).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        return {
          def,
          labelWidth: Math.ceil(hi) + 4,
          headlineTimer: Math.random() * 4000,
          currentHeadlineIdx: 0,
          hoverT: 0,
        };
      });
      citiesRef.current = cities;

      // Region label widths via pretext
      const regionLabels = REGION_LABELS.map((rl) => {
        const handle = prepare(rl.name, regionFont);
        let lo = 0;
        let hi = 200;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 12).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        return { name: rl.name, width: Math.ceil(hi) + 4 };
      });
      regionHandlesRef.current = regionLabels;

      // Ambient particles
      const particleCount = isMobile ? 12 : 30;
      const particles: AmbientParticle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          angle: Math.random() * TAU,
          speed: 0.0005 + Math.random() * 0.001,
          orbitOffset: 4 + Math.random() * 30,
          fadePhase: Math.random() * TAU,
          size: 0.4 + Math.random() * 0.6,
        });
      }
      ambientRef.current = particles;

      readyRef.current = true;
      startRef.current = performance.now();
    });
  }, [labelFont, isMobile]);

  /* ═══ Interaction callbacks ═══ */

  const onMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
    const drag = dragRef.current;
    if (drag.isDragging) {
      const dx = x - drag.lastX;
      const dy = y - drag.lastY;
      rotRef.current += dx * 0.3;
      rotLatRef.current = clamp(rotLatRef.current - dy * 0.2, -60, 60);
      drag.velLon = dx * 0.3;
      drag.velLat = -dy * 0.2;
      drag.lastX = x;
      drag.lastY = y;
    }
  }, []);

  const onLeave = useCallback(() => {
    mouseRef.current = null;
    const drag = dragRef.current;
    if (drag.isDragging) {
      drag.isDragging = false;
      cursorRef.current = 'grab';
    }
  }, []);

  const onDown = useCallback((x: number, y: number) => {
    const drag = dragRef.current;
    drag.isDragging = true;
    drag.lastX = x;
    drag.lastY = y;
    drag.velLon = 0;
    drag.velLat = 0;
    drag.lastInteraction = performance.now();
    cursorRef.current = 'grabbing';
  }, []);

  const onUp = useCallback(() => {
    const drag = dragRef.current;
    drag.isDragging = false;
    drag.lastInteraction = performance.now();
    cursorRef.current = 'grab';
  }, []);

  const onWheel = useCallback((deltaY: number) => {
    zoomRef.current = clamp(zoomRef.current - deltaY * 0.001, 0.7, 1.5);
    dragRef.current.lastInteraction = performance.now();
  }, []);

  /* ═══ Draw ═══ */
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      /* ── Helpers that read from stable refs ── */
      function getRegionSentiment(region: string): { avg: number; articles: number; breaking: number } {
        const geo = geoRef.current.find((g) => g.region === region);
        if (!geo) return { avg: 0, articles: 0, breaking: 0 };
        return { avg: geo.avg_sentiment, articles: geo.article_count, breaking: geo.breaking_count };
      }

      function getCyclingHeadline(region: string, t: number, fallback: string): string {
        const headlines = headlinesRef.current.get(region);
        if (!headlines || headlines.length === 0) return fallback;
        const idx = Math.floor(t / 4000) % headlines.length;
        return headlines[idx];
      }

      if (!readyRef.current) return;
      if (!startRef.current) startRef.current = time;

      const elapsed = time - startRef.current;
      const mouse = mouseRef.current;
      const cities = citiesRef.current;
      const drag = dragRef.current;

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * (isMobile ? 0.38 : 0.42) * zoomRef.current;

      /* ── Rotation: drag / momentum / auto ── */
      const now = performance.now();
      if (!drag.isDragging) {
        // Momentum decay
        drag.velLon *= 0.95;
        drag.velLat *= 0.95;
        rotRef.current += drag.velLon;
        rotLatRef.current = clamp(rotLatRef.current + drag.velLat, -60, 60);

        // Kill tiny velocities
        if (Math.abs(drag.velLon) < 0.001) drag.velLon = 0;
        if (Math.abs(drag.velLat) < 0.001) drag.velLat = 0;

        // Resume auto-rotation after 3.5s idle
        const idle = now - drag.lastInteraction;
        if (idle > 3500) {
          const autoSpeed = isMobile ? 0.012 : 0.015;
          const resumeFactor = clamp01((idle - 3500) / 2000);
          rotRef.current += autoSpeed * resumeFactor;
        }
      }

      const rot = rotRef.current;
      const rotLat = rotLatRef.current;
      const reveal = clamp01(elapsed / 2000);

      /* ── L0: Globe atmosphere glow ── */
      if (reveal > 0) {
        // Inner tinted fill
        const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        innerGrad.addColorStop(0, colorWithAlpha(EMERALD, 0.025 * reveal));
        innerGrad.addColorStop(0.7, colorWithAlpha(EMERALD, 0.012 * reveal));
        innerGrad.addColorStop(1, colorWithAlpha(EMERALD, 0.005 * reveal));
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, TAU);
        ctx.fill();

        // Outer atmosphere halo
        const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.3);
        atmoGrad.addColorStop(0, colorWithAlpha(EMERALD, 0.04 * reveal));
        atmoGrad.addColorStop(0.5, colorWithAlpha(EMERALD, 0.02 * reveal));
        atmoGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = atmoGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.3, 0, TAU);
        ctx.fill();

        // Glass specular highlight (top-left)
        const specX = cx - R * 0.3;
        const specY = cy - R * 0.3;
        const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, R * 0.5);
        specGrad.addColorStop(0, `rgba(255, 255, 255, ${0.04 * reveal})`);
        specGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.012 * reveal})`);
        specGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = specGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, TAU);
        ctx.fill();
      }

      /* ── L0.5: Ambient atmosphere particles ── */
      if (reveal > 0.3) {
        const particles = ambientRef.current;
        const pReveal = clamp01((reveal - 0.3) / 0.7);
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.angle += p.speed;
          p.fadePhase += 0.002;
          const r = R + p.orbitOffset;
          const px = cx + r * Math.cos(p.angle);
          const py = cy + r * Math.sin(p.angle);
          const alpha = 0.15 * Math.max(0, Math.sin(p.fadePhase)) * pReveal;
          if (alpha < 0.01) continue;
          ctx.fillStyle = colorWithAlpha(EMERALD, alpha);
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, TAU);
          ctx.fill();
        }
      }

      /* ── L1: Globe outline ── */
      ctx.save();
      ctx.globalAlpha = 0.22 * reveal;
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
      ctx.restore();

      /* ── L2: Latitude lines ── */
      const latStep = isMobile ? 45 : 30;
      ctx.save();
      ctx.globalAlpha = 0.07 * reveal;
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.6;
      for (let lat = -60; lat <= 60; lat += latStep) {
        // Draw full lat circle using projection points
        ctx.beginPath();
        let started = false;
        for (let lon = 0; lon <= 360; lon += 5) {
          const p = project(lat, lon, cx, cy, R, rot, rotLat);
          if (p.visible) {
            if (!started) { ctx.moveTo(p.x, p.y); started = true; }
            else ctx.lineTo(p.x, p.y);
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }
      ctx.restore();

      /* ── L3: Longitude lines ── */
      const lonStep = isMobile ? 60 : 30;
      ctx.save();
      ctx.globalAlpha = 0.06 * reveal;
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.6;
      for (let lon = 0; lon < 360; lon += lonStep) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = project(lat, lon, cx, cy, R, rot, rotLat);
          if (p.visible) {
            if (!started) { ctx.moveTo(p.x, p.y); started = true; }
            else ctx.lineTo(p.x, p.y);
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }
      ctx.restore();

      /* ── L4: Landmass dot-matrix (front + glass back) ── */
      const landReveal = clamp01((elapsed - 300) / 1500);
      if (landReveal > 0) {
        LANDMASS_DOTS.forEach((dot) => {
          const p = project(dot[0], dot[1], cx, cy, R, rot, rotLat);
          let alpha: number;
          let dotSize: number;
          let dotColor: string;

          if (p.visible) {
            // Front hemisphere: depth-based brightness
            const depthFactor = 0.7 + p.depth * 0.3; // 0.7 at edge → 1.0 at center
            alpha = (0.12 + p.depth * 0.22) * landReveal;
            dotSize = (isMobile ? 1.2 : 1.8) * depthFactor;
            dotColor = LAND_COLOR;
          } else {
            // Glass back hemisphere: dimmer, smaller, desaturated
            const absDepth = Math.abs(p.depth);
            alpha = (0.04 + absDepth * 0.06) * landReveal;
            dotSize = (isMobile ? 0.8 : 1.3) * (0.6 + absDepth * 0.2);
            dotColor = desaturate(LAND_COLOR, 0.4);
          }

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = dotColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotSize, 0, TAU);
          ctx.fill();
          ctx.restore();
        });
      }

      /* ── L4.5: Region labels on globe surface ── */
      if (landReveal > 0.5 && !isMobile) {
        const regionLabels = regionHandlesRef.current;
        REGION_LABELS.forEach((rl, i) => {
          const p = project(rl.lat, rl.lon, cx, cy, R, rot, rotLat);
          const labelData = regionLabels[i];
          if (!labelData) return;

          const alpha = p.visible
            ? 0.08 * landReveal * (0.5 + p.depth * 0.5)
            : 0.025 * landReveal;

          if (alpha < 0.01) return;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = regionFont;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.fillText(rl.name, p.x, p.y);
          ctx.restore();
        });
      }

      /* ── L5: News-flow arcs (front + glass back) ── */
      const arcReveal = clamp01((elapsed - 1000) / 1500);
      if (arcReveal > 0) {
        arcs.forEach(([fromIdx, toIdx]) => {
          const from = FINANCIAL_CENTERS[fromIdx];
          const to = FINANCIAL_CENTERS[toIdx];
          if (!from || !to) return;

          const pts = greatCirclePoints(from.lat, from.lon, to.lat, to.lon, 30);

          // Determine sentiment color for arc
          const regionSent = getRegionSentiment(from.region);
          let arcColor = from.color;
          if (regionSent.avg > 0.15) arcColor = SENTIMENT_GREEN;
          else if (regionSent.avg < -0.15) arcColor = SENTIMENT_RED;

          let baseAlpha = 0.14;

          // Mouse proximity boost
          if (mouse && !isMobile) {
            const pF = project(from.lat, from.lon, cx, cy, R, rot, rotLat);
            const pT = project(to.lat, to.lon, cx, cy, R, rot, rotLat);
            const dF = pF.visible ? dist(mouse.x, mouse.y, pF.x, pF.y) : 999;
            const dT = pT.visible ? dist(mouse.x, mouse.y, pT.x, pT.y) : 999;
            if (dF < 60 || dT < 60) baseAlpha = 0.35;
          }

          // Draw arc — front segments bright, back segments dim
          ctx.save();
          ctx.lineWidth = 1;

          // Back hemisphere pass (glass effect)
          ctx.globalAlpha = baseAlpha * 0.2 * arcReveal;
          ctx.strokeStyle = colorWithAlpha(desaturate(arcColor, 0.3), 0.6);
          ctx.beginPath();
          let started = false;
          pts.forEach((pt) => {
            const p = project(pt.lat, pt.lon, cx, cy, R, rot, rotLat);
            if (!p.visible) {
              if (!started) { ctx.moveTo(p.x, p.y); started = true; }
              else ctx.lineTo(p.x, p.y);
            } else {
              started = false;
            }
          });
          ctx.stroke();

          // Front hemisphere pass
          ctx.globalAlpha = baseAlpha * arcReveal;
          ctx.strokeStyle = colorWithAlpha(arcColor, 0.8);
          ctx.beginPath();
          started = false;
          pts.forEach((pt) => {
            const p = project(pt.lat, pt.lon, cx, cy, R, rot, rotLat);
            if (p.visible) {
              if (!started) { ctx.moveTo(p.x, p.y); started = true; }
              else ctx.lineTo(p.x, p.y);
            } else {
              started = false;
            }
          });
          ctx.stroke();
          ctx.restore();
        });
      }

      /* ── L6: Arc data pulses with glow trails ── */
      if (arcReveal > 0.4 && Math.random() < (isMobile ? 0.02 : 0.035)) {
        pulsesRef.current.push({
          arcIdx: Math.floor(Math.random() * arcs.length),
          t: 0,
          speed: 0.004 + Math.random() * 0.004,
        });
        if (pulsesRef.current.length > (isMobile ? 5 : 12)) pulsesRef.current.shift();
      }

      const alivePulses: ArcPulse[] = [];
      pulsesRef.current.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) return;

        const [fromIdx, toIdx] = arcs[p.arcIdx] ?? [0, 1];
        const from = FINANCIAL_CENTERS[fromIdx];
        const to = FINANCIAL_CENTERS[toIdx];
        if (!from || !to) return;

        const pts = greatCirclePoints(from.lat, from.lon, to.lat, to.lon, 30);

        // Determine pulse color based on region sentiment
        const regionSent = getRegionSentiment(from.region);
        let pulseColor = from.color;
        if (regionSent.avg > 0.15) pulseColor = SENTIMENT_GREEN;
        else if (regionSent.avg < -0.15) pulseColor = SENTIMENT_RED;

        const idx = Math.floor(p.t * (pts.length - 1));
        const pt = pts[Math.min(idx, pts.length - 1)];
        const proj = project(pt.lat, pt.lon, cx, cy, R, rot, rotLat);

        if (proj.visible) {
          const fade = p.t < 0.1 ? p.t / 0.1 : p.t > 0.85 ? (1 - p.t) / 0.15 : 1;

          // Glow trail (behind the pulse)
          if (!isMobile) {
            const trailPts = pts.map((tp) => project(tp.lat, tp.lon, cx, cy, R, rot, rotLat));
            drawArcTrail(ctx, trailPts, p.t, pulseColor);
          }

          // Main glow
          const g = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, 8);
          g.addColorStop(0, colorWithAlpha(pulseColor, 0.5 * fade * arcReveal));
          g.addColorStop(0.5, colorWithAlpha(pulseColor, 0.15 * fade * arcReveal));
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 8, 0, TAU);
          ctx.fill();

          // Bright core
          ctx.save();
          ctx.globalAlpha = 0.9 * fade * arcReveal;
          ctx.fillStyle = pulseColor;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 1.8, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        alivePulses.push(p);
      });
      pulsesRef.current = alivePulses;

      /* ── L7: Financial centre dots + labels + headlines ── */
      const dotReveal = clamp01((elapsed - 700) / 1200);
      let newHoveredCity = -1;

      if (dotReveal > 0) {
        cities.forEach((city, i) => {
          const p = project(city.def.lat, city.def.lon, cx, cy, R, rot, rotLat);

          // Glass globe: all cities visible, back hemisphere at reduced intensity
          let intensity: number;
          if (p.visible) {
            intensity = city.def.tier === 1 ? 0.8 : 0.5;
          } else {
            intensity = city.def.tier === 1 ? 0.15 : 0.06;
          }

          // Hover expansion
          const isHovered =
            mouse &&
            !isMobile &&
            p.visible &&
            dist(mouse.x, mouse.y, p.x, p.y) < 50;
          if (isHovered) {
            city.hoverT = Math.min(1, city.hoverT + 0.06);
            newHoveredCity = i;
          } else {
            city.hoverT = Math.max(0, city.hoverT - 0.04);
          }

          const baseR = city.def.tier === 1 ? (isMobile ? 6 : 9) : (isMobile ? 4 : 6);
          const hoverScale = 1 + city.hoverT * 0.5;
          const dotR = baseR * hoverScale;

          // Depth-based size modulation
          const depthSize = p.visible ? (0.7 + p.depth * 0.3) : 0.6;

          // Mouse proximity boost (front hemisphere only)
          if (mouse && !isMobile && p.visible) {
            const d = dist(mouse.x, mouse.y, p.x, p.y);
            if (d < 60) intensity = lerp(intensity, 1, 1 - d / 60);
          }

          drawGlowingNode(
            ctx,
            p.x,
            p.y,
            Math.max(1, dotR * depthSize * dotReveal),
            p.visible ? city.def.color : desaturate(city.def.color, 0.4),
            intensity * dotReveal,
            time * 0.002 + i,
          );

          // Labels
          if (dotReveal < 0.5) return;

          const showLabel =
            city.def.tier === 1 ||
            (!isMobile && p.visible && isHovered);

          // Back hemisphere: show short code for all tier-1 cities
          const showBackLabel = !p.visible && city.def.tier === 1 && !isMobile;

          if (showBackLabel) {
            const labelAlpha = 0.12 * dotReveal;
            const labelSide = p.x > cx ? 1 : -1;
            const lx = p.x + labelSide * (dotR * depthSize + 6);

            ctx.save();
            ctx.globalAlpha = labelAlpha;
            ctx.font = labelFont;
            ctx.textBaseline = 'middle';
            ctx.textAlign = labelSide > 0 ? 'left' : 'right';
            ctx.fillStyle = desaturate(city.def.color, 0.5);
            ctx.fillText(city.def.short, lx, p.y);
            ctx.restore();
            return;
          }

          if (showLabel && !isMobile) {
            const labelAlpha = (dotReveal - 0.5) * 2 * Math.min(intensity * 1.2, 1);
            const labelSide = p.x > cx ? 1 : -1;
            const lx = p.x + labelSide * (dotR * depthSize + 6);

            // Region sentiment data
            const regionSent = getRegionSentiment(city.def.region);
            const headline = getCyclingHeadline(city.def.region, time, city.def.headline);

            ctx.save();
            ctx.globalAlpha = labelAlpha;
            ctx.font = labelFont;
            ctx.textBaseline = 'middle';
            ctx.textAlign = labelSide > 0 ? 'left' : 'right';

            // City name with glow
            ctx.shadowColor = city.def.glow;
            ctx.shadowBlur = 4;
            ctx.fillStyle = colorWithAlpha(city.def.color, 0.85);
            const displayName = city.def.tier === 1 ? city.def.name : city.def.short;
            ctx.fillText(displayName, lx, p.y);
            ctx.shadowBlur = 0;
            ctx.fillText(displayName, lx, p.y);

            // Sentiment dot next to name
            if (regionSent.articles > 0) {
              const nameW = ctx.measureText(displayName).width;
              const dotX = labelSide > 0 ? lx + nameW + 6 : lx - nameW - 6;
              const sentColor =
                regionSent.avg > 0.15
                  ? SENTIMENT_GREEN
                  : regionSent.avg < -0.15
                    ? SENTIMENT_RED
                    : 'rgba(148, 163, 184, 1)';
              ctx.fillStyle = sentColor;
              ctx.beginPath();
              ctx.arc(dotX, p.y, 2.5, 0, TAU);
              ctx.fill();
            }

            // Cycling headline for tier-1
            if (city.def.tier === 1) {
              city.headlineTimer += 16.67;

              // Crossfade logic
              const cyclePeriod = 4000;
              const fadeWindow = 400;
              const phase = time % cyclePeriod;
              const headlineAlpha =
                phase < fadeWindow
                  ? phase / fadeWindow
                  : phase > cyclePeriod - fadeWindow
                    ? (cyclePeriod - phase) / fadeWindow
                    : 1;

              ctx.globalAlpha = labelAlpha * 0.55 * headlineAlpha;
              ctx.font = headlineFont;
              ctx.shadowBlur = 0;
              ctx.fillStyle = 'rgba(255,255,255,0.55)';

              // Truncate headline to available width using canvas measureText
              const maxHW = 140;
              let displayHeadline = headline;
              if (ctx.measureText(displayHeadline).width > maxHW) {
                while (
                  displayHeadline.length > 0 &&
                  ctx.measureText(displayHeadline + '\u2026').width > maxHW
                ) {
                  displayHeadline = displayHeadline.slice(0, -1);
                }
                displayHeadline += '\u2026';
              }
              ctx.fillText(displayHeadline, lx, p.y + 11);

              // Article count
              if (regionSent.articles > 0) {
                ctx.globalAlpha = labelAlpha * 0.35;
                ctx.font = '400 7px Inter, system-ui, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.fillText(`${regionSent.articles} stories`, lx, p.y + 22);
              }
            }

            ctx.restore();
          }
        });
      }

      hoveredCityRef.current = newHoveredCity;

      /* ── L7.5: Hover info card (desktop only) ── */
      if (newHoveredCity >= 0 && !isMobile) {
        const city = cities[newHoveredCity];
        if (city && city.hoverT > 0.3) {
          const p = project(city.def.lat, city.def.lon, cx, cy, R, rot, rotLat);
          if (p.visible) {
            const regionSent = getRegionSentiment(city.def.region);
            const headline = getCyclingHeadline(city.def.region, time, city.def.headline);
            const labelSide: 1 | -1 = p.x > cx ? 1 : -1;

            ctx.save();
            ctx.globalAlpha = clamp01(city.hoverT * 2 - 0.6);
            drawInfoCard(
              ctx,
              p.x,
              p.y,
              city.def.name,
              headline,
              regionSent.avg,
              regionSent.articles,
              regionSent.breaking,
              labelSide,
              time,
            );
            ctx.restore();
          }
        }
      }

      /* ── L8: Sonar from Mumbai (index 0) + breaking news pulse rings ── */
      if (dotReveal > 0.8) {
        // Mumbai emerald sonar (always)
        const mumbai = project(
          FINANCIAL_CENTERS[0].lat,
          FINANCIAL_CENTERS[0].lon,
          cx, cy, R, rot, rotLat,
        );
        if (mumbai.visible) {
          const sa = (dotReveal - 0.8) * 5;
          ctx.save();
          ctx.globalAlpha = sa;
          const sr = isMobile ? 25 : 40;
          drawSonarPulse(ctx, mumbai.x, mumbai.y, sr, (time % 3500) / 3500, EMERALD);
          drawSonarPulse(ctx, mumbai.x, mumbai.y, sr * 0.6, ((time + 1750) % 3500) / 3500, EMERALD);
          ctx.restore();
        }

        // Breaking news red pulses for any city with breaking_count > 0
        cities.forEach((city) => {
          const regionSent = getRegionSentiment(city.def.region);
          if (regionSent.breaking <= 0) return;

          const p = project(city.def.lat, city.def.lon, cx, cy, R, rot, rotLat);
          if (!p.visible) return;

          const ba = (dotReveal - 0.8) * 5;
          ctx.save();
          ctx.globalAlpha = ba * 0.7;
          const br = city.def.tier === 1 ? (isMobile ? 20 : 30) : (isMobile ? 14 : 22);
          drawBreakingPulse(ctx, p.x, p.y, br, (time % 2000) / 2000);
          drawBreakingPulse(ctx, p.x, p.y, br * 0.6, ((time + 1000) % 2000) / 2000);
          ctx.restore();
        });
      }

      /* ── L9: Mouse spotlight ── */
      if (mouse) {
        // Main spotlight
        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120);
        mg.addColorStop(0, 'rgba(110,231,183,0.04)');
        mg.addColorStop(1, 'transparent');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 120, 0, TAU);
        ctx.fill();

        // Subtle concentric ring
        ctx.strokeStyle = 'rgba(110,231,183,0.03)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 60, 0, TAU);
        ctx.stroke();
      }
    },
    [isMobile, arcs, labelFont, headlineFont, regionFont, geoRef, headlinesRef],
  );

  return (
    <PretextCanvas
      draw={draw}
      fallback={<ParticleField count={50} />}
      fps={isMobile ? 30 : 60}
      cursor={cursorRef.current}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onWheel={onWheel}
    />
  );
}
