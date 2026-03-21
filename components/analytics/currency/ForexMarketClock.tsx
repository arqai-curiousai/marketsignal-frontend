'use client';

import { useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyMarketClock } from '@/src/lib/api/analyticsApi';
import type { IMarketClock, IMarketSession, ISessionOverlap } from '@/src/types/analytics';
import { Clock, Globe, AlertTriangle } from 'lucide-react';

const SESSION_META: Record<string, { emoji: string; color: string; bgColor: string }> = {
  Sydney: {
    emoji: '🇦🇺',
    color: 'text-purple-400',
    bgColor: 'border-purple-500/30 bg-purple-500/5',
  },
  Tokyo: {
    emoji: '🇯🇵',
    color: 'text-rose-400',
    bgColor: 'border-rose-500/30 bg-rose-500/5',
  },
  London: {
    emoji: '🇬🇧',
    color: 'text-blue-400',
    bgColor: 'border-blue-500/30 bg-blue-500/5',
  },
  'New York': {
    emoji: '🇺🇸',
    color: 'text-emerald-400',
    bgColor: 'border-emerald-500/30 bg-emerald-500/5',
  },
};

function SessionCard({ session }: { session: IMarketSession }) {
  const meta = SESSION_META[session.city] ?? {
    emoji: '',
    color: 'text-muted-foreground',
    bgColor: 'border-white/[0.06] bg-white/[0.03]',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-all',
        session.is_active ? meta.bgColor : 'border-white/[0.04] bg-white/[0.02] opacity-60'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{meta.emoji}</span>
          <span className={cn('text-xs font-semibold', session.is_active ? meta.color : 'text-muted-foreground')}>
            {session.city}
          </span>
        </div>
        {session.is_active ? (
          <span className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[9px] font-semibold text-emerald-400 uppercase">Open</span>
          </span>
        ) : (
          <span className="text-[9px] font-medium text-muted-foreground/50 uppercase">Closed</span>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground font-mono">
        {session.start_utc} — {session.end_utc} UTC
      </div>

      {session.is_active && session.hours_remaining > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">Closes in</span>
            <span className={cn('font-mono font-medium', meta.color)}>
              {session.hours_remaining.toFixed(1)}h
            </span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                session.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/20'
              )}
              style={{
                width: `${Math.max(5, Math.min(100, (session.hours_remaining / 12) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function OverlapBadge({ overlap }: { overlap: ISessionOverlap }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
      <Globe className="h-3 w-3" />
      {overlap.label}
    </span>
  );
}

export function ForexMarketClock() {
  const [data, setData] = useState<IMarketClock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(prev => !data ? true : prev);
    setError(null);
    try {
      const res = await getCurrencyMarketClock();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error?.message || 'Failed to load market clock');
      }
    } catch {
      setError('Failed to load market clock');
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh every 60s to keep hours_remaining accurate
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center text-muted-foreground">
        <Clock className="h-6 w-6 mx-auto mb-2 opacity-30" />
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  const sessions = data?.sessions ?? [];
  const overlaps = data?.overlaps ?? [];
  const isWeekend = data?.is_weekend ?? false;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Forex Market Clock</h3>
          {data?.current_utc && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {data.current_utc} UTC
            </span>
          )}
        </div>
        {data?.active_count != null && (
          <span className="text-[10px] text-muted-foreground">
            {data.active_count} session{data.active_count !== 1 ? 's' : ''} active
          </span>
        )}
      </div>

      {/* Weekend Banner */}
      {isWeekend && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-400">Market Closed</p>
            <p className="text-[10px] text-muted-foreground">
              Forex markets are closed during the weekend. Trading resumes Sunday 17:00 ET / Monday 03:30 IST.
            </p>
          </div>
        </div>
      )}

      {/* Session Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sessions.map(session => (
          <SessionCard key={session.city} session={session} />
        ))}
      </div>

      {/* Overlap Badges */}
      {overlaps.length > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[10px] text-muted-foreground">Overlaps:</span>
          {overlaps.map((ov, idx) => (
            <OverlapBadge key={idx} overlap={ov} />
          ))}
        </div>
      )}
    </div>
  );
}
