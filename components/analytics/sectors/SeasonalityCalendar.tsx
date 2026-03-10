'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { seasonalityColor, MONTH_NAMES, perfTextClass } from './constants';
import type { ISectorSeasonality } from '@/types/analytics';

interface SeasonalityCalendarProps {
  data: ISectorSeasonality;
}

export function SeasonalityCalendar({ data }: SeasonalityCalendarProps) {
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div>
      <div className="grid grid-cols-6 gap-1">
        {data.months.map((m) => {
          const isCurrent = m.month === currentMonth;
          return (
            <div
              key={m.month}
              className={cn(
                'rounded-lg p-1.5 text-center transition-all',
                isCurrent && 'ring-1 ring-brand-blue/50',
              )}
              style={{ backgroundColor: seasonalityColor(m.avg_return) }}
            >
              <div className="text-[8px] text-muted-foreground font-medium">
                {MONTH_NAMES[m.month - 1]}
              </div>
              <div className={cn('text-[11px] font-bold tabular-nums', perfTextClass(m.avg_return))}>
                {m.avg_return >= 0 ? '+' : ''}{m.avg_return.toFixed(1)}%
              </div>
              <div className="text-[8px] text-muted-foreground">
                {(m.hit_rate * 100).toFixed(0)}% hit
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-2 text-[9px] text-muted-foreground">
        <span>
          Best: <span className="text-emerald-400 font-medium">{MONTH_NAMES[data.overall_stats.best_month - 1]}</span>
        </span>
        <span>
          Worst: <span className="text-red-400 font-medium">{MONTH_NAMES[data.overall_stats.worst_month - 1]}</span>
        </span>
        <span>
          Avg: <span className="text-white font-medium">{data.overall_stats.avg_monthly.toFixed(2)}%</span>/mo
        </span>
      </div>
    </div>
  );
}
