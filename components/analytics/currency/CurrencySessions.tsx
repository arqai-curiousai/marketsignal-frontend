'use client';

import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencySessions } from '@/src/lib/api/analyticsApi';
import type { ICurrencySessions } from '@/src/types/analytics';

interface Props {
  pair: string;
}

const SESSION_TIMES: Record<string, string> = {
  Asia: '03:30 — 09:00 IST',
  India: '09:00 — 15:30 IST',
  London: '13:30 — 22:30 IST',
  NY: '19:00 — 03:30 IST',
};

const SESSION_COLORS: Record<string, string> = {
  Asia: 'bg-purple-500',
  India: 'bg-amber-500',
  London: 'bg-blue-500',
  NY: 'bg-emerald-500',
};

export function CurrencySessions({ pair }: Props) {
  const [data, setData] = useState<ICurrencySessions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCurrencySessions(pair);
      if (res.success) setData(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [pair]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return <div className="space-y-3"><Skeleton className="h-48" /><Skeleton className="h-24" /></div>;
  }

  if (!data) {
    return <p className="text-xs text-muted-foreground p-4">No session data available</p>;
  }

  return (
    <div className="space-y-4">
      {/* Session Timeline */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold mb-3">Forex Sessions</h3>
        <div className="space-y-2">
          {data.sessions.map(s => (
            <div key={s.name} className="flex items-center gap-3">
              {/* Status dot */}
              <div className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                s.is_active ? `${SESSION_COLORS[s.name]} animate-pulse` : 'bg-muted-foreground/30'
              )} />

              {/* Session bar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs font-medium',
                      s.is_active ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {s.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">{SESSION_TIMES[s.name]}</span>
                    {s.is_active && (
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-400 rounded px-1 py-0.5 font-semibold">
                        LIVE
                      </span>
                    )}
                  </div>
                  {s.range_paise > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {s.range_paise.toFixed(1)}p range
                    </span>
                  )}
                </div>

                {/* Range bar */}
                {s.high != null && s.low != null && (
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        SESSION_COLORS[s.name],
                        !s.is_active && 'opacity-40'
                      )}
                      style={{ width: `${Math.min((s.range_paise / 50) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Range Decomposition */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold mb-3">Session Ranges (Last 5 Days Avg)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-1.5 text-muted-foreground font-medium">Session</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Open</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">High</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Low</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Close</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Range</th>
                <th className="text-right py-1.5 text-muted-foreground font-medium">Return</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map(s => (
                <tr key={s.name} className="border-b border-white/[0.04]">
                  <td className="py-1.5 font-medium">
                    <div className="flex items-center gap-1.5">
                      <div className={cn('w-1.5 h-1.5 rounded-full', SESSION_COLORS[s.name])} />
                      {s.name}
                    </div>
                  </td>
                  <td className="text-right font-mono">{s.open?.toFixed(4) ?? '—'}</td>
                  <td className="text-right font-mono">{s.high?.toFixed(4) ?? '—'}</td>
                  <td className="text-right font-mono">{s.low?.toFixed(4) ?? '—'}</td>
                  <td className="text-right font-mono">{s.close?.toFixed(4) ?? '—'}</td>
                  <td className="text-right font-mono">{s.range_paise.toFixed(1)}p</td>
                  <td className={cn(
                    'text-right font-mono',
                    s.return_pct > 0 ? 'text-emerald-400' : s.return_pct < 0 ? 'text-red-400' : ''
                  )}>
                    {s.return_pct > 0 ? '+' : ''}{s.return_pct.toFixed(3)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asian Range Breakout */}
      {data.asian_breakout && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold mb-3">Asian Range Breakout Levels</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
              <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-1">Resistance</p>
              <p className="text-lg font-mono font-bold text-emerald-400">{data.asian_breakout.high.toFixed(4)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Break above = bullish</p>
            </div>
            <div className="text-center rounded-lg bg-red-500/5 border border-red-500/20 p-3">
              <p className="text-[10px] text-red-400/70 uppercase tracking-wider mb-1">Support</p>
              <p className="text-lg font-mono font-bold text-red-400">{data.asian_breakout.low.toFixed(4)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Break below = bearish</p>
            </div>
          </div>
        </div>
      )}

      {/* Hourly Return Heatmap */}
      {data.hourly_returns && data.hourly_returns.length > 0 && (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <h3 className="text-sm font-semibold mb-3">Hourly Return Pattern (IST)</h3>
        <div className="overflow-x-auto">
          <div className="flex gap-px min-w-[600px]">
            {data.hourly_returns.map(h => {
              const maxAbs = Math.max(
                ...data.hourly_returns.map(hr => Math.abs(hr.avg_return)),
                0.001
              );
              const intensity = Math.min(Math.abs(h.avg_return) / maxAbs, 1);
              const bg = h.avg_return > 0
                ? `rgba(16, 185, 129, ${intensity * 0.6})`
                : h.avg_return < 0
                  ? `rgba(239, 68, 68, ${intensity * 0.6})`
                  : 'transparent';
              return (
                <div
                  key={h.hour}
                  className="flex-1 text-center rounded-sm py-2"
                  style={{ backgroundColor: bg }}
                  title={`${h.hour}:00 IST — Avg return: ${h.avg_return.toFixed(4)}% (${h.bar_count} bars)`}
                >
                  <span className="text-[8px] text-muted-foreground block">{h.hour}</span>
                  {h.bar_count > 0 && (
                    <span className="text-[8px] font-mono block mt-0.5">
                      {h.avg_return > 0 ? '+' : ''}{h.avg_return.toFixed(3)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-1 min-w-[600px]">
            <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
