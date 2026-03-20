'use client';

import { useMemo } from 'react';
import { Globe, Clock, RefreshCw, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ICurrencyStrength } from '@/src/types/analytics';

interface Props {
  strength: ICurrencyStrength | null;
  autoRefreshPaused: boolean;
  onToggleRefresh: () => void;
  onManualRefresh: () => void;
  lastUpdated: string | null;
}

const SESSION_DEFS = [
  { name: 'Asia', startH: 3, startM: 30, endH: 9, endM: 0, tz: 'IST', crossesMidnight: false },
  { name: 'India', startH: 9, startM: 0, endH: 15, endM: 30, tz: 'IST', crossesMidnight: false },
  { name: 'London', startH: 13, startM: 30, endH: 22, endM: 30, tz: 'IST', crossesMidnight: false },
  { name: 'NY', startH: 19, startM: 0, endH: 3, endM: 30, tz: 'IST', crossesMidnight: true },
] as const;

function isSessionActive(s: typeof SESSION_DEFS[number]): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + istOffset) % 1440;

  const start = s.startH * 60 + s.startM;
  const end = s.endH * 60 + s.endM;

  if (s.crossesMidnight) {
    return istMinutes >= start || istMinutes < end;
  }
  return istMinutes >= start && istMinutes < end;
}

function strengthColor(val: number): string {
  if (val > 30) return 'text-emerald-400';
  if (val < -30) return 'text-red-400';
  return 'text-muted-foreground';
}

export function CurrencyHeader({
  strength,
  autoRefreshPaused,
  onToggleRefresh,
  onManualRefresh,
  lastUpdated,
}: Props) {
  const inrStrength = useMemo(() => {
    if (!strength?.currencies?.INR) return null;
    return strength.currencies.INR;
  }, [strength]);

  const activeSessions = useMemo(
    () => SESSION_DEFS.filter(isSessionActive),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.floor(Date.now() / 60000)] // re-check every minute
  );

  const timeSince = useMemo(() => {
    if (!lastUpdated) return null;
    const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  }, [lastUpdated]);

  return (
    <div className="flex flex-wrap items-center gap-3 px-1 py-1.5 text-xs">
      {/* INR Strength */}
      {inrStrength && (
        <div className="flex items-center gap-1.5 rounded-md border border-border/50 bg-card px-2.5 py-1">
          <span className="text-muted-foreground font-medium">INR</span>
          <span className={cn('font-mono font-semibold', strengthColor(inrStrength['1d']))}>
            {inrStrength['1d'] > 0 ? '+' : ''}{inrStrength['1d'].toFixed(0)}
          </span>
        </div>
      )}

      {/* Active Sessions */}
      <div className="flex items-center gap-1.5">
        <Globe className="h-3 w-3 text-muted-foreground" />
        {SESSION_DEFS.map(s => {
          const active = activeSessions.some(a => a.name === s.name);
          return (
            <span
              key={s.name}
              className={cn(
                'rounded px-1.5 py-0.5 font-medium transition-colors',
                active
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-muted/50 text-muted-foreground/50'
              )}
            >
              {s.name}
            </span>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Refresh controls */}
      <div className="flex items-center gap-1.5">
        {timeSince && (
          <span className="text-muted-foreground/60 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeSince}
          </span>
        )}
        <button
          onClick={onToggleRefresh}
          className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
          title={autoRefreshPaused ? 'Resume auto-refresh' : 'Pause auto-refresh'}
        >
          {autoRefreshPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        </button>
        <button
          onClick={onManualRefresh}
          className="p-1 rounded hover:bg-muted/50 text-muted-foreground"
          title="Refresh now"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
