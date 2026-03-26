'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketAwarePolling } from '@/lib/hooks/useMarketAwarePolling';
import { getCurrencyMarketClock } from '@/src/lib/api/analyticsApi';
import type { IMarketClock } from '@/src/types/analytics';

/* ─── Session time definitions (UTC hours) ──────────────────────────────── */
const SESSIONS = [
  { name: 'Sydney',   start: 22, end: 7,  color: '#A78BFA', colorFaint: 'rgba(167,139,250,0.15)' },
  { name: 'Tokyo',    start: 0,  end: 9,  color: '#F87171', colorFaint: 'rgba(248,113,113,0.15)' },
  { name: 'London',   start: 8,  end: 17, color: '#38BDF8', colorFaint: 'rgba(56,189,248,0.15)' },
  { name: 'New York', start: 13, end: 22, color: '#34D399', colorFaint: 'rgba(52,211,153,0.15)' },
] as const;

/** NSE currency segment: 9:00-17:00 IST = 3:30-11:30 UTC */
const NSE_START_UTC = 3.5;
const NSE_END_UTC = 11.5;

function utcNowHours(): number {
  const now = new Date();
  return now.getUTCHours() + now.getUTCMinutes() / 60;
}

interface SessionBarProps {
  name: string;
  startH: number;
  endH: number;
  color: string;
  colorFaint: string;
  y: number;
  isActive: boolean;
  hoursRemaining?: number;
}

function SessionBar({ name, startH, endH, color, colorFaint, y, isActive, hoursRemaining }: SessionBarProps) {
  const hourWidth = 1200 / 24;

  // Handle sessions that span midnight
  const wraps = startH > endH;

  const bars: { x: number; width: number }[] = [];
  if (wraps) {
    bars.push({ x: startH * hourWidth, width: (24 - startH) * hourWidth });
    bars.push({ x: 0, width: endH * hourWidth });
  } else {
    bars.push({ x: startH * hourWidth, width: (endH - startH) * hourWidth });
  }

  return (
    <g>
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y={y}
          width={bar.width}
          height={12}
          rx={3}
          fill={isActive ? color : colorFaint}
          opacity={isActive ? 0.6 : 0.25}
        />
      ))}
      {/* Label on first bar */}
      <text
        x={bars[0].x + 6}
        y={y + 9.5}
        fill={isActive ? '#fff' : 'rgba(255,255,255,0.4)'}
        fontSize={8}
        fontWeight={600}
        fontFamily="system-ui, sans-serif"
      >
        {name}
        {isActive && hoursRemaining != null ? ` (${hoursRemaining.toFixed(1)}h)` : ''}
      </text>
    </g>
  );
}

export function ForexSessionMap() {
  const [data, setData] = useState<IMarketClock | null>(null);
  const [loading, setLoading] = useState(true);
  const [nowH, setNowH] = useState(utcNowHours);

  const fetchData = useCallback(async () => {
    try {
      const res = await getCurrencyMarketClock();
      if (res.success) setData(res.data);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useMarketAwarePolling({
    fetchFn: fetchData,
    marketType: 'forex',
    activeIntervalMs: 60_000,
    inactiveIntervalMs: 300_000,
  });

  // Update "now" line every 30s
  useEffect(() => {
    const timer = setInterval(() => setNowH(utcNowHours()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const sessionStates = useMemo(() => {
    if (!data?.sessions) return SESSIONS.map(s => ({ ...s, isActive: false, hoursRemaining: 0 }));
    return SESSIONS.map(s => {
      const match = data.sessions.find(ds => ds.city === s.name);
      return {
        ...s,
        isActive: match?.is_active ?? false,
        hoursRemaining: match?.hours_remaining ?? 0,
      };
    });
  }, [data]);

  if (loading && !data) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  const hourWidth = 1200 / 24;
  const nowX = nowH * hourWidth;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
          Session Map
        </h3>
        <span className="text-[10px] text-muted-foreground font-mono">
          {data?.current_utc ?? ''} UTC
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox="0 0 1200 90" width="100%" className="min-w-[600px]" role="img" aria-label="Forex trading session map">
          {/* Hour grid lines */}
          {Array.from({ length: 25 }, (_, i) => (
            <g key={i}>
              <line
                x1={i * hourWidth}
                y1={0}
                x2={i * hourWidth}
                y2={72}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />
              {i < 24 && (
                <text
                  x={i * hourWidth + hourWidth / 2}
                  y={84}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.25)"
                  fontSize={8}
                  fontFamily="monospace"
                >
                  {String(i).padStart(2, '0')}
                </text>
              )}
            </g>
          ))}

          {/* Session bars */}
          {sessionStates.map((s, i) => (
            <SessionBar
              key={s.name}
              name={s.name}
              startH={s.start}
              endH={s.end}
              color={s.color}
              colorFaint={s.colorFaint}
              y={i * 16 + 2}
              isActive={s.isActive}
              hoursRemaining={s.hoursRemaining}
            />
          ))}

          {/* NSE overlay */}
          <rect
            x={NSE_START_UTC * hourWidth}
            y={66}
            width={(NSE_END_UTC - NSE_START_UTC) * hourWidth}
            height={4}
            rx={2}
            fill="rgba(251, 191, 36, 0.5)"
          />
          <text
            x={NSE_START_UTC * hourWidth + 4}
            y={64}
            fill="rgba(251, 191, 36, 0.6)"
            fontSize={7}
            fontFamily="system-ui, sans-serif"
          >
            NSE
          </text>

          {/* Now marker */}
          <line
            x1={nowX}
            y1={0}
            x2={nowX}
            y2={72}
            stroke="#EF4444"
            strokeWidth={1.5}
            strokeDasharray="3,2"
          />
          <circle cx={nowX} cy={0} r={3} fill="#EF4444" />
        </svg>
      </div>

      {/* Weekend banner */}
      {data?.is_weekend && (
        <div className="mt-2 text-center text-[10px] text-amber-400/80 bg-amber-500/5 rounded py-1">
          Markets closed — trading resumes Sunday 22:00 UTC
        </div>
      )}
    </div>
  );
}
