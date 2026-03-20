'use client';

import { cn } from '@/lib/utils';
import type { ICurrencyStrength, IMarketClock, ITopMovers } from '@/src/types/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface Props {
  strength: ICurrencyStrength | null;
  marketClock: IMarketClock | null;
  topMovers: ITopMovers | null;
}

interface KPICardData {
  label: string;
  value: string;
  subtext: string;
  icon: typeof Activity;
  color: string;
}

function deriveKPIs(
  strength: ICurrencyStrength | null,
  marketClock: IMarketClock | null,
  topMovers: ITopMovers | null
): KPICardData[] {
  // 1. Active Sessions
  const activeSessions: KPICardData = {
    label: 'Active Sessions',
    value: marketClock != null ? String(marketClock.active_count) : '—',
    subtext: marketClock?.is_weekend
      ? 'Weekend'
      : marketClock?.active_count === 0
        ? 'All closed'
        : `of ${marketClock?.sessions?.length ?? 4} sessions`,
    icon: Activity,
    color: 'text-blue-400',
  };

  // 2. Strongest Currency
  let strongestCcy: KPICardData = {
    label: 'Strongest Currency',
    value: '—',
    subtext: 'No data',
    icon: TrendingUp,
    color: 'text-emerald-400',
  };

  if (strength?.currencies) {
    let maxVal = -Infinity;
    let maxKey = '';
    for (const [ccy, vals] of Object.entries(strength.currencies)) {
      const dayVal = vals['1d'];
      if (dayVal > maxVal) {
        maxVal = dayVal;
        maxKey = ccy;
      }
    }
    if (maxKey) {
      strongestCcy = {
        label: 'Strongest Currency',
        value: maxKey,
        subtext: `${maxVal >= 0 ? '+' : ''}${maxVal.toFixed(2)} (1D)`,
        icon: TrendingUp,
        color: 'text-emerald-400',
      };
    }
  }

  // 3. Weakest Currency
  let weakestCcy: KPICardData = {
    label: 'Weakest Currency',
    value: '—',
    subtext: 'No data',
    icon: TrendingDown,
    color: 'text-red-400',
  };

  if (strength?.currencies) {
    let minVal = Infinity;
    let minKey = '';
    for (const [ccy, vals] of Object.entries(strength.currencies)) {
      const dayVal = vals['1d'];
      if (dayVal < minVal) {
        minVal = dayVal;
        minKey = ccy;
      }
    }
    if (minKey) {
      weakestCcy = {
        label: 'Weakest Currency',
        value: minKey,
        subtext: `${minVal >= 0 ? '+' : ''}${minVal.toFixed(2)} (1D)`,
        icon: TrendingDown,
        color: 'text-red-400',
      };
    }
  }

  // 4. Top Mover
  const topGainer = topMovers?.gainers?.[0];
  const topMover: KPICardData = {
    label: 'Top Mover',
    value: topGainer?.pair ?? '—',
    subtext: topGainer
      ? `+${topGainer.change_pct.toFixed(2)}%`
      : 'No data',
    icon: Zap,
    color: 'text-amber-400',
  };

  return [activeSessions, strongestCcy, weakestCcy, topMover];
}

function KPICard({ kpi, isLoading }: { kpi: KPICardData; isLoading: boolean }) {
  const Icon = kpi.icon;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-3">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-6 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={cn('h-3.5 w-3.5', kpi.color)} />
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {kpi.label}
        </span>
      </div>
      <p className="text-lg font-bold font-mono leading-tight">{kpi.value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.subtext}</p>
    </div>
  );
}

export function ForexOverviewKPIs({ strength, marketClock, topMovers }: Props) {
  const isLoading = strength === null && marketClock === null && topMovers === null;
  const kpis = deriveKPIs(strength, marketClock, topMovers);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map(kpi => (
        <KPICard key={kpi.label} kpi={kpi} isLoading={isLoading} />
      ))}
    </div>
  );
}
