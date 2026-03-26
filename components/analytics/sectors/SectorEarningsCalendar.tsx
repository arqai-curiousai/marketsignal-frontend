'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSectorEarningsCalendar } from '@/src/lib/api/analyticsApi';
import { formatDateTime } from '@/src/lib/exchange/formatting';
import type { ExchangeCode } from '@/src/lib/exchange/config';
import type { ISectorEarningsCalendar, ISectorEarningsEntry } from '@/types/analytics';

interface SectorEarningsCalendarProps {
  sector: string;
  exchange: string;
}

function SkeletonList() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-5 w-12 rounded bg-white/[0.04]" />
          <div className="h-3 w-24 rounded bg-white/[0.04]" />
          <div className="flex-1" />
          <div className="h-3 w-14 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EarningsEntry({
  entry,
  type,
  exchange,
}: {
  entry: ISectorEarningsEntry;
  type: 'upcoming' | 'recent';
  exchange?: string;
}) {
  const isUpcoming = type === 'upcoming';
  const daysLabel = isUpcoming
    ? entry.days_away === 0
      ? 'Today'
      : entry.days_away === 1
        ? 'Tomorrow'
        : `${entry.days_away}d away`
    : entry.days_ago === 0
      ? 'Today'
      : entry.days_ago === 1
        ? 'Yesterday'
        : `${entry.days_ago}d ago`;

  const dateStr = formatDateTime(entry.earnings_date, (exchange ?? 'NSE') as ExchangeCode, {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors">
      {/* Timeline dot */}
      <div
        className={cn(
          'h-2 w-2 rounded-full flex-shrink-0',
          isUpcoming ? 'bg-emerald-400' : 'bg-white/20',
        )}
      />

      {/* Ticker badge */}
      <span
        className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded',
          isUpcoming
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-white/[0.06] text-muted-foreground',
        )}
      >
        {entry.ticker}
      </span>

      {/* Name */}
      <span className="text-[10px] text-white/70 truncate flex-1">
        {entry.name}
      </span>

      {/* Date + Days */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[9px] text-muted-foreground tabular-nums">
          {dateStr}
        </span>
        <span
          className={cn(
            'text-[9px] font-semibold tabular-nums',
            isUpcoming
              ? entry.days_away != null && entry.days_away <= 7
                ? 'text-amber-400'
                : 'text-emerald-400/70'
              : 'text-muted-foreground',
          )}
        >
          {daysLabel}
        </span>
      </div>
    </div>
  );
}

export function SectorEarningsCalendar({ sector, exchange }: SectorEarningsCalendarProps) {
  const [data, setData] = useState<ISectorEarningsCalendar | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sector) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getSectorEarningsCalendar(sector, exchange)
      .then((r) => {
        if (cancelled) return;
        if (r.success && r.data) {
          setData(r.data);
        } else {
          setError('Earnings data unavailable');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load earnings data');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sector, exchange]);

  if (loading) {
    return <SkeletonList />;
  }

  if (error || !data) {
    return (
      <div className="text-[10px] text-muted-foreground text-center py-3">
        {error ?? 'No earnings data'}
      </div>
    );
  }

  const hasUpcoming = data.upcoming.length > 0;
  const hasRecent = data.recent.length > 0;

  if (!hasUpcoming && !hasRecent) {
    return (
      <div className="text-[10px] text-muted-foreground text-center py-3">
        No upcoming or recent earnings
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Upcoming */}
      {hasUpcoming && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Calendar className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
              Upcoming ({data.upcoming.length})
            </span>
          </div>
          <div className="space-y-0.5">
            {data.upcoming.map((entry) => (
              <EarningsEntry
                key={`upcoming-${entry.ticker}`}
                entry={entry}
                type="upcoming"
                exchange={exchange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {hasUpcoming && hasRecent && (
        <div className="border-t border-white/[0.06]" />
      )}

      {/* Recent */}
      {hasRecent && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Recent ({data.recent.length})
            </span>
          </div>
          <div className="space-y-0.5">
            {data.recent.map((entry) => (
              <EarningsEntry
                key={`recent-${entry.ticker}`}
                entry={entry}
                type="recent"
                exchange={exchange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
