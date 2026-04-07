'use client';

import { useRef, useCallback, useEffect } from 'react';
import { PretextCanvas } from '@/components/landing/pretext/PretextCanvas';
import { useMobileDetect } from '@/components/landing/pretext/useMobileDetect';
import {
  drawSonarPulse,
  colorWithAlpha,
} from '@/components/landing/pretext/canvasEffects';
import { useForexData } from '../ForexDataProvider';
import {
  SESSION_COLORS,
  SESSION_FAINT,
  FONT_LABEL,
  FONT_VALUE_SM,
  SONAR_CYCLE_MS,
} from './canvasConstants';

/* ── Session definitions (UTC hours) ── */

const SESSIONS = [
  { key: 'sydney',   label: 'Sydney',    city: 'Sydney',   start: 22, end: 7,  color: SESSION_COLORS.sydney, faint: SESSION_FAINT.sydney },
  { key: 'tokyo',    label: 'Tokyo',     city: 'Tokyo',    start: 0,  end: 9,  color: SESSION_COLORS.tokyo, faint: SESSION_FAINT.tokyo },
  { key: 'london',   label: 'London',    city: 'London',   start: 8,  end: 17, color: SESSION_COLORS.london, faint: SESSION_FAINT.london },
  { key: 'newyork',  label: 'New York',  city: 'New York', start: 13, end: 22, color: SESSION_COLORS.newyork, faint: SESSION_FAINT.newyork },
] as const;

const NSE_START = 3.5;
const NSE_END = 11.5;

function utcNowHours(): number {
  const now = new Date();
  return now.getUTCHours() + now.getUTCMinutes() / 60;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function SessionTimelineCanvas() {
  const isMobile = useMobileDetect();
  const { marketClock } = useForexData();
  const nowRef = useRef(utcNowHours());
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  // Update "now" every 30s
  useEffect(() => {
    const timer = setInterval(() => { nowRef.current = utcNowHours(); }, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Build active session lookup
  const activeSet = useRef(new Set<string>());
  const hoursMap = useRef(new Map<string, number>());
  useEffect(() => {
    const s = new Set<string>();
    const h = new Map<string, number>();
    for (const sess of marketClock?.sessions ?? []) {
      if (sess.is_active) {
        s.add(sess.city);
        h.set(sess.city, sess.hours_remaining);
      }
    }
    activeSet.current = s;
    hoursMap.current = h;
  }, [marketClock]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const padL = 8;
      const padR = 8;
      const timelineW = w - padL - padR;
      const hourW = timelineW / 24;
      const barH = isMobile ? 10 : 12;
      const barGap = 3;
      const topPad = 16;
      const nowH = nowRef.current;

      // Hour grid
      ctx.font = '400 7px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let i = 0; i <= 24; i++) {
        const x = padL + i * hourW;
        // Grid line
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, topPad);
        ctx.lineTo(x, topPad + SESSIONS.length * (barH + barGap) + barH);
        ctx.stroke();
        // Hour label (every 3rd on mobile, every 2nd on desktop)
        const showLabel = isMobile ? i % 6 === 0 : i % 3 === 0;
        if (i < 24 && showLabel) {
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillText(String(i).padStart(2, '0'), x + hourW / 2, topPad + SESSIONS.length * (barH + barGap) + barH + 4);
        }
      }

      // Session bars
      SESSIONS.forEach((sess, i) => {
        const y = topPad + i * (barH + barGap);
        const isActive = activeSet.current.has(sess.city);
        const hrs = hoursMap.current.get(sess.city) ?? 0;

        // Handle wrap-around sessions
        const wraps = sess.start > sess.end;
        const bars: { x: number; w: number }[] = [];
        if (wraps) {
          bars.push({ x: padL + sess.start * hourW, w: (24 - sess.start) * hourW });
          bars.push({ x: padL, w: sess.end * hourW });
        } else {
          bars.push({ x: padL + sess.start * hourW, w: (sess.end - sess.start) * hourW });
        }

        bars.forEach(bar => {
          ctx.save();
          const fillColor = isActive ? sess.color : sess.faint;
          const alpha = isActive ? 0.5 : 0.15;
          ctx.fillStyle = colorWithAlpha(fillColor, alpha);
          roundRect(ctx, bar.x, y, bar.w, barH, 3);
          ctx.fill();

          // Glow when active
          if (isActive) {
            ctx.shadowColor = colorWithAlpha(sess.color, 0.3);
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          ctx.restore();
        });

        // Label on first bar
        ctx.save();
        ctx.font = FONT_LABEL;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)';
        const labelText = isActive ? `${sess.label} (${hrs.toFixed(1)}h)` : sess.label;
        ctx.fillText(labelText, bars[0].x + 5, y + barH / 2);
        ctx.restore();
      });

      // NSE bar
      const nseY = topPad + SESSIONS.length * (barH + barGap);
      const nseX = padL + NSE_START * hourW;
      const nseW = (NSE_END - NSE_START) * hourW;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
      roundRect(ctx, nseX, nseY, nseW, 4, 2);
      ctx.fill();
      ctx.save();
      ctx.font = '400 7px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.fillText('NSE', nseX, nseY - 1);
      ctx.restore();

      // "NOW" marker
      const nowX = padL + nowH * hourW;
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(nowX, topPad - 2);
      ctx.lineTo(nowX, nseY + 6);
      ctx.stroke();
      ctx.setLineDash([]);

      // Now dot
      ctx.fillStyle = 'rgba(239, 68, 68, 1)';
      ctx.beginPath();
      ctx.arc(nowX, topPad - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Sonar pulse at NOW
      const sonarT = (time % SONAR_CYCLE_MS) / SONAR_CYCLE_MS;
      drawSonarPulse(ctx, nowX, topPad - 2, 15, sonarT, 'rgba(239, 68, 68, 0.6)');

      ctx.restore();

      // Weekend banner
      if (marketClock?.is_weekend) {
        ctx.save();
        ctx.font = FONT_VALUE_SM;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.fillText('Weekend — resumes Sun 22:00 UTC', w / 2, h - 8);
        ctx.restore();
      }

      // UTC time label
      ctx.save();
      ctx.font = '400 8px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText(marketClock?.current_utc ?? '', w - padR, 3);
      ctx.restore();
    },
    [isMobile, marketClock],
  );

  return (
    <div className="h-full w-full relative" style={{ minHeight: 160 }}>
      <PretextCanvas
        draw={draw}
        fallback={
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground/40">
            Session Timeline
          </div>
        }
        fps={isMobile ? 15 : 30}
        onMouseMove={(x, y) => { mouseRef.current = { x, y }; }}
        onMouseLeave={() => { mouseRef.current = null; }}
      />
    </div>
  );
}
