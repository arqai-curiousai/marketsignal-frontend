'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock } from 'lucide-react';
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
import { SentimentBadge } from './SentimentBadge';
import { TickerPill } from './TickerPill';
import { formatTimeAgo, getSentimentColor, THEME_COLORS } from './constants';

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
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
        <Clock className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">No timeline data available.</p>
      </div>
    );
  }

  const priceSeries = ticker && data.price_series[ticker] ? data.price_series[ticker] : null;
  const impactMap = new Map(
    data.impact_markers.map((m) => [m.event_id, m])
  );

  // Prepare price chart data
  const chartData = priceSeries
    ? priceSeries.map((p) => ({
        timestamp: p.timestamp,
        dateLabel: new Date(p.timestamp).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        }),
        close: p.close,
      }))
    : [];

  return (
    <div className="space-y-4">
      {/* Price chart with event markers */}
      {priceSeries && chartData.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-mono font-semibold text-white">{ticker}</span>
            <span className="text-[10px] text-muted-foreground">Price with news events</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#1e293b' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#64748B', fontSize: 10 }}
                axisLine={{ stroke: '#1e293b' }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="#60A5FA"
                strokeWidth={1.5}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vertical Timeline */}
      <div className="relative pl-8">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />

        {data.events.map((event, idx) => {
          const sentColor = getSentimentColor(event.sentiment);
          const impact = impactMap.get(event.id);
          const themeColor = event.theme ? (THEME_COLORS[event.theme] || '#94A3B8') : '#94A3B8';

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="relative mb-4"
            >
              {/* Timeline dot */}
              <div
                className="absolute -left-5 top-3 w-2.5 h-2.5 rounded-full border-2 z-10"
                style={{
                  backgroundColor: sentColor,
                  borderColor: '#0d1117',
                }}
              />

              {/* Event card */}
              <div
                onClick={() => onSelectArticle(event.id)}
                className={cn(
                  'rounded-lg border border-white/10 bg-white/[0.02] p-3 cursor-pointer',
                  'hover:border-white/20 hover:bg-white/[0.04] transition-all'
                )}
                style={{ borderLeftWidth: 3, borderLeftColor: themeColor }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-medium text-white leading-snug line-clamp-2 flex-1">
                    {event.headline}
                  </h4>
                  {event.impact_magnitude != null && event.impact_magnitude > 0 && (
                    <span className="text-[10px] font-mono font-semibold text-brand-blue shrink-0">
                      {event.impact_magnitude.toFixed(1)}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-muted-foreground">{event.source}</span>
                  <span className="text-[10px] text-muted-foreground">
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

                {/* Impact data */}
                {impact && impact.price_change_1d != null && (
                  <div className="mt-1.5 text-[10px]">
                    <span className="text-muted-foreground">1D Impact: </span>
                    <span className={impact.price_change_1d >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {impact.price_change_1d >= 0 ? '+' : ''}{impact.price_change_1d.toFixed(2)}%
                    </span>
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
