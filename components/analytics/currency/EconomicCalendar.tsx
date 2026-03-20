'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, RefreshCw, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCurrencyCalendar } from '@/src/lib/api/analyticsApi';
import type { IEconomicCalendar, IEconomicEvent } from '@/src/types/analytics';

const CURRENCIES = [
  'All',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'AUD',
  'NZD',
  'CAD',
  'INR',
] as const;

const DAYS_OPTIONS = [7, 14, 30] as const;

type DaysOption = (typeof DAYS_OPTIONS)[number];

function impactDot(impact: 'high' | 'medium' | 'low'): string {
  switch (impact) {
    case 'high':
      return 'bg-rose-500';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
      return 'bg-muted-foreground/50';
  }
}

function impactLabel(impact: 'high' | 'medium' | 'low'): string {
  switch (impact) {
    case 'high':
      return 'High Impact';
    case 'medium':
      return 'Medium Impact';
    case 'low':
      return 'Low Impact';
  }
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatEventTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DaysUntilBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
        Past
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
        Today
      </span>
    );
  }
  if (days === 1) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
        Tomorrow
      </span>
    );
  }
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
      {days}d
    </span>
  );
}

function EventRow({ event }: { event: IEconomicEvent }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
      {/* Time */}
      <div className="w-14 shrink-0 text-right">
        <span className="text-[11px] font-mono text-muted-foreground">
          {formatEventTime(event.event_date)}
        </span>
      </div>

      {/* Impact dot */}
      <div
        className={cn('w-2 h-2 rounded-full shrink-0', impactDot(event.impact))}
        title={impactLabel(event.impact)}
      />

      {/* Currency badge */}
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted shrink-0">
        {event.currency}
      </span>

      {/* Event name */}
      <span className="text-xs flex-1 min-w-0 truncate">{event.event_name}</span>

      {/* Previous / Forecast / Actual */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {event.previous !== null && (
          <div className="text-center w-16">
            <p className="text-[9px] text-muted-foreground">Prev</p>
            <p className="text-[11px] font-mono">{event.previous}</p>
          </div>
        )}
        {event.forecast !== null && (
          <div className="text-center w-16">
            <p className="text-[9px] text-muted-foreground">Fcst</p>
            <p className="text-[11px] font-mono">{event.forecast}</p>
          </div>
        )}
        {event.actual !== null && (
          <div className="text-center w-16">
            <p className="text-[9px] text-muted-foreground">Actual</p>
            <p className="text-[11px] font-mono font-semibold">{event.actual}</p>
          </div>
        )}
      </div>

      {/* Days until */}
      <div className="shrink-0">
        <DaysUntilBadge days={event.days_until} />
      </div>
    </div>
  );
}

export function EconomicCalendar() {
  const [data, setData] = useState<IEconomicCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DaysOption>(14);
  const [currency, setCurrency] = useState<string>('All');

  const fetchData = useCallback(async (d: DaysOption, cur: string) => {
    setLoading(true);
    setError(null);
    try {
      const curParam = cur === 'All' ? undefined : cur;
      const res = await getCurrencyCalendar(d, curParam);
      if (res.success) {
        setData(res.data);
      } else {
        setError('Failed to load calendar data');
      }
    } catch {
      setError('Network error loading calendar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(days, currency);
  }, [days, currency, fetchData]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    if (!data?.events) return new Map<string, IEconomicEvent[]>();

    const groups = new Map<string, IEconomicEvent[]>();
    for (const event of data.events) {
      const dateKey = formatEventDate(event.event_date);
      const existing = groups.get(dateKey);
      if (existing) {
        existing.push(event);
      } else {
        groups.set(dateKey, [event]);
      }
    }
    return groups;
  }, [data?.events]);

  if (loading && !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <button
          onClick={() => fetchData(days, currency)}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Currency filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Days selector */}
        <div className="flex gap-0.5">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors',
                days === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {d}d
            </button>
          ))}
        </div>

        {loading && (
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
        )}

        {/* Impact legend */}
        <div className="flex items-center gap-2 ml-auto text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Med
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
            Low
          </span>
        </div>
      </div>

      {/* Event groups by date */}
      {groupedEvents.size === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No events found for the selected filters
          </p>
        </div>
      ) : (
        Array.from(groupedEvents.entries()).map(([dateLabel, events]) => (
          <div key={dateLabel} className="rounded-lg border border-border bg-card overflow-hidden">
            {/* Date header */}
            <div className="px-4 py-2 bg-muted/30 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">{dateLabel}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {events.length} event{events.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Events */}
            <div className="px-4">
              {events.map((event, idx) => (
                <EventRow key={`${event.event_name}-${event.currency}-${idx}`} event={event} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Computed at */}
      {data?.computed_at && (
        <p className="text-[10px] text-muted-foreground text-right">
          Updated: {new Date(data.computed_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
