'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/src/lib/api/apiClient';

interface MacroEvent {
  id?: string;
  event: string;
  currency: string;
  impact: 'high' | 'medium' | 'low' | string;
  datetime: string;
  previous?: string | number | null;
  forecast?: string | number | null;
  actual?: string | number | null;
}

interface MacroCalendarInlineProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '\uD83C\uDDFA\uD83C\uDDF8', EUR: '\uD83C\uDDEA\uD83C\uDDFA', GBP: '\uD83C\uDDEC\uD83C\uDDE7',
  JPY: '\uD83C\uDDEF\uD83C\uDDF5', INR: '\uD83C\uDDEE\uD83C\uDDF3', AUD: '\uD83C\uDDE6\uD83C\uDDFA',
  CAD: '\uD83C\uDDE8\uD83C\uDDE6', CHF: '\uD83C\uDDE8\uD83C\uDDED', CNY: '\uD83C\uDDE8\uD83C\uDDF3',
  SGD: '\uD83C\uDDF8\uD83C\uDDEC', HKD: '\uD83C\uDDED\uD83C\uDDF0', NZD: '\uD83C\uDDF3\uD83C\uDDFF',
  SEK: '\uD83C\uDDF8\uD83C\uDDEA', NOK: '\uD83C\uDDF3\uD83C\uDDF4', MXN: '\uD83C\uDDF2\uD83C\uDDFD',
  ZAR: '\uD83C\uDDFF\uD83C\uDDE6', TRY: '\uD83C\uDDF9\uD83C\uDDF7',
};

function impactDots(impact: string) {
  const l = impact?.toLowerCase();
  if (l === 'high') return <span className="flex gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /><span className="h-1.5 w-1.5 rounded-full bg-red-500" /><span className="h-1.5 w-1.5 rounded-full bg-red-500" /></span>;
  if (l === 'medium') return <span className="flex gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /><span className="h-1.5 w-1.5 rounded-full bg-white/10" /></span>;
  return <span className="flex gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-white/20" /><span className="h-1.5 w-1.5 rounded-full bg-white/10" /><span className="h-1.5 w-1.5 rounded-full bg-white/10" /></span>;
}

function formatEventTime(datetime: string): string {
  const diff = new Date(datetime).getTime() - Date.now();
  if (diff < 0) return 'passed';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  const hrs = Math.floor(diff / 3_600_000);
  if (diff < 86_400_000) return `${hrs}h ${Math.floor((diff % 3_600_000) / 60_000)}m`;
  return new Date(datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MacroCalendarInline({ collapsed: controlledCollapsed, onToggle }: MacroCalendarInlineProps) {
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [internalCollapsed, setInternalCollapsed] = useState(isMobile);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const handleToggle = onToggle ?? (() => setInternalCollapsed((p) => !p));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await apiClient.get<MacroEvent[]>(
          '/api/analytics/economic-calendar/upcoming',
          { hours: 48, limit: 8 },
        );
        if (cancelled) return;
        if (result.success) setEvents(result.data);
        else setError(true);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isEmpty = !loading && (error || events.length === 0);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-white/30" />
          <span className="text-xs font-medium text-white/60">Macro Calendar</span>
          {!loading && events.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40 font-medium">
              {events.length}
            </span>
          )}
        </div>
        {isCollapsed
          ? <ChevronDown className="h-3.5 w-3.5 text-white/25" />
          : <ChevronUp className="h-3.5 w-3.5 text-white/25" />}
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-3">
          {loading && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="shrink-0 w-36 h-20 rounded-lg bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          )}
          {isEmpty && !loading && (
            <p className="text-xs text-white/25 py-3 text-center">No upcoming events</p>
          )}
          {!loading && events.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {events.map((evt, i) => {
                const flag = CURRENCY_FLAGS[evt.currency] ?? '';
                const ms = new Date(evt.datetime).getTime() - Date.now();
                const isImminent = ms > 0 && ms < 3_600_000;
                return (
                  <div
                    key={evt.id ?? `${evt.event}-${i}`}
                    className={cn(
                      'shrink-0 w-40 rounded-lg border p-2.5 space-y-1.5 transition-colors',
                      isImminent
                        ? 'border-amber-500/20 bg-amber-500/[0.04]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn('text-[10px] font-mono', isImminent ? 'text-amber-400' : 'text-white/40')}>
                        {formatEventTime(evt.datetime)}
                      </span>
                      {impactDots(evt.impact)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{flag}</span>
                      <span className="text-[10px] text-white/30 font-medium">{evt.currency}</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-snug line-clamp-2 font-medium">{evt.event}</p>
                    {(evt.previous != null || evt.forecast != null) && (
                      <div className="flex items-center gap-2 text-[10px] text-white/30">
                        {evt.previous != null && <span>Prev: {evt.previous}</span>}
                        {evt.forecast != null && <span>Fcst: {evt.forecast}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
