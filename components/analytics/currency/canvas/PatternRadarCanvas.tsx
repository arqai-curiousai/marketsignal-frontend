'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { prepare, layout } from '@chenglou/pretext';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import {
  drawGlowingNode,
  drawSonarPulse,
  colorWithAlpha,
} from '@/components/landing/pretext/canvasEffects';
import { getForexPatternScanner } from '@/src/lib/api/analyticsApi';
import type { IScannerResult, IScannerStockResult } from '@/src/types/analytics';
import { PAIR_CATEGORY_LABELS, FOREX_PAIR_CATEGORIES } from '../constants';
import {
  BULLISH_COLOR,
  BEARISH_COLOR,
  NEUTRAL_COLOR,
  FONT_VALUE_SM,
  FONT_CODE_SM,
  RADAR_CATEGORIES,
  SONAR_CYCLE_MS,
} from './canvasConstants';

/* ── Category angle mapping ── */

const CATEGORY_ANGLE: Record<string, number> = {};
RADAR_CATEGORIES.forEach((cat, i) => {
  CATEGORY_ANGLE[cat] = (i / RADAR_CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
});

function getCategoryAngle(pair: string): number {
  const label = PAIR_CATEGORY_LABELS[pair] ?? 'Other';
  // Fuzzy match
  for (const [cat, angle] of Object.entries(CATEGORY_ANGLE)) {
    if (label.toLowerCase().includes(cat.toLowerCase().replace(/[- ]/g, ''))) return angle;
    if (cat.toLowerCase().includes(label.toLowerCase().split(' ')[0])) return angle;
  }
  // Default by pair structure
  if (FOREX_PAIR_CATEGORIES.majors.includes(pair as never)) return CATEGORY_ANGLE['Majors'] ?? 0;
  if (FOREX_PAIR_CATEGORIES.inr.includes(pair as never)) return CATEGORY_ANGLE['INR'] ?? Math.PI / 4;
  return Math.random() * Math.PI * 2;
}

/* ── Blip type ── */

interface RadarBlip {
  pair: string;
  angle: number;
  distance: number; // 0-1, quality score
  color: string;
  signal: string;
  grade: string;
  patternCount: number;
  fadeIn: number; // 0-1
  labelWidth: number;
}

interface Props {
  onSelectPair: (pair: string) => void;
}

export function PatternRadarCanvas({ onSelectPair }: Props) {
  const isMobile = useMobileDetect();
  const [scanData, setScanData] = useState<IScannerResult | null>(null);
  const blipsRef = useRef<RadarBlip[]>([]);
  const beamAngleRef = useRef(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const hoveredBlipRef = useRef(-1);
  const builtForRef = useRef('');

  // Fetch scanner data
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await getForexPatternScanner();
        if (!cancelled && res.success) setScanData(res.data);
      } catch { /* silent */ }
    };
    fetch();
    // Refresh every 5 min
    const timer = setInterval(fetch, 300_000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const buildBlips = useCallback(() => {
    if (!scanData) return;
    const key = scanData.scanned_at ?? '';
    if (key === builtForRef.current) return;
    builtForRef.current = key;

    const blips: RadarBlip[] = [];
    const stocks: IScannerStockResult[] = scanData.results ?? [];

    for (const stock of stocks) {
      if (stock.pattern_count === 0) continue;

      const gradeMap: Record<string, number> = { 'A+': 0.95, 'A': 0.75, 'B': 0.5, 'C': 0.3 };
      const distance = 1 - (gradeMap[stock.overall_grade] ?? 0.3); // Better quality = closer to center

      const colorMap = {
        bullish: BULLISH_COLOR,
        bearish: BEARISH_COLOR,
        neutral: NEUTRAL_COLOR,
      };

      const handle = prepare(stock.ticker, FONT_VALUE_SM);
      let lo = 0, hi = 120;
      for (let j = 0; j < 12; j++) {
        const mid = (lo + hi) / 2;
        if (layout(handle, mid, 1).lineCount <= 1) hi = mid;
        else lo = mid;
      }

      blips.push({
        pair: stock.ticker,
        angle: getCategoryAngle(stock.ticker),
        distance,
        color: colorMap[stock.overall_signal] ?? NEUTRAL_COLOR,
        signal: stock.overall_signal,
        grade: stock.overall_grade,
        patternCount: stock.pattern_count,
        fadeIn: 0,
        labelWidth: Math.ceil(hi) + 2,
      });
    }

    blipsRef.current = blips;
  }, [scanData]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      buildBlips();
      const blips = blipsRef.current;

      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.42;
      const mouse = mouseRef.current;

      // Rotate beam
      beamAngleRef.current += 0.008;
      const beamAngle = beamAngleRef.current;

      /* ── Background rings ── */
      [0.25, 0.5, 0.75, 1].forEach(frac => {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
        ctx.stroke();
      });

      /* ── Radial sector lines ── */
      RADAR_CATEGORIES.forEach((cat, i) => {
        const angle = (i / RADAR_CATEGORIES.length) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + Math.cos(angle) * maxR;
        const ly = cy + Math.sin(angle) * maxR;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(lx, ly);
        ctx.stroke();

        // Category labels at edge
        if (!isMobile) {
          ctx.save();
          ctx.font = '400 7px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          const labelR = maxR + 12;
          ctx.fillText(cat, cx + Math.cos(angle) * labelR, cy + Math.sin(angle) * labelR);
          ctx.restore();
        }
      });

      /* ── Scanning beam ── */
      ctx.save();
      const beamSpread = 0.4; // radians
      const grad = ctx.createConicGradient(beamAngle - beamSpread, cx, cy);
      grad.addColorStop(0, 'rgba(52, 211, 153, 0)');
      grad.addColorStop(0.5, 'rgba(52, 211, 153, 0.06)');
      grad.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, beamAngle - beamSpread, beamAngle + beamSpread);
      ctx.closePath();
      ctx.fill();

      // Beam edge line
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(beamAngle) * maxR,
        cy + Math.sin(beamAngle) * maxR,
      );
      ctx.stroke();
      ctx.restore();

      /* ── Center pulse ── */
      const sonarT = (time % SONAR_CYCLE_MS) / SONAR_CYCLE_MS;
      drawSonarPulse(ctx, cx, cy, maxR * 0.3, sonarT, 'rgba(52, 211, 153, 0.3)');

      /* ── Blips ── */
      hoveredBlipRef.current = -1;
      blips.forEach((b, i) => {
        // Fade in when beam passes
        const angleDiff = Math.abs(((beamAngle - b.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (angleDiff < beamSpread * 2) {
          b.fadeIn = Math.min(1, b.fadeIn + 0.05);
        } else {
          b.fadeIn = Math.max(0.3, b.fadeIn - 0.002);
        }

        const r = maxR * (0.15 + b.distance * 0.8);
        const bx = cx + Math.cos(b.angle) * r;
        const by = cy + Math.sin(b.angle) * r;
        const nodeR = 3 + b.patternCount * 0.8;

        // Check hover
        if (mouse) {
          const dx = mouse.x - bx;
          const dy = mouse.y - by;
          if (dx * dx + dy * dy < (nodeR + 8) * (nodeR + 8)) {
            hoveredBlipRef.current = i;
          }
        }

        const isHovered = hoveredBlipRef.current === i;
        const intensity = isHovered ? 0.9 : b.fadeIn * 0.6;

        drawGlowingNode(ctx, bx, by, nodeR, b.color, intensity, time * 0.002 + i);

        // Label on hover
        if (isHovered && !isMobile) {
          ctx.save();
          ctx.font = FONT_CODE_SM;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillText(b.pair, bx, by - nodeR - 4);

          ctx.font = '400 7px Inter, system-ui, sans-serif';
          ctx.fillStyle = colorWithAlpha(b.color, 0.7);
          ctx.textBaseline = 'top';
          ctx.fillText(
            `${b.signal} ${b.grade} (${b.patternCount})`,
            bx, by + nodeR + 4,
          );
          ctx.restore();
        }
      });

      // Summary text
      if (blips.length > 0) {
        ctx.save();
        ctx.font = FONT_VALUE_SM;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        const bullish = blips.filter(b => b.signal === 'bullish').length;
        const bearish = blips.filter(b => b.signal === 'bearish').length;
        ctx.fillText(
          `${blips.length} active  ·  ${bullish} bullish  ·  ${bearish} bearish`,
          cx, h - 4,
        );
        ctx.restore();
      } else {
        ctx.save();
        ctx.font = FONT_VALUE_SM;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillText('Scanning patterns...', cx, cy);
        ctx.restore();
      }
    },
    [buildBlips, isMobile],
  );

  const handleMouseUp = useCallback(() => {
    const idx = hoveredBlipRef.current;
    if (idx >= 0 && idx < blipsRef.current.length) {
      onSelectPair(blipsRef.current[idx].pair);
    }
  }, [onSelectPair]);

  return (
    <div className="h-full w-full relative" style={{ minHeight: 300 }}>
      <PretextCanvas
        draw={draw}
        fallback={
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground/40">
            Pattern Radar
          </div>
        }
        fps={isMobile ? 20 : 30}
        onMouseMove={(x, y) => { mouseRef.current = { x, y }; }}
        onMouseLeave={() => { mouseRef.current = null; hoveredBlipRef.current = -1; }}
        onMouseUp={handleMouseUp}
        cursor="crosshair"
      />
    </div>
  );
}
