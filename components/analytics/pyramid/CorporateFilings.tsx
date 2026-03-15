'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IFilingSummary } from './constants';
import { FILING_CATEGORIES } from './constants';

interface CorporateFilingsProps {
  data: IFilingSummary;
}

export function CorporateFilings({ data }: CorporateFilingsProps) {
  if (data.total_filings === 0) {
    return (
      <div className="text-xs text-muted-foreground py-2">
        No corporate filings in the last {data.period_days} days.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Corporate Filings
        </h4>
        <span className="text-[10px] text-muted-foreground">
          {data.total_filings} in {data.period_days}d
        </span>
      </div>

      {/* Category summary chips */}
      <div className="flex flex-wrap gap-1">
        {Object.entries(data.category_counts).map(([cat, count]) => {
          const config = FILING_CATEGORIES[cat] || FILING_CATEGORIES.other;
          return (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{
                backgroundColor: `${config.color}15`,
                color: config.color,
              }}
            >
              {config.label} ({count})
            </span>
          );
        })}
      </div>

      {/* Sentiment distribution */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden flex bg-white/[0.04]">
          {data.sentiment_distribution.positive > 0 && (
            <div
              className="h-full bg-emerald-500/60"
              style={{
                width: `${(data.sentiment_distribution.positive / data.total_filings) * 100}%`,
              }}
            />
          )}
          {data.sentiment_distribution.neutral > 0 && (
            <div
              className="h-full bg-white/20"
              style={{
                width: `${(data.sentiment_distribution.neutral / data.total_filings) * 100}%`,
              }}
            />
          )}
          {data.sentiment_distribution.negative > 0 && (
            <div
              className="h-full bg-red-500/60"
              style={{
                width: `${(data.sentiment_distribution.negative / data.total_filings) * 100}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Filing timeline */}
      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {data.filings.map((filing, i) => {
          const config = FILING_CATEGORIES[filing.category] || FILING_CATEGORIES.other;
          const dateStr = new Date(filing.filing_date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          });

          return (
            <div
              key={i}
              className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0"
            >
              {/* Date */}
              <span className="text-[9px] text-muted-foreground w-10 shrink-0 tabular-nums">
                {dateStr}
              </span>

              {/* Category badge */}
              <span
                className="shrink-0 px-1 py-0.5 rounded text-[8px] font-medium"
                style={{
                  backgroundColor: `${config.color}15`,
                  color: config.color,
                }}
              >
                {config.label}
              </span>

              {/* Title */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-foreground leading-tight truncate">
                  {filing.title}
                </p>
              </div>

              {/* Sentiment dot */}
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0 mt-1',
                  filing.sentiment === 'positive'
                    ? 'bg-emerald-400'
                    : filing.sentiment === 'negative'
                      ? 'bg-red-400'
                      : 'bg-white/20',
                )}
              />

              {/* PDF link */}
              {filing.pdf_url && (
                <a
                  href={filing.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
