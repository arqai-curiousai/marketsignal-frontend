'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ICurrencyStrength, IMarketClock, ITopMovers, ICurrencyOverview } from '@/src/types/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, TrendingUp, TrendingDown, Zap, BarChart3 } from 'lucide-react';

interface Props {
  strength: ICurrencyStrength | null;
  marketClock: IMarketClock | null;
  topMovers: ITopMovers | null;
  overview?: ICurrencyOverview | null;
}

interface KPICardData {
  label: string;
  value: string;
  subtext: string;
  icon: typeof Activity;
  color: string;
  accentBg: string;
  glowColor?: string;
}

function deriveKPIs(
  strength: ICurrencyStrength | null,
  marketClock: IMarketClock | null,
  topMovers: ITopMovers | null,
  overview: ICurrencyOverview | null,
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
    accentBg: 'from-blue-500/10 to-blue-500/0',
    glowColor: 'rgba(96,165,250,0.1)',
  };

  // 2. Strongest Currency
  let strongestCcy: KPICardData = {
    label: 'Strongest',
    value: '—',
    subtext: 'No data',
    icon: TrendingUp,
    color: 'text-emerald-400',
    accentBg: 'from-emerald-500/10 to-emerald-500/0',
    glowColor: 'rgba(110,231,183,0.1)',
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
        label: 'Strongest',
        value: maxKey,
        subtext: `${maxVal >= 0 ? '+' : ''}${maxVal.toFixed(2)} (1D)`,
        icon: TrendingUp,
        color: 'text-emerald-400',
        accentBg: 'from-emerald-500/10 to-emerald-500/0',
        glowColor: 'rgba(110,231,183,0.1)',
      };
    }
  }

  // 3. Weakest Currency
  let weakestCcy: KPICardData = {
    label: 'Weakest',
    value: '—',
    subtext: 'No data',
    icon: TrendingDown,
    color: 'text-orange-400',
    accentBg: 'from-orange-500/10 to-orange-500/0',
    glowColor: 'rgba(251,146,60,0.1)',
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
        label: 'Weakest',
        value: minKey,
        subtext: `${minVal >= 0 ? '+' : ''}${minVal.toFixed(2)} (1D)`,
        icon: TrendingDown,
        color: 'text-orange-400',
        accentBg: 'from-orange-500/10 to-orange-500/0',
        glowColor: 'rgba(251,146,60,0.1)',
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
    accentBg: 'from-amber-500/10 to-amber-500/0',
    glowColor: 'rgba(251,191,36,0.1)',
  };

  // 5. Pairs Tracked — derive from overview data
  const pairCount = overview?.pairs?.length ?? 0;
  const inrCount = overview?.pairs?.filter(p => p.ticker.includes('INR')).length ?? 0;
  const crossCount = pairCount - inrCount;
  const pairsTracked: KPICardData = {
    label: 'Pairs Tracked',
    value: pairCount > 0 ? String(pairCount) : '—',
    subtext: pairCount > 0 ? `${inrCount} INR + ${crossCount} Cross` : 'Loading...',
    icon: BarChart3,
    color: 'text-violet-400',
    accentBg: 'from-violet-500/10 to-violet-500/0',
    glowColor: 'rgba(167,139,250,0.1)',
  };

  return [activeSessions, strongestCcy, weakestCcy, topMover, pairsTracked];
}

function KPICard({ kpi, isLoading }: { kpi: KPICardData; isLoading: boolean }) {
  const Icon = kpi.icon;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  return (
    <div className={cn(
      'group relative rounded-xl border border-white/[0.06] p-3.5 overflow-hidden',
      'bg-white/[0.03] backdrop-blur-md',
      'shadow-[0_2px_16px_rgba(0,0,0,0.15)]',
      'hover:border-white/[0.12] hover:scale-[1.02] transition-all duration-300',
      'hover:shadow-[0_2px_16px_rgba(0,0,0,0.15),0_0_20px_-4px_var(--kpi-glow)]',
    )} style={{ '--kpi-glow': kpi.glowColor ?? 'rgba(255,255,255,0.05)' } as React.CSSProperties}>
      {/* Subtle gradient accent */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-60 group-hover:opacity-80 pointer-events-none transition-opacity duration-300',
        kpi.accentBg,
      )} />

      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon className={cn('h-3.5 w-3.5', kpi.color)} />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {kpi.label}
          </span>
        </div>
        <p className="text-xl font-bold font-mono leading-tight tabular-nums">{kpi.value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{kpi.subtext}</p>
      </div>
    </div>
  );
}

export function ForexOverviewKPIs({ strength, marketClock, topMovers, overview }: Props) {
  const isLoading = strength === null && marketClock === null && topMovers === null;
  const kpis = deriveKPIs(strength, marketClock, topMovers, overview ?? null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {kpis.map(kpi => (
        <KPICard key={kpi.label} kpi={kpi} isLoading={isLoading} />
      ))}
    </div>
  );
}
