'use client';

/**
 * Globe Canvas — Pulse landing hero.
 *
 * Pure Canvas 2D orthographic projection with three visual layers:
 *   1. Landmass dot-matrix (~180 dots tracing continent shapes)
 *   2. 20 financial-centre dots with labels and headlines
 *   3. News-flow arcs with travelling data pulses
 *   4. Wireframe grid (lat/lon), sonar from Mumbai, mouse interaction
 *
 * No external dependencies — standard trig only.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '../pretext/PretextCanvas';
import { ParticleField } from '../shared/ParticleField';
import { useMobileDetect } from '../pretext/useMobileDetect';
import {
  drawGlowingNode,
  drawSonarPulse,
  colorWithAlpha,
  dist,
  lerp,
} from '../pretext/canvasEffects';
import {
  LANDMASS_DOTS,
  FINANCIAL_CENTERS,
  NEWS_ARCS,
  NEWS_ARCS_MOBILE,
  type FinancialCenter,
} from '../pretext/data/globeRegions';

/* ═══ Helpers ═══ */

const DEG2RAD = Math.PI / 180;

function project(
  lat: number,
  lon: number,
  cx: number,
  cy: number,
  R: number,
  rotLon: number,
): { x: number; y: number; visible: boolean; depth: number } {
  const latR = lat * DEG2RAD;
  const lonR = (lon + rotLon) * DEG2RAD;
  const cosLatCosLon = Math.cos(latR) * Math.cos(lonR);
  return {
    x: cx + R * Math.cos(latR) * Math.sin(lonR),
    y: cy - R * Math.sin(latR),
    visible: cosLatCosLon > 0,
    depth: cosLatCosLon, // 1 = dead center, 0 = edge, <0 = back
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

function cl01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/* ═══ Constants ═══ */

const EMERALD = 'rgba(110, 231, 183, 1)';
const GRID_COLOR = 'rgba(110, 231, 183, 1)';
const LAND_COLOR = 'rgba(110, 231, 183, 1)';

/* ═══ Types ═══ */

interface CityState {
  def: FinancialCenter;
  labelWidth: number;
  headlineTimer: number;
}

interface ArcPulse {
  arcIdx: number;
  t: number;
  speed: number;
}

/* ═══ Component ═══ */

export function GlobeCanvas() {
  const isMobile = useMobileDetect();
  const readyRef = useRef(false);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rotRef = useRef(20); // Atlantic view: Europe centre, US left, India right edge
  const citiesRef = useRef<CityState[]>([]);
  const pulsesRef = useRef<ArcPulse[]>([]);
  const startRef = useRef(0);

  const arcs = isMobile ? NEWS_ARCS_MOBILE : NEWS_ARCS;

  const labelFont = isMobile
    ? '600 8px Sora, system-ui, sans-serif'
    : '600 9px Sora, system-ui, sans-serif';
  const headlineFont = isMobile
    ? '400 7px Inter, system-ui, sans-serif'
    : '400 8px Inter, system-ui, sans-serif';

  useEffect(() => {
    document.fonts.ready.then(() => {
      const cities: CityState[] = FINANCIAL_CENTERS.map((def) => {
        const handle = prepare(def.short, labelFont);
        let lo = 0;
        let hi = 200;
        for (let j = 0; j < 14; j++) {
          const mid = (lo + hi) / 2;
          if (layout(handle, mid, 10).lineCount <= 1) hi = mid;
          else lo = mid;
        }
        return { def, labelWidth: Math.ceil(hi) + 4, headlineTimer: Math.random() * 4000 };
      });
      citiesRef.current = cities;
      readyRef.current = true;
      startRef.current = performance.now();
    });
  }, [labelFont]);

  const onMove = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);
  const onLeave = useCallback(() => {
    mouseRef.current = null;
  }, []);

  /* ═══ Draw ═══ */
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      if (!readyRef.current) return;
      if (!startRef.current) startRef.current = time;

      const elapsed = time - startRef.current;
      const mouse = mouseRef.current;
      const cities = citiesRef.current;

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * (isMobile ? 0.38 : 0.42);

      rotRef.current += isMobile ? 0.012 : 0.015;
      const rot = rotRef.current;

      const reveal = cl01(elapsed / 2000);

      /* ── L0: Globe atmosphere glow ── */
      if (reveal > 0) {
        // Inner tinted fill so the globe "disc" is visible against background
        const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
        innerGrad.addColorStop(0, colorWithAlpha(EMERALD, 0.025 * reveal));
        innerGrad.addColorStop(0.7, colorWithAlpha(EMERALD, 0.012 * reveal));
        innerGrad.addColorStop(1, colorWithAlpha(EMERALD, 0.005 * reveal));
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();

        // Outer atmosphere halo
        const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.3);
        atmoGrad.addColorStop(0, colorWithAlpha(EMERALD, 0.04 * reveal));
        atmoGrad.addColorStop(0.5, colorWithAlpha(EMERALD, 0.02 * reveal));
        atmoGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = atmoGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      /* ── L1: Globe outline ── */
      ctx.save();
      ctx.globalAlpha = 0.22 * reveal;
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      /* ── L2: Latitude lines ── */
      const latStep = isMobile ? 45 : 30;
      ctx.save();
      ctx.globalAlpha = 0.07 * reveal;
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.6;
      for (let lat = -60; lat <= 60; lat += latStep) {
        const latR = lat * DEG2RAD;
        const lineR = R * Math.cos(latR);
        const lineY = cy - R * Math.sin(latR);
        if (lineR > 1) {
          ctx.beginPath();
          ctx.ellipse(cx, lineY, lineR, Math.max(1, lineR * 0.12), 0, 0, Math.PI * 2);
          ctx.stroke();
        }
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
          const p = project(lat, lon, cx, cy, R, rot);
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

      /* ── L4: Landmass dot-matrix ── */
      const landReveal = cl01((elapsed - 300) / 1500);
      if (landReveal > 0) {
        LANDMASS_DOTS.forEach((dot) => {
          const p = project(dot[0], dot[1], cx, cy, R, rot);
          if (!p.visible) return;
          // Depth-based alpha: brighter at centre of visible hemisphere
          const depthAlpha = 0.12 + p.depth * 0.22;
          const dotSize = isMobile ? 1.2 : 1.8;
          ctx.save();
          ctx.globalAlpha = depthAlpha * landReveal;
          ctx.fillStyle = LAND_COLOR;
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      /* ── L5: News-flow arcs ── */
      const arcReveal = cl01((elapsed - 1000) / 1500);
      if (arcReveal > 0) {
        arcs.forEach(([fromIdx, toIdx]) => {
          const from = FINANCIAL_CENTERS[fromIdx];
          const to = FINANCIAL_CENTERS[toIdx];
          if (!from || !to) return;

          const pts = greatCirclePoints(from.lat, from.lon, to.lat, to.lon, 30);
          let arcAlpha = 0.14;

          // Mouse proximity boost
          if (mouse && !isMobile) {
            const pF = project(from.lat, from.lon, cx, cy, R, rot);
            const pT = project(to.lat, to.lon, cx, cy, R, rot);
            const dF = pF.visible ? dist(mouse.x, mouse.y, pF.x, pF.y) : 999;
            const dT = pT.visible ? dist(mouse.x, mouse.y, pT.x, pT.y) : 999;
            if (dF < 60 || dT < 60) arcAlpha = 0.35;
          }

          ctx.save();
          ctx.globalAlpha = arcAlpha * arcReveal;
          ctx.strokeStyle = colorWithAlpha(from.color, 0.8);
          ctx.lineWidth = 1;
          ctx.beginPath();
          let started = false;
          pts.forEach((pt) => {
            const p = project(pt.lat, pt.lon, cx, cy, R, rot);
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

      /* ── L6: Arc data pulses ── */
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
        const idx = Math.floor(p.t * (pts.length - 1));
        const pt = pts[Math.min(idx, pts.length - 1)];
        const proj = project(pt.lat, pt.lon, cx, cy, R, rot);

        if (proj.visible) {
          const fade = p.t < 0.1 ? p.t / 0.1 : p.t > 0.85 ? (1 - p.t) / 0.15 : 1;
          const col = from.color;

          const g = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, 8);
          g.addColorStop(0, colorWithAlpha(col, 0.5 * fade * arcReveal));
          g.addColorStop(0.5, colorWithAlpha(col, 0.15 * fade * arcReveal));
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.globalAlpha = 0.9 * fade * arcReveal;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        alivePulses.push(p);
      });
      pulsesRef.current = alivePulses;

      /* ── L7: Financial centre dots ── */
      const dotReveal = cl01((elapsed - 700) / 1200);
      if (dotReveal > 0) {
        cities.forEach((city, i) => {
          const p = project(city.def.lat, city.def.lon, cx, cy, R, rot);
          if (!p.visible && city.def.tier === 2) return; // skip backside tier-2

          // Glass-globe: tier-1 cities stay visible on the back side at reduced intensity
          let intensity: number;
          if (p.visible) {
            intensity = city.def.tier === 1 ? 0.8 : 0.5;
          } else {
            intensity = city.def.tier === 1 ? 0.15 : 0.04;
          }
          const dotR = city.def.tier === 1 ? (isMobile ? 6 : 9) : (isMobile ? 4 : 6);

          // Mouse proximity boost
          if (mouse && !isMobile && p.visible) {
            const d = dist(mouse.x, mouse.y, p.x, p.y);
            if (d < 60) intensity = lerp(intensity, 1, 1 - d / 60);
          }

          drawGlowingNode(
            ctx,
            p.x,
            p.y,
            Math.max(1, dotR * dotReveal),
            city.def.color,
            intensity * dotReveal,
            time * 0.002 + i,
          );

          // Label: tier-1 always (front = bright, back = dim), tier-2 on hover
          if (dotReveal < 0.5) return;
          const showLabel =
            city.def.tier === 1 ||
            (!isMobile && p.visible &&
              mouse &&
              dist(mouse.x, mouse.y, p.x, p.y) < 50);

          if (showLabel && !isMobile) {
            const labelAlpha = (dotReveal - 0.5) * 2 * Math.min(intensity * 1.2, 1);
            const labelSide = p.x > cx ? 1 : -1;
            const lx = p.x + labelSide * (dotR + 6);

            ctx.save();
            ctx.globalAlpha = labelAlpha;
            ctx.font = labelFont;
            ctx.textBaseline = 'middle';
            ctx.textAlign = labelSide > 0 ? 'left' : 'right';
            ctx.shadowColor = city.def.glow;
            ctx.shadowBlur = 4;
            ctx.fillStyle = colorWithAlpha(city.def.color, 0.85);
            ctx.fillText(city.def.tier === 1 ? city.def.name : city.def.short, lx, p.y);
            ctx.shadowBlur = 0;
            ctx.fillText(city.def.tier === 1 ? city.def.name : city.def.short, lx, p.y);

            // Cycling headline for tier 1
            if (city.def.tier === 1) {
              city.headlineTimer += 16.67;
              ctx.globalAlpha = labelAlpha * 0.55;
              ctx.font = headlineFont;
              ctx.shadowBlur = 0;
              ctx.fillStyle = 'rgba(255,255,255,0.55)';
              ctx.fillText(city.def.headline, lx, p.y + 10);
            }

            ctx.restore();
          }
        });
      }

      /* ── L8: Sonar from Mumbai (index 0) ── */
      if (dotReveal > 0.8) {
        const mumbai = project(
          FINANCIAL_CENTERS[0].lat,
          FINANCIAL_CENTERS[0].lon,
          cx, cy, R, rot,
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
      }

      /* ── Mouse spotlight ── */
      if (mouse) {
        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90);
        mg.addColorStop(0, 'rgba(110,231,183,0.04)');
        mg.addColorStop(1, 'transparent');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 90, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [isMobile, arcs, labelFont, headlineFont],
  );

  return (
    <PretextCanvas
      draw={draw}
      fallback={<ParticleField count={50} />}
      fps={isMobile ? 30 : 60}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    />
  );
}
