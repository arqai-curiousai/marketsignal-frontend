'use client';

import { useState, useEffect, useCallback } from 'react';
import { Landmark, Calendar, ChevronRight, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getCentralBankRates, getUpcomingMeetings } from '@/src/lib/api/analyticsApi';
import type { ICentralBankRates, ICentralBankRate, IUpcomingMeetings, IUpcomingMeeting } from '@/src/types/analytics';

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '\u{1F1FA}\u{1F1F8}',
  EUR: '\u{1F1EA}\u{1F1FA}',
  GBP: '\u{1F1EC}\u{1F1E7}',
  JPY: '\u{1F1EF}\u{1F1F5}',
  CHF: '\u{1F1E8}\u{1F1ED}',
  AUD: '\u{1F1E6}\u{1F1FA}',
  NZD: '\u{1F1F3}\u{1F1FF}',
  CAD: '\u{1F1E8}\u{1F1E6}',
  INR: '\u{1F1EE}\u{1F1F3}',
};

function formatBps(bps: number): string {
  if (bps === 0) return 'Hold';
  const sign = bps > 0 ? '+' : '';
  return `${sign}${bps}bp`;
}

function changeColor(bps: number): string {
  // Positive bps = rate hike (tightening, red for risk), Negative = cut (easing, green)
  if (bps > 0) return 'text-rose-400';
  if (bps < 0) return 'text-emerald-400';
  return 'text-muted-foreground';
}

function changeBgColor(bps: number): string {
  if (bps > 0) return 'bg-rose-500/10 border-rose-500/20';
  if (bps < 0) return 'bg-emerald-500/10 border-emerald-500/20';
  return 'bg-white/[0.03] border-white/[0.06]';
}

function daysUntilText(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Passed';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `in ${diff}d`;
}

function RateSparkline({ history }: { history: Array<{ date: string; rate: number }> }) {
  const rates = history.map(h => h.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const range = max - min || 0.01;
  const w = 120;
  const h = 24;
  const step = w / (rates.length - 1);

  const points = rates
    .map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - ((v - min) / range) * (h - 4)).toFixed(1)}`)
    .join(' ');

  // Was last move up or down?
  const trend = rates.length >= 2 ? rates[rates.length - 1] - rates[rates.length - 2] : 0;
  const strokeColor = trend > 0 ? 'hsl(0, 70%, 60%)' : trend < 0 ? 'hsl(142, 70%, 50%)' : 'hsl(220, 10%, 50%)';

  return (
    <div className="flex items-center justify-center">
      <svg width={w} height={h} className="opacity-70">
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Current rate dot */}
        {rates.length > 0 && (
          <circle
            cx={w}
            cy={h - 2 - ((rates[rates.length - 1] - min) / range) * (h - 4)}
            r={2.5}
            fill={strokeColor}
          />
        )}
      </svg>
    </div>
  );
}

function RateCard({ rate }: { rate: ICentralBankRate }) {
  const flag = CURRENCY_FLAGS[rate.currency] || '';
  const meetingBadge = daysUntilText(rate.next_meeting_date);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-2 hover:border-white/[0.12] transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label={rate.currency}>
            {flag}
          </span>
          <div>
            <span className="text-sm font-semibold">{rate.currency}</span>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {rate.bank_code}
            </p>
          </div>
        </div>
        {meetingBadge && (
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
              meetingBadge === 'Today' || meetingBadge === 'Tomorrow'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {meetingBadge}
          </span>
        )}
      </div>

      {/* Current rate */}
      <div className="text-center py-1">
        <span className="text-2xl font-bold font-mono">
          {rate.current_rate.toFixed(2)}%
        </span>
      </div>

      {/* Rate history sparkline */}
      {rate.rate_history && rate.rate_history.length >= 2 && (
        <RateSparkline history={rate.rate_history} />
      )}

      {/* Last change */}
      <div
        className={cn(
          'flex items-center justify-between rounded px-2 py-1 border text-xs',
          changeBgColor(rate.last_change_bps)
        )}
      >
        <span className="text-muted-foreground">Last change</span>
        <span className={cn('font-mono font-semibold', changeColor(rate.last_change_bps))}>
          {formatBps(rate.last_change_bps)}
        </span>
      </div>

      {/* Bank name + meeting date */}
      <div className="text-[10px] text-muted-foreground space-y-0.5">
        <p>{rate.bank_name}</p>
        {rate.next_meeting_date && (
          <p className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5" />
            Next: {new Date(rate.next_meeting_date).toLocaleDateString()}
          </p>
        )}
        {rate.last_change_date && (
          <p>
            Changed: {new Date(rate.last_change_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function MeetingTimeline({ meetings }: { meetings: IUpcomingMeeting[] }) {
  if (!meetings.length) {
    return (
      <p className="text-xs text-muted-foreground">No upcoming meetings found</p>
    );
  }

  return (
    <div className="space-y-1">
      {meetings.map((m, i) => {
        const flag = CURRENCY_FLAGS[m.currency] || '';
        return (
          <div
            key={`${m.bank_code}-${m.date}-${i}`}
            className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0"
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  m.days_until <= 7
                    ? 'bg-amber-500'
                    : m.days_until <= 30
                      ? 'bg-blue-500'
                      : 'bg-muted-foreground'
                )}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm" role="img" aria-label={m.currency}>
                  {flag}
                </span>
                <span className="text-xs font-semibold">{m.bank_code}</span>
                <span className="text-[10px] text-muted-foreground">
                  {m.bank_name}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Current: {m.current_rate.toFixed(2)}%
              </p>
            </div>

            {/* Date */}
            <div className="text-right shrink-0">
              <p className="text-xs font-mono">
                {new Date(m.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p
                className={cn(
                  'text-[10px] font-medium',
                  m.days_until <= 7 ? 'text-amber-400' : 'text-muted-foreground'
                )}
              >
                {m.days_until === 0
                  ? 'Today'
                  : m.days_until === 1
                    ? 'Tomorrow'
                    : `${m.days_until}d away`}
              </p>
            </div>

            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>
        );
      })}
    </div>
  );
}

export function CentralBankDashboard() {
  const [rates, setRates] = useState<ICentralBankRates | null>(null);
  const [meetings, setMeetings] = useState<IUpcomingMeetings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [ratesRes, meetingsRes] = await Promise.all([
        getCentralBankRates(),
        getUpcomingMeetings(90),
      ]);
      if (ratesRes.success) setRates(ratesRes.data);
      if (meetingsRes.success) setMeetings(meetingsRes.data);
      if (!ratesRes.success && !meetingsRes.success) {
        setError('Failed to load central bank data');
      }
    } catch {
      setError('Network error loading central bank data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error && !rates && !meetings) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 text-center">
        <Landmark className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rate cards grid */}
      {rates?.rates && rates.rates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            Central Bank Policy Rates
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {rates.rates.map((rate) => (
              <RateCard key={rate.currency} rate={rate} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming meetings timeline */}
      {meetings?.meetings && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Upcoming Meetings (90 days)
          </h3>
          <MeetingTimeline meetings={meetings.meetings} />
        </div>
      )}

      {/* Computed at */}
      {rates?.computed_at && (
        <p className="text-[10px] text-muted-foreground text-right">
          Updated: {new Date(rates.computed_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
