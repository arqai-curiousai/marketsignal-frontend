'use client';

import React, { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { INewsTimeline } from '@/types/analytics';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/src/lib/exchange/formatting';
import { SentimentBadge } from './SentimentBadge';
import { TickerPill } from './TickerPill';
import { formatTimeAgo, getSentimentColor, getSourceDisplayName, THEME_COLORS } from './constants';

interface NewsTimelineProps {
  data: INewsTimeline | null;
  loading: boolean;
  ticker: string | null;
  onSelectArticle: (articleId: string) => void;
  onTickerClick: (ticker: string) => void;
}

export function NewsTimeline({
  data,
  loading,
  ticker,
  onSelectArticle,
  onTickerClick,
}: NewsTimelineProps) {
  const gradientId = useId();
  // All hooks must be called before any early return
  const effectiveTicker = useMemo(() => {
    if (!data || data.events.length === 0) return null;
    if (ticker) return ticker;
    const tickers = data.events.flatMap((e) => e.tickers);
    if (tickers.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const t of tickers) counts[t] = (counts[t] ?? 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted[0]?.[0];
    return top && data.price_series[top] ? top : null;
  }, [ticker, data]);

  const priceSeries = effectiveTicker && data?.price_series[effectiveTicker] ? data.price_series[effectiveTicker] : null;

  const impactMap = useMemo(
    () => data?.impact_markers ? new Map(data.impact_markers.map((m) => [m.event_id, m])) : new Map(),
    [data?.impact_markers],
  );

  const chartData = useMemo(
    () =>
      priceSeries
        ? priceSeries.map((p) => ({
            timestamp: p.timestamp,
            dateLabel: formatDateTime(p.timestamp, 'NSE', {
              month: 'short',
              day: 'numeric',
            }),
            close: p.close,
          }))
        : [],
    [priceSeries],
  );

  const maxImpact = useMemo(
    () => data?.events ? Math.max(1, ...data.events.map((e) => Math.abs(e.impact_magnitude ?? 0))) : 1,
    [data?.events],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <span className="text-xs text-white/30">Loading timeline...</span>
        </div>
      </div>
    );
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
        <Clock className="h-12 w-12 mb-3 opacity-20" />
        <p className="text-sm text-white/40">No timeline data available</p>
        <p className="text-xs text-white/20 mt-1">Try a different time range or ticker</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price chart with event markers */}
      {priceSeries && chartData.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-gradient-to-r from-white/[0.02] via-white/[0.03] to-white/[0.02] p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-mono font-bold text-white">{effectiveTicker}</span>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-[10px] text-white/35">Price with news events</span>
            <span className="text-[10px] text-white/20 tabular-nums">{chartData.length} data points</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`${gradientId}-price`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  fontSize: 11,
                  color: '#fff',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#4ADE80"
                strokeWidth={1.5}
                fill={`url(#${gradientId}-price)`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Event count summary */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] text-white/30 tabular-nums">{data.events.length} events</span>
        <div className="flex-1 h-px bg-white/[0.05]" />
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-10">
        {/* Timeline line — gradient */}
        <div
          className="absolute left-4 top-0 bottom-0 w-px"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
          }}
        />

        {data.events.map((event, idx) => {
          const sentColor = getSentimentColor(event.sentiment);
          const impact = impactMap.get(event.id);
          const themeColor = event.theme ? (THEME_COLORS[event.theme] || '#94A3B8') : '#94A3B8';
          const impactMag = Math.abs(event.impact_magnitude ?? 0);
          const isHighImpact = impactMag > 2;

          // Scale dot size by impact magnitude (8px to 14px)
          const dotSize = Math.max(8, Math.min(14, 8 + (impactMag / maxImpact) * 6));

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="relative mb-3"
            >
              {/* Timeline dot — scaled by impact, colored by sentiment */}
              <div
                className="absolute top-4 z-10 rounded-full border-2"
                style={{
                  width: dotSize,
                  height: dotSize,
                  left: `${-(24 + dotSize / 2)}px`,
                  backgroundColor: sentColor,
                  borderColor: '#0d1117',
                  boxShadow: isHighImpact
                    ? `0 0 12px ${sentColor}50, 0 0 24px ${sentColor}20`
                    : `0 0 8px ${sentColor}30`,
                }}
              />

              {/* Event card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectArticle(event.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectArticle(event.id); } }}
                className={cn(
                  'rounded-xl border bg-white/[0.02] p-3.5 cursor-pointer transition-all overflow-hidden relative',
                  isHighImpact
                    ? 'border-white/[0.12] hover:border-white/[0.2] hover:bg-white/[0.04]'
                    : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]'
                )}
                style={{
                  boxShadow: isHighImpact ? `0 0 20px ${sentColor}08` : undefined,
                }}
              >
                {/* Sentiment accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: `linear-gradient(90deg, ${themeColor}50, ${themeColor}15, transparent)`,
                  }}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-white/90 leading-snug line-clamp-2">
                      {event.headline}
                    </h4>
                  </div>

                  {/* Impact magnitude badge */}
                  {event.impact_magnitude != null && event.impact_magnitude > 0 && (
                    <div className={cn(
                      'shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums',
                      isHighImpact
                        ? 'bg-amber-500/[0.1] text-amber-400 border border-amber-500/[0.15]'
                        : 'text-white/40'
                    )}>
                      {isHighImpact && <Zap className="h-2.5 w-2.5" />}
                      {event.impact_magnitude.toFixed(1)}%
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="text-[10px] text-white/30">{getSourceDisplayName(event.source)}</span>
                  <span className="text-[10px] text-white/25">
                    {formatTimeAgo(event.published_at)}
                  </span>
                  <SentimentBadge sentiment={event.sentiment} />

                  {/* Ticker pills */}
                  {event.tickers.length > 0 && (
                    <div className="flex gap-1 ml-auto">
                      {event.tickers.slice(0, 3).map((t) => (
                        <TickerPill key={t} ticker={t} onClick={onTickerClick} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Impact data — visual bar */}
                {impact && impact.price_change_1d != null && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-white/25">1D Impact</span>
                      <div className="flex items-center gap-1">
                        {impact.price_change_1d >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        )}
                        <span className={cn(
                          'font-mono font-semibold tabular-nums',
                          impact.price_change_1d >= 0 ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {impact.price_change_1d >= 0 ? '+' : ''}{impact.price_change_1d.toFixed(2)}%
                        </span>
                      </div>
                      {/* Mini impact bar */}
                      <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, Math.abs(impact.price_change_1d) * 10)}%`,
                            backgroundColor: impact.price_change_1d >= 0 ? '#10B981' : '#EF4444',
                            boxShadow: `0 0 8px ${impact.price_change_1d >= 0 ? '#10B98140' : '#EF444440'}`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
